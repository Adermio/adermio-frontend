/**
 * Adermio Face Scan v5.1 — Continuous Video Scan + Intelligent Frame Extraction
 *
 * Bug fixes from v5.0:
 *  - Fixed yaw/mirror inversion (CSS scaleX(-1) vs raw landmarks)
 *  - Relaxed stability during scan (score penalty, not hard gate)
 *  - Reduced calibration hold to 800ms, relaxed blur in calibration
 *  - Lowered blur threshold for mobile cameras
 *  - Cached capture canvas (no per-frame allocation)
 *  - Fixed restart() re-init through public API
 *  - Better visual feedback: progress ring, pulse animations, larger bin dots
 *
 * Dependencies: @mediapipe/face_mesh, @mediapipe/camera_utils (CDN)
 */
(function () {
  "use strict";

  /* ═══════════════════════════════════════════════════════════
     TRANSLATIONS
     ═══════════════════════════════════════════════════════════ */
  const T = {
    fr: {
      cameraPermTitle: "Scan intelligent",
      cameraPermDesc:
        "Notre technologie va scanner votre visage en quelques secondes. Aucune vidéo n'est enregistrée — seules les meilleures captures sont conservées.",
      cameraPermBtn: "Activer la caméra",
      cameraDenied:
        "Accès à la caméra refusé. Vous pouvez importer vos photos manuellement.",
      cameraNotSupported:
        "Votre navigateur ne supporte pas la caméra. Utilisez l'import manuel.",
      noCameraDevice: "Aucune caméra frontale détectée.",
      loading: "Initialisation du scan...",

      // Calibration
      calibTitle: "Préparation du scan",
      calibReady: "C'est parti !",
      moveCloser: "Rapprochez-vous",
      moveBack: "Reculez légèrement",
      centerFace: "Centrez votre visage dans l'ovale",
      moreLightNeeded: "Luminosité insuffisante",
      tooMuchLight: "Lumière trop forte",
      backlight: "Contre-jour détecté",
      holdStill: "Restez immobile un instant",
      blurry: "Image floue, stabilisez-vous",
      noFaceDetected: "Aucun visage détecté",
      noFaceHint: "Vérifiez que votre visage est bien visible",

      // Scanning
      scanTitle: "Scan en cours",
      scanPhaseRight: "↪ Tournez lentement vers la droite",
      scanPhaseCenter1: "↩ Revenez face caméra",
      scanPhaseLeft: "↩ Tournez lentement vers la gauche",
      scanPhaseCenter2: "↪ Revenez face caméra",
      scanComplete: "Scan terminé !",
      scanAlmostDone: "Presque fini...",

      // Bins
      binFace: "Face",
      binSemiRight: "Semi D",
      binRight: "Profil D",
      binSemiLeft: "Semi G",
      binLeft: "Profil G",

      // Badges
      badgeDistance: "Distance",
      badgeLight: "Lumière",
      badgeAngle: "Angle",
      badgeStability: "Stabilité",

      // Preview
      previewTitle: "Vos captures",
      previewSubtitle: "Vérifiez la qualité avant d'envoyer",
      qualityExcellent: "Excellent",
      qualityGood: "Bon",
      qualityAcceptable: "OK",
      qualityMissing: "Manquant",
      retakeAngle: "Refaire",
      validatePhotos: "Valider et continuer",
      scanAnother: "Recommencer le scan",
      uploadingPhotos: "Envoi en cours...",
    },
    en: {
      cameraPermTitle: "Smart scan",
      cameraPermDesc:
        "Our technology will scan your face in a few seconds. No video is recorded — only the best captures are kept.",
      cameraPermBtn: "Enable camera",
      cameraDenied:
        "Camera access denied. You can upload your photos manually.",
      cameraNotSupported:
        "Your browser does not support camera access. Use manual upload.",
      noCameraDevice: "No front camera detected.",
      loading: "Initializing scan...",

      calibTitle: "Preparing scan",
      calibReady: "Let's go!",
      moveCloser: "Move closer",
      moveBack: "Move back slightly",
      centerFace: "Center your face in the oval",
      moreLightNeeded: "Not enough light",
      tooMuchLight: "Too much light",
      backlight: "Backlight detected",
      holdStill: "Hold still a moment",
      blurry: "Image is blurry, hold steady",
      noFaceDetected: "No face detected",
      noFaceHint: "Make sure your face is visible",

      scanTitle: "Scanning",
      scanPhaseRight: "↪ Slowly turn to the right",
      scanPhaseCenter1: "↩ Come back to center",
      scanPhaseLeft: "↩ Slowly turn to the left",
      scanPhaseCenter2: "↪ Come back to center",
      scanComplete: "Scan complete!",
      scanAlmostDone: "Almost done...",

      binFace: "Front",
      binSemiRight: "Semi R",
      binRight: "Profile R",
      binSemiLeft: "Semi L",
      binLeft: "Profile L",

      badgeDistance: "Distance",
      badgeLight: "Light",
      badgeAngle: "Angle",
      badgeStability: "Stability",

      previewTitle: "Your captures",
      previewSubtitle: "Check quality before sending",
      qualityExcellent: "Excellent",
      qualityGood: "Good",
      qualityAcceptable: "OK",
      qualityMissing: "Missing",
      retakeAngle: "Retake",
      validatePhotos: "Validate and continue",
      scanAnother: "Restart scan",
      uploadingPhotos: "Uploading...",
    },
  };

  /* ═══════════════════════════════════════════════════════════
     CONFIGURATION
     ═══════════════════════════════════════════════════════════ */
  const CFG = {
    // Face size (forehead→chin as fraction of frame height)
    faceSizeMin: 0.20,
    faceSizeMax: 0.58,
    faceSizeIdeal: 0.35,
    centerMaxOffset: 0.16,

    // Angles (degrees) — these are ABSOLUTE values, sign handled separately
    faceYawMax: 12,
    semiProfileYawMin: 14,
    semiProfileYawMax: 32,
    profileYawMin: 28,
    profileYawMax: 58,
    pitchMax: 18,

    // Quality thresholds
    brightnessMin: 45,
    brightnessMax: 230,
    brightnessIdeal: 130,
    backlightRatio: 0.55,
    blurThreshold: 8, // lowered for mobile selfie cams
    blurIdeal: 50,
    stabilityMaxPerSec: 0.18,

    // Timing
    calibHoldMs: 800, // reduced from 1500 — less frustrating
    captureIntervalMs: 180,
    scanTimeoutMs: 25000,
    noFaceTimeoutMs: 10000,

    // Bins: top candidates per bin
    binTopN: 3,

    // Image
    jpegQuality: 0.92,

    // Throttle
    expensiveCheckInterval: 4,
  };

  /* ═══════════════════════════════════════════════════════════
     BINS DEFINITION
     ═══════════════════════════════════════════════════════════

     IMPORTANT: The video is CSS-mirrored (scaleX(-1)).
     MediaPipe landmarks are in RAW coordinates (un-mirrored).
     When the user turns their head RIGHT (as they see it in the mirror),
     the raw yaw is NEGATIVE. So:
       User turns right → raw yaw < 0 → we label this "right profile"
       User turns left  → raw yaw > 0 → we label this "left profile"

     The bins use raw yaw ranges but have display labels matching
     what the USER sees (their perspective in the mirror).
     ═══════════════════════════════════════════════════════════ */
  const BINS = [
    // Face: small absolute yaw
    { id: "face", yawMin: -CFG.faceYawMax, yawMax: CFG.faceYawMax, idealYaw: 0, labelKey: "binFace" },
    // User turns right → raw yaw negative
    { id: "semi_right", yawMin: -CFG.semiProfileYawMax, yawMax: -CFG.semiProfileYawMin, idealYaw: -22, labelKey: "binSemiRight" },
    { id: "right", yawMin: -CFG.profileYawMax, yawMax: -CFG.profileYawMin, idealYaw: -42, labelKey: "binRight" },
    // User turns left → raw yaw positive
    { id: "semi_left", yawMin: CFG.semiProfileYawMin, yawMax: CFG.semiProfileYawMax, idealYaw: 22, labelKey: "binSemiLeft" },
    { id: "left", yawMin: CFG.profileYawMin, yawMax: CFG.profileYawMax, idealYaw: 42, labelKey: "binLeft" },
  ];

  /* ═══════════════════════════════════════════════════════════
     LANDMARKS
     ═══════════════════════════════════════════════════════════ */
  const LM = {
    noseTip: 1,
    noseBridge: 6,
    leftCheek: 234,
    rightCheek: 454,
    chin: 152,
    forehead: 10,
    contour: [
      10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365,
      379, 378, 400, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234,
      127, 162, 21, 54, 103, 67, 109, 10,
    ],
  };

  /* ═══════════════════════════════════════════════════════════
     GEOMETRY HELPERS
     ═══════════════════════════════════════════════════════════ */
  function pt(marks, idx) {
    const p = marks[idx];
    return { x: p.x, y: p.y, z: p.z };
  }

  function dist2D(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  function faceBounds(marks) {
    let xMin = 1, xMax = 0, yMin = 1, yMax = 0;
    for (const idx of LM.contour) {
      const p = marks[idx];
      if (p.x < xMin) xMin = p.x;
      if (p.x > xMax) xMax = p.x;
      if (p.y < yMin) yMin = p.y;
      if (p.y > yMax) yMax = p.y;
    }
    return { xMin, xMax, yMin, yMax };
  }

  function headPose(marks) {
    const lc = pt(marks, LM.leftCheek);
    const rc = pt(marks, LM.rightCheek);
    const ch = pt(marks, LM.chin);
    const fh = pt(marks, LM.forehead);
    const hx = rc.x - lc.x, hy = rc.y - lc.y, hz = rc.z - lc.z;
    const vx = fh.x - ch.x, vy = fh.y - ch.y, vz = fh.z - ch.z;
    const nx = hy * vz - hz * vy;
    const ny = hz * vx - hx * vz;
    const nz = hx * vy - hy * vx;
    const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1e-9;
    const yaw = (Math.atan2(nx, nz) * 180) / Math.PI;
    const pitch =
      (Math.asin(Math.max(-1, Math.min(1, -ny / nLen))) * 180) / Math.PI;
    return { yaw, pitch };
  }

  function faceSize(marks) {
    return dist2D(pt(marks, LM.forehead), pt(marks, LM.chin));
  }

  function stabilityPerSec(curr, prev, dtMs) {
    if (!prev || dtMs < 1) return 0;
    const dt = dtMs / 1000;
    let total = 0, n = 0;
    const step = 10;
    for (let i = 0; i < curr.length && i < prev.length; i += step) {
      total += dist2D(curr[i], prev[i]);
      n++;
    }
    return n > 0 ? total / n / dt : 0;
  }

  /* ═══════════════════════════════════════════════════════════
     IMAGE ANALYSIS (cached canvases)
     ═══════════════════════════════════════════════════════════ */
  let _brightCanvas = null, _brightCtx = null;
  let _blurCanvas = null, _blurCtx = null;
  let _captureCanvas = null, _captureCtx = null;

  function analyzeBrightness(video, marks) {
    if (!_brightCanvas) {
      _brightCanvas = document.createElement("canvas");
      _brightCtx = _brightCanvas.getContext("2d", { willReadFrequently: true });
    }
    const sw = 160, sh = 120;
    _brightCanvas.width = sw;
    _brightCanvas.height = sh;
    _brightCtx.drawImage(video, 0, 0, sw, sh);
    const data = _brightCtx.getImageData(0, 0, sw, sh).data;
    const fb = faceBounds(marks);
    let faceSum = 0, facePx = 0, bgSum = 0, bgPx = 0;
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const i = (y * sw + x) * 4;
        const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        const nx = x / sw, ny = y / sh;
        if (nx >= fb.xMin && nx <= fb.xMax && ny >= fb.yMin && ny <= fb.yMax) {
          faceSum += lum;
          facePx++;
        } else {
          bgSum += lum;
          bgPx++;
        }
      }
    }
    const face = facePx > 0 ? faceSum / facePx : 128;
    const bg = bgPx > 0 ? bgSum / bgPx : 128;
    const ratio = bg > 1 ? face / bg : 1;
    return {
      face, bg, ratio,
      ok: face >= CFG.brightnessMin && face <= CFG.brightnessMax && !(ratio < CFG.backlightRatio && bg > 100),
      tooLight: face > CFG.brightnessMax,
      tooDark: face < CFG.brightnessMin,
      backlight: ratio < CFG.backlightRatio && bg > 100,
    };
  }

  function analyzeBlur(video, marks) {
    if (!_blurCanvas) {
      _blurCanvas = document.createElement("canvas");
      _blurCtx = _blurCanvas.getContext("2d", { willReadFrequently: true });
    }
    const fb = faceBounds(marks);
    const vw = video.videoWidth || video.width || 640;
    const vh = video.videoHeight || video.height || 480;
    const sx = fb.xMin * vw, sy = fb.yMin * vh;
    const sw = (fb.xMax - fb.xMin) * vw, sh = (fb.yMax - fb.yMin) * vh;
    if (sw < 10 || sh < 10) return { score: 0, ok: false };
    const cw = 150, ch = 150;
    _blurCanvas.width = cw;
    _blurCanvas.height = ch;
    _blurCtx.drawImage(video, sx, sy, sw, sh, 0, 0, cw, ch);
    const data = _blurCtx.getImageData(0, 0, cw, ch).data;
    const gray = new Float32Array(cw * ch);
    for (let i = 0; i < gray.length; i++) {
      gray[i] = data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114;
    }
    let sum = 0, n = 0;
    for (let y = 1; y < ch - 1; y++) {
      for (let x = 1; x < cw - 1; x++) {
        const lap =
          -4 * gray[y * cw + x] +
          gray[(y - 1) * cw + x] +
          gray[(y + 1) * cw + x] +
          gray[y * cw + x - 1] +
          gray[y * cw + x + 1];
        sum += lap * lap;
        n++;
      }
    }
    const score = n > 0 ? sum / n : 0;
    return { score, ok: score >= CFG.blurThreshold };
  }

  /* ═══════════════════════════════════════════════════════════
     SCORING
     ═══════════════════════════════════════════════════════════ */
  function computeScore(brightnessData, blurData, stability, yaw, idealYaw) {
    const bFace = brightnessData.face;
    const bScore = Math.max(0, 1 - Math.abs(bFace - CFG.brightnessIdeal) / 80);
    const sScore = Math.min(1, blurData.score / CFG.blurIdeal);
    const stScore = Math.max(0, 1 - stability / (CFG.stabilityMaxPerSec * 5));
    const aScore = Math.max(0, 1 - Math.abs(yaw - idealYaw) / 20);
    return bScore * 0.25 + sScore * 0.35 + stScore * 0.20 + aScore * 0.20;
  }

  function qualityLabel(score, lang) {
    const tl = T[lang] || T.fr;
    if (score >= 0.65) return { label: tl.qualityExcellent, color: "#22c55e" };
    if (score >= 0.4) return { label: tl.qualityGood, color: "#eab308" };
    if (score > 0) return { label: tl.qualityAcceptable, color: "#f97316" };
    return { label: tl.qualityMissing, color: "#ef4444" };
  }

  /* ═══════════════════════════════════════════════════════════
     STATE FACTORY
     ═══════════════════════════════════════════════════════════ */
  function mkState() {
    const bins = {};
    for (const b of BINS) bins[b.id] = [];
    return {
      phase: "idle",
      bins,
      calibReadySince: null,
      scanStartTime: null,
      scanPhase: 0,
      lastCaptureTime: 0,
      prevLandmarks: null,
      prevTimestamp: null,
      noFaceTimer: null,
      frameCount: 0,
      cachedBrightness: null,
      cachedBlur: null,
      status: { distance: null, light: null, angle: null, stability: null },
      faceMesh: null,
      camera: null,
      videoStream: null,
      animFrameId: null,
      metadataHandler: null,
      retakeBinId: null,
      isCapturing: false,
    };
  }

  /* ═══════════════════════════════════════════════════════════
     SAFARI roundRect POLYFILL
     ═══════════════════════════════════════════════════════════ */
  if (
    typeof CanvasRenderingContext2D !== "undefined" &&
    !CanvasRenderingContext2D.prototype.roundRect
  ) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      const rad = typeof r === "number" ? r : (r && r[0]) || 0;
      this.beginPath();
      this.moveTo(x + rad, y);
      this.arcTo(x + w, y, x + w, y + h, rad);
      this.arcTo(x + w, y + h, x, y + h, rad);
      this.arcTo(x, y + h, x, y, rad);
      this.arcTo(x, y, x + w, y, rad);
      this.closePath();
      return this;
    };
  }

  /* ═══════════════════════════════════════════════════════════
     BUILD UI
     ═══════════════════════════════════════════════════════════ */
  function buildUI(t) {
    return `
      <div id="fs-root" style="position:relative;width:100%;max-width:400px;margin:0 auto;border-radius:20px;overflow:hidden;background:#000;box-shadow:0 20px 60px rgba(0,0,0,.4);">

        <!-- Permission screen -->
        <div id="fs-permission" style="padding:36px 24px;text-align:center;background:linear-gradient(160deg,#0f172a 0%,#1e293b 50%,#0f172a 100%);color:#fff;">
          <div style="width:72px;height:72px;margin:0 auto 20px;border-radius:50%;background:linear-gradient(135deg,rgba(99,102,241,.2),rgba(139,92,246,.2));display:flex;align-items:center;justify-content:center;border:1px solid rgba(99,102,241,.3);">
            <svg width="32" height="32" fill="none" stroke="#a78bfa" stroke-width="1.8" stroke-linecap="round">
              <path d="M16 28c7.18 0 13-5.82 13-13V7.5A2.5 2.5 0 0 0 26.5 5h-21A2.5 2.5 0 0 0 3 7.5V15c0 7.18 5.82 13 13 13z"/>
              <circle cx="16" cy="13" r="3.5"/>
              <path d="M10 20c0-3.31 2.69-6 6-6s6 2.69 6 6" opacity=".3"/>
            </svg>
          </div>
          <h3 style="font-size:20px;font-weight:800;margin:0 0 8px;letter-spacing:-.3px;">${t.cameraPermTitle}</h3>
          <p style="font-size:13px;color:#94a3b8;margin:0 0 24px;line-height:1.6;">${t.cameraPermDesc}</p>
          <button id="fs-perm-btn" style="width:100%;padding:16px;border:none;border-radius:14px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-size:15px;font-weight:700;cursor:pointer;letter-spacing:.3px;box-shadow:0 4px 20px rgba(99,102,241,.4);transition:transform .15s,box-shadow .15s;" onmousedown="this.style.transform='scale(.97)'" onmouseup="this.style.transform=''" onmouseleave="this.style.transform=''">${t.cameraPermBtn}</button>
        </div>

        <!-- Loading screen -->
        <div id="fs-loading" style="display:none;padding:60px 24px;text-align:center;background:linear-gradient(160deg,#0f172a,#1e293b);color:#fff;">
          <div style="width:48px;height:48px;margin:0 auto 20px;border:3px solid rgba(255,255,255,.08);border-top-color:#a78bfa;border-radius:50%;animation:fsSpin .8s linear infinite;"></div>
          <p style="font-size:14px;color:#94a3b8;font-weight:500;">${t.loading}</p>
        </div>

        <!-- Scan screen -->
        <div id="fs-scan" style="display:none;position:relative;aspect-ratio:3/4;background:#000;">
          <video id="fs-video" playsinline autoplay muted style="width:100%;height:100%;object-fit:cover;transform:scaleX(-1);"></video>
          <canvas id="fs-overlay" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;"></canvas>
          <div id="fs-flash" style="display:none;position:absolute;inset:0;background:rgba(34,197,94,.25);pointer-events:none;z-index:5;transition:opacity .3s;"></div>
          <div id="fs-instr" style="position:absolute;bottom:0;left:0;right:0;padding:16px 20px 20px;background:linear-gradient(transparent,rgba(0,0,0,.85));text-align:center;z-index:4;">
            <p id="fs-instr-text" style="color:#fff;font-size:15px;font-weight:700;margin:0;letter-spacing:.2px;text-shadow:0 1px 4px rgba(0,0,0,.5);"></p>
            <p id="fs-instr-sub" style="color:rgba(255,255,255,.6);font-size:12px;margin:6px 0 0;font-weight:500;"></p>
          </div>
        </div>

        <!-- Preview screen -->
        <div id="fs-preview" style="display:none;padding:24px;background:linear-gradient(160deg,#0f172a 0%,#1e293b 50%,#0f172a 100%);color:#fff;">
          <h3 style="font-size:18px;font-weight:800;margin:0 0 4px;text-align:center;letter-spacing:-.3px;">${t.previewTitle}</h3>
          <p style="font-size:12px;color:#64748b;margin:0 0 16px;text-align:center;">${t.previewSubtitle}</p>
          <div id="fs-preview-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px;"></div>
          <div id="fs-preview-grid2" style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:20px;"></div>
          <button id="fs-validate-btn" style="width:100%;padding:16px;border:none;border-radius:14px;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 4px 20px rgba(34,197,94,.3);transition:transform .15s;" onmousedown="this.style.transform='scale(.97)'" onmouseup="this.style.transform=''">${t.validatePhotos}</button>
          <button id="fs-restart-btn" style="width:100%;padding:12px;margin-top:10px;border:1px solid rgba(255,255,255,.1);border-radius:14px;background:transparent;color:#94a3b8;font-size:13px;font-weight:600;cursor:pointer;transition:border-color .2s;" onmouseenter="this.style.borderColor='rgba(255,255,255,.3)'" onmouseleave="this.style.borderColor='rgba(255,255,255,.1)'">${t.scanAnother}</button>
        </div>

        <!-- Error screen -->
        <div id="fs-error" style="display:none;padding:40px 24px;text-align:center;background:linear-gradient(160deg,#0f172a,#1e293b);color:#fff;">
          <div style="width:56px;height:56px;margin:0 auto 16px;border-radius:50%;background:rgba(239,68,68,.1);display:flex;align-items:center;justify-content:center;border:1px solid rgba(239,68,68,.2);">
            <svg width="24" height="24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
          </div>
          <p id="fs-error-msg" style="font-size:14px;color:#f87171;margin:0;font-weight:500;"></p>
        </div>
      </div>
      <style>
        @keyframes fsSpin { to { transform: rotate(360deg); } }
        @keyframes fsBinPop { 0% { transform:scale(1); } 50% { transform:scale(1.4); } 100% { transform:scale(1); } }
      </style>
    `;
  }

  /* ═══════════════════════════════════════════════════════════
     OVERLAY DRAWING
     ═══════════════════════════════════════════════════════════ */
  function drawOverlay(ctx, w, h, S, lang) {
    const t = T[lang] || T.fr;
    ctx.clearRect(0, 0, w, h);

    if (S.phase !== "calibrating" && S.phase !== "scanning") return;

    const cx = w / 2, cy = h * 0.42;
    const rx = w * 0.35, ry = h * 0.3;

    // Dim outside oval
    ctx.fillStyle = "rgba(0,0,0,.5)";
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2, true);
    ctx.fill("evenodd");

    // Oval border — animated glow during scan
    const allGood = S.status.distance && S.status.light;
    let borderColor;
    if (S.phase === "scanning") {
      borderColor = allGood ? "#22c55e" : "#f59e0b";
    } else {
      borderColor = allGood ? "#22c55e" : "rgba(255,255,255,.6)";
    }

    // Glow effect
    if (S.phase === "scanning") {
      ctx.shadowColor = borderColor;
      ctx.shadowBlur = 12;
    }
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Progress ring during scan
    if (S.phase === "scanning" && S.scanStartTime) {
      const elapsed = performance.now() - S.scanStartTime;
      const progress = Math.min(1, elapsed / CFG.scanTimeoutMs);
      ctx.strokeStyle = "rgba(139,92,246,.6)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx + 6, ry + 6, 0, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
      ctx.stroke();
    }

    // Status badges
    drawBadges(ctx, w, h, S.status, t);

    // Bin indicators during scan
    if (S.phase === "scanning") {
      drawBinIndicators(ctx, w, h, S, t);
    }
  }

  function drawBadges(ctx, w, h, status, t) {
    const badges = [
      { key: "distance", label: t.badgeDistance, icon: "↕" },
      { key: "light", label: t.badgeLight, icon: "☀" },
      { key: "stability", label: t.badgeStability, icon: "◎" },
    ];
    const bw = 80, bh = 28, gap = 8;
    const totalW = badges.length * bw + (badges.length - 1) * gap;
    let bx = (w - totalW) / 2;
    const by = h * 0.80;

    for (const b of badges) {
      const val = status[b.key];
      const bg =
        val === true ? "rgba(34,197,94,.2)" :
        val === false ? "rgba(239,68,68,.2)" :
        "rgba(255,255,255,.08)";
      const fg =
        val === true ? "#4ade80" :
        val === false ? "#f87171" :
        "#64748b";

      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 8);
      ctx.fill();

      // Subtle border
      ctx.strokeStyle = val === true ? "rgba(34,197,94,.3)" : val === false ? "rgba(239,68,68,.2)" : "rgba(255,255,255,.05)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = fg;
      ctx.font = "600 10px -apple-system,system-ui,sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${b.icon} ${b.label}`, bx + bw / 2, by + bh / 2);

      bx += bw + gap;
    }
  }

  function drawBinIndicators(ctx, w, h, S, t) {
    // 5 indicators across the top
    const binOrder = ["left", "semi_left", "face", "semi_right", "right"];
    const labels = binOrder.map((id) => {
      const b = BINS.find((x) => x.id === id);
      return t[b.labelKey];
    });

    const totalW = w * 0.85;
    const startX = (w - totalW) / 2;
    const y = h * 0.06;
    const spacing = totalW / (binOrder.length - 1);
    const dotR = 10;

    // Connecting line
    ctx.strokeStyle = "rgba(255,255,255,.1)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(startX + totalW, y);
    ctx.stroke();

    // Filled segment
    const filled = binOrder.filter((id) => S.bins[id].length > 0);
    if (filled.length > 0) {
      ctx.strokeStyle = "rgba(34,197,94,.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const firstFilled = binOrder.indexOf(filled[0]);
      const lastFilled = binOrder.indexOf(filled[filled.length - 1]);
      ctx.moveTo(startX + firstFilled * spacing, y);
      ctx.lineTo(startX + lastFilled * spacing, y);
      ctx.stroke();
    }

    for (let i = 0; i < binOrder.length; i++) {
      const dx = startX + i * spacing;
      const hasCandidates = S.bins[binOrder[i]].length > 0;

      // Dot background
      ctx.beginPath();
      ctx.arc(dx, y, dotR, 0, Math.PI * 2);
      if (hasCandidates) {
        ctx.fillStyle = "#22c55e";
        ctx.fill();
        ctx.strokeStyle = "rgba(34,197,94,.5)";
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        ctx.fillStyle = "rgba(255,255,255,.08)";
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,.15)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Check mark or dot
      if (hasCandidates) {
        ctx.fillStyle = "#fff";
        ctx.font = "bold 10px -apple-system,system-ui,sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("✓", dx, y);
      }

      // Label
      ctx.fillStyle = hasCandidates ? "#4ade80" : "rgba(255,255,255,.4)";
      ctx.font = "500 8px -apple-system,system-ui,sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(labels[i], dx, y + dotR + 10);
    }

    // Counter
    const count = BINS.filter((b) => S.bins[b.id].length > 0).length;
    ctx.fillStyle = "#fff";
    ctx.font = "bold 13px -apple-system,system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${count}/5`, w / 2, y + dotR + 26);
  }

  /* ═══════════════════════════════════════════════════════════
     CAMERA & MEDIAPIPE
     ═══════════════════════════════════════════════════════════ */
  async function requestCamera() {
    return navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
      audio: false,
    });
  }

  function initFaceMesh(onResults) {
    const fm = new window.FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });
    fm.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    fm.onResults(onResults);
    return fm;
  }

  function startCamera(video, faceMesh) {
    const cam = new window.Camera(video, {
      onFrame: async () => { await faceMesh.send({ image: video }); },
      width: 1280,
      height: 960,
    });
    cam.start();
    return cam;
  }

  function stopCamera(S) {
    if (S.camera) { try { S.camera.stop(); } catch (_) {} S.camera = null; }
    if (S.animFrameId) { cancelAnimationFrame(S.animFrameId); S.animFrameId = null; }
    if (S.videoStream) {
      S.videoStream.getTracks().forEach((tr) => tr.stop());
      S.videoStream = null;
    }
    if (S.noFaceTimer) { clearTimeout(S.noFaceTimer); S.noFaceTimer = null; }
  }

  /* ═══════════════════════════════════════════════════════════
     FRAME CAPTURE (cached canvas)
     ═══════════════════════════════════════════════════════════ */
  function captureFrame(video) {
    return new Promise((resolve) => {
      const vw = video.videoWidth || 1280;
      const vh = video.videoHeight || 960;
      if (!_captureCanvas) {
        _captureCanvas = document.createElement("canvas");
        _captureCtx = _captureCanvas.getContext("2d");
      }
      _captureCanvas.width = vw;
      _captureCanvas.height = vh;
      _captureCtx.drawImage(video, 0, 0, vw, vh);
      _captureCanvas.toBlob((blob) => resolve(blob), "image/jpeg", CFG.jpegQuality);
    });
  }

  /* ═══════════════════════════════════════════════════════════
     SCAN PHASE INSTRUCTIONS
     ═══════════════════════════════════════════════════════════ */
  function getScanPhaseInstruction(elapsed, t) {
    if (elapsed < 4000) return { phase: 0, text: t.scanPhaseRight };
    if (elapsed < 6500) return { phase: 1, text: t.scanPhaseCenter1 };
    if (elapsed < 10500) return { phase: 2, text: t.scanPhaseLeft };
    if (elapsed < 13000) return { phase: 3, text: t.scanPhaseCenter2 };
    return { phase: 4, text: t.scanAlmostDone };
  }

  /* ═══════════════════════════════════════════════════════════
     MAIN MODULE
     ═══════════════════════════════════════════════════════════ */
  function createScanner(container, opts) {
    // Language detection — explicit parentheses to avoid precedence issues
    const detectedLang = ((document.documentElement.lang || "").substring(0, 2) === "en") ? "en" : "fr";
    const lang = opts.lang || detectedLang;
    const t = T[lang] || T.fr;
    const onScanComplete = opts.onComplete || null;
    const onFallback = opts.onFallback || null;

    let S = mkState();
    let destroyed = false;

    // Inject UI
    container.innerHTML = buildUI(t);

    // DOM refs
    const $permission = container.querySelector("#fs-permission");
    const $loading = container.querySelector("#fs-loading");
    const $scan = container.querySelector("#fs-scan");
    const $preview = container.querySelector("#fs-preview");
    const $error = container.querySelector("#fs-error");
    const $video = container.querySelector("#fs-video");
    const $overlay = container.querySelector("#fs-overlay");
    const $flash = container.querySelector("#fs-flash");
    const $instrText = container.querySelector("#fs-instr-text");
    const $instrSub = container.querySelector("#fs-instr-sub");
    const $errorMsg = container.querySelector("#fs-error-msg");
    const overlayCtx = $overlay.getContext("2d");

    function showScreen(name) {
      [$permission, $loading, $scan, $preview, $error].forEach(
        (el) => (el.style.display = "none")
      );
      const map = { permission: $permission, loading: $loading, scan: $scan, preview: $preview, error: $error };
      if (map[name]) map[name].style.display = "";
    }

    function showError(msg) {
      $errorMsg.textContent = msg;
      showScreen("error");
      S.phase = "idle";
      setTimeout(() => { if (onFallback && !destroyed) onFallback(); }, 2500);
    }

    function flashGreen() {
      $flash.style.display = "";
      $flash.style.opacity = "1";
      setTimeout(() => { $flash.style.opacity = "0"; }, 200);
      setTimeout(() => { $flash.style.display = "none"; }, 400);
    }

    // ── Permission ──────────────────────────────────────
    showScreen("permission");
    S.phase = "permission";

    container.querySelector("#fs-perm-btn").addEventListener("click", async () => {
      showScreen("loading");
      S.phase = "loading";
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          showError(t.cameraNotSupported);
          return;
        }
        S.videoStream = await requestCamera();
        $video.srcObject = S.videoStream;
        await new Promise((resolve, reject) => {
          S.metadataHandler = resolve;
          $video.addEventListener("loadedmetadata", resolve, { once: true });
          setTimeout(() => reject(new Error("Video timeout")), 10000);
        });
        S.faceMesh = initFaceMesh(onResults);
        S.camera = startCamera($video, S.faceMesh);
        S.phase = "calibrating";
        showScreen("scan");
        resizeOverlay();
        $instrText.textContent = t.calibTitle;
        $instrSub.textContent = t.centerFace;
      } catch (err) {
        console.error("Camera init error:", err);
        if (err.name === "NotAllowedError") showError(t.cameraDenied);
        else if (err.name === "NotFoundError") showError(t.noCameraDevice);
        else showError(t.cameraDenied);
      }
    });

    function resizeOverlay() {
      const rect = $scan.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      $overlay.width = rect.width * dpr;
      $overlay.height = rect.height * dpr;
      overlayCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    /* ── MediaPipe callback ───────────────────────────── */
    function onResults(results) {
      if (destroyed) return;
      if (S.phase !== "calibrating" && S.phase !== "scanning") return;

      const now = performance.now();
      const marks = results.multiFaceLandmarks && results.multiFaceLandmarks[0];

      if (!marks || marks.length < 468) {
        handleNoFace();
        return;
      }

      if (S.noFaceTimer) { clearTimeout(S.noFaceTimer); S.noFaceTimer = null; }

      S.frameCount++;
      const dtMs = S.prevTimestamp ? now - S.prevTimestamp : 33;
      const pose = headPose(marks);
      const size = faceSize(marks);
      const stab = stabilityPerSec(marks, S.prevLandmarks, dtMs);
      const nose = marks[LM.noseTip];
      const centered = Math.abs(nose.x - 0.5) < CFG.centerMaxOffset;

      // Throttled expensive checks
      if (S.frameCount % CFG.expensiveCheckInterval === 0 || !S.cachedBrightness) {
        S.cachedBrightness = analyzeBrightness($video, marks);
        S.cachedBlur = analyzeBlur($video, marks);
      }
      const bright = S.cachedBrightness || { ok: true, face: 128, bg: 128, tooDark: false, tooLight: false, backlight: false };
      const blur = S.cachedBlur || { ok: true, score: 30 };

      // Status badges
      const distOk = size >= CFG.faceSizeMin && size <= CFG.faceSizeMax;
      S.status.distance = distOk;
      S.status.light = bright.ok;
      S.status.stability = stab <= CFG.stabilityMaxPerSec;
      S.status.angle = Math.abs(pose.pitch) <= CFG.pitchMax;

      S.prevLandmarks = marks;
      S.prevTimestamp = now;

      // ─── CALIBRATION ───
      if (S.phase === "calibrating") {
        updateCalibInstruction(size, bright, blur, stab, centered);

        // Calibration requires: distance OK, brightness OK, centered
        // Blur and stability are softer checks — we just warn but don't block
        const calibOk = distOk && bright.ok && centered;
        if (calibOk) {
          if (!S.calibReadySince) S.calibReadySince = now;
          if (now - S.calibReadySince >= CFG.calibHoldMs) {
            S.phase = "scanning";
            S.scanStartTime = now;
            S.scanPhase = 0;
            $instrText.textContent = t.scanTitle;
            $instrSub.textContent = t.scanPhaseRight;
            if (navigator.vibrate) navigator.vibrate(80);
          } else {
            $instrText.textContent = t.calibReady;
            const remaining = ((CFG.calibHoldMs - (now - S.calibReadySince)) / 1000).toFixed(1);
            $instrSub.textContent = remaining + "s";
          }
        } else {
          S.calibReadySince = null;
        }
      }

      // ─── SCANNING ───
      if (S.phase === "scanning") {
        const elapsed = now - S.scanStartTime;
        const phaseInfo = getScanPhaseInstruction(elapsed, t);
        S.scanPhase = phaseInfo.phase;
        $instrText.textContent = t.scanTitle;
        $instrSub.textContent = phaseInfo.text;

        if (elapsed > CFG.scanTimeoutMs) { finishScan(); return; }

        // Capture candidates — NO hard stability gate during scan
        // Stability only affects the score, not whether we capture
        if (now - S.lastCaptureTime >= CFG.captureIntervalMs && !S.isCapturing) {
          tryCapture(marks, pose, bright, blur, stab, now);
        }

        // Auto-finish when all bins filled and user is front-facing
        const filledCount = BINS.filter((b) => S.bins[b.id].length > 0).length;
        if (filledCount >= 5 && elapsed > 4000 && Math.abs(pose.yaw) < CFG.faceYawMax) {
          finishScan();
          return;
        }

        // Also auto-finish if 3+ bins filled and we're past 15s
        if (filledCount >= 3 && elapsed > 15000 && Math.abs(pose.yaw) < CFG.faceYawMax) {
          finishScan();
          return;
        }
      }

      // Draw overlay
      const rect = $scan.getBoundingClientRect();
      drawOverlay(overlayCtx, rect.width, rect.height, S, lang);
    }

    function handleNoFace() {
      $instrText.textContent = t.noFaceDetected;
      $instrSub.textContent = t.noFaceHint;
      S.status = { distance: null, light: null, angle: null, stability: null };
      S.calibReadySince = null;
      if (!S.noFaceTimer) {
        S.noFaceTimer = setTimeout(() => {
          if ((S.phase === "calibrating" || S.phase === "scanning") && !destroyed) {
            showError(t.noFaceDetected);
          }
        }, CFG.noFaceTimeoutMs);
      }
      const rect = $scan.getBoundingClientRect();
      drawOverlay(overlayCtx, rect.width, rect.height, S, lang);
    }

    function updateCalibInstruction(size, bright, blur, stab, centered) {
      if (size < CFG.faceSizeMin) { $instrText.textContent = t.moveCloser; $instrSub.textContent = ""; }
      else if (size > CFG.faceSizeMax) { $instrText.textContent = t.moveBack; $instrSub.textContent = ""; }
      else if (bright.tooDark) { $instrText.textContent = t.moreLightNeeded; $instrSub.textContent = ""; }
      else if (bright.tooLight) { $instrText.textContent = t.tooMuchLight; $instrSub.textContent = ""; }
      else if (bright.backlight) { $instrText.textContent = t.backlight; $instrSub.textContent = ""; }
      else if (!centered) { $instrText.textContent = t.centerFace; $instrSub.textContent = ""; }
      else if (stab > CFG.stabilityMaxPerSec * 2) { $instrText.textContent = t.holdStill; $instrSub.textContent = ""; }
      else { $instrText.textContent = t.calibTitle; $instrSub.textContent = t.centerFace; }
    }

    /* ── Frame capture into bins ──────────────────────── */
    async function tryCapture(marks, pose, bright, blur, stab, now) {
      // During scan: only require brightness OK and pitch OK
      // Blur and stability contribute to SCORE but don't block capture
      if (!bright.ok) return;
      if (Math.abs(pose.pitch) > CFG.pitchMax + 5) return; // slightly relaxed

      const yaw = pose.yaw;
      let targetBin = null;

      if (S.retakeBinId) {
        const binDef = BINS.find((b) => b.id === S.retakeBinId);
        if (binDef && yaw >= binDef.yawMin && yaw <= binDef.yawMax) targetBin = binDef;
      } else {
        for (const b of BINS) {
          if (yaw >= b.yawMin && yaw <= b.yawMax) { targetBin = b; break; }
        }
      }
      if (!targetBin) return;

      const score = computeScore(bright, blur, stab, yaw, targetBin.idealYaw);
      const bin = S.bins[targetBin.id];
      if (bin.length >= CFG.binTopN && score <= bin[bin.length - 1].score) return;

      // Capture
      S.isCapturing = true;
      S.lastCaptureTime = now;
      try {
        const blob = await captureFrame($video);
        if (!blob || destroyed) { S.isCapturing = false; return; }

        const wasEmpty = bin.length === 0;
        const entry = { blob, url: URL.createObjectURL(blob), score, yaw };
        bin.push(entry);
        bin.sort((a, b) => b.score - a.score);
        while (bin.length > CFG.binTopN) {
          const removed = bin.pop();
          URL.revokeObjectURL(removed.url);
        }

        if (wasEmpty) {
          flashGreen();
          if (navigator.vibrate) navigator.vibrate(40);
        }
      } catch (e) {
        console.warn("Capture failed:", e);
      }
      S.isCapturing = false;
    }

    /* ── Finish scan ──────────────────────────────────── */
    function finishScan() {
      if (S.phase === "preview") return;
      S.phase = "preview";
      stopCamera(S);
      if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
      showPreview();
    }

    /* ── Preview ──────────────────────────────────────── */
    function showPreview() {
      showScreen("preview");
      const $grid1 = container.querySelector("#fs-preview-grid");
      const $grid2 = container.querySelector("#fs-preview-grid2");
      $grid1.innerHTML = "";
      $grid2.innerHTML = "";

      for (const binId of ["face", "semi_right", "right"]) {
        $grid1.appendChild(createPreviewCard(binId));
      }
      for (const binId of ["semi_left", "left"]) {
        $grid2.appendChild(createPreviewCard(binId));
      }

      container.querySelector("#fs-validate-btn").onclick = () => upload();
      container.querySelector("#fs-restart-btn").onclick = () => {
        if (window.AdermioFaceScan) window.AdermioFaceScan.restart();
      };
    }

    function createPreviewCard(binId) {
      const binDef = BINS.find((b) => b.id === binId);
      const best = S.bins[binId][0] || null;
      const q = best ? qualityLabel(best.score, lang) : qualityLabel(0, lang);

      const card = document.createElement("div");
      card.style.cssText = "border-radius:12px;overflow:hidden;background:rgba(255,255,255,.04);text-align:center;border:1px solid rgba(255,255,255,.06);";

      if (best) {
        card.innerHTML = `
          <img src="${best.url}" style="width:100%;aspect-ratio:3/4;object-fit:cover;display:block;" />
          <div style="padding:8px 4px;">
            <span style="display:inline-block;padding:2px 10px;border-radius:10px;font-size:10px;font-weight:700;background:${q.color}18;color:${q.color};border:1px solid ${q.color}30;">${q.label}</span>
            <p style="font-size:9px;color:#64748b;margin:4px 0 0;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">${t[binDef.labelKey]}</p>
          </div>`;
      } else {
        card.innerHTML = `
          <div style="width:100%;aspect-ratio:3/4;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.02);">
            <svg width="24" height="24" fill="none" stroke="rgba(255,255,255,.15)" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 15s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg>
          </div>
          <div style="padding:8px 4px;">
            <span style="display:inline-block;padding:2px 10px;border-radius:10px;font-size:10px;font-weight:700;background:${q.color}18;color:${q.color};border:1px solid ${q.color}30;">${q.label}</span>
            <p style="font-size:9px;color:#64748b;margin:4px 0 0;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">${t[binDef.labelKey]}</p>
            <button class="fs-retake-btn" data-bin="${binId}" style="margin-top:6px;padding:4px 12px;border:1px solid rgba(139,92,246,.3);border-radius:8px;background:rgba(139,92,246,.1);color:#a78bfa;font-size:10px;font-weight:600;cursor:pointer;">${t.retakeAngle}</button>
          </div>`;
      }

      card.querySelectorAll(".fs-retake-btn").forEach((btn) => {
        btn.addEventListener("click", () => retakeBin(btn.dataset.bin));
      });
      return card;
    }

    /* ── Retake specific bin ──────────────────────────── */
    async function retakeBin(binId) {
      S.bins[binId].forEach((e) => URL.revokeObjectURL(e.url));
      S.bins[binId] = [];
      S.retakeBinId = binId;

      showScreen("scan");
      try {
        S.videoStream = await requestCamera();
        $video.srcObject = S.videoStream;
        await new Promise((res) => $video.addEventListener("loadedmetadata", res, { once: true }));
        S.faceMesh = initFaceMesh(onResults);
        S.camera = startCamera($video, S.faceMesh);
        S.phase = "scanning";
        S.scanStartTime = performance.now();
        S.frameCount = 0;
        S.prevLandmarks = null;
        S.prevTimestamp = null;
        S.cachedBrightness = null;
        S.cachedBlur = null;
        S.isCapturing = false;
        resizeOverlay();

        const binDef = BINS.find((b) => b.id === binId);
        $instrText.textContent = t.retakeAngle;
        $instrSub.textContent = t[binDef.labelKey];

        const retakeCheck = setInterval(() => {
          if (S.bins[binId].length > 0 || destroyed) {
            clearInterval(retakeCheck);
            S.retakeBinId = null;
            if (!destroyed) finishScan();
          }
        }, 400);

        setTimeout(() => {
          clearInterval(retakeCheck);
          S.retakeBinId = null;
          if (S.phase === "scanning" && !destroyed) finishScan();
        }, 10000);
      } catch (err) {
        console.error("Retake error:", err);
        S.retakeBinId = null;
        showPreview();
      }
    }

    /* ── Upload ───────────────────────────────────────── */
    async function upload() {
      const $btn = container.querySelector("#fs-validate-btn");
      $btn.textContent = t.uploadingPhotos;
      $btn.disabled = true;
      $btn.style.opacity = "0.6";

      try {
        const uploadMap = [
          { binId: "face", s3Type: "face", formKey: "face" },
          { binId: "semi_right", s3Type: "semi_right", formKey: null },
          { binId: "right", s3Type: "right", formKey: "right" },
          { binId: "semi_left", s3Type: "semi_left", formKey: null },
          { binId: "left", s3Type: "left", formKey: "left" },
        ];

        for (const { binId, s3Type, formKey } of uploadMap) {
          const best = S.bins[binId][0];
          if (!best) continue;
          const file = new File([best.blob], `scan_${s3Type}_${Date.now()}.jpg`, { type: "image/jpeg" });
          if (typeof window.uploadToS3Presigned === "function") {
            const { key, getUrl } = await window.uploadToS3Presigned({
              file, jobId: window.formState?.jobId || "", type: s3Type,
            });
            if (formKey && window.formState) {
              window.formState.photos[formKey] = { key, getUrl };
            }
          }
        }

        if (window.validationState) window.validationState.facePhotoUploaded = true;
        syncManualPreviews();
        if (onScanComplete) onScanComplete({ bins: Object.fromEntries(BINS.map((b) => [b.id, S.bins[b.id].length > 0])) });

        const manualContainer = document.getElementById("manual-upload-container");
        const scanContainer = document.getElementById("facescan-container");
        if (manualContainer && scanContainer) {
          scanContainer.classList.add("hidden");
          manualContainer.classList.remove("hidden");
        }
      } catch (err) {
        console.error("Upload error:", err);
        $btn.textContent = t.validatePhotos;
        $btn.disabled = false;
        $btn.style.opacity = "1";
      }
    }

    function syncManualPreviews() {
      const map = { face: "face", right: "left", left: "right" };
      for (const [binId, previewType] of Object.entries(map)) {
        const best = S.bins[binId]?.[0];
        if (!best) continue;
        const previewEl = document.getElementById(`preview-${previewType}`);
        const emptyEl = document.getElementById(`empty-${previewType}`);
        if (previewEl) { previewEl.src = best.url; previewEl.classList.remove("hidden"); }
        if (emptyEl) emptyEl.classList.add("hidden");
      }
    }

    /* ── Destroy ──────────────────────────────────────── */
    function destroy() {
      destroyed = true;
      stopCamera(S);
      for (const b of BINS) {
        S.bins[b.id].forEach((e) => URL.revokeObjectURL(e.url));
        S.bins[b.id] = [];
      }
      S.phase = "idle";
    }

    return { destroy };
  }

  /* ═══════════════════════════════════════════════════════════
     PUBLIC API
     ═══════════════════════════════════════════════════════════ */
  window.AdermioFaceScan = {
    _instance: null,
    _container: null,
    _opts: null,

    init(containerId, opts = {}) {
      const el = document.getElementById(containerId);
      if (!el) { console.error("AdermioFaceScan: container not found:", containerId); return; }
      if (this._instance) this._instance.destroy();
      this._container = el;
      this._opts = opts;
      this._instance = createScanner(el, opts);
    },

    destroy() {
      if (this._instance) { this._instance.destroy(); this._instance = null; }
    },

    restart() {
      if (this._container && this._opts) {
        if (this._instance) this._instance.destroy();
        // Reset cached canvases
        _brightCanvas = null; _brightCtx = null;
        _blurCanvas = null; _blurCtx = null;
        _captureCanvas = null; _captureCtx = null;
        this._instance = createScanner(this._container, this._opts);
      }
    },
  };
})();
