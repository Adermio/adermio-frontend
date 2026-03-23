/**
 * Adermio Face Scan v4 — Production-grade guided face capture
 *
 * Audit fixes applied:
 *  - Face-region brightness (landmarks bounding box, not full frame)
 *  - Backlight detection (face darker than surroundings)
 *  - Distance check works for ALL steps (face height, not pupil distance)
 *  - Signed yaw: profiles are direction-enforced (can't show same side twice)
 *  - Blur detection via Laplacian variance on face region
 *  - Cached canvas for brightness (no per-frame allocation)
 *  - Throttled expensive checks (brightness/blur every 5th frame)
 *  - Time-normalized stability (px/sec not px/frame)
 *  - Event listener cleanup
 *
 * Dependencies: @mediapipe/face_mesh, @mediapipe/camera_utils (CDN)
 */
(function () {
  "use strict";

  // ─── TRANSLATIONS ──────────────────────────────────────────
  const T = {
    fr: {
      cameraPermTitle: "Scan intelligent",
      cameraPermDesc: "Notre IA va guider la prise de vos 3 photos. Aucune vidéo n'est enregistrée — seules les captures finales sont utilisées.",
      cameraPermBtn: "Activer la caméra",
      cameraDenied: "Accès à la caméra refusé. Vous pouvez importer vos photos manuellement.",
      cameraNotSupported: "Votre navigateur ne supporte pas la caméra. Utilisez l'import manuel.",
      noCameraDevice: "Aucune caméra frontale détectée.",
      loading: "Initialisation du scan...",
      stepFace: "Face",
      stepLeft: "Gauche",
      stepRight: "Droite",
      instructionFace: "Regardez droit vers la caméra",
      instructionLeft: "Tournez la tête vers la droite",
      instructionRight: "Tournez la tête vers la gauche",
      moveCloser: "Rapprochez-vous de la caméra",
      moveBack: "Vous êtes trop près, reculez légèrement",
      centerFace: "Centrez votre visage",
      moreLightNeeded: "Trouvez un endroit mieux éclairé",
      tooMuchLight: "Lumière trop forte, décalez-vous",
      backlight: "Évitez le contre-jour, la lumière doit être devant vous",
      holdStill: "Restez immobile",
      blurry: "Image floue, stabilisez-vous",
      capturing: "Capture en cours...",
      captureSuccess: "Parfait !",
      noFaceDetected: "Aucun visage détecté",
      noFaceHint: "Vérifiez que votre visage est bien visible et éclairé",
      previewTitle: "Vérifiez vos photos",
      retake: "Reprendre",
      validatePhotos: "Valider et continuer",
      scanAnother: "Recommencer",
      nextStep: "Photo suivante dans",
      badgeDistance: "Distance",
      badgeLight: "Lumière",
      badgeAngle: "Angle",
      badgeStability: "Stabilité",
      tipFace: "Visage dégagé, sans lunettes",
      tipProfile: "Tournez franchement la tête",
    },
    en: {
      cameraPermTitle: "Smart scan",
      cameraPermDesc: "Our AI will guide you through 3 photo captures. No video is recorded — only the final captures are used.",
      cameraPermBtn: "Enable camera",
      cameraDenied: "Camera access denied. You can upload your photos manually.",
      cameraNotSupported: "Your browser does not support camera access. Use manual upload.",
      noCameraDevice: "No front camera detected.",
      loading: "Initializing scan...",
      stepFace: "Front",
      stepLeft: "Left",
      stepRight: "Right",
      instructionFace: "Look straight at the camera",
      instructionLeft: "Turn your head to the right",
      instructionRight: "Turn your head to the left",
      moveCloser: "Move closer to the camera",
      moveBack: "Too close, move back slightly",
      centerFace: "Center your face",
      moreLightNeeded: "Find a brighter spot",
      tooMuchLight: "Too much light, move aside",
      backlight: "Avoid backlight — light should be in front of you",
      holdStill: "Hold still",
      blurry: "Image is blurry, hold steady",
      capturing: "Capturing...",
      captureSuccess: "Perfect!",
      noFaceDetected: "No face detected",
      noFaceHint: "Make sure your face is visible and well-lit",
      previewTitle: "Review your photos",
      retake: "Retake",
      validatePhotos: "Validate and continue",
      scanAnother: "Start over",
      nextStep: "Next photo in",
      badgeDistance: "Distance",
      badgeLight: "Light",
      badgeAngle: "Angle",
      badgeStability: "Stability",
      tipFace: "Face clear, no glasses",
      tipProfile: "Turn your head fully",
    },
  };

  // ─── CONFIGURATION ────────────────────────────────────────
  const CFG = {
    // Face size: fraction of frame height (forehead→chin)
    faceSizeMin: 0.22,     // too far away
    faceSizeMax: 0.55,     // too close
    faceSizeIdeal: 0.35,   // sweet spot
    // Centering
    centerMaxOffset: 0.14,
    // Yaw (degrees, 3D normal)
    faceYawMax: 10,
    profileYawMin: 28,
    profileYawMax: 60,
    // Pitch
    pitchMax: 15,
    // Brightness (0-255, face region only)
    brightnessMin: 55,
    brightnessMax: 220,
    backlightRatio: 0.65,  // face/background ratio below this = backlight
    // Blur: Laplacian variance threshold
    blurThreshold: 15,
    // Stability: max movement in normalized units per second
    stabilityMaxPerSec: 0.15,
    // Timing
    holdDurationMs: 1800,
    captureCooldown: 2200,
    noFaceTimeout: 8000,
    jpegQuality: 0.92,
    // Throttle: run expensive checks every N frames
    expensiveCheckInterval: 5,
  };

  // MediaPipe landmark indices
  const LM = {
    noseTip: 1, noseBridge: 6,
    leftEyeOuter: 33, rightEyeOuter: 263,
    leftCheek: 234, rightCheek: 454,
    chin: 152, forehead: 10,
    // Face contour for bounding box (subset)
    contour: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109],
  };

  // ─── STATE ────────────────────────────────────────────────
  let lang = "fr";
  let S = mkState();

  function mkState() {
    return {
      phase: "idle", captureStep: 0,
      captures: [null, null, null], captureBlobs: [null, null, null],
      holdStartTime: null, lastLandmarks: null, prevLandmarks: null,
      prevTimestamp: null,
      noFaceTimer: null, isCapturing: false,
      faceMesh: null, camera: null, videoStream: null, animFrameId: null,
      frameCount: 0,
      // Cached results for expensive checks (updated every N frames)
      cachedBrightness: null,   // { face, bg, ok, backlight }
      cachedBlur: null,         // { score, ok }
      // Direction of yaw captured at step 1 (to enforce opposite at step 2)
      step1YawSign: 0,
      // Status badges
      status: { distance: null, light: null, angle: null, stability: null },
      // Event listener refs for cleanup
      metadataHandler: null,
    };
  }

  let containerEl, videoEl, overlayCanvasEl, overlayCtx;
  let onScanComplete = null, onFallbackToUpload = null;

  // Reusable canvases (created once, never GC'd during session)
  let _brightCanvas = null, _brightCtx = null;
  let _blurCanvas = null, _blurCtx = null;

  function getBrightCanvas() {
    if (!_brightCanvas) {
      _brightCanvas = document.createElement("canvas");
      _brightCanvas.width = 160; _brightCanvas.height = 120;
      _brightCtx = _brightCanvas.getContext("2d", { willReadFrequently: true });
    }
    return { canvas: _brightCanvas, ctx: _brightCtx };
  }

  function getBlurCanvas() {
    if (!_blurCanvas) {
      _blurCanvas = document.createElement("canvas");
      _blurCanvas.width = 200; _blurCanvas.height = 200;
      _blurCtx = _blurCanvas.getContext("2d", { willReadFrequently: true });
    }
    return { canvas: _blurCanvas, ctx: _blurCtx };
  }

  // ─── HELPERS ──────────────────────────────────────────────
  function t(k) { return T[lang]?.[k] || T.fr[k] || k; }
  function detectLang() { lang = (document.documentElement.lang || "fr").startsWith("en") ? "en" : "fr"; }
  function haptic() { try { navigator.vibrate?.(50); } catch (_) {} }

  // ─── LANDMARK UTILS ───────────────────────────────────────
  function pt(landmarks, idx) {
    const p = landmarks?.[idx];
    return p ? { x: p.x, y: p.y, z: p.z || 0 } : null;
  }

  function dist2D(a, b) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }

  /** Face bounding box from contour landmarks (normalized 0-1 coords) */
  function faceBounds(landmarks) {
    let minX = 1, maxX = 0, minY = 1, maxY = 0;
    for (const idx of LM.contour) {
      const p = pt(landmarks, idx);
      if (!p) continue;
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
  }

  // ─── 3D HEAD POSE ────────────────────────────────────────
  function headPose(landmarks) {
    const lc = pt(landmarks, LM.leftCheek), rc = pt(landmarks, LM.rightCheek);
    const fh = pt(landmarks, LM.forehead), ch = pt(landmarks, LM.chin);
    if (!lc || !rc || !fh || !ch) return { yaw: 0, pitch: 0 };

    const hx = lc.x - rc.x, hy = lc.y - rc.y, hz = lc.z - rc.z;
    const vx = fh.x - ch.x, vy = fh.y - ch.y, vz = fh.z - ch.z;
    const nx = hy * vz - hz * vy, ny = hz * vx - hx * vz, nz = hx * vy - hy * vx;
    const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);

    return {
      yaw: Math.atan2(nx, nz) * (180 / Math.PI),
      pitch: nLen > 0 ? Math.asin(Math.max(-1, Math.min(1, -ny / nLen))) * (180 / Math.PI) : 0,
    };
  }

  // ─── FACE SIZE (distance proxy) ───────────────────────────
  /** Uses forehead→chin distance as % of frame height. Works at any head angle. */
  function faceSize(landmarks) {
    const fh = pt(landmarks, LM.forehead), ch = pt(landmarks, LM.chin);
    if (!fh || !ch) return 0;
    return Math.abs(ch.y - fh.y);
  }

  // ─── TIME-NORMALIZED STABILITY ────────────────────────────
  /** Returns movement in normalized units per second (not per frame). */
  function stabilityPerSec(currMarks, prevMarks, dtMs) {
    if (!prevMarks || !currMarks || dtMs <= 0) return 999;
    const ids = [LM.noseTip, LM.leftEyeOuter, LM.rightEyeOuter, LM.chin, LM.forehead];
    let sum = 0, n = 0;
    for (const i of ids) {
      const a = pt(currMarks, i), b = pt(prevMarks, i);
      if (a && b) { sum += dist2D(a, b); n++; }
    }
    if (n === 0) return 999;
    const avgDeltaPerFrame = sum / n;
    // Convert to per-second: delta / (dt in seconds)
    return avgDeltaPerFrame / (dtMs / 1000);
  }

  // ─── FACE-REGION BRIGHTNESS + BACKLIGHT ───────────────────
  /**
   * Analyzes brightness of the face region specifically (using landmark bounding box).
   * Also computes background brightness to detect backlight.
   * Returns { face, background, ratio, ok, backlight }
   */
  function analyzeBrightness(video, landmarks) {
    const { ctx } = getBrightCanvas();
    const cw = 160, ch = 120;
    ctx.drawImage(video, 0, 0, cw, ch);
    const imgData = ctx.getImageData(0, 0, cw, ch);
    const pixels = imgData.data;

    // Face bounding box in pixel coords
    const bounds = faceBounds(landmarks);
    const fx1 = Math.floor(bounds.minX * cw);
    const fx2 = Math.ceil(bounds.maxX * cw);
    const fy1 = Math.floor(bounds.minY * ch);
    const fy2 = Math.ceil(bounds.maxY * ch);

    let faceLum = 0, faceN = 0;
    let bgLum = 0, bgN = 0;

    for (let y = 0; y < ch; y += 2) {
      for (let x = 0; x < cw; x += 2) {
        const i = (y * cw + x) * 4;
        const lum = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
        const inFace = x >= fx1 && x <= fx2 && y >= fy1 && y <= fy2;
        if (inFace) { faceLum += lum; faceN++; }
        else { bgLum += lum; bgN++; }
      }
    }

    const face = faceN > 0 ? faceLum / faceN : 128;
    const bg = bgN > 0 ? bgLum / bgN : 128;
    const ratio = bg > 0 ? face / bg : 1;

    return {
      face,
      background: bg,
      ratio,
      ok: face >= CFG.brightnessMin && face <= CFG.brightnessMax,
      tooLight: face > CFG.brightnessMax,
      tooDark: face < CFG.brightnessMin,
      backlight: ratio < CFG.backlightRatio && bg > 100,
    };
  }

  // ─── BLUR DETECTION (Laplacian variance) ──────────────────
  /**
   * Computes sharpness of the face region using Laplacian kernel variance.
   * Low variance = blurry. Returns { score, ok }.
   */
  function analyzeBlur(video, landmarks) {
    const { canvas, ctx } = getBlurCanvas();
    const sz = 200;

    // Crop face region from video
    const bounds = faceBounds(landmarks);
    const vw = video.videoWidth, vh = video.videoHeight;
    const sx = Math.floor(bounds.minX * vw);
    const sy = Math.floor(bounds.minY * vh);
    const sw = Math.ceil(bounds.width * vw) || 100;
    const sh = Math.ceil(bounds.height * vh) || 100;

    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sz, sz);
    const imgData = ctx.getImageData(0, 0, sz, sz);
    const pixels = imgData.data;

    // Convert to grayscale array
    const gray = new Float32Array(sz * sz);
    for (let i = 0; i < sz * sz; i++) {
      const j = i * 4;
      gray[i] = 0.299 * pixels[j] + 0.587 * pixels[j + 1] + 0.114 * pixels[j + 2];
    }

    // Apply Laplacian kernel [0,1,0; 1,-4,1; 0,1,0] and compute variance
    let sum = 0, sumSq = 0, n = 0;
    for (let y = 1; y < sz - 1; y++) {
      for (let x = 1; x < sz - 1; x++) {
        const lap = -4 * gray[y * sz + x]
          + gray[(y - 1) * sz + x]
          + gray[(y + 1) * sz + x]
          + gray[y * sz + (x - 1)]
          + gray[y * sz + (x + 1)];
        sum += lap;
        sumSq += lap * lap;
        n++;
      }
    }

    const mean = sum / n;
    const variance = (sumSq / n) - (mean * mean);

    return {
      score: variance,
      ok: variance >= CFG.blurThreshold,
    };
  }

  // ─── CAPTURE ──────────────────────────────────────────────
  function captureFrame(video) {
    const c = document.createElement("canvas");
    c.width = video.videoWidth; c.height = video.videoHeight;
    c.getContext("2d").drawImage(video, 0, 0);
    return new Promise(r => c.toBlob(r, "image/jpeg", CFG.jpegQuality));
  }

  // ─── OVERLAY DRAWING ─────────────────────────────────────
  function drawOverlay(color, progress, step) {
    if (!overlayCtx || !overlayCanvasEl) return;
    const w = overlayCanvasEl.width, h = overlayCanvasEl.height;
    overlayCtx.clearRect(0, 0, w, h);

    overlayCtx.fillStyle = "rgba(0,0,0,0.55)";
    overlayCtx.fillRect(0, 0, w, h);

    const cx = w / 2, cy = h * 0.40, rx = w * 0.34, ry = h * 0.30;

    // Cut oval
    overlayCtx.save();
    overlayCtx.globalCompositeOperation = "destination-out";
    overlayCtx.beginPath();
    overlayCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    overlayCtx.fill();
    overlayCtx.restore();

    // Base border
    const borderColors = { white: "rgba(255,255,255,0.3)", yellow: "rgba(250,204,21,0.5)", green: "rgba(20,184,166,0.25)" };
    overlayCtx.strokeStyle = borderColors[color] || borderColors.white;
    overlayCtx.lineWidth = 2;
    overlayCtx.beginPath();
    overlayCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    overlayCtx.stroke();

    if (color === "yellow") {
      overlayCtx.strokeStyle = "rgba(250,204,21,0.7)";
      overlayCtx.lineWidth = 3;
      overlayCtx.beginPath();
      overlayCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      overlayCtx.stroke();
    }

    // Green progress arc
    if (color === "green" && progress > 0) {
      const start = -Math.PI / 2, end = start + Math.PI * 2 * progress;
      overlayCtx.strokeStyle = "rgba(20,184,166,0.2)";
      overlayCtx.lineWidth = 16;
      overlayCtx.beginPath();
      overlayCtx.ellipse(cx, cy, rx + 2, ry + 2, 0, start, end);
      overlayCtx.stroke();

      overlayCtx.strokeStyle = "rgba(20,184,166,1)";
      overlayCtx.lineWidth = 4;
      overlayCtx.lineCap = "round";
      overlayCtx.beginPath();
      overlayCtx.ellipse(cx, cy, rx, ry, 0, start, end);
      overlayCtx.stroke();
      overlayCtx.lineCap = "butt";
    }

    // Profile rotation arrows
    if (color !== "green" && (step === 1 || step === 2)) {
      overlayCtx.save();
      overlayCtx.strokeStyle = "rgba(255,255,255,0.35)";
      overlayCtx.lineWidth = 2;
      const angle = step === 1 ? -0.4 : Math.PI + 0.4;
      const endA = step === 1 ? 0.4 : Math.PI - 0.4;
      overlayCtx.beginPath();
      overlayCtx.arc(cx, cy, rx + 22, angle, endA, step === 2);
      overlayCtx.stroke();
      // Arrow head
      const tipAngle = endA;
      const tipX = cx + (rx + 22) * Math.cos(tipAngle);
      const tipY = cy + (rx + 22) * Math.sin(tipAngle);
      const aSize = 8;
      const aAngle = tipAngle + (step === 1 ? Math.PI / 2 : -Math.PI / 2);
      overlayCtx.beginPath();
      overlayCtx.moveTo(tipX + aSize * Math.cos(aAngle - 0.5), tipY + aSize * Math.sin(aAngle - 0.5));
      overlayCtx.lineTo(tipX, tipY);
      overlayCtx.lineTo(tipX + aSize * Math.cos(aAngle + 0.5), tipY + aSize * Math.sin(aAngle + 0.5));
      overlayCtx.stroke();
      overlayCtx.restore();
    }

    // Status badges
    drawBadges(w, h);
  }

  function drawBadges(w, h) {
    const items = [
      { key: "distance", icon: "↔", label: t("badgeDistance") },
      { key: "light", icon: "☀", label: t("badgeLight") },
      { key: "angle", icon: "◐", label: t("badgeAngle") },
      { key: "stability", icon: "⊙", label: t("badgeStability") },
    ];
    const bw = 58, bh = 26, gap = 6;
    const totalW = items.length * bw + (items.length - 1) * gap;
    let x = (w - totalW) / 2;
    const y = h - 50;

    for (const b of items) {
      const v = S.status[b.key];
      const bg = v === true ? "rgba(20,184,166,0.7)" : v === false ? "rgba(239,68,68,0.6)" : "rgba(255,255,255,0.15)";
      overlayCtx.fillStyle = bg;
      overlayCtx.beginPath();
      const r = 6;
      if (overlayCtx.roundRect) overlayCtx.roundRect(x, y, bw, bh, r);
      else { overlayCtx.moveTo(x + r, y); overlayCtx.arcTo(x + bw, y, x + bw, y + bh, r); overlayCtx.arcTo(x + bw, y + bh, x, y + bh, r); overlayCtx.arcTo(x, y + bh, x, y, r); overlayCtx.arcTo(x, y, x + bw, y, r); overlayCtx.closePath(); }
      overlayCtx.fill();

      overlayCtx.fillStyle = v === null ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.95)";
      overlayCtx.font = "bold 10px system-ui,sans-serif";
      overlayCtx.textAlign = "center";
      overlayCtx.fillText(b.icon, x + 12, y + 17);
      overlayCtx.font = "9px system-ui,sans-serif";
      overlayCtx.fillText(b.label, x + 38, y + 17);
      x += bw + gap;
    }
  }

  // ─── UI ───────────────────────────────────────────────────
  function buildUI() {
    return `
      <div id="facescan-root" class="relative w-full max-w-md mx-auto" style="touch-action:manipulation;">
        <div id="fs-permission" class="hidden text-center py-8 px-4 space-y-5">
          <div class="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 flex items-center justify-center">
            <svg class="w-10 h-10 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/>
            </svg>
          </div>
          <h3 class="font-serif text-2xl text-brand-dark" id="fs-perm-title"></h3>
          <p class="text-sm text-stone-500 leading-relaxed max-w-xs mx-auto" id="fs-perm-desc"></p>
          <div class="flex items-center justify-center gap-4 text-[10px] text-stone-400 uppercase tracking-wider pt-1">
            <span class="flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg> 100% privé</span>
          </div>
          <button type="button" id="fs-perm-btn" class="w-full py-4 rounded-2xl bg-brand-primary text-white font-bold text-sm tracking-wide hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20"></button>
        </div>

        <div id="fs-loading" class="hidden text-center py-16 space-y-4">
          <div class="w-12 h-12 mx-auto border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          <p class="text-sm text-stone-500" id="fs-loading-text"></p>
        </div>

        <div id="fs-scan" class="hidden">
          <div class="flex items-center justify-center gap-3 mb-4" id="fs-progress"></div>
          <div class="relative w-full rounded-[2rem] overflow-hidden bg-black shadow-2xl" style="aspect-ratio:3/4;">
            <video id="fs-video" autoplay playsinline muted class="absolute inset-0 w-full h-full object-cover" style="transform:scaleX(-1);"></video>
            <canvas id="fs-overlay" class="absolute inset-0 w-full h-full pointer-events-none" style="transform:scaleX(-1);"></canvas>
            <div class="absolute top-0 left-0 right-0 p-3 pointer-events-none">
              <div id="fs-tip" class="text-center"><span class="inline-block px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[10px] text-white/70 uppercase tracking-wider font-medium"></span></div>
            </div>
            <div class="absolute bottom-0 left-0 right-0 p-4 text-center pointer-events-none">
              <div id="fs-instruction" class="inline-block px-5 py-2.5 rounded-2xl bg-black/60 backdrop-blur-md text-white text-sm font-medium transition-all duration-300 shadow-lg"></div>
            </div>
            <div id="fs-flash" class="absolute inset-0 bg-white pointer-events-none opacity-0 transition-opacity duration-200" style="z-index:20;"></div>
            <div id="fs-success-overlay" class="absolute inset-0 bg-brand-primary/20 backdrop-blur-[2px] pointer-events-none opacity-0 transition-opacity duration-500 flex items-center justify-center" style="z-index:15;">
              <div class="text-center">
                <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-brand-primary flex items-center justify-center shadow-lg">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
                </div>
                <p id="fs-success-text" class="text-white font-serif text-xl font-semibold drop-shadow-lg"></p>
                <p id="fs-success-next" class="text-white/70 text-xs mt-1 font-medium"></p>
              </div>
            </div>
          </div>
          <div id="fs-noface-hint" class="hidden mt-3 text-center">
            <p class="text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2 inline-block"></p>
          </div>
        </div>

        <div id="fs-preview" class="hidden space-y-5">
          <h3 class="font-serif text-xl text-brand-dark text-center" id="fs-preview-title"></h3>
          <div class="grid grid-cols-3 gap-3">${[0,1,2].map(i => `
            <div class="space-y-2 text-center">
              <div class="relative aspect-[3/4] rounded-2xl overflow-hidden bg-stone-900 shadow-lg ring-1 ring-white/10">
                <img id="fs-prev-${i}" class="w-full h-full object-cover" style="transform:scaleX(-1);">
                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                  <span class="text-[9px] font-bold uppercase tracking-wider text-white/80" id="fs-prev-label-${i}"></span>
                </div>
              </div>
              <button type="button" class="text-[10px] text-brand-primary font-bold uppercase tracking-wider hover:underline" data-retake="${i}" id="fs-retake-${i}"></button>
            </div>`).join("")}</div>
          <button type="button" id="fs-validate-btn" class="w-full py-4 rounded-2xl bg-brand-primary text-white font-bold text-sm tracking-wide hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20"></button>
          <button type="button" id="fs-restart-btn" class="w-full py-2.5 rounded-2xl border border-stone-200 text-stone-400 text-[11px] font-bold tracking-wide hover:border-brand-primary hover:text-brand-primary transition-all"></button>
        </div>

        <div id="fs-error" class="hidden text-center py-8 px-4 space-y-4">
          <div class="w-14 h-14 mx-auto rounded-full bg-amber-50 flex items-center justify-center">
            <svg class="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
            </svg>
          </div>
          <p class="text-sm text-stone-600 leading-relaxed" id="fs-error-text"></p>
        </div>
      </div>`;
  }

  // ─── PROGRESS BAR ─────────────────────────────────────────
  function updateProgress() {
    const el = document.getElementById("fs-progress");
    if (!el) return;
    const labels = [t("stepFace"), t("stepLeft"), t("stepRight")];
    let html = "";
    for (let i = 0; i < 3; i++) {
      const done = !!S.captures[i], active = i === S.captureStep && !done;
      const cls = done ? "w-7 h-7 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-md shadow-brand-primary/30"
        : active ? "w-7 h-7 rounded-full border-2 border-brand-primary text-brand-primary flex items-center justify-center"
        : "w-7 h-7 rounded-full border-2 border-stone-300 text-stone-400 flex items-center justify-center";
      const inner = done ? '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>'
        : `<span class="text-[10px] font-bold">${i + 1}</span>`;
      if (i > 0) html += `<div class="w-8 h-px ${S.captures[i-1] ? "bg-brand-primary" : "bg-stone-300"}"></div>`;
      html += `<div class="flex flex-col items-center gap-1"><div class="${cls}">${inner}</div><span class="text-[10px] ${done||active?"font-bold text-brand-dark":"font-medium text-stone-400"}">${labels[i]}</span></div>`;
    }
    el.innerHTML = html;
  }

  function updateInstruction(text) {
    const el = document.getElementById("fs-instruction");
    if (el && el.textContent !== text) el.textContent = text;
  }

  function updateTip(text) {
    const el = document.getElementById("fs-tip");
    if (el) el.querySelector("span").textContent = text;
  }

  function showScreen(id) {
    ["fs-permission","fs-loading","fs-scan","fs-preview","fs-error"].forEach(s => {
      const el = document.getElementById(s);
      if (el) el.classList.toggle("hidden", s !== id);
    });
  }

  // ─── CAMERA & MEDIAPIPE ───────────────────────────────────
  async function requestCamera() {
    if (!navigator.mediaDevices?.getUserMedia) { showError(t("cameraNotSupported")); return false; }
    try {
      S.videoStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false,
      });
      return true;
    } catch (err) {
      showError(err.name === "NotFoundError" ? t("noCameraDevice") : t("cameraDenied"));
      return false;
    }
  }

  async function initFaceMesh() {
    if (!window.FaceMesh) { showError(t("cameraNotSupported")); return false; }
    const fm = new window.FaceMesh({ locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}` });
    fm.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
    fm.onResults(onResults);
    S.faceMesh = fm;
    return true;
  }

  function startCamera() {
    if (!videoEl || !S.videoStream) return;
    videoEl.srcObject = S.videoStream;
    videoEl.play().catch(() => {});

    // Metadata handler with cleanup ref
    S.metadataHandler = () => {
      if (overlayCanvasEl) { overlayCanvasEl.width = videoEl.videoWidth; overlayCanvasEl.height = videoEl.videoHeight; }
    };
    videoEl.addEventListener("loadedmetadata", S.metadataHandler, { once: true });

    if (window.Camera && S.faceMesh) {
      const cam = new window.Camera(videoEl, {
        onFrame: async () => { if (S.phase === "scanning" && S.faceMesh) await S.faceMesh.send({ image: videoEl }); },
        width: 1280, height: 960,
      });
      cam.start();
      S.camera = cam;
    } else {
      (function loop() {
        if (S.phase !== "scanning") return;
        if (S.faceMesh && videoEl.readyState >= 2) S.faceMesh.send({ image: videoEl }).then(() => { S.animFrameId = requestAnimationFrame(loop); });
        else S.animFrameId = requestAnimationFrame(loop);
      })();
    }
    resetNoFaceTimer();
  }

  function stopCamera() {
    if (S.camera) { try { S.camera.stop(); } catch (_) {} S.camera = null; }
    if (S.animFrameId) { cancelAnimationFrame(S.animFrameId); S.animFrameId = null; }
    if (S.videoStream) { S.videoStream.getTracks().forEach(t => t.stop()); S.videoStream = null; }
    if (videoEl) {
      if (S.metadataHandler) videoEl.removeEventListener("loadedmetadata", S.metadataHandler);
      videoEl.srcObject = null;
    }
    clearNoFaceTimer();
  }

  function resetNoFaceTimer() {
    clearNoFaceTimer();
    const hint = document.getElementById("fs-noface-hint");
    if (hint) hint.classList.add("hidden");
    S.noFaceTimer = setTimeout(() => {
      const h = document.getElementById("fs-noface-hint");
      if (h) { h.classList.remove("hidden"); h.querySelector("p").textContent = t("noFaceHint"); }
    }, CFG.noFaceTimeout);
  }

  function clearNoFaceTimer() { if (S.noFaceTimer) { clearTimeout(S.noFaceTimer); S.noFaceTimer = null; } }

  // ─── FACE MESH CALLBACK ──────────────────────────────────
  function onResults(results) {
    if (S.phase !== "scanning" || S.isCapturing) return;
    const now = performance.now();
    const marks = results.multiFaceLandmarks?.[0];
    S.frameCount++;

    if (!marks || marks.length < 468) {
      S.holdStartTime = null;
      S.status = { distance: null, light: null, angle: null, stability: null };
      drawOverlay("white", 0, S.captureStep);
      updateInstruction(t("noFaceDetected"));
      S.prevTimestamp = now;
      return;
    }

    resetNoFaceTimer();
    S.prevLandmarks = S.lastLandmarks;
    S.lastLandmarks = marks;
    const dtMs = S.prevTimestamp ? now - S.prevTimestamp : 33;
    S.prevTimestamp = now;

    const check = evaluate(marks, dtMs);

    if (check.allGood) {
      if (!S.holdStartTime) S.holdStartTime = Date.now();
      const held = Date.now() - S.holdStartTime;
      const progress = Math.min(held / CFG.holdDurationMs, 1);

      if (held >= CFG.holdDurationMs) {
        S.holdStartTime = null;
        performCapture();
        return;
      }
      const rem = ((CFG.holdDurationMs - held) / 1000).toFixed(1);
      updateInstruction(`${t("holdStill")} (${rem}s)`);
      drawOverlay("green", progress, S.captureStep);
    } else {
      S.holdStartTime = null;
      drawOverlay(check.faceDetected ? "yellow" : "white", 0, S.captureStep);
      updateInstruction(check.instruction);
    }
  }

  // ─── CONDITION EVALUATION ─────────────────────────────────
  function evaluate(marks, dtMs) {
    const step = S.captureStep;
    const isProfile = step > 0;
    let instruction = "";
    let allGood = true;

    S.status = { distance: true, light: true, angle: true, stability: true };

    // ── 1. DISTANCE (face size, works at any angle) ──
    const size = faceSize(marks);
    if (size < CFG.faceSizeMin) {
      instruction = t("moveCloser");
      S.status.distance = false;
      allGood = false;
    } else if (size > CFG.faceSizeMax) {
      instruction = t("moveBack");
      S.status.distance = false;
      allGood = false;
    }

    // ── 2. CENTERING (face only) ──
    if (allGood && step === 0) {
      const nose = pt(marks, LM.noseTip);
      if (nose && (Math.abs(nose.x - 0.5) > CFG.centerMaxOffset || Math.abs(nose.y - 0.40) > CFG.centerMaxOffset)) {
        instruction = t("centerFace");
        S.status.distance = false;
        allGood = false;
      }
    }

    // ── 3. HEAD POSE (3D, signed yaw for profiles) ──
    const pose = headPose(marks);
    const absYaw = Math.abs(pose.yaw);

    if (allGood) {
      if (step === 0) {
        if (absYaw > CFG.faceYawMax) { instruction = t("instructionFace"); S.status.angle = false; allGood = false; }
        if (allGood && Math.abs(pose.pitch) > CFG.pitchMax) { instruction = t("instructionFace"); S.status.angle = false; allGood = false; }
      } else if (step === 1) {
        // First profile: accept either direction, but store which side was shown
        if (absYaw < CFG.profileYawMin) { instruction = t("instructionLeft"); S.status.angle = false; allGood = false; }
        else if (absYaw > CFG.profileYawMax) { instruction = t("instructionLeft"); S.status.angle = false; allGood = false; }
        if (allGood && Math.abs(pose.pitch) > CFG.pitchMax * 2) { S.status.angle = false; allGood = false; }
      } else if (step === 2) {
        // Second profile: MUST be opposite direction from step 1
        if (absYaw < CFG.profileYawMin) { instruction = t("instructionRight"); S.status.angle = false; allGood = false; }
        else if (absYaw > CFG.profileYawMax) { instruction = t("instructionRight"); S.status.angle = false; allGood = false; }
        // Enforce opposite side
        if (allGood && S.step1YawSign !== 0) {
          const sameSign = (pose.yaw > 0 && S.step1YawSign > 0) || (pose.yaw < 0 && S.step1YawSign < 0);
          if (sameSign) {
            // User is showing the same side as step 1
            instruction = S.step1YawSign > 0 ? t("instructionRight") : t("instructionLeft");
            S.status.angle = false;
            allGood = false;
          }
        }
        if (allGood && Math.abs(pose.pitch) > CFG.pitchMax * 2) { S.status.angle = false; allGood = false; }
      }
    }

    // ── 4. BRIGHTNESS (face region, throttled) ──
    if (allGood && videoEl) {
      if (S.frameCount % CFG.expensiveCheckInterval === 0) {
        S.cachedBrightness = analyzeBrightness(videoEl, marks);
      }
      if (S.cachedBrightness) {
        if (S.cachedBrightness.backlight) {
          instruction = t("backlight"); S.status.light = false; allGood = false;
        } else if (S.cachedBrightness.tooDark) {
          instruction = t("moreLightNeeded"); S.status.light = false; allGood = false;
        } else if (S.cachedBrightness.tooLight) {
          instruction = t("tooMuchLight"); S.status.light = false; allGood = false;
        }
      }
    }

    // ── 5. BLUR (throttled, only when other conditions met) ──
    if (allGood && videoEl && S.frameCount % CFG.expensiveCheckInterval === 0) {
      S.cachedBlur = analyzeBlur(videoEl, marks);
    }
    if (allGood && S.cachedBlur && !S.cachedBlur.ok) {
      instruction = t("blurry");
      S.status.stability = false;
      allGood = false;
    }

    // ── 6. STABILITY (time-normalized) ──
    if (allGood) {
      const stab = stabilityPerSec(marks, S.prevLandmarks, dtMs);
      const maxS = isProfile ? CFG.stabilityMaxPerSec * 1.5 : CFG.stabilityMaxPerSec;
      if (stab > maxS) { instruction = t("holdStill"); S.status.stability = false; allGood = false; }
    }

    if (!allGood && !instruction) {
      instruction = [t("instructionFace"), t("instructionLeft"), t("instructionRight")][step];
    }

    // Debug
    if (Math.random() < 0.02) {
      const br = S.cachedBrightness;
      const bl = S.cachedBlur;
      console.log(`[Scan] step=${step} yaw=${pose.yaw.toFixed(1)}° size=${size.toFixed(3)} face_lum=${br?.face?.toFixed(0)||'?'} blur=${bl?.score?.toFixed(1)||'?'} ok=${allGood}`);
    }

    return { allGood, instruction, faceDetected: true };
  }

  // ─── CAPTURE ──────────────────────────────────────────────
  async function performCapture() {
    if (S.isCapturing) return;
    S.isCapturing = true;
    haptic();
    updateInstruction(t("capturing"));

    const flash = document.getElementById("fs-flash");
    if (flash) { flash.style.opacity = "0.8"; setTimeout(() => flash.style.opacity = "0", 250); }

    try {
      const blob = await captureFrame(videoEl);
      const step = S.captureStep;
      S.captureBlobs[step] = blob;
      S.captures[step] = URL.createObjectURL(blob);

      // Store yaw sign for step 1 to enforce opposite in step 2
      if (step === 1) {
        const pose = headPose(S.lastLandmarks);
        S.step1YawSign = pose.yaw > 0 ? 1 : -1;
      }

      updateProgress();

      const overlay = document.getElementById("fs-success-overlay");
      const successText = document.getElementById("fs-success-text");
      const nextText = document.getElementById("fs-success-next");

      if (overlay && successText) {
        successText.textContent = t("captureSuccess");
        overlay.style.opacity = "1";
        if (step < 2 && nextText) {
          let cd = Math.ceil(CFG.captureCooldown / 1000);
          nextText.textContent = `${t("nextStep")} ${cd}s...`;
          const iv = setInterval(() => { cd--; if (cd > 0) nextText.textContent = `${t("nextStep")} ${cd}s...`; else { clearInterval(iv); nextText.textContent = ""; } }, 1000);
        } else if (nextText) nextText.textContent = "";
      }

      await new Promise(r => setTimeout(r, CFG.captureCooldown));
      if (overlay) overlay.style.opacity = "0";

      if (step < 2) {
        S.captureStep = step + 1;
        S.holdStartTime = null;
        S.isCapturing = false;
        S.prevLandmarks = null;
        S.lastLandmarks = null;
        S.prevTimestamp = null;
        S.cachedBrightness = null;
        S.cachedBlur = null;
        updateProgress();
        updateInstruction([t("instructionFace"), t("instructionLeft"), t("instructionRight")][S.captureStep]);
        updateTip(t("tipProfile"));
      } else {
        S.isCapturing = false;
        showPreview();
      }
    } catch (err) {
      console.error("Capture failed:", err);
      S.isCapturing = false;
      S.holdStartTime = null;
    }
  }

  // ─── PREVIEW ──────────────────────────────────────────────
  function showPreview() {
    stopCamera();
    S.phase = "preview";
    showScreen("fs-preview");
    const labels = [t("stepFace"), t("stepLeft"), t("stepRight")];
    for (let i = 0; i < 3; i++) {
      const img = document.getElementById(`fs-prev-${i}`);
      const lbl = document.getElementById(`fs-prev-label-${i}`);
      const btn = document.getElementById(`fs-retake-${i}`);
      if (img) img.src = S.captures[i] || "";
      if (lbl) lbl.textContent = labels[i];
      if (btn) btn.textContent = t("retake");
    }
    document.getElementById("fs-preview-title").textContent = t("previewTitle");
    document.getElementById("fs-validate-btn").textContent = t("validatePhotos");
    document.getElementById("fs-restart-btn").textContent = t("scanAnother");
    document.querySelectorAll("[data-retake]").forEach(b => { b.onclick = () => retake(parseInt(b.dataset.retake, 10)); });
    document.getElementById("fs-validate-btn").onclick = upload;
    document.getElementById("fs-restart-btn").onclick = restart;
  }

  async function retake(idx) {
    if (S.captures[idx]) URL.revokeObjectURL(S.captures[idx]);
    S.captures[idx] = null; S.captureBlobs[idx] = null;
    S.captureStep = idx; S.holdStartTime = null;
    S.cachedBrightness = null; S.cachedBlur = null; S.prevTimestamp = null;
    S.phase = "scanning";
    showScreen("fs-scan");
    updateProgress();
    if (await requestCamera()) startCamera();
  }

  function restart() {
    for (let i = 0; i < 3; i++) { if (S.captures[i]) URL.revokeObjectURL(S.captures[i]); S.captures[i] = null; S.captureBlobs[i] = null; }
    S.captureStep = 0; S.holdStartTime = null; S.step1YawSign = 0;
    S.cachedBrightness = null; S.cachedBlur = null; S.prevTimestamp = null;
    startFlow();
  }

  // ─── UPLOAD ───────────────────────────────────────────────
  async function upload() {
    const btn = document.getElementById("fs-validate-btn");
    if (btn) { btn.disabled = true; btn.textContent = "..."; }
    try {
      const types = ["face", "left", "right"];
      for (let i = 0; i < 3; i++) {
        const blob = S.captureBlobs[i];
        if (!blob) continue;
        const file = new File([blob], `scan_${types[i]}_${Date.now()}.jpg`, { type: "image/jpeg" });
        if (typeof window.uploadToS3Presigned === "function") {
          const { key, getUrl } = await window.uploadToS3Presigned({ file, jobId: window.formState?.jobId || "", type: types[i] });
          if (window.formState) window.formState.photos[types[i]] = { key, getUrl };
        }
      }
      if (window.validationState) window.validationState.facePhotoUploaded = true;
      syncManualPreviews();
      if (onScanComplete) onScanComplete({ face: S.captureBlobs[0], left: S.captureBlobs[1], right: S.captureBlobs[2] });
      if (btn) { btn.textContent = "✓"; btn.className = btn.className.replace("bg-brand-primary", "bg-green-500"); }
      setTimeout(() => {
        const sc = document.getElementById("facescan-container"), uc = document.getElementById("manual-upload-container");
        if (sc) sc.classList.add("hidden"); if (uc) uc.classList.remove("hidden");
        const sb = document.getElementById("switch-to-scan-btn"); if (sb) sb.classList.remove("hidden");
      }, 800);
    } catch (err) {
      console.error("Upload failed:", err);
      if (btn) { btn.disabled = false; btn.textContent = t("validatePhotos"); }
      alert(lang === "fr" ? "Erreur lors de l'envoi. Vérifiez votre connexion." : "Upload error. Check your connection.");
    }
  }

  function syncManualPreviews() {
    [["preview-face","empty-face",0],["preview-left","empty-left",1],["preview-right","empty-right",2]].forEach(([p,e,i]) => {
      if (!S.captures[i]) return;
      const img = document.getElementById(p), empty = document.getElementById(e);
      if (img) { img.src = S.captures[i]; img.classList.remove("hidden"); }
      if (empty) empty.classList.add("hidden");
    });
  }

  // ─── ERROR ────────────────────────────────────────────────
  function showError(msg) {
    showScreen("fs-error");
    const el = document.getElementById("fs-error-text"); if (el) el.textContent = msg;
    setTimeout(() => {
      const sc = document.getElementById("facescan-container"), uc = document.getElementById("manual-upload-container");
      if (sc) sc.classList.add("hidden"); if (uc) uc.classList.remove("hidden");
      const sb = document.getElementById("switch-to-scan-btn"); if (sb) sb.classList.remove("hidden");
    }, 2000);
    if (onFallbackToUpload) onFallbackToUpload();
  }

  // ─── MAIN FLOW ────────────────────────────────────────────
  async function startFlow() {
    S.phase = "permission";
    showScreen("fs-permission");
    document.getElementById("fs-perm-title").textContent = t("cameraPermTitle");
    document.getElementById("fs-perm-desc").textContent = t("cameraPermDesc");
    document.getElementById("fs-perm-btn").textContent = t("cameraPermBtn");

    document.getElementById("fs-perm-btn").onclick = async () => {
      S.phase = "loading";
      showScreen("fs-loading");
      document.getElementById("fs-loading-text").textContent = t("loading");
      if (!await requestCamera()) return;
      if (!await initFaceMesh()) { stopCamera(); return; }
      S.phase = "scanning";
      S.captureStep = 0;
      S.holdStartTime = null;
      S.frameCount = 0;
      showScreen("fs-scan");
      updateProgress();
      updateInstruction(t("instructionFace"));
      updateTip(t("tipFace"));
      videoEl = document.getElementById("fs-video");
      overlayCanvasEl = document.getElementById("fs-overlay");
      if (overlayCanvasEl) overlayCtx = overlayCanvasEl.getContext("2d");
      startCamera();
    };
  }

  // ─── PUBLIC API ───────────────────────────────────────────
  window.AdermioFaceScan = {
    init(containerId, opts) {
      detectLang();
      containerEl = document.getElementById(containerId);
      if (!containerEl) return;
      onScanComplete = opts?.onComplete || null;
      onFallbackToUpload = opts?.onFallback || null;
      containerEl.innerHTML = buildUI();
      if (!navigator.mediaDevices?.getUserMedia) { showError(t("cameraNotSupported")); return; }
      startFlow();
    },
    destroy() {
      stopCamera();
      if (S.faceMesh) { try { S.faceMesh.close(); } catch (_) {} }
      for (let i = 0; i < 3; i++) if (S.captures[i]) URL.revokeObjectURL(S.captures[i]);
      S = mkState();
    },
    restart,
  };
})();
