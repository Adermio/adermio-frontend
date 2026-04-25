/**
 * Adermio Face Scan v9.0 — Production Release
 *
 * Multi-angle guided scan via MediaPipe Face Mesh (468 landmarks).
 *
 * Improvements over v8.0 (parity + edge over the React Native app):
 *  - Post-capture quality validation (real pixel-level brightness + Laplacian on every captured frame)
 *  - Per-angle retake from preview (tap thumbnail → keep / re-shoot just that angle)
 *  - Colored quality badges on preview thumbnails (Excellent / Bon / Correct / Manquant)
 *  - Image compression before upload (1500px max, 85% JPEG) — speeds up presign + Gemini
 *  - Upload retries with exponential backoff (3 attempts for presign + S3 PUT)
 *  - Detailed position guidance (pitch / roll / backlit / centering — verbatim app strings)
 *  - Periodic light probe during scan (every 3s) — catches mid-scan lighting drops
 *  - Updated scoring: blur 35% + stability 30% + angle 35%, then adjusted with 40% post-capture quality
 *  - 90s timeout (was 40s) — more permissive for low-end devices
 *  - ScanLogger event tracking (saved to formState.scanLog and submitted with the form)
 *
 * Dependencies: @mediapipe/face_mesh (CDN, loaded by formulaire2.html)
 * Public API: window.AdermioFaceScan.{init, destroy, restart}
 */
(function () {
  "use strict";

  var DEBUG = false;

  /* ═══════════════════════════════════════════════════════════
     DEVICE CAPABILITY DETECTION
     ═══════════════════════════════════════════════════════════ */
  var isHighEnd = (function () {
    var dpr = window.devicePixelRatio || 1;
    var mem = navigator.deviceMemory || 4;
    return dpr >= 3 || mem >= 6;
  })();

  var deviceTier = isHighEnd ? "high" : (navigator.deviceMemory && navigator.deviceMemory <= 2 ? "low" : "mid");

  var CAM_W = isHighEnd ? 1280 : 640;
  var CAM_H = isHighEnd ? 960 : 480;
  var CAP_MAX = isHighEnd ? 1280 : 800;

  // Compression target before upload (matches the mobile app)
  var COMPRESS_MAX_W = 1500;
  var COMPRESS_QUALITY = 0.85;

  /* ═══════════════════════════════════════════════════════════
     TRANSLATIONS — strings ported verbatim from the mobile app
     (lib/scan-engine.ts checkPosition + getGuidance)
     ═══════════════════════════════════════════════════════════ */
  var T = {
    fr: {
      permTitle: "Analyse Haute Définition",
      permDesc: "7 captures automatisées sous différents angles pour une précision maximale. Aucune donnée vidéo n'est conservée.",
      permBtn: "Démarrer le scan 3D",
      denied: "Accès caméra refusé. Utilisez l'import manuel.",
      notSupported: "Navigateur incompatible. Utilisez l'import manuel.",
      noDevice: "Aucune caméra frontale détectée.",
      loading: "Chargement de l'analyse faciale…",
      loadTimeout: "Chargement trop long. Vérifiez votre connexion.",

      calibTitle: "Positionnez votre visage",
      calibSub: "Placez votre visage dans l'ovale",
      calibReady: "Parfait, ne bougez pas",
      calibReadySub: "Position idéale",

      // Shown until MediaPipe's first result lands — avoids the user staring at
      // "Positionnez votre visage" for 10s while the WASM downloads from the CDN.
      initializingTitle: "Initialisation de l'analyse…",
      initializingSub: "Préparation du moteur de détection",
      initializingTimeout: "Connexion trop lente. Utilisez l'import manuel.",

      countdownSub: "Préparez-vous, le scan va commencer",

      // Position issues — checkPosition() in scan-engine.ts
      moveCloser: "Rapprochez-vous",
      moveCloserSub: "Votre visage est trop loin",
      moveBack: "Reculez légèrement",
      moveBackSub: "Votre visage est trop proche",
      lowLight: "Éclairage insuffisant",
      lowLightSub: "Trouvez un endroit plus lumineux",
      strongLight: "Lumière trop forte",
      strongLightSub: "Déplacez-vous",
      backlight: "Contre-jour détecté",
      backlightSub: "Tournez-vous",
      centerFace: "Centrez votre visage",
      centerFaceSub: "Placez-vous dans l'ovale",
      pitchOff: "Regardez droit devant",
      pitchOffSub: "Ne baissez/levez pas la tête",
      rollOff: "Redressez la tête",
      rollOffSub: "Ne penchez pas la tête sur le côté",

      noFace: "Aucun visage détecté",
      noFaceSub: "Placez votre visage dans l'ovale",

      // Scanning guidance — getGuidance() in scan-engine.ts (verbatim)
      scanFace: "Regardez la caméra",
      scanFaceSub: "Restez bien de face",
      scanRight1: "Tournez la tête vers la droite",
      scanRight1Sub: "Doucement, montrez votre profil",
      scanRight2: "Continuez de tourner à droite",
      scanRight2Sub: "Montrez votre profil",
      scanRight3: "Encore un peu à droite",
      scanRight3Sub: "Montrez votre oreille",
      scanLeft1: "Tournez la tête vers la gauche",
      scanLeft1Sub: "Doucement, montrez votre profil",
      scanLeft2: "Continuez de tourner à gauche",
      scanLeft2Sub: "Montrez votre profil",
      scanLeft3: "Encore un peu à gauche",
      scanLeft3Sub: "Montrez votre oreille",
      scanDone: "Scan terminé",
      scanDoneSub: "Analyse de vos captures…",

      // Quality feedback during scan
      qualityLow: "Qualité insuffisante",
      qualityLowSub: "Tenez-vous stable, face à la lumière",
      lightDuringScan: "Éclairage insuffisant",
      lightDuringScanSub: "Placez-vous près d'une fenêtre ou allumez la lumière",

      // Retake-only mode (one bin)
      retakeFor: "Reprise de l'angle",

      captured: "Capturé",
      binFace: "Face", binSemiR: "Semi D", binRight: "Profil D", binWideR: "Large D",
      binSemiL: "Semi G", binLeft: "Profil G", binWideL: "Large G",
      distance: "Distance", light: "Lumière", stability: "Stabilité",

      previewTitle: "Vos captures",
      previewHint: "Tapez sur une photo pour l'agrandir",

      excellent: "Excellent", good: "Bon", ok: "Correct", missing: "Manquant",
      keep: "Garder", retakeOne: "Reprendre",
      retake: "Refaire", validate: "Valider et continuer",
      restart: "Recommencer le scan",
      uploading: "Envoi en cours…",
      uploadFail: "Erreur d'envoi, réessayez",

      zoomBtn: "Ajouter un gros plan",
      zoomSub: "Photo d'une zone spécifique (optionnel)",
      zoomAdded: "Gros plan ajouté",

      noDataStored: "Aucune donnée vidéo conservée",
      anglesCaptured: "angles capturés",
      angleCaptured: "angle capturé",
    },
    en: {
      permTitle: "High Definition Analysis",
      permDesc: "7 automated captures from different angles for maximum precision. No video data is stored.",
      permBtn: "Start 3D scan",
      denied: "Camera access denied. Use manual upload.",
      notSupported: "Browser not supported. Use manual upload.",
      noDevice: "No front camera detected.",
      loading: "Loading face analysis…",
      loadTimeout: "Loading too slow. Check your connection.",

      calibTitle: "Position your face",
      calibSub: "Place your face inside the oval",
      calibReady: "Perfect, hold still",
      calibReadySub: "Ideal position",

      initializingTitle: "Initializing analysis…",
      initializingSub: "Loading detection engine",
      initializingTimeout: "Connection too slow. Use manual upload.",

      countdownSub: "Get ready, scan is about to start",

      moveCloser: "Move closer",
      moveCloserSub: "Your face is too far",
      moveBack: "Move back slightly",
      moveBackSub: "Your face is too close",
      lowLight: "Insufficient lighting",
      lowLightSub: "Find a brighter spot",
      strongLight: "Too much light",
      strongLightSub: "Move away from the light",
      backlight: "Backlight detected",
      backlightSub: "Turn around",
      centerFace: "Center your face",
      centerFaceSub: "Place yourself in the oval",
      pitchOff: "Look straight ahead",
      pitchOffSub: "Don't tilt your head up or down",
      rollOff: "Straighten your head",
      rollOffSub: "Don't tilt your head sideways",

      noFace: "No face detected",
      noFaceSub: "Place your face in the oval",

      scanFace: "Look at the camera",
      scanFaceSub: "Stay facing forward",
      scanRight1: "Turn your head to the right",
      scanRight1Sub: "Slowly, show your profile",
      scanRight2: "Keep turning right",
      scanRight2Sub: "Show your profile",
      scanRight3: "A bit more to the right",
      scanRight3Sub: "Show your ear",
      scanLeft1: "Turn your head to the left",
      scanLeft1Sub: "Slowly, show your profile",
      scanLeft2: "Keep turning left",
      scanLeft2Sub: "Show your profile",
      scanLeft3: "A bit more to the left",
      scanLeft3Sub: "Show your ear",
      scanDone: "Scan complete",
      scanDoneSub: "Analyzing your captures…",

      qualityLow: "Quality too low",
      qualityLowSub: "Hold still, face the light",
      lightDuringScan: "Insufficient lighting",
      lightDuringScanSub: "Move near a window or turn on the light",

      retakeFor: "Retaking",

      captured: "Captured",
      binFace: "Front", binSemiR: "Semi R", binRight: "Profile R", binWideR: "Wide R",
      binSemiL: "Semi L", binLeft: "Profile L", binWideL: "Wide L",
      distance: "Distance", light: "Light", stability: "Stability",

      previewTitle: "Your captures",
      previewHint: "Tap a photo to enlarge it",

      excellent: "Excellent", good: "Good", ok: "Fair", missing: "Missing",
      keep: "Keep", retakeOne: "Retake",
      retake: "Retake", validate: "Validate and continue",
      restart: "Restart scan",
      uploading: "Uploading…",
      uploadFail: "Upload error, try again",

      zoomBtn: "Add a close-up",
      zoomSub: "Photo of a specific area (optional)",
      zoomAdded: "Close-up added",

      noDataStored: "No video data stored",
      anglesCaptured: "angles captured",
      angleCaptured: "angle captured",
    },
  };

  /* ═══════════════════════════════════════════════════════════
     CONFIG — synced with mobile app (lib/scan-engine.ts CFG)
     ═══════════════════════════════════════════════════════════ */
  var CFG = {
    faceSizeMin: 0.33,
    faceSizeMax: 0.58,
    centerMaxOff: 0.15,

    faceYawMax: 12,
    semiYawMin: 13,
    semiYawMax: 28,
    profYawMin: 28,
    profYawMax: 48,
    wideYawMin: 48,
    wideYawMax: 70,

    pitchMax: 20,
    rollMax: 25, // matches mobile rollMax — front camera roll is noisy

    // Pre-capture pixel-sampling thresholds (live preview)
    brightMin: 40,
    brightMax: 235,
    brightIdeal: 130,
    backlightRatio: 0.50,

    // Post-capture rejection thresholds (run on every captured blob)
    // Slightly more lenient than pre-capture to avoid over-rejection.
    postBrightMinReject: 35,
    postBrightMaxReject: 240,
    postBlurMinReject: 8,    // Laplacian variance — below this is severely blurred
    postBlurWarning: 20,
    rejectGuidanceAfter: 5,  // show "Qualité insuffisante" after N rejects on the same bin
    rejectForceAfter: 15,    // force-accept after N rejects (avoid infinite loop)

    blurIdeal: 45,
    stabMax: 0.20,

    calibMs: 700,
    captureMs: 150,
    timeoutMs: 90000,        // 90s — matches mobile (was 40s)
    wasmTimeoutMs: 15000,
    noFaceMs: 12000,
    binTopN: 3,
    jpegQ: 0.92,             // canvas → blob quality
    expensiveEvery: isHighEnd ? 4 : 6,
    lightProbeMs: 3000,      // periodic light status refresh during scan
  };

  /* ═══════════════════════════════════════════════════════════
     BIN SYSTEM
     ═══════════════════════════════════════════════════════════ */
  var BIN_IDS = ["face", "semi_right", "right", "wide_right", "semi_left", "left", "wide_left"];
  var BIN_LABELS = {
    face: "binFace", semi_right: "binSemiR", right: "binRight", wide_right: "binWideR",
    semi_left: "binSemiL", left: "binLeft", wide_left: "binWideL",
  };
  var BIN_IDEAL_YAW = { face: 0, semi_right: 20, right: 38, wide_right: 55, semi_left: 20, left: 38, wide_left: 55 };

  // Visual order in the dot strip + preview grid: left-of-screen = right side of face (mirrored)
  var DOT_ORDER = ["wide_right", "right", "semi_right", "face", "semi_left", "left", "wide_left"];

  function classifyBin(absYaw, noseX) {
    // Photo is mirrored at capture (scaleX -1), so the visible cheek in the photo
    // is OPPOSITE to the raw nose direction.
    var showsRight = noseX > 0.5;
    if (absYaw < CFG.faceYawMax) return "face";
    if (absYaw >= CFG.semiYawMin && absYaw < CFG.semiYawMax) return showsRight ? "semi_right" : "semi_left";
    if (absYaw >= CFG.profYawMin && absYaw < CFG.wideYawMin) return showsRight ? "right" : "left";
    if (absYaw >= CFG.wideYawMin && absYaw <= CFG.wideYawMax) return showsRight ? "wide_right" : "wide_left";
    return null;
  }

  // getAllowedBins — port from mobile lib/scan-engine.ts.
  // Restricts captures to the side currently being guided so a user who
  // accidentally turns the wrong way doesn't capture an off-side photo
  // ahead of schedule (which would then be missing from the expected
  // capture sequence and confuse the guidance).
  function getAllowedBins(bins) {
    var allowed = {};
    if (!bins.face.length) { allowed.face = true; return allowed; }
    var leftMissing = !bins.semi_left.length || !bins.left.length || !bins.wide_left.length;
    var rightMissing = !bins.semi_right.length || !bins.right.length || !bins.wide_right.length;
    if (leftMissing) {
      if (!bins.semi_left.length) allowed.semi_left = true;
      if (!bins.left.length) allowed.left = true;
      if (!bins.wide_left.length) allowed.wide_left = true;
    } else if (rightMissing) {
      if (!bins.semi_right.length) allowed.semi_right = true;
      if (!bins.right.length) allowed.right = true;
      if (!bins.wide_right.length) allowed.wide_right = true;
    }
    return allowed;
  }

  /* ═══════════════════════════════════════════════════════════
     LANDMARKS & GEOMETRY
     ═══════════════════════════════════════════════════════════ */
  var LM = {
    nose: 1, lCheek: 234, rCheek: 454, chin: 152, forehead: 10,
    contour: [10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109,10],
  };

  function pt(m, i) { return { x: m[i].x, y: m[i].y, z: m[i].z }; }
  function d2(a, b) { return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y)); }

  function faceBounds(m) {
    var x0 = 1, x1 = 0, y0 = 1, y1 = 0;
    for (var j = 0; j < LM.contour.length; j++) {
      var p = m[LM.contour[j]];
      if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x;
      if (p.y < y0) y0 = p.y; if (p.y > y1) y1 = p.y;
    }
    return { x0: x0, x1: x1, y0: y0, y1: y1 };
  }

  function headPose(m) {
    var lc = pt(m, LM.lCheek), rc = pt(m, LM.rCheek), ch = pt(m, LM.chin), fh = pt(m, LM.forehead);
    var hx = rc.x - lc.x, hy = rc.y - lc.y, hz = rc.z - lc.z;
    var vx = fh.x - ch.x, vy = fh.y - ch.y, vz = fh.z - ch.z;
    var nx = hy * vz - hz * vy, ny = hz * vx - hx * vz, nz = hx * vy - hy * vx;
    var nLen = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1e-9;
    // Roll: rotation of the cheek-to-cheek line in the image plane (z dropped).
    // atan2(hy, hx) gives the angle of the cheek vector vs horizontal.
    return {
      yaw: (Math.atan2(nx, -nz) * 180) / Math.PI,
      pitch: (Math.asin(Math.max(-1, Math.min(1, -ny / nLen))) * 180) / Math.PI,
      roll: (Math.atan2(hy, hx) * 180) / Math.PI,
    };
  }

  function faceSize(m) { return d2(pt(m, LM.forehead), pt(m, LM.chin)); }

  function stabPerSec(curr, prev, dt) {
    if (!prev || dt < 1) return 0;
    var sum = 0, n = 0;
    for (var i = 0; i < curr.length && i < prev.length; i += 10) { sum += d2(curr[i], prev[i]); n++; }
    return n > 0 ? (sum / n) / (dt / 1000) : 0;
  }

  /* ═══════════════════════════════════════════════════════════
     IMAGE ANALYSIS — pre-capture (live frame)
     ═══════════════════════════════════════════════════════════ */
  var _bc = null, _bx = null, _lc = null, _lx = null, _cc = null, _cx = null, _blurBuf = null;

  function analyzeBright(video, m) {
    if (!_bc) { _bc = document.createElement("canvas"); _bx = _bc.getContext("2d", { willReadFrequently: true }); }
    var sw = 120, sh = 90; _bc.width = sw; _bc.height = sh;
    try { _bx.drawImage(video, 0, 0, sw, sh); var d = _bx.getImageData(0, 0, sw, sh).data; }
    catch (e) { return { face: 128, bg: 128, r: 1, ok: true, dark: false, bright: false, bl: false }; }
    var fb = faceBounds(m);
    var fs = 0, fp = 0, bs = 0, bp = 0;
    for (var y = 0; y < sh; y++) for (var x = 0; x < sw; x++) {
      var i = (y * sw + x) * 4;
      var l = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
      var nx2 = x / sw, ny2 = y / sh;
      if (nx2 >= fb.x0 && nx2 <= fb.x1 && ny2 >= fb.y0 && ny2 <= fb.y1) { fs += l; fp++; }
      else { bs += l; bp++; }
    }
    var face = fp > 0 ? fs / fp : 128, bg = bp > 0 ? bs / bp : 128;
    var r = bg > 1 ? face / bg : 1;
    return {
      face: face, bg: bg, r: r,
      ok: face >= CFG.brightMin && face <= CFG.brightMax && !(r < CFG.backlightRatio && bg > 80),
      dark: face < CFG.brightMin, bright: face > CFG.brightMax, bl: r < CFG.backlightRatio && bg > 80,
    };
  }

  function analyzeBlur(video, m) {
    if (!_lc) { _lc = document.createElement("canvas"); _lx = _lc.getContext("2d", { willReadFrequently: true }); }
    var fb = faceBounds(m);
    var vw = video.videoWidth || 640, vh = video.videoHeight || 480;
    var sx = fb.x0 * vw, sy = fb.y0 * vh, sw = (fb.x1 - fb.x0) * vw, sh = (fb.y1 - fb.y0) * vh;
    if (sw < 10 || sh < 10) return { s: 0 };
    var cw = 120, ch = 120; _lc.width = cw; _lc.height = ch;
    try { _lx.drawImage(video, sx, sy, sw, sh, 0, 0, cw, ch); var d = _lx.getImageData(0, 0, cw, ch).data; }
    catch (e) { return { s: 0 }; }
    if (!_blurBuf || _blurBuf.length !== cw * ch) _blurBuf = new Float32Array(cw * ch);
    var g = _blurBuf;
    for (var i = 0; i < g.length; i++) g[i] = d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114;
    var sum = 0, n = 0;
    for (var y = 1; y < ch - 1; y++) for (var x = 1; x < cw - 1; x++) {
      var lap = -4 * g[y * cw + x] + g[(y - 1) * cw + x] + g[(y + 1) * cw + x] + g[y * cw + x - 1] + g[y * cw + x + 1];
      sum += lap * lap; n++;
    }
    return { s: n > 0 ? sum / n : 0 };
  }

  /* ═══════════════════════════════════════════════════════════
     POST-CAPTURE QUALITY VALIDATION
     Runs on the captured frame's brightness/blur values, not on EXIF
     (web has no EXIF on getUserMedia frames, but pixel-level analysis
     is more accurate than mobile's heuristic anyway).
     ═══════════════════════════════════════════════════════════ */
  function analyzePhotoQuality(br, bl) {
    var warnings = [];
    var rejectReason = null;

    // Brightness rejection
    if (br.face < CFG.postBrightMinReject) {
      rejectReason = "lowLight";
    } else if (br.face > CFG.postBrightMaxReject) {
      rejectReason = "strongLight";
    } else if (br.bl) {
      // Backlit but not pitch black — warn rather than reject (still usable for analysis)
      warnings.push("backlit");
    }

    // Sharpness rejection
    if (!rejectReason && bl.s < CFG.postBlurMinReject) {
      rejectReason = "blur";
    } else if (bl.s < CFG.postBlurWarning) {
      warnings.push("low_sharpness");
    }

    // Scoring (0-1)
    var brightnessScore = Math.max(0, 1 - Math.abs(br.face - CFG.brightIdeal) / 90);
    var sharpnessScore = Math.min(1, bl.s / CFG.blurIdeal);
    var overallScore = brightnessScore * 0.5 + sharpnessScore * 0.5;

    return {
      brightnessScore: brightnessScore,
      sharpnessScore: sharpnessScore,
      brightnessValue: br.face,
      sharpnessValue: bl.s,
      overallScore: overallScore,
      isAcceptable: rejectReason === null,
      rejectReason: rejectReason,
      warnings: warnings,
    };
  }

  /* ═══════════════════════════════════════════════════════════
     COMPRESSION — resize to 1500px max + reencode at 85% JPEG
     before upload. Matches the React Native app's expo-image-manipulator
     output to keep payloads reasonable for n8n / Gemini.
     ═══════════════════════════════════════════════════════════ */
  function compressBlob(blob) {
    return new Promise(function (resolve) {
      // Try createImageBitmap first (faster, no DOM image)
      var bmpPromise = (typeof createImageBitmap === "function")
        ? createImageBitmap(blob).catch(function () { return null; })
        : Promise.resolve(null);

      bmpPromise.then(function (bmp) {
        if (bmp) {
          process(bmp.width, bmp.height, function (cv, cx) { cx.drawImage(bmp, 0, 0, cv.width, cv.height); }, function () { try { bmp.close(); } catch (_) {} });
          return;
        }
        // Fallback: Image element via object URL
        var url = URL.createObjectURL(blob);
        var img = new Image();
        img.onload = function () {
          process(img.naturalWidth || img.width, img.naturalHeight || img.height,
            function (cv, cx) { cx.drawImage(img, 0, 0, cv.width, cv.height); },
            function () { URL.revokeObjectURL(url); });
        };
        img.onerror = function () { URL.revokeObjectURL(url); resolve(blob); };
        img.src = url;
      });

      function process(w, h, drawFn, cleanupFn) {
        var scale = w > COMPRESS_MAX_W ? COMPRESS_MAX_W / w : 1;
        var ow = Math.round(w * scale), oh = Math.round(h * scale);
        var cv = document.createElement("canvas");
        cv.width = ow; cv.height = oh;
        var cx = cv.getContext("2d");
        try { drawFn(cv, cx); }
        catch (e) { cleanupFn(); resolve(blob); return; }
        cv.toBlob(function (out) {
          cleanupFn();
          // Only return compressed version if it's actually smaller (sometimes recompression
          // of already-compressed JPEG yields a bigger blob). Otherwise keep the original.
          if (out && out.size > 0 && out.size <= blob.size) resolve(out);
          else resolve(blob);
        }, "image/jpeg", COMPRESS_QUALITY);
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════
     UPLOAD — withRetry wrapper (3 retries, exponential backoff)
     The actual upload is delegated to window.uploadToS3Presigned
     defined in formulaire2.html. We compress before passing it in.
     ═══════════════════════════════════════════════════════════ */
  var UPLOAD_MAX_RETRIES = 3;
  var UPLOAD_BACKOFF_MS = 1000;

  function withRetry(fn, label) {
    return new Promise(function (resolve, reject) {
      var attempt = 0;
      function tryOnce() {
        Promise.resolve()
          .then(fn)
          .then(resolve)
          .catch(function (err) {
            if (attempt >= UPLOAD_MAX_RETRIES) {
              if (DEBUG) console.warn("[FaceScan] " + label + " failed after " + (attempt + 1) + " attempts:", err);
              reject(err);
              return;
            }
            var delay = UPLOAD_BACKOFF_MS * Math.pow(2, attempt);
            attempt++;
            setTimeout(tryOnce, delay);
          });
      }
      tryOnce();
    });
  }

  /* ═══════════════════════════════════════════════════════════
     SCAN LOGGER — port of lib/scan-logger.ts
     Tracks events for quality debugging + analytics. The JSON
     is written to formState.scanLog and submitted with the form.
     ═══════════════════════════════════════════════════════════ */
  function ScanLogger() {
    this.events = [];
    this.sessionStart = 0;
  }
  ScanLogger.prototype.start = function (tier) {
    this.events = [];
    this.sessionStart = Date.now();
    this.events.push({ type: "scan_start", timestamp: this.sessionStart, deviceTier: tier });
  };
  ScanLogger.prototype.log = function (e) { this.events.push(e); };
  ScanLogger.prototype.logCapture = function (bin, score, wasNew) {
    this.events.push({ type: "capture", timestamp: Date.now(), bin: bin, score: score, wasNew: wasNew });
  };
  ScanLogger.prototype.logRejected = function (bin, reason) {
    this.events.push({ type: "capture_rejected", timestamp: Date.now(), bin: bin, reason: reason });
  };
  ScanLogger.prototype.logError = function (msg) {
    this.events.push({ type: "capture_error", timestamp: Date.now(), error: msg });
  };
  ScanLogger.prototype.logComplete = function (binsCount) {
    this.events.push({ type: "scan_complete", timestamp: Date.now(), binsCount: binsCount, durationMs: Date.now() - this.sessionStart });
  };
  ScanLogger.prototype.logTimeout = function (binsCount) {
    this.events.push({ type: "scan_timeout", timestamp: Date.now(), binsCount: binsCount });
  };
  ScanLogger.prototype.getSummary = function () {
    var captures = [], rejected = 0, errors = 0, scoreSum = 0;
    var perBin = {};
    for (var i = 0; i < this.events.length; i++) {
      var e = this.events[i];
      if (e.type === "capture") { captures.push(e); perBin[e.bin] = (perBin[e.bin] || 0) + 1; scoreSum += e.score; }
      else if (e.type === "capture_rejected") rejected++;
      else if (e.type === "capture_error") errors++;
    }
    return {
      totalEvents: this.events.length,
      totalCaptures: captures.length,
      totalRejected: rejected,
      totalErrors: errors,
      durationMs: Date.now() - this.sessionStart,
      capturesPerBin: perBin,
      avgScore: captures.length > 0 ? scoreSum / captures.length : 0,
    };
  };
  ScanLogger.prototype.toJSON = function () {
    return JSON.stringify({
      sessionStart: this.sessionStart,
      summary: this.getSummary(),
      events: this.events,
    });
  };

  /* ═══════════════════════════════════════════════════════════
     SCORING — pre-capture ranking
     Mirrors mobile lib/scan-engine.ts computeScore():
       blur 35% + stability 30% + angle 35%
     Brightness component is moved to post-capture quality bonus.
     ═══════════════════════════════════════════════════════════ */
  function computeScore(bl, stab, absYaw, idealYaw) {
    var lS = Math.min(1, bl.s / CFG.blurIdeal);
    var tS = Math.max(0, 1 - stab / (CFG.stabMax * 6));
    var aS = Math.max(0, 1 - Math.abs(absYaw - idealYaw) / 25);
    return lS * 0.35 + tS * 0.30 + aS * 0.35;
  }

  function qLabel(s, t) {
    if (s >= 0.55) return { l: t.excellent, c: "#14B8A6" };
    if (s >= 0.35) return { l: t.good, c: "#D4B483" };
    if (s > 0) return { l: t.ok, c: "#A8A29E" };
    return { l: t.missing, c: "#EF4444" };
  }

  /* ═══════════════════════════════════════════════════════════
     STATE
     ═══════════════════════════════════════════════════════════ */
  function mkState() {
    var bins = {};
    for (var i = 0; i < BIN_IDS.length; i++) bins[BIN_IDS[i]] = [];
    return {
      phase: "idle", bins: bins, calibSince: null,
      countdownStart: null, scanStart: null, lastCapt: 0, lastProbe: 0,
      prev: null, prevT: null,
      noFaceT: null, fc: 0,
      cBr: null, cBl: null,
      st: { dist: null, light: null, stab: null },
      fm: null, cam: null, stream: null,
      retake: null,        // when set, only this bin is captured
      retakeRejects: 0,    // rejects on the active bin (resets per bin)
      capturing: false,
      idleDraw: null,
      logger: new ScanLogger(),
      qualityHint: null,   // "qualityLow" | "lightDuringScan" | null
    };
  }

  /* ═══════════════════════════════════════════════════════════
     POLYFILLS — roundRect + ellipse (older Safari)
     ═══════════════════════════════════════════════════════════ */
  if (typeof CanvasRenderingContext2D !== "undefined" && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      var rad = typeof r === "number" ? r : (r && r[0]) || 0;
      this.beginPath(); this.moveTo(x + rad, y);
      this.arcTo(x + w, y, x + w, y + h, rad); this.arcTo(x + w, y + h, x, y + h, rad);
      this.arcTo(x, y + h, x, y, rad); this.arcTo(x, y, x + w, y, rad);
      this.closePath(); return this;
    };
  }
  if (typeof CanvasRenderingContext2D !== "undefined" && !CanvasRenderingContext2D.prototype.ellipse) {
    CanvasRenderingContext2D.prototype.ellipse = function (cx, cy, rx, ry, rot, sa, ea, ccw) {
      this.save(); this.translate(cx, cy); this.rotate(rot || 0); this.scale(1, ry / (rx || 1));
      this.arc(0, 0, rx, sa, ea, ccw); this.restore();
    };
  }
  function fillEvenOdd(ctx) { try { ctx.fill("evenodd"); } catch (e) { ctx.fill(); } }

  /* ═══════════════════════════════════════════════════════════
     UI — Adermio brand
     ═══════════════════════════════════════════════════════════ */
  function buildUI(t) {
    return '<div id="fs-root" style="position:relative;width:100%;max-width:420px;margin:0 auto;border-radius:1.25rem;overflow:hidden;background:#FAFAF9;font-family:\'DM Sans\',sans-serif;transition:all .3s ease;">'
    + '<div id="fs-perm" style="padding:24px 28px;text-align:center;background:#FAFAF9;color:#1f2937;">'
    + '<div style="width:52px;height:52px;margin:0 auto 16px;border-radius:50%;background:#f5f5f4;border:1px solid #e7e5e4;display:flex;align-items:center;justify-content:center;">'
    + '<svg width="22" height="22" fill="none" stroke="#0F3D39" stroke-width="1.5" stroke-linecap="round" viewBox="0 0 24 24"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>'
    + '</div>'
    + '<button id="fs-go" style="width:100%;padding:15px;border:none;border-radius:2rem;background:#0F3D39;color:#fff;font-size:13px;font-weight:600;cursor:pointer;letter-spacing:.4px;text-transform:uppercase;transition:background .15s;">' + t.permBtn + '</button>'
    + '<p style="font-size:11px;color:#a8a29e;margin:10px 0 0;font-weight:400;">~15 secondes</p>'
    + '<div style="display:flex;align-items:center;gap:5px;justify-content:center;margin-top:10px;opacity:.4;">'
    + '<svg width="11" height="11" fill="none" stroke="#44403C" stroke-width="1.5" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'
    + '<span style="font-size:9px;color:#44403C;font-weight:500;letter-spacing:.05em;">' + t.noDataStored + '</span>'
    + '</div>'
    + '</div>'
    + '<div id="fs-load" style="display:none;padding:64px 28px;text-align:center;background:#FAFAF9;color:#1f2937;">'
    + '<div style="width:36px;height:36px;margin:0 auto 20px;border:2px solid #e7e5e4;border-top-color:#0F3D39;border-radius:50%;animation:fsSpin .7s linear infinite;"></div>'
    + '<p style="font-size:13px;color:#78716c;font-weight:400;">' + t.loading + '</p>'
    + '</div>'
    + '<div id="fs-scan" style="display:none;position:relative;background:#000;overflow:hidden;width:100%;height:100%;">'
    + '<video id="fs-v" playsinline autoplay muted style="width:100%;height:100%;display:block;object-fit:cover;transform:scaleX(-1);"></video>'
    + '<canvas id="fs-ov" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;"></canvas>'
    + '<div id="fs-fl" style="display:none;position:absolute;inset:0;background:rgba(20,184,166,.12);pointer-events:none;z-index:5;transition:opacity .2s;"></div>'
    + '<div id="fs-retakebadge" style="display:none;position:absolute;top:calc(60px + env(safe-area-inset-top, 0px));left:50%;transform:translateX(-50%);z-index:6;padding:6px 14px;border-radius:999px;background:rgba(20,184,166,.18);border:1px solid rgba(20,184,166,.4);color:#5eead4;font-size:10px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);"></div>'
    + '<button id="fs-cancel" style="position:absolute;top:calc(12px + env(safe-area-inset-top, 0px));right:12px;z-index:10;width:32px;height:32px;border-radius:50%;border:none;background:rgba(0,0,0,.4);color:rgba(255,255,255,.7);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);">&times;</button>'
    + '<div id="fs-guide" style="position:absolute;bottom:0;left:0;right:0;padding:20px 24px 28px;background:linear-gradient(0deg,rgba(0,0,0,.82) 0%,rgba(0,0,0,.4) 70%,transparent 100%);text-align:center;z-index:4;">'
    + '<p id="fs-t1" style="color:#fff;font-size:17px;font-weight:600;margin:0 0 4px;font-family:\'DM Sans\',sans-serif;text-shadow:0 1px 8px rgba(0,0,0,.5);"></p>'
    + '<p id="fs-t2" style="color:rgba(255,255,255,.55);font-size:12px;margin:0;font-weight:400;text-shadow:0 1px 4px rgba(0,0,0,.4);"></p>'
    + '</div></div>'

    /* Preview screen */
    + '<div id="fs-prev" style="display:none;padding:24px 16px;background:#FAFAF9;color:#1f2937;">'
    + '<p style="font-size:10px;font-weight:600;color:#44403C;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 4px;text-align:center;">' + t.previewTitle + '</p>'
    + '<p id="fs-prev-sub" style="font-size:11px;color:#a8a29e;margin:0 0 16px;text-align:center;font-weight:400;"></p>'
    + '<div id="fs-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:8px;"></div>'
    + '<p style="font-size:10px;color:#a8a29e;margin:6px 0 14px;text-align:center;font-weight:400;">' + t.previewHint + '</p>'

    /* Quality legend */
    + '<div id="fs-leg" style="display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;margin-bottom:16px;">'
    +   '<div style="display:flex;align-items:center;gap:5px;"><span style="width:7px;height:7px;border-radius:50%;background:#14B8A6;display:inline-block;"></span><span style="font-size:9.5px;color:#78716c;font-weight:500;">' + t.excellent + '</span></div>'
    +   '<div style="display:flex;align-items:center;gap:5px;"><span style="width:7px;height:7px;border-radius:50%;background:#D4B483;display:inline-block;"></span><span style="font-size:9.5px;color:#78716c;font-weight:500;">' + t.good + '</span></div>'
    +   '<div style="display:flex;align-items:center;gap:5px;"><span style="width:7px;height:7px;border-radius:50%;background:#A8A29E;display:inline-block;"></span><span style="font-size:9.5px;color:#78716c;font-weight:500;">' + t.ok + '</span></div>'
    +   '<div style="display:flex;align-items:center;gap:5px;"><span style="width:7px;height:7px;border-radius:50%;background:#EF4444;display:inline-block;"></span><span style="font-size:9.5px;color:#78716c;font-weight:500;">' + t.missing + '</span></div>'
    + '</div>'

    + '<div id="fs-zoom-wrap" style="margin-bottom:16px;">'
    + '<input type="file" id="fs-zoom-input" accept="image/*" capture="environment" style="display:none;"/>'
    + '<button id="fs-zoom-btn" style="width:100%;padding:12px;border:1px dashed #d6d3d1;border-radius:12px;background:transparent;color:#78716c;font-size:12px;font-weight:500;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .15s;">'
    + '<svg width="16" height="16" fill="none" stroke="#a8a29e" stroke-width="1.5" stroke-linecap="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6M8 11h6"/></svg>'
    + '<span><span style="display:block;font-size:12px;color:#57534e;">' + t.zoomBtn + '</span><span style="display:block;font-size:10px;color:#a8a29e;font-weight:400;margin-top:1px;">' + t.zoomSub + '</span></span>'
    + '</button>'
    + '<div id="fs-zoom-preview" style="display:none;margin-top:8px;position:relative;border-radius:10px;overflow:hidden;border:1px solid #e7e5e4;">'
    + '<img id="fs-zoom-img" style="width:100%;max-height:160px;object-fit:cover;display:block;"/>'
    + '<div style="position:absolute;bottom:0;left:0;right:0;padding:6px;background:linear-gradient(transparent,rgba(0,0,0,.4));text-align:center;">'
    + '<span style="font-size:9px;color:#fff;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">' + t.zoomAdded + '</span>'
    + '</div></div></div>'

    + '<button id="fs-re" style="width:100%;padding:11px;border:1px solid #e7e5e4;border-radius:2rem;background:transparent;color:#a8a29e;font-size:11px;font-weight:500;cursor:pointer;transition:all .15s;">' + t.restart + '</button>'
    + '</div>'

    /* Retake/preview modal (full-size photo) */
    + '<div id="fs-modal" style="display:none;position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.85);align-items:center;justify-content:center;flex-direction:column;padding:24px;">'
    + '<img id="fs-modal-img" style="max-width:100%;max-height:60vh;border-radius:14px;object-fit:contain;display:block;"/>'
    + '<p id="fs-modal-label" style="color:rgba(255,255,255,.85);font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1.2px;margin:14px 0 16px;text-align:center;"></p>'
    + '<div style="display:flex;gap:10px;width:100%;max-width:340px;">'
    +   '<button id="fs-modal-keep" style="flex:1;padding:12px;border-radius:999px;border:1px solid rgba(20,184,166,.45);background:rgba(20,184,166,.12);color:#5eead4;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;letter-spacing:.4px;text-transform:uppercase;">'
    +   '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>' + t.keep + '</button>'
    +   '<button id="fs-modal-retake" style="flex:1;padding:12px;border-radius:999px;border:none;background:#0F3D39;color:#fff;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;letter-spacing:.4px;text-transform:uppercase;">'
    +   '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>' + t.retakeOne + '</button>'
    + '</div>'
    + '<button id="fs-modal-close" style="margin-top:18px;background:none;border:none;color:rgba(255,255,255,.5);cursor:pointer;padding:8px;">'
    +   '<svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>'
    + '</button>'
    + '</div>'

    + '<div id="fs-err" style="display:none;padding:52px 28px;text-align:center;background:#FAFAF9;color:#1f2937;">'
    + '<div style="width:48px;height:48px;margin:0 auto 16px;border-radius:50%;border:1.5px solid #fecaca;display:flex;align-items:center;justify-content:center;background:#fef2f2;">'
    + '<svg width="20" height="20" fill="none" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>'
    + '</div>'
    + '<p id="fs-em" style="font-size:13px;color:#991b1b;margin:0;font-weight:400;line-height:1.6;"></p>'
    + '</div></div>'
    + '<style>@keyframes fsSpin{to{transform:rotate(360deg)}}</style>';
  }

  /* ═══════════════════════════════════════════════════════════
     OVERLAY DRAWING
     ═══════════════════════════════════════════════════════════ */
  function drawOverlay(ctx, w, h, S, t) {
    ctx.clearRect(0, 0, w, h);
    if (S.phase !== "calibrating" && S.phase !== "scanning" && S.phase !== "countdown") return;

    var cx = w / 2, cy = h * 0.42, rx = w * 0.34, ry = h * 0.29;

    // Dim outside oval
    ctx.fillStyle = "rgba(0,0,0,.5)";
    ctx.beginPath(); ctx.rect(0, 0, w, h);
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2, true);
    fillEvenOdd(ctx);

    // Oval border
    var allOk = S.st.dist && S.st.light;
    ctx.strokeStyle = allOk ? "#14B8A6" : "rgba(255,255,255,.3)";
    ctx.lineWidth = allOk ? 2.5 : 1.5;
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();

    // Scanning: progress arc
    if (S.phase === "scanning" && S.scanStart) {
      var elapsed = performance.now() - S.scanStart;
      var p = Math.min(1, elapsed / CFG.timeoutMs);
      ctx.strokeStyle = "rgba(20,184,166,.4)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx + 6, ry + 6, 0, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
      ctx.stroke();
    }

    drawBadges(ctx, w, h, S.st, t);
    if (S.phase === "scanning") {
      drawBinDots(ctx, w, h, S, t);
      if (S._guideDir) drawArrow(ctx, w, h, S._guideDir, cx, cy, rx);
    }
  }

  function drawArrow(ctx, w, h, dir, cx, cy, rx) {
    if (dir === "none") return;
    var time = performance.now();
    var pulse = Math.sin(time / 300) * 8;
    var arrowX, tipDir;
    if (dir === "right") { arrowX = cx + rx + 30 + pulse; tipDir = 1; }
    else { arrowX = cx - rx - 30 - pulse; tipDir = -1; }
    var arrowY = cy, size = 14;

    ctx.save();
    ctx.globalAlpha = 0.7 + Math.sin(time / 400) * 0.3;
    ctx.fillStyle = "#14B8A6";
    ctx.beginPath();
    ctx.moveTo(arrowX + tipDir * size, arrowY);
    ctx.lineTo(arrowX - tipDir * size * 0.5, arrowY - size * 0.7);
    ctx.lineTo(arrowX - tipDir * size * 0.5, arrowY + size * 0.7);
    ctx.closePath(); ctx.fill();

    ctx.globalAlpha = 0.3 + Math.sin(time / 400) * 0.15;
    var offset = tipDir * -22;
    ctx.beginPath();
    ctx.moveTo(arrowX + offset + tipDir * size * 0.8, arrowY);
    ctx.lineTo(arrowX + offset - tipDir * size * 0.4, arrowY - size * 0.55);
    ctx.lineTo(arrowX + offset - tipDir * size * 0.4, arrowY + size * 0.55);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function drawBadges(ctx, w, h, st, t) {
    var items = [{ k: "dist", l: t.distance }, { k: "light", l: t.light }, { k: "stab", l: t.stability }];
    var bw = 76, bh = 26, gap = 6;
    var tw = items.length * bw + (items.length - 1) * gap;
    var x = (w - tw) / 2, y = h * 0.80;

    for (var i = 0; i < items.length; i++) {
      var b = items[i], v = st[b.k];
      var bg = v === true ? "rgba(20,184,166,.12)" : v === false ? "rgba(239,68,68,.10)" : "rgba(255,255,255,.04)";
      var fg = v === true ? "#5eead4" : v === false ? "#fca5a5" : "rgba(255,255,255,.25)";
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.roundRect(x, y, bw, bh, 13); ctx.fill();
      ctx.fillStyle = fg;
      ctx.beginPath(); ctx.arc(x + 12, y + bh / 2, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = fg;
      ctx.font = "500 9px 'DM Sans',sans-serif";
      ctx.textAlign = "left"; ctx.textBaseline = "middle";
      ctx.fillText(b.l, x + 20, y + bh / 2 + 0.5);
      x += bw + gap;
    }
  }

  function drawBinDots(ctx, w, h, S, t) {
    var total = w * 0.85, sx = (w - total) / 2, y = h * 0.055;
    var sp = total / (DOT_ORDER.length - 1), r = 6;

    ctx.strokeStyle = "rgba(255,255,255,.06)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(sx, y); ctx.lineTo(sx + total, y); ctx.stroke();

    for (var i = 0; i < DOT_ORDER.length; i++) {
      var dx = sx + i * sp;
      var has = S.bins[DOT_ORDER[i]].length > 0;
      ctx.beginPath(); ctx.arc(dx, y, r, 0, Math.PI * 2);
      ctx.fillStyle = has ? "#14B8A6" : "rgba(255,255,255,.05)";
      ctx.fill();
      if (has) {
        ctx.strokeStyle = "rgba(20,184,166,.5)"; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = "#fff"; ctx.font = "600 7px 'DM Sans',sans-serif";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("✓", dx, y + 0.5);
      }
    }

    var count = 0;
    for (var j = 0; j < BIN_IDS.length; j++) { if (S.bins[BIN_IDS[j]].length > 0) count++; }
    ctx.fillStyle = "rgba(255,255,255,.5)"; ctx.font = "600 11px 'DM Sans',sans-serif";
    ctx.textAlign = "center"; ctx.fillText(count + "/7", w / 2, y + r + 14);
  }

  /* ═══════════════════════════════════════════════════════════
     ADAPTIVE GUIDANCE — getGuidance() port from mobile
     dir: "none" | "right" | "left" — direction of the arrow on the
     mirrored display. "right" means user must turn physically right.
     ═══════════════════════════════════════════════════════════ */
  function adaptiveGuide(S, t) {
    function has(id) { return S.bins[id].length > 0; }
    if (!has("face")) return { t1: t.scanFace, t2: t.scanFaceSub, dir: "none" };
    if (!has("semi_left")) return { t1: t.scanRight1, t2: t.scanRight1Sub, dir: "right" };
    if (!has("left")) return { t1: t.scanRight2, t2: t.scanRight2Sub, dir: "right" };
    if (!has("wide_left")) return { t1: t.scanRight3, t2: t.scanRight3Sub, dir: "right" };
    if (!has("semi_right")) return { t1: t.scanLeft1, t2: t.scanLeft1Sub, dir: "left" };
    if (!has("right")) return { t1: t.scanLeft2, t2: t.scanLeft2Sub, dir: "left" };
    if (!has("wide_right")) return { t1: t.scanLeft3, t2: t.scanLeft3Sub, dir: "left" };
    return { t1: t.scanDone, t2: t.scanDoneSub, dir: "none" };
  }

  // Retake-only guidance: tells user which angle to reach (uses mobile direction strings)
  function retakeGuide(binId, t) {
    switch (binId) {
      case "face": return { t1: t.scanFace, t2: t.scanFaceSub, dir: "none" };
      case "semi_left": return { t1: t.scanRight1, t2: t.scanRight1Sub, dir: "right" };
      case "left": return { t1: t.scanRight2, t2: t.scanRight2Sub, dir: "right" };
      case "wide_left": return { t1: t.scanRight3, t2: t.scanRight3Sub, dir: "right" };
      case "semi_right": return { t1: t.scanLeft1, t2: t.scanLeft1Sub, dir: "left" };
      case "right": return { t1: t.scanLeft2, t2: t.scanLeft2Sub, dir: "left" };
      case "wide_right": return { t1: t.scanLeft3, t2: t.scanLeft3Sub, dir: "left" };
      default: return { t1: t.scanFace, t2: t.scanFaceSub, dir: "none" };
    }
  }

  /* ═══════════════════════════════════════════════════════════
     CAMERA / MEDIAPIPE
     ═══════════════════════════════════════════════════════════ */
  function reqCam() {
    return navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: CAM_W, max: 1920 }, height: { ideal: CAM_H, max: 1440 } }, audio: false,
    });
  }

  function initFM(cb) {
    var fm = new window.FaceMesh({
      locateFile: function (f) { return "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/" + f; },
    });
    fm.setOptions({ maxNumFaces: 1, refineLandmarks: false, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
    fm.onResults(cb);
    return fm;
  }

  function startLoop(video, fm) {
    var running = true, processing = false;
    function tick() {
      if (!running) return;
      requestAnimationFrame(tick);
      if (video.readyState >= 2 && !processing) {
        processing = true;
        fm.send({ image: video }).catch(function () {}).then(function () { processing = false; });
      }
    }
    requestAnimationFrame(tick);
    return { stop: function () { running = false; } };
  }

  function stopCam(S) {
    if (S.cam) { try { S.cam.stop(); } catch (e) {} S.cam = null; }
    if (S.stream) { S.stream.getTracks().forEach(function (tr) { tr.stop(); }); S.stream = null; }
    if (S.noFaceT) { clearTimeout(S.noFaceT); S.noFaceT = null; }
    if (S.idleDraw) { clearInterval(S.idleDraw); S.idleDraw = null; }
  }

  function capFrame(video) {
    return new Promise(function (res) {
      var rawW = video.videoWidth || 640, rawH = video.videoHeight || 480;
      var scale = rawW > CAP_MAX ? CAP_MAX / rawW : 1;
      var vw = Math.round(rawW * scale), vh = Math.round(rawH * scale);
      if (!_cc) { _cc = document.createElement("canvas"); _cx = _cc.getContext("2d"); }
      _cc.width = vw; _cc.height = vh;
      _cx.setTransform(-1, 0, 0, 1, vw, 0);
      try { _cx.drawImage(video, 0, 0, vw, vh); } catch (e) { res(null); return; }
      _cx.setTransform(1, 0, 0, 1, 0, 0);
      _cc.toBlob(function (b) { res(b); }, "image/jpeg", CFG.jpegQ);
    });
  }

  /* ═══════════════════════════════════════════════════════════
     POSITION CHECK — reproduces mobile checkPosition() including
     pitch / roll / backlit messaging. Returns the full set of flags
     the overlay needs.
     ═══════════════════════════════════════════════════════════ */
  function checkPosition(sz, noseX, pitch, roll, br, t) {
    var distOk = sz >= CFG.faceSizeMin && sz <= CFG.faceSizeMax;
    var centerOk = Math.abs(noseX - 0.5) <= CFG.centerMaxOff;
    var pitchOk = Math.abs(pitch) <= CFG.pitchMax;
    var rollOk = Math.abs(roll) <= CFG.rollMax;
    var lightOk = br.ok;
    var allGood = distOk && centerOk && pitchOk && rollOk && lightOk;

    var msg = t.calibTitle, sub = t.calibSub;

    if (!distOk) {
      if (sz < CFG.faceSizeMin) { msg = t.moveCloser; sub = t.moveCloserSub; }
      else { msg = t.moveBack; sub = t.moveBackSub; }
    } else if (br.dark) { msg = t.lowLight; sub = t.lowLightSub; }
    else if (br.bright) { msg = t.strongLight; sub = t.strongLightSub; }
    else if (br.bl) { msg = t.backlight; sub = t.backlightSub; }
    else if (!centerOk) { msg = t.centerFace; sub = t.centerFaceSub; }
    else if (!pitchOk) { msg = t.pitchOff; sub = t.pitchOffSub; }
    else if (!rollOk) { msg = t.rollOff; sub = t.rollOffSub; }
    else { msg = t.calibReady; sub = t.calibReadySub; }

    return { distOk: distOk, centerOk: centerOk, pitchOk: pitchOk, rollOk: rollOk, lightOk: lightOk, allGood: allGood, msg: msg, sub: sub };
  }

  /* ═══════════════════════════════════════════════════════════
     MAIN SCANNER
     ═══════════════════════════════════════════════════════════ */
  function createScanner(container, opts) {
    var lang = opts.lang || (((document.documentElement.lang || "").substring(0, 2) === "en") ? "en" : "fr");
    var t = T[lang] || T.fr;
    var onDone = opts.onComplete || null;
    var onFall = opts.onFallback || null;
    var S = mkState(), dead = false;

    container.innerHTML = buildUI(t);
    function $(sel) { return container.querySelector(sel); }
    var $perm = $("#fs-perm"), $load = $("#fs-load"), $scan = $("#fs-scan");
    var $prev = $("#fs-prev"), $err = $("#fs-err");
    var $v = $("#fs-v"), $ov = $("#fs-ov"), $fl = $("#fs-fl");
    var $t1 = $("#fs-t1"), $t2 = $("#fs-t2"), $em = $("#fs-em");
    var $retakeBadge = $("#fs-retakebadge");
    var ctx = $ov.getContext("2d");

    var $root = $("#fs-root");
    var _fsActive = false;
    var _savedScrollY = 0;

    function enterFullscreen() {
      if (_fsActive) return;
      _fsActive = true;
      _savedScrollY = window.scrollY || window.pageYOffset || 0;
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      $root.style.position = "fixed";
      $root.style.top = "0"; $root.style.left = "0"; $root.style.right = "0"; $root.style.bottom = "0";
      $root.style.width = "100%"; $root.style.maxWidth = "100%";
      $root.style.height = "100dvh";
      $root.style.height = "calc(var(--vh, 1vh) * 100)";
      $root.style.margin = "0"; $root.style.borderRadius = "0";
      $root.style.zIndex = "9999";
      $root.style.paddingTop = "env(safe-area-inset-top, 0px)";
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = "-" + _savedScrollY + "px";
      document.body.style.left = "0"; document.body.style.right = "0";
      updateVh();
      window.addEventListener("resize", updateVh);
      try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock("portrait").catch(function(){}); } catch(e) {}
    }

    function exitFullscreen() {
      if (!_fsActive) return;
      _fsActive = false;
      $root.style.position = "relative";
      $root.style.top = ""; $root.style.left = ""; $root.style.right = ""; $root.style.bottom = "";
      $root.style.width = "100%"; $root.style.maxWidth = "420px";
      $root.style.height = ""; $root.style.margin = "0 auto";
      $root.style.borderRadius = "1.25rem"; $root.style.zIndex = "";
      $root.style.paddingTop = "";
      document.body.style.overflow = ""; document.body.style.position = "";
      document.body.style.top = ""; document.body.style.left = ""; document.body.style.right = "";
      window.scrollTo(0, _savedScrollY);
      window.removeEventListener("resize", updateVh);
      try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch(e) {}
    }

    function updateVh() {
      var vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", vh + "px");
    }

    function show(name) {
      var map = { perm: $perm, load: $load, scan: $scan, prev: $prev, err: $err };
      [$perm, $load, $scan, $prev, $err].forEach(function (e) { e.style.display = "none"; });
      map[name].style.display = "";
      if (name === "scan" || name === "load") enterFullscreen();
      else exitFullscreen();
    }

    function showErr(msg) {
      stopCam(S); $em.textContent = msg; show("err");
      S.phase = "idle";
      setTimeout(function () { if (onFall && !dead) onFall(); }, 3000);
    }

    function resize() {
      var r = $scan.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) {
        setTimeout(function () {
          var r2 = $scan.getBoundingClientRect();
          if (r2.width > 0 && r2.height > 0) {
            var dpr = window.devicePixelRatio || 1;
            $ov.width = r2.width * dpr; $ov.height = r2.height * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          }
        }, 150);
        return;
      }
      var dpr = window.devicePixelRatio || 1;
      $ov.width = r.width * dpr; $ov.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    var resizeHandler = function () {
      if (S.phase === "calibrating" || S.phase === "scanning" || S.phase === "countdown") resize();
    };
    window.addEventListener("resize", resizeHandler);

    show("perm"); S.phase = "perm";

    /* ── Cancel button (during scan) ────────── */
    $("#fs-cancel").addEventListener("click", function () {
      stopCam(S); exitFullscreen(); S.phase = "idle";
      if (onFall && !dead) onFall(); else show("perm");
    });

    /* ── Start button ──────────────────────── */
    var startClicked = false;
    $("#fs-go").addEventListener("click", function () {
      if (startClicked) return;
      startClicked = true;
      beginCalibration(true);
    });

    var beginInFlight = false;
    function beginCalibration(initial) {
      // initial=true means we're entering from perm screen — load MediaPipe + camera fresh.
      // initial=false means we're restarting after a retake — camera may already be alive.
      // Guard: ignore re-entry while a calibration boot is already underway
      // (e.g., user double-taps a retake button).
      if (beginInFlight) return;
      beginInFlight = true;
      show("load"); S.phase = "load";

      var wasmTimeout = setTimeout(function () {
        if (S.phase === "load" && !dead) showErr(t.loadTimeout);
      }, CFG.wasmTimeoutMs);

      // Reuse the existing stream only when it is still alive. After a scan
      // completes, finish() calls stopCam() which ends every track, so on
      // retake we always need a fresh getUserMedia call.
      var streamAlive = !!(S.stream && S.stream.active);
      var ensureStream = (streamAlive && initial !== true)
        ? Promise.resolve(S.stream)
        : reqCam();

      ensureStream.then(function (stream) {
        var streamChanged = $v.srcObject !== stream;
        S.stream = stream;
        if (streamChanged) {
          // Reassigning srcObject resets readyState — must wait for fresh
          // loadedmetadata regardless of any prior video state.
          $v.srcObject = stream;
        }
        return new Promise(function (ok, no) {
          if (!streamChanged && $v.readyState >= 2) { ok(); return; }
          var done = false;
          var onMeta = function () { if (done) return; done = true; ok(); };
          $v.addEventListener("loadedmetadata", onMeta, { once: true });
          setTimeout(function () {
            if (done) return;
            done = true;
            $v.removeEventListener("loadedmetadata", onMeta);
            no(new Error("loadedmetadata_timeout"));
          }, 10000);
        });
      }).then(function () {
        try { $v.play(); } catch (e) {}
        var vw = $v.videoWidth || CAM_W, vh = $v.videoHeight || CAM_H;
        var ratio = vw / vh;
        if (ratio > 1.5 && S._origFaceSizeMin == null) {
          S._origFaceSizeMin = CFG.faceSizeMin;
          S._origFaceSizeMax = CFG.faceSizeMax;
          CFG.faceSizeMin = 0.28; CFG.faceSizeMax = 0.62;
        }
        if (!S.fm) S.fm = initFM(onRes);
        if (!S.cam) S.cam = startLoop($v, S.fm);
        clearTimeout(wasmTimeout);

        if (initial) {
          S.logger.start(deviceTier);
        }

        S.phase = "calibrating"; show("scan"); resize();

        // If MediaPipe WASM hasn't been pre-warmed (or just isn't ready yet),
        // tell the user explicitly. Otherwise jump straight into the calibration
        // copy. The pre-warm in formulaire2.html sets this flag once initialize()
        // resolves, so on a warm cache subsequent scans show calibration immediately.
        var enginePreWarmed = !!window._adermioFaceMeshReady;
        if (enginePreWarmed) {
          $t1.textContent = t.calibTitle; $t2.textContent = t.calibSub;
        } else {
          $t1.textContent = t.initializingTitle; $t2.textContent = t.initializingSub;
        }

        // Track the boot moment so idleDraw can surface a clear "too slow" error
        // if MediaPipe never returns a frame (slow CDN, captive portal, etc).
        var bootStart = performance.now();
        var firstFrameTimeoutMs = enginePreWarmed ? 12000 : 25000;
        S.idleDraw = setInterval(function () {
          if (S.fc > 0 || dead) { clearInterval(S.idleDraw); S.idleDraw = null; return; }
          if (performance.now() - bootStart > firstFrameTimeoutMs) {
            clearInterval(S.idleDraw); S.idleDraw = null;
            if (!dead) showErr(t.initializingTimeout);
            return;
          }
          resize();
          var rect = $scan.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) drawOverlay(ctx, rect.width, rect.height, S, t);
        }, 100);

        // Retake banner
        if (S.retake) {
          var labelKey = BIN_LABELS[S.retake];
          $retakeBadge.textContent = t.retakeFor + " · " + (t[labelKey] || S.retake);
          $retakeBadge.style.display = "";
        } else {
          $retakeBadge.style.display = "none";
        }

        beginInFlight = false;
      }).catch(function (e) {
        clearTimeout(wasmTimeout);
        startClicked = false;
        beginInFlight = false;
        console.error("[FaceScan] init error:", e && e.name, e && e.message, e);
        if (e && e.name === "NotAllowedError") showErr(t.denied);
        else if (e && e.name === "NotFoundError") showErr(t.noDevice);
        else if (e && e.name === "NotReadableError") showErr(t.denied);
        else showErr(t.notSupported);
      });
    }

    /* ── MediaPipe results callback ────────── */
    function onRes(results) {
      if (dead || (S.phase !== "calibrating" && S.phase !== "scanning" && S.phase !== "countdown")) return;
      var now = performance.now();
      var marks = results.multiFaceLandmarks && results.multiFaceLandmarks[0];

      if (!marks || marks.length < 468) { noFace(); return; }
      if (S.noFaceT) { clearTimeout(S.noFaceT); S.noFaceT = null; }

      S.fc++;
      var dt = S.prevT ? now - S.prevT : 33;
      var pose = headPose(marks);
      var sz = faceSize(marks);
      var stab = stabPerSec(marks, S.prev, dt);
      var nose = marks[LM.nose];
      var noseX = nose.x;
      var absYaw = Math.abs(pose.yaw);

      // Recompute brightness/blur every N frames OR if last update was >lightProbeMs ago.
      // The light-probe interval ensures the light badge stays current even if
      // the user turns away from the camera between expensive frames.
      var needsProbe = !S.cBr || (S.fc % CFG.expensiveEvery === 0) ||
        (S.phase === "scanning" && (now - S.lastProbe) > CFG.lightProbeMs);
      if (needsProbe) {
        S.cBr = analyzeBright($v, marks);
        S.cBl = analyzeBlur($v, marks);
        S.lastProbe = now;
      }
      var br = S.cBr || { ok: true, face: 128, dark: false, bright: false, bl: false };
      var bl = S.cBl || { s: 30 };

      var pos = checkPosition(sz, noseX, pose.pitch, pose.roll, br, t);
      S.st.dist = pos.distOk; S.st.light = br.ok; S.st.stab = stab <= CFG.stabMax;
      S.prev = marks; S.prevT = now;

      // ── CALIBRATION ──
      if (S.phase === "calibrating") {
        $t1.textContent = pos.msg; $t2.textContent = pos.sub;

        if (pos.allGood) {
          if (!S.calibSince) S.calibSince = now;
          if (now - S.calibSince >= CFG.calibMs) {
            S.phase = "countdown"; S.countdownStart = now;
            S.logger.log({ type: "calibration_ok", timestamp: Date.now(), durationMs: now - (S.calibSince || now) });
            S.logger.log({ type: "countdown_start", timestamp: Date.now() });
            $t2.textContent = t.countdownSub;
            if (navigator.vibrate) navigator.vibrate(40);
          } else {
            $t1.textContent = t.calibReady; $t2.textContent = t.calibReadySub;
          }
        } else { S.calibSince = null; }
      }

      // ── COUNTDOWN ──
      if (S.phase === "countdown") {
        var cdElapsed = now - S.countdownStart;
        var sec = Math.ceil(3 - cdElapsed / 1000);
        if (sec >= 1) {
          $t1.textContent = sec.toString();
          $t1.style.fontSize = "42px";
          $t2.textContent = t.countdownSub;
        }
        if (cdElapsed >= 3000) {
          $t1.style.fontSize = "";
          S.phase = "scanning"; S.scanStart = now;
          S.logger.log({ type: "scanning_start", timestamp: Date.now() });
          var g = S.retake ? retakeGuide(S.retake, t) : adaptiveGuide(S, t);
          $t1.textContent = g.t1; $t2.textContent = g.t2;
          S._guideDir = g.dir;
          if (navigator.vibrate) navigator.vibrate([60, 30, 60]);
        }
      }

      // ── SCANNING ──
      if (S.phase === "scanning") {
        var scanElapsed = now - S.scanStart;

        // Quality-hint overrides (after multiple post-capture rejects)
        if (S.qualityHint === "lightDuringScan") {
          $t1.textContent = t.lightDuringScan; $t2.textContent = t.lightDuringScanSub;
          S._guideDir = "none";
        } else if (S.qualityHint === "qualityLow") {
          $t1.textContent = t.qualityLow; $t2.textContent = t.qualityLowSub;
          S._guideDir = "none";
        } else if (!pos.distOk && sz < CFG.faceSizeMin) {
          $t1.textContent = t.moveCloser; $t2.textContent = t.moveCloserSub; S._guideDir = "none";
        } else if (!pos.distOk && sz > CFG.faceSizeMax) {
          $t1.textContent = t.moveBack; $t2.textContent = t.moveBackSub; S._guideDir = "none";
        } else if (br.dark) {
          $t1.textContent = t.lowLight; $t2.textContent = t.lowLightSub; S._guideDir = "none";
        } else if (br.bright) {
          $t1.textContent = t.strongLight; $t2.textContent = t.strongLightSub; S._guideDir = "none";
        } else if (br.bl) {
          $t1.textContent = t.backlight; $t2.textContent = t.backlightSub; S._guideDir = "none";
        } else if (!pos.pitchOk) {
          $t1.textContent = t.pitchOff; $t2.textContent = t.pitchOffSub; S._guideDir = "none";
        } else if (!pos.rollOk) {
          $t1.textContent = t.rollOff; $t2.textContent = t.rollOffSub; S._guideDir = "none";
        } else {
          var guide = S.retake ? retakeGuide(S.retake, t) : adaptiveGuide(S, t);
          $t1.textContent = guide.t1; $t2.textContent = guide.t2;
          S._guideDir = guide.dir;
        }

        // Adaptive capture cadence (matches mobile step7.tsx): high-end devices
        // can sustain 150ms intervals for finer top-K selection; low/mid-end
        // devices throttle to 300ms to avoid frame drops during analysis.
        var captureInterval = isHighEnd ? CFG.captureMs : CFG.captureMs * 2;
        if (now - S.lastCapt >= captureInterval && !S.capturing && pos.distOk) {
          tryCapture(marks, pose, br, bl, stab, absYaw, noseX, now);
        }

        var filled = 0;
        for (var fi = 0; fi < BIN_IDS.length; fi++) { if (S.bins[BIN_IDS[fi]].length > 0) filled++; }

        // Retake mode: finish as soon as the target bin has a capture
        if (S.retake && S.bins[S.retake].length > 0) { finish(); return; }

        if (filled >= 7) { finish(); return; }
        // Early finish: 3+ essential bins after 20s
        var hasEssential = S.bins.face.length > 0
          && (S.bins.right.length > 0 || S.bins.semi_right.length > 0 || S.bins.wide_right.length > 0)
          && (S.bins.left.length > 0 || S.bins.semi_left.length > 0 || S.bins.wide_left.length > 0);
        if (hasEssential && filled >= 3 && scanElapsed > 20000 && !S.retake) { finish(); return; }
        if (scanElapsed > CFG.timeoutMs) { S.logger.logTimeout(filled); finish(); return; }
      }

      var rect = $scan.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) drawOverlay(ctx, rect.width, rect.height, S, t);
    }

    function noFace() {
      $t1.textContent = t.noFace; $t2.textContent = t.noFaceSub;
      S.st = { dist: null, light: null, stab: null }; S.calibSince = null;
      if (!S.noFaceT) {
        S.noFaceT = setTimeout(function () {
          if ((S.phase === "calibrating" || S.phase === "scanning") && !dead) {
            S.logger.log({ type: "no_face", timestamp: Date.now(), durationMs: 0 });
            showErr(t.noFace);
          }
        }, CFG.noFaceMs);
      }
      var rect = $scan.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) drawOverlay(ctx, rect.width, rect.height, S, t);
    }

    /* ── Capture (with post-capture quality validation) ───── */
    function tryCapture(marks, pose, br, bl, stab, absYaw, noseX, now) {
      var detectedBin = classifyBin(absYaw, noseX);
      if (!detectedBin) return;
      if (S.retake) {
        // Retake mode: only the explicitly retaken bin is eligible
        if (detectedBin !== S.retake) return;
      } else {
        // Normal mode: only capture bins on the side we're currently guiding
        // toward. Prevents the user from accidentally banking right-side photos
        // while the guidance is still asking them to turn left, which would
        // leave the sequence half-done with mismatched expectations.
        var allowed = getAllowedBins(S.bins);
        if (!allowed[detectedBin]) return;
      }
      var binId = detectedBin;

      var preScore = computeScore(bl, stab, absYaw, BIN_IDEAL_YAW[binId]);
      var bin = S.bins[binId];

      // Pre-flight rejection: stored scores are adjusted (preScore*0.6 + qualityBonus*0.4).
      // Best possible adjusted score for this candidate = preScore*0.6 + 1.0*0.4. If even
      // that can't beat the lowest stored, skip — saves a takePhoto.
      var bestPossibleAdjusted = preScore * 0.6 + 0.4;
      if (bin.length >= CFG.binTopN && bestPossibleAdjusted <= bin[bin.length - 1].score) return;

      S.capturing = true; S.lastCapt = now;
      capFrame($v).then(function (blob) {
        if (!blob || dead) { S.capturing = false; return; }

        // Post-capture quality validation. We use the cached pre-capture brightness
        // and blur values which were computed within the last few frames — they
        // accurately describe the captured frame because <100ms elapsed.
        var quality = analyzePhotoQuality(br, bl);

        if (!quality.isAcceptable) {
          S.retakeRejects++;
          S.logger.logRejected(binId, quality.rejectReason || "quality_low");
          if (DEBUG) console.log("[FaceScan] Rejected " + binId + ": " + quality.rejectReason +
            " (face=" + br.face.toFixed(0) + ", lap=" + bl.s.toFixed(1) + ")");

          var isLight = (quality.rejectReason === "lowLight" || quality.rejectReason === "strongLight");

          if (isLight) {
            S.qualityHint = "lightDuringScan";
            if (navigator.vibrate) navigator.vibrate([20, 40, 20]);
          } else if (S.retakeRejects >= CFG.rejectGuidanceAfter) {
            S.qualityHint = "qualityLow";
          }

          if (S.retakeRejects >= CFG.rejectForceAfter) {
            // Force-accept this one to avoid infinite loop
            S.retakeRejects = 0;
            S.qualityHint = null;
            // fall through to add to bin
          } else {
            S.capturing = false;
            return;
          }
        } else {
          if (S.retakeRejects > 0) {
            S.retakeRejects = 0;
            S.qualityHint = null;
          }
        }

        // Adjusted score: 60% pre-capture (blur+stab+angle) + 40% post-capture quality bonus
        var adjustedScore = preScore * 0.6 + quality.overallScore * 0.4;

        var wasEmpty = bin.length === 0;
        bin.push({ blob: blob, url: URL.createObjectURL(blob), score: adjustedScore });
        bin.sort(function (a, b) { return b.score - a.score; });
        while (bin.length > CFG.binTopN) { var rm = bin.pop(); URL.revokeObjectURL(rm.url); }

        S.logger.logCapture(binId, adjustedScore, wasEmpty);
        if (wasEmpty && navigator.vibrate) navigator.vibrate(25);
        S.capturing = false;
      }).catch(function (e) {
        S.logger.logError(e && e.message ? e.message : "capFrame_failed");
        S.capturing = false;
      });
    }

    function finish() {
      if (S.phase === "preview") return;
      var binsFilled = 0;
      for (var i = 0; i < BIN_IDS.length; i++) if (S.bins[BIN_IDS[i]].length > 0) binsFilled++;
      S.logger.logComplete(binsFilled);
      S.phase = "preview";
      stopCam(S);
      if (navigator.vibrate) navigator.vibrate([50, 25, 50]);
      // Persist scan log to formState so it ships with the form submission
      try {
        if (window.formState) window.formState.scanLog = S.logger.toJSON();
      } catch (_) {}
      var wasRetake = !!S.retake;
      S.retake = null;
      S.retakeRejects = 0;
      S.qualityHint = null;
      showPreview(wasRetake);
    }

    /* ── Preview ───────────────────────────── */
    function showPreview(wasRetake) {
      show("prev");
      var grid = $("#fs-grid");
      grid.innerHTML = "";

      var filled = 0;
      for (var k = 0; k < BIN_IDS.length; k++) if (S.bins[BIN_IDS[k]].length > 0) filled++;
      var subEl = $("#fs-prev-sub");
      var word = filled === 1 ? t.angleCaptured : t.anglesCaptured;
      subEl.textContent = filled + " " + word;

      for (var i = 0; i < DOT_ORDER.length; i++) {
        var bin = DOT_ORDER[i];
        var entry = S.bins[bin][0] || null;
        grid.appendChild(makeCard(bin, entry));
      }

      var $zBtn = $("#fs-zoom-btn"), $zIn = $("#fs-zoom-input"), $zPrev = $("#fs-zoom-preview"), $zImg = $("#fs-zoom-img");
      $zBtn.onclick = function () { $zIn.click(); };
      $zIn.onchange = function (e) {
        var f = e.target.files && e.target.files[0]; if (!f) return;
        S.zoomFile = f;
        var reader = new FileReader();
        reader.onload = function (ev) { $zImg.src = ev.target.result; $zPrev.style.display = ""; };
        reader.readAsDataURL(f);
        // Upload zoom immediately when selected (with compression + retry)
        compressBlob(f).then(function (compressed) {
          var zoomFileObj = new File([compressed], "scan_zoom_" + Date.now() + ".jpg", { type: "image/jpeg" });
          if (typeof window.uploadToS3Presigned === "function") {
            withRetry(function () {
              return window.uploadToS3Presigned({ file: zoomFileObj, jobId: (window.formState && window.formState.jobId) || "", type: "zoom" });
            }, "zoom_upload")
              .then(function (result) { if (window.formState) window.formState.photos.zoom = { key: result.key, getUrl: result.getUrl }; })
              .catch(function () {});
          }
        });
      };

      $("#fs-re").onclick = function () { if (window.AdermioFaceScan) window.AdermioFaceScan.restart(); };

      // Modal close button
      $("#fs-modal-close").onclick = closeModal;
      var $modal = $("#fs-modal");
      $modal.onclick = function (e) { if (e.target === $modal) closeModal(); };

      // After a retake, run the upload again so the new photo lands on S3
      doUpload(wasRetake);
    }

    function makeCard(bin, entry) {
      var labelKey = BIN_LABELS[bin];
      var label = t[labelKey] || bin;
      var el = document.createElement("div");
      el.style.cssText = "border-radius:10px;overflow:hidden;background:#fff;border:1px solid #e7e5e4;text-align:center;cursor:pointer;position:relative;transition:transform .12s;";
      el.onmouseenter = function () { el.style.transform = "scale(1.02)"; };
      el.onmouseleave = function () { el.style.transform = "scale(1)"; };

      if (entry) {
        var q = qLabel(entry.score, t);
        el.innerHTML = '<div style="position:relative;">'
          + '<img src="' + entry.url + '" style="width:100%;aspect-ratio:3/4;object-fit:cover;display:block;"/>'
          + '<div style="position:absolute;top:6px;right:6px;width:8px;height:8px;border-radius:50%;background:' + q.c + ';box-shadow:0 0 0 1.5px rgba(255,255,255,.85),0 1px 3px rgba(0,0,0,.3);"></div>'
          + '<div style="position:absolute;bottom:0;left:0;right:0;padding:4px 6px;background:linear-gradient(transparent,rgba(0,0,0,.55));">'
          +   '<span style="font-size:8.5px;color:#fff;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">' + q.l + '</span>'
          + '</div>'
          + '</div>'
          + '<div style="padding:6px 2px 5px;background:#FAFAF9;border-top:1px solid #f5f5f4;">'
          + '<p style="font-size:8px;color:#78716c;margin:0;font-weight:600;text-transform:uppercase;letter-spacing:.8px;">' + label + '</p>'
          + '</div>';
        el.onclick = function () { openModal(bin, entry, label); };
      } else {
        el.innerHTML = '<div style="position:relative;">'
          + '<div style="width:100%;aspect-ratio:3/4;display:flex;align-items:center;justify-content:center;background:#f5f5f4;">'
          +   '<svg width="20" height="20" fill="none" stroke="#d6d3d1" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>'
          + '</div>'
          + '<div style="position:absolute;top:6px;right:6px;width:8px;height:8px;border-radius:50%;background:#EF4444;box-shadow:0 0 0 1.5px rgba(255,255,255,.85);"></div>'
          + '</div>'
          + '<div style="padding:6px 2px 5px;background:#FAFAF9;border-top:1px solid #f5f5f4;">'
          + '<p style="font-size:8px;color:#d6d3d1;margin:0;font-weight:600;text-transform:uppercase;letter-spacing:.8px;">' + label + '</p>'
          + '</div>';
        // Tap on empty card → directly retake that angle
        el.onclick = function () { startRetake(bin); };
      }
      return el;
    }

    function openModal(bin, entry, label) {
      var $modal = $("#fs-modal");
      var $img = $("#fs-modal-img");
      var $lbl = $("#fs-modal-label");
      $img.src = entry.url;
      $lbl.textContent = label;
      $modal.style.display = "flex";

      $("#fs-modal-keep").onclick = closeModal;
      $("#fs-modal-retake").onclick = function () {
        closeModal();
        startRetake(bin);
      };
    }

    function closeModal() {
      var $modal = $("#fs-modal");
      $modal.style.display = "none";
    }

    function startRetake(bin) {
      // Clear that bin (free its blob URLs)
      var arr = S.bins[bin];
      for (var j = 0; j < arr.length; j++) URL.revokeObjectURL(arr[j].url);
      S.bins[bin] = [];
      // Mark retake target and reset rejection counter
      S.retake = bin;
      S.retakeRejects = 0;
      S.qualityHint = null;
      S.calibSince = null;
      S.fc = 0;
      S.cBr = null; S.cBl = null;
      // Re-enter calibration → countdown → scan, only that bin will be captured.
      beginCalibration(false);
    }

    /* ── Upload ───────────────────────────── */
    function doUpload(wasRetake) {
      if (!S.bins.face[0]) {
        // Nothing to upload — handle restart gracefully
        if (!wasRetake && window.AdermioFaceScan) window.AdermioFaceScan.restart();
        return;
      }

      function uploadOne(item) {
        if (typeof window.uploadToS3Presigned !== "function") return Promise.resolve(null);
        return compressBlob(item.blob).then(function (compressed) {
          var file = new File([compressed], "scan_" + item.binId + "_" + Date.now() + ".jpg", { type: "image/jpeg" });
          return withRetry(function () {
            return window.uploadToS3Presigned({ file: file, jobId: (window.formState && window.formState.jobId) || "", type: item.binId });
          }, "upload_" + item.binId)
            .then(function (result) {
              if (window.formState) window.formState.photos[item.binId] = { key: result.key, getUrl: result.getUrl };
              return result;
            })
            .catch(function (err) {
              if (DEBUG) console.warn("[FaceScan] upload failed for " + item.binId, err);
              return null;
            });
        });
      }

      // Face first — unblocks the form's "next" button
      var faceItem = { binId: "face", blob: S.bins.face[0].blob };
      uploadOne(faceItem).then(function (result) {
        if (!result) return;
        if (window.validationState) window.validationState.facePhotoUploaded = true;
        if (window.formState) window.formState.photoMethod = "scan";
        syncManualPreviews();
        var photoErr = document.getElementById("photo-error");
        if (photoErr) photoErr.classList.add("hidden");

        // Background queue: remaining bins one at a time (avoid bandwidth saturation on mobile)
        var bgQueue = [];
        for (var i = 0; i < BIN_IDS.length; i++) {
          if (BIN_IDS[i] === "face") continue;
          var best = S.bins[BIN_IDS[i]][0];
          if (best) bgQueue.push({ binId: BIN_IDS[i], blob: best.blob });
        }
        if (S.zoomFile) bgQueue.push({ binId: "zoom", blob: S.zoomFile });

        function bgNext(idx) {
          if (idx >= bgQueue.length) {
            if (onDone) onDone({ uploaded: bgQueue.length + 1 });
            return;
          }
          uploadOne(bgQueue[idx]).then(function () { bgNext(idx + 1); });
        }
        bgNext(0);
      });
    }

    function syncManualPreviews() {
      var mapping = { face: "face", right: "right", left: "left" };
      for (var bin in mapping) {
        var entry = S.bins[bin] && S.bins[bin][0]; if (!entry) continue;
        var img = document.getElementById("preview-" + mapping[bin]);
        var empty = document.getElementById("empty-" + mapping[bin]);
        if (img) { img.src = entry.url; img.classList.remove("hidden"); }
        if (empty) empty.classList.add("hidden");
      }
    }

    /* ── Destroy ──────────────────────────── */
    function destroy() {
      dead = true;
      exitFullscreen();
      stopCam(S);
      // Release the dead MediaStream reference so a future scan instance starts clean
      try { if ($v) $v.srcObject = null; } catch (_) {}
      if (S.fm) { try { S.fm.close(); } catch (e) {} S.fm = null; }
      if (S._origFaceSizeMin != null) { CFG.faceSizeMin = S._origFaceSizeMin; CFG.faceSizeMax = S._origFaceSizeMax; }
      for (var i = 0; i < BIN_IDS.length; i++) {
        var arr = S.bins[BIN_IDS[i]];
        for (var j = 0; j < arr.length; j++) URL.revokeObjectURL(arr[j].url);
        S.bins[BIN_IDS[i]] = [];
      }
      window.removeEventListener("resize", resizeHandler);
      S.phase = "idle";
    }

    return { destroy: destroy };
  }

  /* ═══════════════════════════════════════════════════════════
     PUBLIC API
     ═══════════════════════════════════════════════════════════ */
  window.AdermioFaceScan = {
    _i: null, _el: null, _o: null,
    init: function (id, opts) {
      opts = opts || {};
      var el = document.getElementById(id);
      if (!el) return;
      if (this._i) this._i.destroy();
      this._el = el; this._o = opts;
      this._i = createScanner(el, opts);
    },
    destroy: function () { if (this._i) { this._i.destroy(); this._i = null; } },
    restart: function () {
      if (this._el && this._o) {
        if (this._i) this._i.destroy();
        _bc = null; _bx = null; _lc = null; _lx = null; _cc = null; _cx = null; _blurBuf = null;
        this._i = createScanner(this._el, this._o);
      }
    },
  };
})();
