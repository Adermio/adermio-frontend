/**
 * Adermio Face Scan v8.0 — Production Release
 *
 * Captures 7 angles via guided video scan using MediaPipe Face Mesh.
 * Adaptive resolution: high-res on modern devices, low-res on old ones.
 *
 * Dependencies: @mediapipe/face_mesh, @mediapipe/camera_utils (CDN)
 */
(function () {
  "use strict";

  var DEBUG = false;

  /* ═══════════════════════════════════════════════════════════
     DEVICE CAPABILITY DETECTION
     ═══════════════════════════════════════════════════════════ */
  var isHighEnd = (function () {
    var dpr = window.devicePixelRatio || 1;
    var mem = navigator.deviceMemory || 4; // default 4GB if not available
    // iPhone 12+ has dpr 3, 4GB+ RAM
    // Old devices: dpr 2, 2GB RAM
    return dpr >= 3 || mem >= 6;
  })();

  var CAM_W = isHighEnd ? 1280 : 640;
  var CAM_H = isHighEnd ? 960 : 480;
  var CAP_MAX = isHighEnd ? 1280 : 800;

  /* ═══════════════════════════════════════════════════════════
     TRANSLATIONS
     ═══════════════════════════════════════════════════════════ */
  var T = {
    fr: {
      permTitle: "Scan facial intelligent",
      permDesc: "Notre technologie analyse votre visage en quelques secondes pour garantir des photos optimales pour votre diagnostic. Aucune donn\u00e9e vid\u00e9o n'est conserv\u00e9e.",
      permBtn: "Activer la cam\u00e9ra",
      denied: "Acc\u00e8s cam\u00e9ra refus\u00e9. Utilisez l'import manuel.",
      notSupported: "Navigateur incompatible. Utilisez l'import manuel.",
      noDevice: "Aucune cam\u00e9ra frontale d\u00e9tect\u00e9e.",
      loading: "Chargement de l'analyse faciale\u2026",
      loadTimeout: "Chargement trop long. V\u00e9rifiez votre connexion.",
      calibTitle: "Positionnez votre visage",
      calibSub: "Placez votre visage dans l'ovale",
      calibReady: "Parfait, ne bougez pas",
      countdown3: "3", countdown2: "2", countdown1: "1",
      countdownSub: "Pr\u00e9parez-vous, le scan va commencer",
      moveCloser: "Rapprochez-vous de la cam\u00e9ra",
      moveBack: "Reculez l\u00e9g\u00e8rement",
      centerFace: "Centrez votre visage dans l'ovale",
      lowLight: "Trouvez un endroit plus \u00e9clair\u00e9",
      strongLight: "Lumi\u00e8re trop forte, d\u00e9placez-vous",
      backlight: "Contre-jour d\u00e9tect\u00e9, tournez-vous",
      noFace: "Visage non d\u00e9tect\u00e9",
      noFaceSub: "Assurez-vous que votre visage est bien visible",
      scanReady: "C'est parti",
      scanFace: "Regardez la cam\u00e9ra",
      scanFaceSub: "Restez bien de face",
      scanRight: "Tournez la t\u00eate vers la droite",
      scanRightSub: "Doucement, montrez votre profil",
      scanWideRight: "Continuez de tourner \u00e0 droite",
      scanWideRightSub: "Un peu plus, montrez votre oreille",
      scanLeft: "Tournez la t\u00eate vers la gauche",
      scanLeftSub: "Doucement, montrez votre profil",
      scanWideLeft: "Continuez de tourner \u00e0 gauche",
      scanWideLeftSub: "Un peu plus, montrez votre oreille",
      scanCenter: "Revenez face cam\u00e9ra",
      scanCenterSub: "Regardez droit devant vous",
      scanDone: "Scan termin\u00e9",
      scanDoneSub: "Analyse de vos captures\u2026",
      captured: "Captur\u00e9",
      binFace: "Face", binSemiR: "Semi D", binRight: "Profil D", binWideR: "Large D",
      binSemiL: "Semi G", binLeft: "Profil G", binWideL: "Large G",
      distance: "Distance", light: "Lumi\u00e8re", stability: "Stabilit\u00e9",
      previewTitle: "Vos captures",
      excellent: "Excellent", good: "Bon", ok: "Correct", missing: "Manquant",
      retake: "Refaire", validate: "Valider et continuer",
      restart: "Recommencer le scan", uploading: "Envoi en cours\u2026",
      uploadFail: "Erreur d'envoi, r\u00e9essayez",
      zoomBtn: "Ajouter un gros plan",
      zoomSub: "Photo d'une zone sp\u00e9cifique (optionnel)",
      zoomAdded: "Gros plan ajout\u00e9",
    },
    en: {
      permTitle: "Smart face scan",
      permDesc: "Our technology analyzes your face in seconds to ensure optimal photos for your diagnosis. No video data is stored.",
      permBtn: "Enable camera",
      denied: "Camera access denied. Use manual upload.",
      notSupported: "Browser not supported. Use manual upload.",
      noDevice: "No front camera detected.",
      loading: "Loading face analysis\u2026",
      loadTimeout: "Loading too slow. Check your connection.",
      calibTitle: "Position your face",
      calibSub: "Place your face inside the oval",
      calibReady: "Perfect, hold still",
      countdown3: "3", countdown2: "2", countdown1: "1",
      countdownSub: "Get ready, scan is about to start",
      moveCloser: "Move closer to the camera",
      moveBack: "Move back slightly",
      centerFace: "Center your face in the oval",
      lowLight: "Find a brighter spot",
      strongLight: "Too much light, move away",
      backlight: "Backlight detected, turn around",
      noFace: "Face not detected",
      noFaceSub: "Make sure your face is clearly visible",
      scanReady: "Let's go",
      scanFace: "Look at the camera",
      scanFaceSub: "Stay facing forward",
      scanRight: "Turn your head to the right",
      scanRightSub: "Slowly, show your profile",
      scanWideRight: "Keep turning right",
      scanWideRightSub: "A bit more, show your ear",
      scanLeft: "Turn your head to the left",
      scanLeftSub: "Slowly, show your profile",
      scanWideLeft: "Keep turning left",
      scanWideLeftSub: "A bit more, show your ear",
      scanCenter: "Come back to center",
      scanCenterSub: "Look straight ahead",
      scanDone: "Scan complete",
      scanDoneSub: "Analyzing your captures\u2026",
      captured: "Captured",
      binFace: "Front", binSemiR: "Semi R", binRight: "Profile R", binWideR: "Wide R",
      binSemiL: "Semi L", binLeft: "Profile L", binWideL: "Wide L",
      distance: "Distance", light: "Light", stability: "Stability",
      previewTitle: "Your captures",
      excellent: "Excellent", good: "Good", ok: "Fair", missing: "Missing",
      retake: "Retake", validate: "Validate and continue",
      restart: "Restart scan", uploading: "Uploading\u2026",
      uploadFail: "Upload error, try again",
      zoomBtn: "Add a close-up",
      zoomSub: "Photo of a specific area (optional)",
      zoomAdded: "Close-up added",
    },
  };

  /* ═══════════════════════════════════════════════════════════
     CONFIG
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
    brightMin: 40,
    brightMax: 235,
    brightIdeal: 130,
    backlightRatio: 0.50,
    blurIdeal: 45,
    stabMax: 0.20,
    calibMs: 700,
    captureMs: 150,
    timeoutMs: 40000,
    wasmTimeoutMs: 15000,
    noFaceMs: 12000,
    binTopN: 3,
    jpegQ: 0.92,
    expensiveEvery: isHighEnd ? 4 : 6,
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

  function classifyBin(absYaw, noseX) {
    var right = noseX < 0.5;
    if (absYaw < CFG.faceYawMax) return "face";
    if (absYaw >= CFG.semiYawMin && absYaw < CFG.semiYawMax) return right ? "semi_right" : "semi_left";
    if (absYaw >= CFG.profYawMin && absYaw < CFG.wideYawMin) return right ? "right" : "left";
    if (absYaw >= CFG.wideYawMin && absYaw <= CFG.wideYawMax) return right ? "wide_right" : "wide_left";
    return null;
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
    return {
      yaw: (Math.atan2(nx, -nz) * 180) / Math.PI,
      pitch: (Math.asin(Math.max(-1, Math.min(1, -ny / nLen))) * 180) / Math.PI,
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
     IMAGE ANALYSIS (cached canvases)
     ═══════════════════════════════════════════════════════════ */
  var _bc = null, _bx = null, _lc = null, _lx = null, _cc = null, _cx = null, _blurBuf = null;

  function analyzeBright(video, m) {
    if (!_bc) { _bc = document.createElement("canvas"); _bx = _bc.getContext("2d", { willReadFrequently: true }); }
    var sw = 120, sh = 90; _bc.width = sw; _bc.height = sh;
    try { _bx.drawImage(video, 0, 0, sw, sh); var d = _bx.getImageData(0, 0, sw, sh).data; } catch (e) { return { face: 128, bg: 128, r: 1, ok: true, dark: false, bright: false, bl: false }; }
    var fb = faceBounds(m);
    var fs = 0, fp = 0, bs = 0, bp = 0;
    for (var y = 0; y < sh; y++) for (var x = 0; x < sw; x++) {
      var i = (y * sw + x) * 4;
      var l = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
      var nx2 = x / sw, ny2 = y / sh;
      if (nx2 >= fb.x0 && nx2 <= fb.x1 && ny2 >= fb.y0 && ny2 <= fb.y1) { fs += l; fp++; } else { bs += l; bp++; }
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
    try { _lx.drawImage(video, sx, sy, sw, sh, 0, 0, cw, ch); var d = _lx.getImageData(0, 0, cw, ch).data; } catch (e) { return { s: 0 }; }
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
     SCORING
     ═══════════════════════════════════════════════════════════ */
  function computeScore(br, bl, stab, absYaw, idealYaw) {
    var bS = Math.max(0, 1 - Math.abs(br.face - CFG.brightIdeal) / 90);
    var lS = Math.min(1, bl.s / CFG.blurIdeal);
    var tS = Math.max(0, 1 - stab / (CFG.stabMax * 6));
    var aS = Math.max(0, 1 - Math.abs(absYaw - idealYaw) / 25);
    return bS * 0.25 + lS * 0.30 + tS * 0.20 + aS * 0.25;
  }

  function qLabel(s, t) {
    if (s >= 0.55) return { l: t.excellent, c: "#14B8A6" };
    if (s >= 0.35) return { l: t.good, c: "#D4B483" };
    if (s > 0) return { l: t.ok, c: "#a8a29e" };
    return { l: t.missing, c: "#ef4444" };
  }

  /* ═══════════════════════════════════════════════════════════
     STATE
     ═══════════════════════════════════════════════════════════ */
  function mkState() {
    var bins = {};
    for (var i = 0; i < BIN_IDS.length; i++) bins[BIN_IDS[i]] = [];
    return {
      phase: "idle", bins: bins, calibSince: null,
      countdownStart: null, scanStart: null, lastCapt: 0,
      prev: null, prevT: null,
      noFaceT: null, fc: 0,
      cBr: null, cBl: null,
      st: { dist: null, light: null, stab: null },
      fm: null, cam: null, stream: null,
      retake: null, capturing: false,
      idleDraw: null,
    };
  }

  /* ═══════════════════════════════════════════════════════════
     POLYFILLS (roundRect + ellipse)
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
      this.save();
      this.translate(cx, cy);
      this.rotate(rot || 0);
      this.scale(1, ry / (rx || 1));
      this.arc(0, 0, rx, sa, ea, ccw);
      this.restore();
    };
  }

  /* ═══════════════════════════════════════════════════════════
     EVENODD POLYFILL HELPER
     ═══════════════════════════════════════════════════════════ */
  function fillEvenOdd(ctx) {
    try { ctx.fill("evenodd"); } catch (e) { ctx.fill(); }
  }

  /* ═══════════════════════════════════════════════════════════
     UI — Adermio Brand
     ═══════════════════════════════════════════════════════════ */
  function buildUI(t) {
    return '<div id="fs-root" style="position:relative;width:100%;max-width:420px;margin:0 auto;border-radius:1.25rem;overflow:hidden;background:#0F3D39;font-family:\'DM Sans\',sans-serif;">'
    + '<div id="fs-perm" style="padding:44px 28px;text-align:center;background:linear-gradient(160deg,#0F3D39 0%,#1a5249 100%);color:#fff;">'
    + '<div style="width:60px;height:60px;margin:0 auto 24px;border-radius:50%;border:1.5px solid rgba(20,184,166,.25);display:flex;align-items:center;justify-content:center;">'
    + '<svg width="26" height="26" fill="none" stroke="#14B8A6" stroke-width="1.5" stroke-linecap="round" viewBox="0 0 24 24"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>'
    + '</div>'
    + '<h3 style="font-family:\'Playfair Display\',serif;font-size:21px;font-weight:600;margin:0 0 10px;letter-spacing:-.3px;">' + t.permTitle + '</h3>'
    + '<p style="font-size:13px;color:rgba(255,255,255,.5);margin:0 0 32px;line-height:1.75;font-weight:300;">' + t.permDesc + '</p>'
    + '<button id="fs-go" style="width:100%;padding:16px;border:none;border-radius:2rem;background:#14B8A6;color:#fff;font-size:14px;font-weight:600;cursor:pointer;letter-spacing:.5px;text-transform:uppercase;">' + t.permBtn + '</button>'
    + '</div>'
    + '<div id="fs-load" style="display:none;padding:64px 28px;text-align:center;background:#0F3D39;color:#fff;">'
    + '<div style="width:40px;height:40px;margin:0 auto 24px;border:2.5px solid rgba(255,255,255,.08);border-top-color:#14B8A6;border-radius:50%;animation:fsSpin .7s linear infinite;"></div>'
    + '<p style="font-size:13px;color:rgba(255,255,255,.45);font-weight:400;">' + t.loading + '</p>'
    + '</div>'
    + '<div id="fs-scan" style="display:none;position:relative;background:#000;overflow:hidden;">'
    + '<video id="fs-v" playsinline autoplay muted style="width:100%;display:block;object-fit:cover;transform:scaleX(-1);"></video>'
    + '<canvas id="fs-ov" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;"></canvas>'
    + '<div id="fs-fl" style="display:none;position:absolute;inset:0;background:rgba(20,184,166,.12);pointer-events:none;z-index:5;transition:opacity .2s;"></div>'
    + '<button id="fs-cancel" style="position:absolute;top:12px;right:12px;z-index:10;width:32px;height:32px;border-radius:50%;border:none;background:rgba(0,0,0,.4);color:rgba(255,255,255,.7);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);">&times;</button>'
    + '<div id="fs-guide" style="position:absolute;bottom:0;left:0;right:0;padding:20px 24px 28px;background:linear-gradient(0deg,rgba(0,0,0,.82) 0%,rgba(0,0,0,.4) 70%,transparent 100%);text-align:center;z-index:4;">'
    + '<p id="fs-t1" style="color:#fff;font-size:17px;font-weight:600;margin:0 0 4px;font-family:\'DM Sans\',sans-serif;text-shadow:0 1px 8px rgba(0,0,0,.5);"></p>'
    + '<p id="fs-t2" style="color:rgba(255,255,255,.55);font-size:12px;margin:0;font-weight:400;text-shadow:0 1px 4px rgba(0,0,0,.4);"></p>'
    + '</div></div>'
    + '<div id="fs-prev" style="display:none;padding:28px 20px;background:linear-gradient(160deg,#0F3D39 0%,#1a5249 100%);color:#fff;">'
    + '<h3 style="font-family:\'Playfair Display\',serif;font-size:19px;font-weight:600;margin:0 0 20px;text-align:center;">' + t.previewTitle + '</h3>'
    + '<div id="fs-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:16px;"></div>'
    + '<div id="fs-zoom-wrap" style="margin-bottom:20px;">'
    + '<input type="file" id="fs-zoom-input" accept="image/*" capture="environment" style="display:none;"/>'
    + '<button id="fs-zoom-btn" style="width:100%;padding:14px;border:1px dashed rgba(20,184,166,.3);border-radius:12px;background:rgba(20,184,166,.04);color:rgba(255,255,255,.7);font-size:13px;font-weight:500;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;">'
    + '<svg width="18" height="18" fill="none" stroke="#14B8A6" stroke-width="1.5" stroke-linecap="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6M8 11h6"/></svg>'
    + '<span><span style="display:block;font-size:13px;">' + t.zoomBtn + '</span><span style="display:block;font-size:10px;color:rgba(255,255,255,.35);font-weight:400;margin-top:2px;">' + t.zoomSub + '</span></span>'
    + '</button>'
    + '<div id="fs-zoom-preview" style="display:none;margin-top:10px;position:relative;border-radius:12px;overflow:hidden;border:1px solid rgba(20,184,166,.2);">'
    + '<img id="fs-zoom-img" style="width:100%;max-height:180px;object-fit:cover;display:block;"/>'
    + '<div style="position:absolute;bottom:0;left:0;right:0;padding:8px;background:linear-gradient(transparent,rgba(0,0,0,.6));text-align:center;">'
    + '<span style="font-size:10px;color:#5eead4;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">' + t.zoomAdded + '</span>'
    + '</div></div></div>'
    + '<button id="fs-ok" style="width:100%;padding:16px;border:none;border-radius:2rem;background:#14B8A6;color:#fff;font-size:14px;font-weight:600;cursor:pointer;text-transform:uppercase;letter-spacing:.5px;">' + t.validate + '</button>'
    + '<button id="fs-re" style="width:100%;padding:13px;margin-top:10px;border:1px solid rgba(255,255,255,.1);border-radius:2rem;background:transparent;color:rgba(255,255,255,.4);font-size:12px;font-weight:500;cursor:pointer;">' + t.restart + '</button>'
    + '</div>'
    + '<div id="fs-err" style="display:none;padding:52px 28px;text-align:center;background:#0F3D39;color:#fff;">'
    + '<div style="width:52px;height:52px;margin:0 auto 20px;border-radius:50%;border:1.5px solid rgba(239,68,68,.15);display:flex;align-items:center;justify-content:center;">'
    + '<svg width="22" height="22" fill="none" stroke="#f87171" stroke-width="1.5" stroke-linecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>'
    + '</div>'
    + '<p id="fs-em" style="font-size:14px;color:#fca5a5;margin:0;font-weight:400;line-height:1.6;"></p>'
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
    if (S.phase === "scanning") drawBinDots(ctx, w, h, S, t);
  }

  function drawBadges(ctx, w, h, st, t) {
    var items = [
      { k: "dist", l: t.distance },
      { k: "light", l: t.light },
      { k: "stab", l: t.stability },
    ];
    var bw = 76, bh = 26, gap = 6;
    var tw = items.length * bw + (items.length - 1) * gap;
    var x = (w - tw) / 2;
    var y = h * 0.80;

    for (var i = 0; i < items.length; i++) {
      var b = items[i];
      var v = st[b.k];
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
    var order = ["wide_left", "left", "semi_left", "face", "semi_right", "right", "wide_right"];
    var total = w * 0.85, sx = (w - total) / 2, y = h * 0.055;
    var sp = total / (order.length - 1), r = 6;

    ctx.strokeStyle = "rgba(255,255,255,.06)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(sx, y); ctx.lineTo(sx + total, y); ctx.stroke();

    for (var i = 0; i < order.length; i++) {
      var dx = sx + i * sp;
      var has = S.bins[order[i]].length > 0;
      ctx.beginPath(); ctx.arc(dx, y, r, 0, Math.PI * 2);
      ctx.fillStyle = has ? "#14B8A6" : "rgba(255,255,255,.05)";
      ctx.fill();
      if (has) {
        ctx.strokeStyle = "rgba(20,184,166,.5)"; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = "#fff"; ctx.font = "600 7px 'DM Sans',sans-serif";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("\u2713", dx, y + 0.5);
      }
    }

    var count = 0;
    for (var j = 0; j < BIN_IDS.length; j++) { if (S.bins[BIN_IDS[j]].length > 0) count++; }
    ctx.fillStyle = "rgba(255,255,255,.5)"; ctx.font = "600 11px 'DM Sans',sans-serif";
    ctx.textAlign = "center"; ctx.fillText(count + "/7", w / 2, y + r + 14);
  }

  /* ═══════════════════════════════════════════════════════════
     ADAPTIVE INSTRUCTIONS
     ═══════════════════════════════════════════════════════════ */
  function adaptiveGuide(S, t) {
    function has(id) { return S.bins[id].length > 0; }
    if (!has("face")) return { t1: t.scanFace, t2: t.scanFaceSub };
    if (!has("semi_right")) return { t1: t.scanRight, t2: t.scanRightSub };
    if (!has("right")) return { t1: t.scanRight, t2: t.scanRightSub };
    if (!has("wide_right")) return { t1: t.scanWideRight, t2: t.scanWideRightSub };
    if (!has("semi_left")) return { t1: t.scanLeft, t2: t.scanLeftSub };
    if (!has("left")) return { t1: t.scanLeft, t2: t.scanLeftSub };
    if (!has("wide_left")) return { t1: t.scanWideLeft, t2: t.scanWideLeftSub };
    return { t1: t.scanDone, t2: t.scanDoneSub };
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
        fm.send({ image: video })
          .catch(function () {})
          .then(function () { processing = false; });
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
    var ctx = $ov.getContext("2d");

    function show(name) {
      var map = { perm: $perm, load: $load, scan: $scan, prev: $prev, err: $err };
      [$perm, $load, $scan, $prev, $err].forEach(function (e) { e.style.display = "none"; });
      map[name].style.display = "";
    }
    function showErr(msg) { $em.textContent = msg; show("err"); S.phase = "idle"; setTimeout(function () { if (onFall && !dead) onFall(); }, 3000); }

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
      stopCam(S);
      S.phase = "idle";
      if (onFall && !dead) onFall();
      else show("perm");
    });

    /* ── Start button ──────────────────────── */
    $("#fs-go").addEventListener("click", function () {
      show("load"); S.phase = "load";

      var wasmTimeout = setTimeout(function () {
        if (S.phase === "load" && !dead) showErr(t.loadTimeout);
      }, CFG.wasmTimeoutMs);

      reqCam().then(function (stream) {
        S.stream = stream;
        $v.srcObject = stream;
        return new Promise(function (ok, no) {
          $v.addEventListener("loadedmetadata", ok, { once: true });
          setTimeout(function () { no(new Error("timeout")); }, 10000);
        });
      }).then(function () {
        try { $v.play(); } catch (e) {}
        // Adapt thresholds if camera is 16:9 (some Android front cameras)
        var vw = $v.videoWidth || CAM_W, vh = $v.videoHeight || CAM_H;
        var ratio = vw / vh;
        if (ratio > 1.5) {
          S._origFaceSizeMin = CFG.faceSizeMin;
          S._origFaceSizeMax = CFG.faceSizeMax;
          CFG.faceSizeMin = 0.28; CFG.faceSizeMax = 0.62;
        }
        S.fm = initFM(onRes);
        S.cam = startLoop($v, S.fm);
        clearTimeout(wasmTimeout);
        S.phase = "calibrating"; show("scan"); resize();
        // Draw oval immediately
        S.idleDraw = setInterval(function () {
          if (S.fc > 0 || dead) { clearInterval(S.idleDraw); S.idleDraw = null; return; }
          resize();
          var rect = $scan.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) drawOverlay(ctx, rect.width, rect.height, S, t);
        }, 100);
        $t1.textContent = t.calibTitle; $t2.textContent = t.calibSub;
      }).catch(function (e) {
        clearTimeout(wasmTimeout);
        if (e.name === "NotAllowedError") showErr(t.denied);
        else if (e.name === "NotFoundError") showErr(t.noDevice);
        else showErr(t.denied);
      });
    });

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
      var centered = Math.abs(nose.x - 0.5) < CFG.centerMaxOff;
      var absYaw = Math.abs(pose.yaw);

      if (S.fc % CFG.expensiveEvery === 0 || !S.cBr) {
        S.cBr = analyzeBright($v, marks);
        S.cBl = analyzeBlur($v, marks);
      }
      var br = S.cBr || { ok: true, face: 128, dark: false, bright: false, bl: false };
      var bl = S.cBl || { s: 30 };

      var distOk = sz >= CFG.faceSizeMin && sz <= CFG.faceSizeMax;
      S.st.dist = distOk; S.st.light = br.ok; S.st.stab = stab <= CFG.stabMax;
      S.prev = marks; S.prevT = now;

      // ── CALIBRATION ──
      if (S.phase === "calibrating") {
        if (sz < CFG.faceSizeMin) { $t1.textContent = t.moveCloser; $t2.textContent = ""; }
        else if (sz > CFG.faceSizeMax) { $t1.textContent = t.moveBack; $t2.textContent = ""; }
        else if (br.dark) { $t1.textContent = t.lowLight; $t2.textContent = ""; }
        else if (br.bright) { $t1.textContent = t.strongLight; $t2.textContent = ""; }
        else if (br.bl) { $t1.textContent = t.backlight; $t2.textContent = ""; }
        else if (!centered) { $t1.textContent = t.centerFace; $t2.textContent = ""; }
        else { $t1.textContent = t.calibTitle; $t2.textContent = t.calibSub; }

        var calibOk = distOk && br.ok && centered;
        if (calibOk) {
          if (!S.calibSince) S.calibSince = now;
          if (now - S.calibSince >= CFG.calibMs) {
            S.phase = "countdown"; S.countdownStart = now;
            $t2.textContent = t.countdownSub;
            if (navigator.vibrate) navigator.vibrate(40);
          } else {
            $t1.textContent = t.calibReady; $t2.textContent = "";
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
          var g = adaptiveGuide(S, t);
          $t1.textContent = g.t1; $t2.textContent = g.t2;
          if (navigator.vibrate) navigator.vibrate([60, 30, 60]);
        }
      }

      // ── SCANNING ──
      if (S.phase === "scanning") {
        var scanElapsed = now - S.scanStart;

        if (!distOk && sz < CFG.faceSizeMin) {
          $t1.textContent = t.moveCloser; $t2.textContent = "";
        } else if (!distOk && sz > CFG.faceSizeMax) {
          $t1.textContent = t.moveBack; $t2.textContent = "";
        } else if (br.dark) {
          $t1.textContent = t.lowLight; $t2.textContent = "";
        } else if (br.bright) {
          $t1.textContent = t.strongLight; $t2.textContent = "";
        } else if (br.bl) {
          $t1.textContent = t.backlight; $t2.textContent = "";
        } else {
          var guide = adaptiveGuide(S, t);
          $t1.textContent = guide.t1; $t2.textContent = guide.t2;
        }

        if (now - S.lastCapt >= CFG.captureMs && !S.capturing && distOk) {
          tryCapture(marks, pose, br, bl, stab, absYaw, nose.x, now);
        }

        var filled = 0;
        for (var fi = 0; fi < BIN_IDS.length; fi++) { if (S.bins[BIN_IDS[fi]].length > 0) filled++; }
        if (filled >= 7) { finish(); return; }
        // Early finish: 3+ essential bins after 20s
        var hasEssential = S.bins.face.length > 0
          && (S.bins.right.length > 0 || S.bins.semi_right.length > 0 || S.bins.wide_right.length > 0)
          && (S.bins.left.length > 0 || S.bins.semi_left.length > 0 || S.bins.wide_left.length > 0);
        if (hasEssential && filled >= 3 && scanElapsed > 20000) { finish(); return; }
        if (scanElapsed > CFG.timeoutMs) { finish(); return; }
      }

      var rect = $scan.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) drawOverlay(ctx, rect.width, rect.height, S, t);
    }

    function noFace() {
      $t1.textContent = t.noFace; $t2.textContent = t.noFaceSub;
      S.st = { dist: null, light: null, stab: null }; S.calibSince = null;
      if (!S.noFaceT) {
        S.noFaceT = setTimeout(function () {
          if ((S.phase === "calibrating" || S.phase === "scanning") && !dead) showErr(t.noFace);
        }, CFG.noFaceMs);
      }
      var rect = $scan.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) drawOverlay(ctx, rect.width, rect.height, S, t);
    }

    /* ── Capture ──────────────────────────── */
    function tryCapture(marks, pose, br, bl, stab, absYaw, noseX, now) {
      var binId = S.retake ? S.retake : classifyBin(absYaw, noseX);
      if (!binId) return;
      if (S.retake && binId !== S.retake) return;

      var sc = computeScore(br, bl, stab, absYaw, BIN_IDEAL_YAW[binId]);
      var bin = S.bins[binId];
      if (bin.length >= CFG.binTopN && sc <= bin[bin.length - 1].score) return;

      S.capturing = true; S.lastCapt = now;
      capFrame($v).then(function (blob) {
        if (!blob || dead) { S.capturing = false; return; }
        var wasEmpty = bin.length === 0;
        bin.push({ blob: blob, url: URL.createObjectURL(blob), score: sc });
        bin.sort(function (a, b) { return b.score - a.score; });
        while (bin.length > CFG.binTopN) { var rm = bin.pop(); URL.revokeObjectURL(rm.url); }
        if (wasEmpty && navigator.vibrate) navigator.vibrate(25);
        S.capturing = false;
      }).catch(function () { S.capturing = false; });
    }

    function finish() {
      if (S.phase === "preview") return;
      S.phase = "preview"; stopCam(S);
      if (navigator.vibrate) navigator.vibrate([50, 25, 50]);
      showPreview();
    }

    /* ── Preview ──────────────────────────── */
    function showPreview() {
      show("prev");
      var grid = $("#fs-grid");
      grid.innerHTML = "";
      var showOrder = [
        { key: "wide_left", label: t.binWideL },
        { key: "left", label: t.binLeft },
        { key: "semi_left", label: t.binSemiL },
        { key: "face", label: t.binFace },
        { key: "semi_right", label: t.binSemiR },
        { key: "right", label: t.binRight },
        { key: "wide_right", label: t.binWideR },
      ];
      for (var i = 0; i < showOrder.length; i++) {
        var entry = S.bins[showOrder[i].key][0] || null;
        grid.appendChild(makeCard(entry, showOrder[i].label));
      }

      var $zBtn = $("#fs-zoom-btn"), $zIn = $("#fs-zoom-input"), $zPrev = $("#fs-zoom-preview"), $zImg = $("#fs-zoom-img");
      $zBtn.onclick = function () { $zIn.click(); };
      $zIn.onchange = function (e) {
        var f = e.target.files && e.target.files[0]; if (!f) return;
        S.zoomFile = f;
        var reader = new FileReader();
        reader.onload = function (ev) { $zImg.src = ev.target.result; $zPrev.style.display = ""; };
        reader.readAsDataURL(f);
      };

      $("#fs-ok").onclick = function () { doUpload(); };
      $("#fs-re").onclick = function () { if (window.AdermioFaceScan) window.AdermioFaceScan.restart(); };
    }

    function makeCard(entry, label) {
      var q = entry ? qLabel(entry.score, t) : qLabel(0, t);
      var el = document.createElement("div");
      el.style.cssText = "border-radius:12px;overflow:hidden;background:rgba(255,255,255,.03);text-align:center;";
      if (entry) {
        el.innerHTML = '<img src="' + entry.url + '" style="width:100%;aspect-ratio:3/4;object-fit:cover;display:block;border-radius:12px 12px 0 0;"/>'
          + '<div style="padding:10px 4px 8px;">'
          + '<span style="display:inline-block;padding:3px 12px;border-radius:2rem;font-size:9px;font-weight:600;color:' + q.c + ';background:rgba(255,255,255,.06);letter-spacing:.4px;">' + q.l + '</span>'
          + '<p style="font-size:9px;color:rgba(255,255,255,.3);margin:6px 0 0;font-weight:500;text-transform:uppercase;letter-spacing:1px;">' + label + '</p>'
          + '</div>';
      } else {
        el.innerHTML = '<div style="width:100%;aspect-ratio:3/4;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.02);border-radius:12px 12px 0 0;">'
          + '<svg width="24" height="24" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>'
          + '</div>'
          + '<div style="padding:10px 4px 8px;">'
          + '<span style="display:inline-block;padding:3px 12px;border-radius:2rem;font-size:9px;font-weight:600;color:' + q.c + ';background:rgba(255,255,255,.06);letter-spacing:.4px;">' + q.l + '</span>'
          + '<p style="font-size:9px;color:rgba(255,255,255,.3);margin:6px 0 0;font-weight:500;text-transform:uppercase;letter-spacing:1px;">' + label + '</p>'
          + '</div>';
      }
      return el;
    }

    /* ── Upload ───────────────────────────── */
    function doUpload() {
      var $btn = $("#fs-ok");
      $btn.textContent = t.uploading; $btn.disabled = true; $btn.style.opacity = ".5";

      if (!S.bins.face[0]) {
        $btn.textContent = t.validate; $btn.disabled = false; $btn.style.opacity = "1";
        if (window.AdermioFaceScan) window.AdermioFaceScan.restart();
        return;
      }

      var uploadCount = 0;
      var uploadQueue = [];
      for (var i = 0; i < BIN_IDS.length; i++) {
        var best = S.bins[BIN_IDS[i]][0];
        if (best) uploadQueue.push({ binId: BIN_IDS[i], blob: best.blob });
      }
      if (S.zoomFile) uploadQueue.push({ binId: "zoom", blob: S.zoomFile });

      function uploadOne(item) {
        var file = new File([item.blob], "scan_" + item.binId + "_" + Date.now() + ".jpg", { type: "image/jpeg" });
        if (typeof window.uploadToS3Presigned !== "function") return Promise.resolve(null);
        return window.uploadToS3Presigned({ file: file, jobId: (window.formState && window.formState.jobId) || "", type: item.binId })
          .then(function (result) {
            if (window.formState) window.formState.photos[item.binId] = { key: result.key, getUrl: result.getUrl };
            uploadCount++;
          })
          .catch(function () {});
      }

      function uploadBatch(startIdx) {
        if (startIdx >= uploadQueue.length) {
          if (uploadCount === 0) {
            $btn.textContent = t.uploadFail; $btn.disabled = false; $btn.style.opacity = "1";
            setTimeout(function () { $btn.textContent = t.validate; }, 2500);
            return;
          }
          if (window.validationState) window.validationState.facePhotoUploaded = true;
          syncManualPreviews();
          if (onDone) onDone({ uploaded: uploadCount });
          if (typeof window.goToStep === "function" && typeof window.currentStep === "number") {
            window.goToStep(window.currentStep + 1);
          } else {
            var btn = document.getElementById("btn-next");
            if (btn) btn.click();
          }
          return;
        }
        var batch = uploadQueue.slice(startIdx, startIdx + 3);
        var promises = [];
        for (var b = 0; b < batch.length; b++) promises.push(uploadOne(batch[b]));
        Promise.all(promises).then(function () { uploadBatch(startIdx + 3); });
      }
      uploadBatch(0);
    }

    function syncManualPreviews() {
      var mapping = { face: "face", right: "left", left: "right" };
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
      stopCam(S);
      if (S.fm) { try { S.fm.close(); } catch (e) {} S.fm = null; }
      // Restore original thresholds if they were modified for 16:9
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
