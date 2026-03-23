/**
 * Adermio Face Scan v5 — Continuous Video Scan + Intelligent Frame Extraction
 *
 * Architecture:
 *  Phase 1: Calibration — check lighting, distance, centering before scan
 *  Phase 2: Continuous scan — guided head rotation, real-time frame collection
 *  Phase 3: Validation — show 5 best frames, allow selective retake
 *
 * Captures 5 angles: face, semi-right, right, semi-left, left
 * Each frame scored by composite: sharpness(35%) + brightness(25%) + stability(20%) + angle(20%)
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
      calibReady: "Conditions optimales — scan imminent",
      moveCloser: "Rapprochez-vous",
      moveBack: "Reculez légèrement",
      centerFace: "Centrez votre visage",
      moreLightNeeded: "Luminosité insuffisante",
      tooMuchLight: "Lumière trop forte",
      backlight: "Contre-jour détecté",
      holdStill: "Restez immobile",
      blurry: "Image floue",
      noFaceDetected: "Aucun visage détecté",
      noFaceHint: "Vérifiez que votre visage est bien visible",

      // Scanning
      scanTitle: "Scan en cours",
      scanInstruction: "Tournez lentement la tête",
      scanPhaseRight: "Tournez vers la droite",
      scanPhaseCenter: "Revenez face caméra",
      scanPhaseLeft: "Tournez vers la gauche",
      scanPhaseFinish: "Revenez face caméra",
      scanComplete: "Scan terminé !",
      scanTimeout: "Temps écoulé",

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
      previewTitle: "Vos photos de scan",
      qualityExcellent: "Excellent",
      qualityGood: "Bon",
      qualityAcceptable: "Acceptable",
      qualityMissing: "Manquant",
      retake: "Reprendre",
      retakeAngle: "Refaire cet angle",
      validatePhotos: "Valider et continuer",
      scanAnother: "Recommencer",
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
      calibReady: "Optimal conditions — scan starting",
      moveCloser: "Move closer",
      moveBack: "Move back slightly",
      centerFace: "Center your face",
      moreLightNeeded: "Not enough light",
      tooMuchLight: "Too much light",
      backlight: "Backlight detected",
      holdStill: "Hold still",
      blurry: "Image is blurry",
      noFaceDetected: "No face detected",
      noFaceHint: "Make sure your face is visible",

      scanTitle: "Scanning",
      scanInstruction: "Slowly turn your head",
      scanPhaseRight: "Turn to the right",
      scanPhaseCenter: "Come back to center",
      scanPhaseLeft: "Turn to the left",
      scanPhaseFinish: "Come back to center",
      scanComplete: "Scan complete!",
      scanTimeout: "Time's up",

      binFace: "Front",
      binSemiRight: "Semi R",
      binRight: "Profile R",
      binSemiLeft: "Semi L",
      binLeft: "Profile L",

      badgeDistance: "Distance",
      badgeLight: "Light",
      badgeAngle: "Angle",
      badgeStability: "Stability",

      previewTitle: "Your scan photos",
      qualityExcellent: "Excellent",
      qualityGood: "Good",
      qualityAcceptable: "Acceptable",
      qualityMissing: "Missing",
      retake: "Retake",
      retakeAngle: "Retake this angle",
      validatePhotos: "Validate and continue",
      scanAnother: "Start over",
      uploadingPhotos: "Uploading...",
    },
  };

  /* ═══════════════════════════════════════════════════════════
     CONFIGURATION
     ═══════════════════════════════════════════════════════════ */
  const CFG = {
    // Face size (forehead→chin as fraction of frame height)
    faceSizeMin: 0.22,
    faceSizeMax: 0.55,
    faceSizeIdeal: 0.35,
    centerMaxOffset: 0.14,

    // Angles (degrees)
    faceYawMax: 10,
    semiProfileYawMin: 15,
    semiProfileYawMax: 30,
    profileYawMin: 30,
    profileYawMax: 55,
    pitchMax: 15,

    // Quality
    brightnessMin: 55,
    brightnessMax: 220,
    brightnessIdeal: 130,
    backlightRatio: 0.65,
    blurThreshold: 15,
    blurIdeal: 60,
    stabilityMaxPerSec: 0.15,

    // Timing
    calibHoldMs: 1500, // conditions must be green for 1.5s
    captureIntervalMs: 200, // sample a candidate every 200ms
    scanTimeoutMs: 20000, // max scan duration
    noFaceTimeoutMs: 8000,

    // Bins: top candidates per bin
    binTopN: 3,

    // Image
    jpegQuality: 0.92,

    // Throttle
    expensiveCheckInterval: 5,
  };

  /* ═══════════════════════════════════════════════════════════
     BINS DEFINITION
     ═══════════════════════════════════════════════════════════ */
  const BINS = [
    { id: "face", yawMin: -CFG.faceYawMax, yawMax: CFG.faceYawMax, idealYaw: 0, labelKey: "binFace" },
    { id: "semi_right", yawMin: CFG.semiProfileYawMin, yawMax: CFG.semiProfileYawMax, idealYaw: 22, labelKey: "binSemiRight" },
    { id: "right", yawMin: CFG.profileYawMin, yawMax: CFG.profileYawMax, idealYaw: 42, labelKey: "binRight" },
    { id: "semi_left", yawMin: -CFG.semiProfileYawMax, yawMax: -CFG.semiProfileYawMin, idealYaw: -22, labelKey: "binSemiLeft" },
    { id: "left", yawMin: -CFG.profileYawMax, yawMax: -CFG.profileYawMin, idealYaw: -42, labelKey: "binLeft" },
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
    const cw = 200, ch = 200;
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
    // Brightness: 0-1, best at ideal
    const bFace = brightnessData.face;
    const bScore = 1 - Math.min(1, Math.abs(bFace - CFG.brightnessIdeal) / (CFG.brightnessIdeal - CFG.brightnessMin));

    // Sharpness: 0-1, normalized by ideal
    const sScore = Math.min(1, blurData.score / CFG.blurIdeal);

    // Stability: 0-1, inverse of movement
    const stScore = Math.max(0, 1 - stability / (CFG.stabilityMaxPerSec * 3));

    // Angle precision: 0-1, distance from ideal yaw
    const maxYawDev = 15;
    const aScore = Math.max(0, 1 - Math.abs(yaw - idealYaw) / maxYawDev);

    return bScore * 0.25 + sScore * 0.35 + stScore * 0.20 + aScore * 0.20;
  }

  function qualityLabel(score, lang) {
    const t = T[lang] || T.fr;
    if (score >= 0.75) return { label: t.qualityExcellent, color: "#22c55e" };
    if (score >= 0.5) return { label: t.qualityGood, color: "#eab308" };
    if (score > 0) return { label: t.qualityAcceptable, color: "#f97316" };
    return { label: t.qualityMissing, color: "#ef4444" };
  }

  /* ═══════════════════════════════════════════════════════════
     STATE FACTORY
     ═══════════════════════════════════════════════════════════ */
  function mkState() {
    const bins = {};
    for (const b of BINS) bins[b.id] = []; // each: { blob, url, score, yaw }
    return {
      phase: "idle", // idle | permission | loading | calibrating | scanning | preview
      bins,
      calibReadySince: null,
      scanStartTime: null,
      scanPhase: 0, // 0=right, 1=center1, 2=left, 3=center2
      lastCaptureTime: 0,
      lastLandmarks: null,
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
      retakeBinId: null, // if retaking a specific bin
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
      <div id="fs-root" style="position:relative;width:100%;max-width:400px;margin:0 auto;border-radius:16px;overflow:hidden;background:#000;">

        <!-- Permission screen -->
        <div id="fs-permission" style="padding:32px 20px;text-align:center;background:linear-gradient(135deg,#0f172a,#1e293b);color:#fff;">
          <div style="width:64px;height:64px;margin:0 auto 16px;border-radius:50%;background:rgba(99,102,241,.15);display:flex;align-items:center;justify-content:center;">
            <svg width="28" height="28" fill="none" stroke="#818cf8" stroke-width="2" stroke-linecap="round"><path d="M12 22c5.523 0 10-4.477 10-10V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6c0 5.523 4.477 10 10 10z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <h3 style="font-size:18px;font-weight:700;margin:0 0 8px;">${t.cameraPermTitle}</h3>
          <p style="font-size:13px;color:#94a3b8;margin:0 0 20px;line-height:1.5;">${t.cameraPermDesc}</p>
          <button id="fs-perm-btn" style="width:100%;padding:14px;border:none;border-radius:12px;background:linear-gradient(135deg,#6366f1,#818cf8);color:#fff;font-size:15px;font-weight:600;cursor:pointer;">${t.cameraPermBtn}</button>
        </div>

        <!-- Loading screen -->
        <div id="fs-loading" style="display:none;padding:48px 20px;text-align:center;background:#0f172a;color:#fff;">
          <div style="width:40px;height:40px;margin:0 auto 16px;border:3px solid rgba(255,255,255,.1);border-top-color:#818cf8;border-radius:50%;animation:fsSpin 1s linear infinite;"></div>
          <p style="font-size:14px;color:#94a3b8;">${t.loading}</p>
        </div>

        <!-- Scan screen (calibration + scanning) -->
        <div id="fs-scan" style="display:none;position:relative;aspect-ratio:3/4;background:#000;">
          <video id="fs-video" playsinline autoplay muted style="width:100%;height:100%;object-fit:cover;transform:scaleX(-1);"></video>
          <canvas id="fs-overlay" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;"></canvas>
          <!-- Success flash -->
          <div id="fs-flash" style="display:none;position:absolute;inset:0;background:rgba(34,197,94,.2);pointer-events:none;z-index:5;"></div>
          <!-- Instruction bar -->
          <div id="fs-instr" style="position:absolute;bottom:0;left:0;right:0;padding:12px 16px;background:linear-gradient(transparent,rgba(0,0,0,.8));text-align:center;z-index:4;">
            <p id="fs-instr-text" style="color:#fff;font-size:14px;font-weight:600;margin:0;"></p>
            <p id="fs-instr-sub" style="color:#94a3b8;font-size:12px;margin:4px 0 0;"></p>
          </div>
        </div>

        <!-- Preview screen -->
        <div id="fs-preview" style="display:none;padding:20px;background:linear-gradient(135deg,#0f172a,#1e293b);color:#fff;">
          <h3 style="font-size:16px;font-weight:700;margin:0 0 16px;text-align:center;">${t.previewTitle}</h3>
          <div id="fs-preview-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px;"></div>
          <div id="fs-preview-grid2" style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:16px;"></div>
          <button id="fs-validate-btn" style="width:100%;padding:14px;border:none;border-radius:12px;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;font-size:15px;font-weight:600;cursor:pointer;">${t.validatePhotos}</button>
          <button id="fs-restart-btn" style="width:100%;padding:10px;margin-top:8px;border:1px solid rgba(255,255,255,.15);border-radius:12px;background:transparent;color:#94a3b8;font-size:13px;cursor:pointer;">${t.scanAnother}</button>
        </div>

        <!-- Error screen -->
        <div id="fs-error" style="display:none;padding:32px 20px;text-align:center;background:#0f172a;color:#fff;">
          <div style="width:48px;height:48px;margin:0 auto 12px;border-radius:50%;background:rgba(239,68,68,.15);display:flex;align-items:center;justify-content:center;">
            <svg width="24" height="24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
          </div>
          <p id="fs-error-msg" style="font-size:14px;color:#f87171;margin:0;"></p>
        </div>
      </div>
      <style>
        @keyframes fsSpin { to { transform: rotate(360deg); } }
        @keyframes fsPulse { 0%,100% { opacity:1; } 50% { opacity:.5; } }
      </style>
    `;
  }

  /* ═══════════════════════════════════════════════════════════
     OVERLAY DRAWING
     ═══════════════════════════════════════════════════════════ */
  function drawOverlay(ctx, w, h, S, lang) {
    const t = T[lang] || T.fr;
    ctx.clearRect(0, 0, w, h);

    if (S.phase === "calibrating" || S.phase === "scanning") {
      // Dim outside oval
      const cx = w / 2, cy = h * 0.42;
      const rx = w * 0.34, ry = h * 0.3;
      ctx.fillStyle = "rgba(0,0,0,.55)";
      ctx.beginPath();
      ctx.rect(0, 0, w, h);
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2, true);
      ctx.fill("evenodd");

      // Oval border
      const allGood = S.status.distance && S.status.light && S.status.stability;
      const color = S.phase === "scanning"
        ? (allGood ? "#22c55e" : "#eab308")
        : (allGood ? "#22c55e" : "#ffffff");
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Draw status badges
      drawBadges(ctx, w, h, S.status, t);

      // Draw bin indicators during scan
      if (S.phase === "scanning") {
        drawBinIndicators(ctx, w, h, S, t);
      }
    }
  }

  function drawBadges(ctx, w, h, status, t) {
    const badges = [
      { key: "distance", label: t.badgeDistance, icon: "↕" },
      { key: "light", label: t.badgeLight, icon: "☀" },
      { key: "angle", label: t.badgeAngle, icon: "↻" },
      { key: "stability", label: t.badgeStability, icon: "◎" },
    ];
    const bw = 72, bh = 26, gap = 6;
    const totalW = badges.length * bw + (badges.length - 1) * gap;
    let bx = (w - totalW) / 2;
    const by = h * 0.78;

    for (const b of badges) {
      const val = status[b.key];
      const bg =
        val === true ? "rgba(34,197,94,.25)" :
        val === false ? "rgba(239,68,68,.25)" :
        "rgba(255,255,255,.1)";
      const fg =
        val === true ? "#22c55e" :
        val === false ? "#ef4444" :
        "#94a3b8";

      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 6);
      ctx.fill();

      ctx.fillStyle = fg;
      ctx.font = "bold 10px -apple-system,sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${b.icon} ${b.label}`, bx + bw / 2, by + bh / 2);

      bx += bw + gap;
    }
  }

  function drawBinIndicators(ctx, w, h, S, t) {
    // 5 dots in an arc at the top showing bin completion
    const labels = BINS.map((b) => t[b.labelKey]);
    const cx = w / 2, cy = h * 0.08;
    const radius = w * 0.35;
    const totalAngle = Math.PI * 0.6;
    const startAngle = Math.PI + (Math.PI - totalAngle) / 2;

    for (let i = 0; i < BINS.length; i++) {
      const angle = startAngle + (totalAngle * i) / (BINS.length - 1);
      const dx = cx + radius * Math.cos(angle);
      const dy = cy - radius * Math.sin(angle) + radius;
      const hasCandidates = S.bins[BINS[i].id].length > 0;

      // Dot
      ctx.beginPath();
      ctx.arc(dx, dy, 8, 0, Math.PI * 2);
      ctx.fillStyle = hasCandidates ? "#22c55e" : "rgba(255,255,255,.2)";
      ctx.fill();

      if (hasCandidates) {
        ctx.fillStyle = "#fff";
        ctx.font = "bold 8px -apple-system,sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("✓", dx, dy);
      }

      // Label below dot
      ctx.fillStyle = hasCandidates ? "#22c55e" : "rgba(255,255,255,.5)";
      ctx.font = "9px -apple-system,sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(labels[i], dx, dy + 16);
    }

    // Filled count
    const filled = BINS.filter((b) => S.bins[b.id].length > 0).length;
    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px -apple-system,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${filled}/5`, cx, cy + 4);
  }

  /* ═══════════════════════════════════════════════════════════
     CAMERA & MEDIAPIPE
     ═══════════════════════════════════════════════════════════ */
  async function requestCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 1280 },
        height: { ideal: 960 },
      },
      audio: false,
    });
    return stream;
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
      onFrame: async () => {
        await faceMesh.send({ image: video });
      },
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
      S.videoStream.getTracks().forEach((t) => t.stop());
      S.videoStream = null;
    }
    if (S.noFaceTimer) { clearTimeout(S.noFaceTimer); S.noFaceTimer = null; }
  }

  /* ═══════════════════════════════════════════════════════════
     FRAME CAPTURE
     ═══════════════════════════════════════════════════════════ */
  function captureFrame(video) {
    return new Promise((resolve) => {
      const c = document.createElement("canvas");
      c.width = video.videoWidth || 1280;
      c.height = video.videoHeight || 960;
      c.getContext("2d").drawImage(video, 0, 0);
      c.toBlob(
        (blob) => resolve(blob),
        "image/jpeg",
        CFG.jpegQuality
      );
    });
  }

  /* ═══════════════════════════════════════════════════════════
     SCAN PHASE INSTRUCTIONS
     ═══════════════════════════════════════════════════════════ */
  function getScanPhaseInstruction(elapsed, t) {
    // Timeline: 0-3s right, 3-5s center, 5-8s left, 8-10s center
    if (elapsed < 3000) return { phase: 0, text: t.scanPhaseRight };
    if (elapsed < 5000) return { phase: 1, text: t.scanPhaseCenter };
    if (elapsed < 8000) return { phase: 2, text: t.scanPhaseLeft };
    return { phase: 3, text: t.scanPhaseFinish };
  }

  /* ═══════════════════════════════════════════════════════════
     MAIN MODULE
     ═══════════════════════════════════════════════════════════ */
  function createScanner(container, opts) {
    const lang =
      opts.lang ||
      (document.documentElement.lang || "").substring(0, 2) === "en"
        ? "en"
        : "fr";
    const t = T[lang] || T.fr;
    const onScanComplete = opts.onComplete || null;
    const onFallback = opts.onFallback || null;

    let S = mkState();

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
      const map = {
        permission: $permission,
        loading: $loading,
        scan: $scan,
        preview: $preview,
        error: $error,
      };
      if (map[name]) map[name].style.display = "";
    }

    function showError(msg) {
      $errorMsg.textContent = msg;
      showScreen("error");
      S.phase = "idle";
      setTimeout(() => { if (onFallback) onFallback(); }, 2500);
    }

    function flashGreen() {
      $flash.style.display = "";
      setTimeout(() => ($flash.style.display = "none"), 300);
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

        // Wait for video metadata
        await new Promise((resolve, reject) => {
          const handler = () => resolve();
          S.metadataHandler = handler;
          $video.addEventListener("loadedmetadata", handler, { once: true });
          setTimeout(() => reject(new Error("Video timeout")), 10000);
        });

        S.faceMesh = initFaceMesh(onResults);
        S.camera = startCamera($video, S.faceMesh);

        // Enter calibration
        S.phase = "calibrating";
        showScreen("scan");
        resizeOverlay();
        $instrText.textContent = t.calibTitle;
        $instrSub.textContent = "";
      } catch (err) {
        console.error("Camera init error:", err);
        if (err.name === "NotAllowedError") showError(t.cameraDenied);
        else if (err.name === "NotFoundError") showError(t.noCameraDevice);
        else showError(t.cameraDenied);
      }
    });

    // ── Overlay resize ──────────────────────────────────
    function resizeOverlay() {
      const rect = $scan.getBoundingClientRect();
      $overlay.width = rect.width * (window.devicePixelRatio || 1);
      $overlay.height = rect.height * (window.devicePixelRatio || 1);
      overlayCtx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
    }

    // ── MediaPipe callback ──────────────────────────────
    function onResults(results) {
      if (S.phase !== "calibrating" && S.phase !== "scanning") return;

      const now = performance.now();
      const marks =
        results.multiFaceLandmarks && results.multiFaceLandmarks[0];

      if (!marks || marks.length < 468) {
        handleNoFace(now);
        return;
      }

      // Clear no-face timer
      if (S.noFaceTimer) {
        clearTimeout(S.noFaceTimer);
        S.noFaceTimer = null;
      }

      S.frameCount++;
      const dtMs = S.prevTimestamp ? now - S.prevTimestamp : 33;

      // Compute all metrics
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

      // Update status badges
      const distOk = size >= CFG.faceSizeMin && size <= CFG.faceSizeMax;
      S.status.distance = distOk;
      S.status.light = bright.ok;
      S.status.stability = stab <= CFG.stabilityMaxPerSec;
      S.status.angle = Math.abs(pose.pitch) <= CFG.pitchMax;

      // Update prev
      S.prevLandmarks = marks;
      S.prevTimestamp = now;

      // Update instruction text
      updateInstruction(pose, size, bright, blur, stab, centered, now);

      // ─── CALIBRATION PHASE ───
      if (S.phase === "calibrating") {
        const allGreen = distOk && bright.ok && blur.ok && S.status.stability && centered;
        if (allGreen) {
          if (!S.calibReadySince) S.calibReadySince = now;
          const elapsed = now - S.calibReadySince;
          if (elapsed >= CFG.calibHoldMs) {
            // Transition to scanning
            S.phase = "scanning";
            S.scanStartTime = now;
            S.scanPhase = 0;
            $instrText.textContent = t.scanTitle;
            $instrSub.textContent = t.scanPhaseRight;
            // Haptic feedback
            if (navigator.vibrate) navigator.vibrate(100);
          } else {
            $instrText.textContent = t.calibReady;
            $instrSub.textContent = `${((CFG.calibHoldMs - elapsed) / 1000).toFixed(1)}s`;
          }
        } else {
          S.calibReadySince = null;
        }
      }

      // ─── SCANNING PHASE ───
      if (S.phase === "scanning") {
        const elapsed = now - S.scanStartTime;

        // Update guided instruction
        const phaseInfo = getScanPhaseInstruction(elapsed, t);
        S.scanPhase = phaseInfo.phase;
        $instrText.textContent = t.scanTitle;
        $instrSub.textContent = phaseInfo.text;

        // Check timeout
        if (elapsed > CFG.scanTimeoutMs) {
          finishScan();
          return;
        }

        // Try to capture a candidate frame
        if (now - S.lastCaptureTime >= CFG.captureIntervalMs) {
          tryCapture(marks, pose, bright, blur, stab, now);
        }

        // Auto-finish: all 5 bins have candidates AND user is facing front
        const allFilled = BINS.every((b) => S.bins[b.id].length > 0);
        if (allFilled && elapsed > 5000 && Math.abs(pose.yaw) < CFG.faceYawMax) {
          finishScan();
          return;
        }
      }

      // Draw overlay
      const rect = $scan.getBoundingClientRect();
      drawOverlay(overlayCtx, rect.width, rect.height, S, lang);
    }

    function handleNoFace(now) {
      $instrText.textContent = t.noFaceDetected;
      $instrSub.textContent = t.noFaceHint;
      S.status = { distance: null, light: null, angle: null, stability: null };
      S.calibReadySince = null;

      if (!S.noFaceTimer) {
        S.noFaceTimer = setTimeout(() => {
          if (S.phase === "calibrating" || S.phase === "scanning") {
            showError(t.noFaceDetected);
          }
        }, CFG.noFaceTimeoutMs);
      }

      const rect = $scan.getBoundingClientRect();
      drawOverlay(overlayCtx, rect.width, rect.height, S, lang);
    }

    function updateInstruction(pose, size, bright, blur, stab, centered, now) {
      if (S.phase !== "calibrating") return;

      // Priority messages for calibration
      if (size < CFG.faceSizeMin) {
        $instrText.textContent = t.moveCloser;
        $instrSub.textContent = "";
      } else if (size > CFG.faceSizeMax) {
        $instrText.textContent = t.moveBack;
        $instrSub.textContent = "";
      } else if (bright.tooDark) {
        $instrText.textContent = t.moreLightNeeded;
        $instrSub.textContent = "";
      } else if (bright.tooLight) {
        $instrText.textContent = t.tooMuchLight;
        $instrSub.textContent = "";
      } else if (bright.backlight) {
        $instrText.textContent = t.backlight;
        $instrSub.textContent = "";
      } else if (!blur.ok) {
        $instrText.textContent = t.blurry;
        $instrSub.textContent = "";
      } else if (stab > CFG.stabilityMaxPerSec) {
        $instrText.textContent = t.holdStill;
        $instrSub.textContent = "";
      } else if (!centered) {
        $instrText.textContent = t.centerFace;
        $instrSub.textContent = "";
      } else {
        $instrText.textContent = t.calibTitle;
        $instrSub.textContent = "";
      }
    }

    // ── Frame capture into bins ─────────────────────────
    async function tryCapture(marks, pose, bright, blur, stab, now) {
      // Basic quality gate: must pass brightness, blur, pitch, stability
      if (!bright.ok || !blur.ok || Math.abs(pose.pitch) > CFG.pitchMax) return;
      // Stability tolerance: profiles get 2x tolerance
      const stabThreshold =
        Math.abs(pose.yaw) > CFG.semiProfileYawMin
          ? CFG.stabilityMaxPerSec * 2
          : CFG.stabilityMaxPerSec;
      if (stab > stabThreshold) return;

      // Determine which bin this yaw belongs to
      const yaw = pose.yaw;
      let targetBin = null;

      // If retaking a specific bin, only accept that bin
      if (S.retakeBinId) {
        const binDef = BINS.find((b) => b.id === S.retakeBinId);
        if (binDef && yaw >= binDef.yawMin && yaw <= binDef.yawMax) {
          targetBin = binDef;
        }
      } else {
        for (const b of BINS) {
          if (yaw >= b.yawMin && yaw <= b.yawMax) {
            targetBin = b;
            break;
          }
        }
      }

      if (!targetBin) return;

      // Compute score
      const score = computeScore(bright, blur, stab, yaw, targetBin.idealYaw);

      // Check if this improves the bin
      const bin = S.bins[targetBin.id];
      if (bin.length >= CFG.binTopN && score <= bin[bin.length - 1].score) return;

      // Capture frame
      S.lastCaptureTime = now;
      const blob = await captureFrame($video);
      if (!blob) return;

      const wasEmpty = bin.length === 0;

      // Insert sorted (highest score first)
      const entry = { blob, url: URL.createObjectURL(blob), score, yaw };
      bin.push(entry);
      bin.sort((a, b) => b.score - a.score);

      // Trim to top N, revoke old URLs
      while (bin.length > CFG.binTopN) {
        const removed = bin.pop();
        URL.revokeObjectURL(removed.url);
      }

      // Flash green if first candidate in this bin
      if (wasEmpty) {
        flashGreen();
        if (navigator.vibrate) navigator.vibrate(50);
      }
    }

    // ── Finish scan ─────────────────────────────────────
    function finishScan() {
      S.phase = "preview";
      stopCamera(S);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      showPreview();
    }

    // ── Preview ─────────────────────────────────────────
    function showPreview() {
      showScreen("preview");

      const $grid1 = container.querySelector("#fs-preview-grid");
      const $grid2 = container.querySelector("#fs-preview-grid2");
      $grid1.innerHTML = "";
      $grid2.innerHTML = "";

      // Row 1: face, semi_right, right (3 cols)
      const row1Bins = ["face", "semi_right", "right"];
      // Row 2: semi_left, left (2 cols)
      const row2Bins = ["semi_left", "left"];

      for (const binId of row1Bins) {
        $grid1.appendChild(createPreviewCard(binId));
      }
      for (const binId of row2Bins) {
        $grid2.appendChild(createPreviewCard(binId));
      }

      // Validate button
      container.querySelector("#fs-validate-btn").onclick = () => upload();
      container.querySelector("#fs-restart-btn").onclick = () => restart();
    }

    function createPreviewCard(binId) {
      const binDef = BINS.find((b) => b.id === binId);
      const candidates = S.bins[binId];
      const best = candidates[0] || null;
      const q = best
        ? qualityLabel(best.score, lang)
        : qualityLabel(0, lang);

      const card = document.createElement("div");
      card.style.cssText =
        "border-radius:10px;overflow:hidden;background:rgba(255,255,255,.05);text-align:center;";

      if (best) {
        card.innerHTML = `
          <img src="${best.url}" style="width:100%;aspect-ratio:3/4;object-fit:cover;display:block;" />
          <div style="padding:6px;">
            <span style="display:inline-block;padding:2px 8px;border-radius:8px;font-size:10px;font-weight:600;background:${q.color}22;color:${q.color};">${q.label}</span>
            <p style="font-size:10px;color:#94a3b8;margin:4px 0 0;">${t[binDef.labelKey]}</p>
          </div>
        `;
      } else {
        card.innerHTML = `
          <div style="width:100%;aspect-ratio:3/4;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.03);">
            <span style="font-size:24px;opacity:.3;">?</span>
          </div>
          <div style="padding:6px;">
            <span style="display:inline-block;padding:2px 8px;border-radius:8px;font-size:10px;font-weight:600;background:${q.color}22;color:${q.color};">${q.label}</span>
            <p style="font-size:10px;color:#94a3b8;margin:4px 0 0;">${t[binDef.labelKey]}</p>
            <button class="fs-retake-btn" data-bin="${binId}" style="margin-top:4px;padding:4px 10px;border:1px solid rgba(255,255,255,.2);border-radius:6px;background:transparent;color:#818cf8;font-size:10px;cursor:pointer;">${t.retakeAngle}</button>
          </div>
        `;
      }

      // Retake button for missing bins
      card.querySelectorAll(".fs-retake-btn").forEach((btn) => {
        btn.addEventListener("click", () => retakeBin(btn.dataset.bin));
      });

      return card;
    }

    // ── Retake specific bin ─────────────────────────────
    async function retakeBin(binId) {
      // Clear this bin
      S.bins[binId].forEach((e) => URL.revokeObjectURL(e.url));
      S.bins[binId] = [];
      S.retakeBinId = binId;

      // Restart camera for this bin only
      showScreen("scan");
      S.phase = "loading";
      try {
        S.videoStream = await requestCamera();
        $video.srcObject = S.videoStream;
        await new Promise((resolve) => {
          $video.addEventListener("loadedmetadata", resolve, { once: true });
        });
        S.faceMesh = initFaceMesh(onResults);
        S.camera = startCamera($video, S.faceMesh);
        S.phase = "scanning";
        S.scanStartTime = performance.now();
        S.frameCount = 0;
        S.prevLandmarks = null;
        S.prevTimestamp = null;
        S.cachedBrightness = null;
        S.cachedBlur = null;
        resizeOverlay();

        const binDef = BINS.find((b) => b.id === binId);
        $instrText.textContent = t.retakeAngle;
        $instrSub.textContent = t[binDef.labelKey];

        // Auto-stop after 8 seconds or when bin has a candidate
        const retakeCheck = setInterval(() => {
          if (S.bins[binId].length > 0) {
            clearInterval(retakeCheck);
            S.retakeBinId = null;
            finishScan();
          }
        }, 500);

        setTimeout(() => {
          clearInterval(retakeCheck);
          if (S.phase === "scanning") {
            S.retakeBinId = null;
            finishScan();
          }
        }, 8000);
      } catch (err) {
        console.error("Retake error:", err);
        S.retakeBinId = null;
        showPreview();
      }
    }

    // ── Upload ──────────────────────────────────────────
    async function upload() {
      const $btn = container.querySelector("#fs-validate-btn");
      $btn.textContent = t.uploadingPhotos;
      $btn.disabled = true;
      $btn.style.opacity = "0.6";

      try {
        // Map bin IDs to S3 upload types
        // Backend currently expects: face, left, right
        // We upload all 5 but map to formState only the 3 main ones
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

          const file = new File(
            [best.blob],
            `scan_${s3Type}_${Date.now()}.jpg`,
            { type: "image/jpeg" }
          );

          if (typeof window.uploadToS3Presigned === "function") {
            const { key, getUrl } = await window.uploadToS3Presigned({
              file,
              jobId: window.formState?.jobId || "",
              type: s3Type,
            });

            // Update formState for backend-compatible types
            if (formKey && window.formState) {
              window.formState.photos[formKey] = { key, getUrl };
            }
          }
        }

        // Mark validation
        if (window.validationState) {
          window.validationState.facePhotoUploaded = true;
        }

        // Sync manual upload previews if they exist
        syncManualPreviews();

        // Callback
        if (onScanComplete) {
          onScanComplete({
            bins: Object.fromEntries(
              BINS.map((b) => [b.id, S.bins[b.id].length > 0])
            ),
          });
        }

        // Switch to manual upload container (shows success)
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
      const typeMap = { face: "face", right: "left", left: "right" };
      for (const [binId, previewType] of Object.entries(typeMap)) {
        const best = S.bins[binId]?.[0];
        if (!best) continue;
        const previewEl = document.getElementById(`preview-${previewType}`);
        const emptyEl = document.getElementById(`empty-${previewType}`);
        if (previewEl) {
          previewEl.src = best.url;
          previewEl.classList.remove("hidden");
        }
        if (emptyEl) emptyEl.classList.add("hidden");
      }
    }

    // ── Restart ─────────────────────────────────────────
    function restart() {
      // Cleanup bins
      for (const b of BINS) {
        S.bins[b.id].forEach((e) => URL.revokeObjectURL(e.url));
        S.bins[b.id] = [];
      }
      stopCamera(S);
      S = mkState();
      // Re-init
      container.innerHTML = buildUI(t);
      createScanner.__lastInstance = createScanner(container, opts);
    }

    // ── Destroy ─────────────────────────────────────────
    function destroy() {
      stopCamera(S);
      for (const b of BINS) {
        S.bins[b.id].forEach((e) => URL.revokeObjectURL(e.url));
        S.bins[b.id] = [];
      }
      S.phase = "idle";
      _brightCanvas = null;
      _brightCtx = null;
      _blurCanvas = null;
      _blurCtx = null;
    }

    return { destroy, restart };
  }

  /* ═══════════════════════════════════════════════════════════
     PUBLIC API
     ═══════════════════════════════════════════════════════════ */
  window.AdermioFaceScan = {
    _instance: null,

    init(containerId, opts = {}) {
      const el = document.getElementById(containerId);
      if (!el) {
        console.error("AdermioFaceScan: container not found:", containerId);
        return;
      }
      if (this._instance) this._instance.destroy();
      this._instance = createScanner(el, opts);
    },

    destroy() {
      if (this._instance) {
        this._instance.destroy();
        this._instance = null;
      }
    },

    restart() {
      if (this._instance) this._instance.restart();
    },
  };
})();
