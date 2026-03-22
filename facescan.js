/**
 * Adermio Face Scan v3 — Premium guided face capture
 * Uses MediaPipe Face Mesh 3D landmarks for precise head pose estimation.
 * Time-based hold with visual countdown + real-time status indicators.
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
      holdStill: "Restez immobile",
      capturing: "Capture en cours...",
      captureSuccess: "Parfait !",
      noFaceDetected: "Aucun visage détecté",
      noFaceHint: "Vérifiez que votre visage est bien visible et éclairé",
      previewTitle: "Vérifiez vos photos",
      retake: "Reprendre",
      validatePhotos: "Valider et continuer",
      scanAnother: "Recommencer",
      stepComplete: "Excellent !",
      nextStep: "Photo suivante dans",
      badgeDistance: "Distance",
      badgeLight: "Lumière",
      badgeAngle: "Angle",
      badgeStability: "Stabilité",
      statusOk: "OK",
      statusBad: "Ajuster",
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
      holdStill: "Hold still",
      capturing: "Capturing...",
      captureSuccess: "Perfect!",
      noFaceDetected: "No face detected",
      noFaceHint: "Make sure your face is visible and well-lit",
      previewTitle: "Review your photos",
      retake: "Retake",
      validatePhotos: "Validate and continue",
      scanAnother: "Start over",
      stepComplete: "Great!",
      nextStep: "Next photo in",
      badgeDistance: "Distance",
      badgeLight: "Light",
      badgeAngle: "Angle",
      badgeStability: "Stability",
      statusOk: "OK",
      statusBad: "Adjust",
      tipFace: "Face clear, no glasses",
      tipProfile: "Turn your head fully",
    },
  };

  // ─── CONSTANTS ─────────────────────────────────────────────
  const CFG = {
    pupilDistMin: 0.08,
    pupilDistMax: 0.35,
    centerMaxOffset: 0.15,
    faceYawMax: 10,
    profileYawMin: 28,
    profileYawMax: 60,
    pitchMax: 15,
    brightnessMin: 50,
    brightnessMax: 225,
    stabilityMaxDelta: 0.008,
    holdDurationMs: 1800,
    captureCooldown: 2200,
    noFaceTimeout: 8000,
    jpegQuality: 0.92,
  };

  const LM = {
    noseTip: 1, noseBridge: 6, leftEyeOuter: 33, rightEyeOuter: 263,
    leftCheek: 234, rightCheek: 454, chin: 152, forehead: 10,
  };

  // ─── STATE ─────────────────────────────────────────────────
  let lang = "fr";
  let S = resetState();

  function resetState() {
    return {
      phase: "idle", captureStep: 0,
      captures: [null, null, null], captureBlobs: [null, null, null],
      holdStartTime: null, lastLandmarks: null, prevLandmarks: null,
      noFaceTimer: null, isCapturing: false,
      faceMesh: null, camera: null, videoStream: null, animFrameId: null,
      // Real-time status for UI badges
      status: { distance: null, light: null, angle: null, stability: null },
    };
  }

  let containerEl, videoEl, overlayCanvasEl, overlayCtx;
  let onScanComplete = null, onFallbackToUpload = null;

  // ─── HELPERS ───────────────────────────────────────────────
  function t(k) { return T[lang]?.[k] || T.fr[k] || k; }
  function detectLang() { lang = (document.documentElement.lang || "fr").startsWith("en") ? "en" : "fr"; }

  // ─── 3D HEAD POSE ─────────────────────────────────────────
  function lm(landmarks, idx) {
    const p = landmarks?.[idx];
    return p ? { x: p.x, y: p.y, z: p.z || 0 } : null;
  }

  function dist2D(a, b) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }

  function headPose(landmarks) {
    const lc = lm(landmarks, LM.leftCheek), rc = lm(landmarks, LM.rightCheek);
    const fh = lm(landmarks, LM.forehead), ch = lm(landmarks, LM.chin);
    if (!lc || !rc || !fh || !ch) return { yaw: 0, pitch: 0 };

    const hx = lc.x - rc.x, hy = lc.y - rc.y, hz = lc.z - rc.z;
    const vx = fh.x - ch.x, vy = fh.y - ch.y, vz = fh.z - ch.z;
    const nx = hy * vz - hz * vy, ny = hz * vx - hx * vz, nz = hx * vy - hy * vx;
    const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);

    return {
      yaw: Math.atan2(nx, nz) * (180 / Math.PI),
      pitch: nLen > 0 ? Math.asin(-ny / nLen) * (180 / Math.PI) : 0,
    };
  }

  function pupilDist(landmarks) {
    const l = lm(landmarks, LM.leftEyeOuter), r = lm(landmarks, LM.rightEyeOuter);
    return l && r ? dist2D(l, r) : 0;
  }

  function stability(curr, prev) {
    if (!prev || !curr) return 999;
    const ids = [LM.noseTip, LM.leftEyeOuter, LM.rightEyeOuter, LM.chin, LM.forehead];
    let sum = 0, n = 0;
    for (const i of ids) {
      const a = lm(curr, i), b = lm(prev, i);
      if (a && b) { sum += dist2D(a, b); n++; }
    }
    return n > 0 ? sum / n : 999;
  }

  function brightness(video) {
    const c = document.createElement("canvas");
    c.width = 120; c.height = 90;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, 120, 90);
    const d = ctx.getImageData(0, 0, 120, 90).data;
    let sum = 0, n = 0;
    for (let i = 0; i < d.length; i += 64) { sum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; n++; }
    return n > 0 ? sum / n : 128;
  }

  // ─── CAPTURE ──────────────────────────────────────────────
  function captureFrame(video) {
    const c = document.createElement("canvas");
    c.width = video.videoWidth; c.height = video.videoHeight;
    c.getContext("2d").drawImage(video, 0, 0);
    return new Promise(r => c.toBlob(r, "image/jpeg", CFG.jpegQuality));
  }

  function haptic() {
    try { navigator.vibrate?.(50); } catch (_) {}
  }

  // ─── OVERLAY DRAWING ─────────────────────────────────────
  function drawOverlay(color, progress, step) {
    if (!overlayCtx || !overlayCanvasEl) return;
    const w = overlayCanvasEl.width, h = overlayCanvasEl.height;
    overlayCtx.clearRect(0, 0, w, h);

    // Dark vignette outside oval
    overlayCtx.fillStyle = "rgba(0,0,0,0.55)";
    overlayCtx.fillRect(0, 0, w, h);

    const cx = w / 2, cy = h * 0.40, rx = w * 0.34, ry = h * 0.30;

    // Cut out oval
    overlayCtx.save();
    overlayCtx.globalCompositeOperation = "destination-out";
    overlayCtx.beginPath();
    overlayCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    overlayCtx.fill();
    overlayCtx.restore();

    // Base oval border
    const borderColors = { white: "rgba(255,255,255,0.3)", yellow: "rgba(250,204,21,0.5)", green: "rgba(20,184,166,0.25)" };
    overlayCtx.strokeStyle = borderColors[color] || borderColors.white;
    overlayCtx.lineWidth = 2;
    overlayCtx.beginPath();
    overlayCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    overlayCtx.stroke();

    // Yellow pulsing border
    if (color === "yellow") {
      overlayCtx.strokeStyle = "rgba(250,204,21,0.7)";
      overlayCtx.lineWidth = 3;
      overlayCtx.beginPath();
      overlayCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      overlayCtx.stroke();
    }

    // Green progress arc
    if (color === "green" && progress > 0) {
      const start = -Math.PI / 2;
      const end = start + Math.PI * 2 * progress;

      // Glow
      overlayCtx.strokeStyle = "rgba(20,184,166,0.2)";
      overlayCtx.lineWidth = 16;
      overlayCtx.beginPath();
      overlayCtx.ellipse(cx, cy, rx + 2, ry + 2, 0, start, end);
      overlayCtx.stroke();

      // Main arc
      overlayCtx.strokeStyle = "rgba(20,184,166,1)";
      overlayCtx.lineWidth = 4;
      overlayCtx.lineCap = "round";
      overlayCtx.beginPath();
      overlayCtx.ellipse(cx, cy, rx, ry, 0, start, end);
      overlayCtx.stroke();
      overlayCtx.lineCap = "butt";
    }

    // Draw profile guide arrow for step 1 & 2
    if (color !== "green" && (step === 1 || step === 2)) {
      const arrowX = step === 1 ? cx + rx + 30 : cx - rx - 30;
      const dir = step === 1 ? 1 : -1;
      overlayCtx.save();
      overlayCtx.strokeStyle = "rgba(255,255,255,0.4)";
      overlayCtx.lineWidth = 2;
      overlayCtx.beginPath();
      // Arrow shaft
      overlayCtx.moveTo(arrowX, cy - 20);
      overlayCtx.lineTo(arrowX, cy + 20);
      // Arrow head
      overlayCtx.moveTo(arrowX - 8 * dir, cy - 12);
      overlayCtx.lineTo(arrowX, cy - 20);
      overlayCtx.lineTo(arrowX + 8 * dir, cy - 12);
      overlayCtx.stroke();
      // Curved arrow showing rotation direction
      overlayCtx.beginPath();
      overlayCtx.arc(cx, cy, rx + 20, step === 1 ? -0.3 : Math.PI - 0.3, step === 1 ? 0.3 : Math.PI + 0.3);
      overlayCtx.stroke();
      overlayCtx.restore();
    }

    // Status badges at bottom of overlay
    drawStatusBadges(w, h);
  }

  function drawStatusBadges(w, h) {
    const badges = [
      { key: "distance", icon: "↔", label: t("badgeDistance") },
      { key: "light", icon: "☀", label: t("badgeLight") },
      { key: "angle", icon: "◐", label: t("badgeAngle") },
      { key: "stability", icon: "⊙", label: t("badgeStability") },
    ];

    const badgeW = 58, badgeH = 26, gap = 6;
    const totalW = badges.length * badgeW + (badges.length - 1) * gap;
    let x = (w - totalW) / 2;
    const y = h - 50;

    for (const b of badges) {
      const status = S.status[b.key]; // true = ok, false = bad, null = unknown
      const bgColor = status === true ? "rgba(20,184,166,0.7)" : status === false ? "rgba(239,68,68,0.6)" : "rgba(255,255,255,0.15)";
      const textColor = status === null ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.95)";

      // Badge background
      overlayCtx.fillStyle = bgColor;
      overlayCtx.beginPath();
      const r = 6;
      // roundRect polyfill for older Safari
      if (overlayCtx.roundRect) { overlayCtx.roundRect(x, y, badgeW, badgeH, r); }
      else { overlayCtx.moveTo(x+r,y); overlayCtx.arcTo(x+badgeW,y,x+badgeW,y+badgeH,r); overlayCtx.arcTo(x+badgeW,y+badgeH,x,y+badgeH,r); overlayCtx.arcTo(x,y+badgeH,x,y,r); overlayCtx.arcTo(x,y,x+badgeW,y,r); overlayCtx.closePath(); }
      overlayCtx.fill();

      // Icon
      overlayCtx.fillStyle = textColor;
      overlayCtx.font = "bold 10px system-ui, sans-serif";
      overlayCtx.textAlign = "center";
      overlayCtx.fillText(b.icon, x + 12, y + 17);

      // Label
      overlayCtx.font = "9px system-ui, sans-serif";
      overlayCtx.fillText(b.label, x + 38, y + 17);

      x += badgeW + gap;
    }
  }

  // ─── UI BUILD ─────────────────────────────────────────────
  function buildScanUI() {
    return `
      <div id="facescan-root" class="relative w-full max-w-md mx-auto" style="touch-action:manipulation;">
        <div id="fs-permission" class="hidden text-center py-8 px-4 space-y-5">
          <div class="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 flex items-center justify-center">
            <svg class="w-10 h-10 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
          </div>
          <h3 class="font-serif text-2xl text-brand-dark" id="fs-perm-title"></h3>
          <p class="text-sm text-stone-500 leading-relaxed max-w-xs mx-auto" id="fs-perm-desc"></p>
          <div class="flex items-center justify-center gap-4 text-[10px] text-stone-400 uppercase tracking-wider pt-1">
            <span class="flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"/></svg> Aucun enregistrement</span>
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
              <div id="fs-tip" class="text-center">
                <span class="inline-block px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[10px] text-white/70 uppercase tracking-wider font-medium"></span>
              </div>
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
          <div class="grid grid-cols-3 gap-3" id="fs-preview-grid">
            ${[0,1,2].map(i => `
            <div class="space-y-2 text-center">
              <div class="relative aspect-[3/4] rounded-2xl overflow-hidden bg-stone-900 shadow-lg ring-1 ring-white/10">
                <img id="fs-prev-${i}" class="w-full h-full object-cover" style="transform:scaleX(-1);">
                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                  <span class="text-[9px] font-bold uppercase tracking-wider text-white/80" id="fs-prev-label-${i}"></span>
                </div>
              </div>
              <button type="button" class="text-[10px] text-brand-primary font-bold uppercase tracking-wider hover:underline" data-retake="${i}" id="fs-retake-${i}"></button>
            </div>`).join("")}
          </div>
          <button type="button" id="fs-validate-btn" class="w-full py-4 rounded-2xl bg-brand-primary text-white font-bold text-sm tracking-wide hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20"></button>
          <button type="button" id="fs-restart-btn" class="w-full py-2.5 rounded-2xl border border-stone-200 text-stone-400 text-[11px] font-bold tracking-wide hover:border-brand-primary hover:text-brand-primary transition-all"></button>
        </div>

        <div id="fs-error" class="hidden text-center py-8 px-4 space-y-4">
          <div class="w-14 h-14 mx-auto rounded-full bg-amber-50 flex items-center justify-center">
            <svg class="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
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
      const done = !!S.captures[i];
      const active = i === S.captureStep && !done;
      const dotClass = done
        ? "w-7 h-7 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-md shadow-brand-primary/30"
        : active
          ? "w-7 h-7 rounded-full border-2 border-brand-primary text-brand-primary flex items-center justify-center"
          : "w-7 h-7 rounded-full border-2 border-stone-300 text-stone-400 flex items-center justify-center";
      const labelClass = done || active ? "text-[10px] font-bold text-brand-dark" : "text-[10px] font-medium text-stone-400";
      const inner = done
        ? '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>'
        : `<span class="text-[10px] font-bold">${i + 1}</span>`;

      if (i > 0) html += '<div class="w-8 h-px ' + (S.captures[i - 1] ? "bg-brand-primary" : "bg-stone-300") + '"></div>';
      html += `<div class="flex flex-col items-center gap-1"><div class="${dotClass}">${inner}</div><span class="${labelClass}">${labels[i]}</span></div>`;
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
    ["fs-permission", "fs-loading", "fs-scan", "fs-preview", "fs-error"].forEach(s => {
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
    videoEl.addEventListener("loadedmetadata", () => {
      if (overlayCanvasEl) { overlayCanvasEl.width = videoEl.videoWidth; overlayCanvasEl.height = videoEl.videoHeight; }
    });

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
    if (videoEl) videoEl.srcObject = null;
    clearNoFaceTimer();
  }

  function resetNoFaceTimer() {
    clearNoFaceTimer();
    const hint = document.getElementById("fs-noface-hint");
    if (hint) hint.classList.add("hidden");
    S.noFaceTimer = setTimeout(() => {
      const hint = document.getElementById("fs-noface-hint");
      if (hint) { hint.classList.remove("hidden"); hint.querySelector("p").textContent = t("noFaceHint"); }
    }, CFG.noFaceTimeout);
  }

  function clearNoFaceTimer() { if (S.noFaceTimer) { clearTimeout(S.noFaceTimer); S.noFaceTimer = null; } }

  // ─── FACE MESH CALLBACK ──────────────────────────────────
  function onResults(results) {
    if (S.phase !== "scanning" || S.isCapturing) return;
    const marks = results.multiFaceLandmarks?.[0];

    if (!marks || marks.length < 468) {
      S.holdStartTime = null;
      S.status = { distance: null, light: null, angle: null, stability: null };
      drawOverlay("white", 0, S.captureStep);
      updateInstruction(t("noFaceDetected"));
      return;
    }

    resetNoFaceTimer();
    S.prevLandmarks = S.lastLandmarks;
    S.lastLandmarks = marks;

    const check = evaluate(marks);

    if (check.allGood) {
      const now = Date.now();
      if (!S.holdStartTime) S.holdStartTime = now;
      const held = now - S.holdStartTime;
      const progress = Math.min(held / CFG.holdDurationMs, 1);

      if (held >= CFG.holdDurationMs) {
        S.holdStartTime = null;
        performCapture();
        return;
      }

      const remaining = ((CFG.holdDurationMs - held) / 1000).toFixed(1);
      updateInstruction(`${t("holdStill")} (${remaining}s)`);
      drawOverlay("green", progress, S.captureStep);
    } else {
      S.holdStartTime = null;
      drawOverlay(check.faceDetected ? "yellow" : "white", 0, S.captureStep);
      updateInstruction(check.instruction);
    }
  }

  // ─── CONDITION EVALUATION ─────────────────────────────────
  function evaluate(marks) {
    const step = S.captureStep;
    const isProfile = step > 0;
    let instruction = "";
    let allGood = true;

    // Reset statuses
    S.status = { distance: true, light: true, angle: true, stability: true };

    // 1. Distance (skip for profiles)
    if (!isProfile) {
      const pd = pupilDist(marks);
      if (pd < CFG.pupilDistMin) {
        instruction = t("moveCloser");
        S.status.distance = false;
        allGood = false;
      } else if (pd > CFG.pupilDistMax) {
        instruction = t("moveBack");
        S.status.distance = false;
        allGood = false;
      }
    }

    // 2. Centering (face only)
    if (allGood && step === 0) {
      const nose = lm(marks, LM.noseTip);
      if (nose) {
        if (Math.abs(nose.x - 0.5) > CFG.centerMaxOffset || Math.abs(nose.y - 0.40) > CFG.centerMaxOffset) {
          instruction = t("centerFace");
          S.status.distance = false;
          allGood = false;
        }
      }
    }

    // 3. Head pose (3D)
    const pose = headPose(marks);
    const absYaw = Math.abs(pose.yaw);

    if (allGood) {
      if (step === 0) {
        if (absYaw > CFG.faceYawMax) { instruction = t("instructionFace"); S.status.angle = false; allGood = false; }
        if (allGood && Math.abs(pose.pitch) > CFG.pitchMax) { instruction = t("instructionFace"); S.status.angle = false; allGood = false; }
      } else {
        if (absYaw < CFG.profileYawMin) {
          instruction = step === 1 ? t("instructionLeft") : t("instructionRight");
          S.status.angle = false;
          allGood = false;
        } else if (absYaw > CFG.profileYawMax) {
          instruction = step === 1 ? t("instructionLeft") : t("instructionRight");
          S.status.angle = false;
          allGood = false;
        }
        if (allGood && Math.abs(pose.pitch) > CFG.pitchMax * 2) { S.status.angle = false; allGood = false; }
      }
    }

    // 4. Brightness
    if (allGood && videoEl) {
      const br = brightness(videoEl);
      if (br < CFG.brightnessMin) { instruction = t("moreLightNeeded"); S.status.light = false; allGood = false; }
      else if (br > CFG.brightnessMax) { instruction = t("tooMuchLight"); S.status.light = false; allGood = false; }
    }

    // 5. Stability
    if (allGood) {
      const stab = stability(marks, S.prevLandmarks);
      const maxD = isProfile ? CFG.stabilityMaxDelta * 1.5 : CFG.stabilityMaxDelta;
      if (stab > maxD) { instruction = t("holdStill"); S.status.stability = false; allGood = false; }
    }

    if (!allGood && !instruction) {
      instruction = [t("instructionFace"), t("instructionLeft"), t("instructionRight")][step];
    }

    // Debug (3% of frames)
    if (Math.random() < 0.03) {
      console.log(`[Scan] step=${step} yaw=${pose.yaw.toFixed(1)}° pitch=${pose.pitch.toFixed(1)}° all=${allGood}`);
    }

    return { allGood, instruction, faceDetected: true };
  }

  // ─── CAPTURE ──────────────────────────────────────────────
  async function performCapture() {
    if (S.isCapturing) return;
    S.isCapturing = true;

    haptic();
    updateInstruction(t("capturing"));

    // Flash
    const flash = document.getElementById("fs-flash");
    if (flash) { flash.style.opacity = "0.8"; setTimeout(() => flash.style.opacity = "0", 250); }

    try {
      const blob = await captureFrame(videoEl);
      const step = S.captureStep;
      S.captureBlobs[step] = blob;
      S.captures[step] = URL.createObjectURL(blob);
      updateProgress();

      // Show success overlay
      const overlay = document.getElementById("fs-success-overlay");
      const successText = document.getElementById("fs-success-text");
      const nextText = document.getElementById("fs-success-next");

      if (overlay && successText) {
        successText.textContent = t("captureSuccess");
        overlay.style.opacity = "1";

        if (step < 2 && nextText) {
          // Countdown display
          let countdown = Math.ceil(CFG.captureCooldown / 1000);
          nextText.textContent = `${t("nextStep")} ${countdown}s...`;
          const interval = setInterval(() => {
            countdown--;
            if (countdown > 0) nextText.textContent = `${t("nextStep")} ${countdown}s...`;
            else { clearInterval(interval); nextText.textContent = ""; }
          }, 1000);
        } else if (nextText) {
          nextText.textContent = "";
        }
      }

      await new Promise(r => setTimeout(r, CFG.captureCooldown));

      if (overlay) overlay.style.opacity = "0";

      if (step < 2) {
        S.captureStep = step + 1;
        S.holdStartTime = null;
        S.isCapturing = false;
        S.prevLandmarks = null;
        S.lastLandmarks = null;
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
      const label = document.getElementById(`fs-prev-label-${i}`);
      const retake = document.getElementById(`fs-retake-${i}`);
      if (img) img.src = S.captures[i] || "";
      if (label) label.textContent = labels[i];
      if (retake) retake.textContent = t("retake");
    }

    document.getElementById("fs-preview-title").textContent = t("previewTitle");
    document.getElementById("fs-validate-btn").textContent = t("validatePhotos");
    document.getElementById("fs-restart-btn").textContent = t("scanAnother");

    document.querySelectorAll("[data-retake]").forEach(btn => {
      btn.onclick = () => retakeCapture(parseInt(btn.dataset.retake, 10));
    });
    document.getElementById("fs-validate-btn").onclick = validateAndUpload;
    document.getElementById("fs-restart-btn").onclick = restartScan;
  }

  async function retakeCapture(idx) {
    if (S.captures[idx]) URL.revokeObjectURL(S.captures[idx]);
    S.captures[idx] = null;
    S.captureBlobs[idx] = null;
    S.captureStep = idx;
    S.holdStartTime = null;
    S.phase = "scanning";
    showScreen("fs-scan");
    updateProgress();
    const ok = await requestCamera();
    if (ok) startCamera();
  }

  function restartScan() {
    for (let i = 0; i < 3; i++) { if (S.captures[i]) URL.revokeObjectURL(S.captures[i]); S.captures[i] = null; S.captureBlobs[i] = null; }
    S.captureStep = 0;
    S.holdStartTime = null;
    startScanFlow();
  }

  // ─── UPLOAD ───────────────────────────────────────────────
  async function validateAndUpload() {
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
      updateManualPreviews();
      if (onScanComplete) onScanComplete({ face: S.captureBlobs[0], left: S.captureBlobs[1], right: S.captureBlobs[2] });

      if (btn) { btn.textContent = "✓"; btn.className = btn.className.replace("bg-brand-primary", "bg-green-500"); }

      setTimeout(() => {
        const sc = document.getElementById("facescan-container");
        const uc = document.getElementById("manual-upload-container");
        if (sc) sc.classList.add("hidden");
        if (uc) uc.classList.remove("hidden");
        const sb = document.getElementById("switch-to-scan-btn");
        if (sb) sb.classList.remove("hidden");
      }, 800);
    } catch (err) {
      console.error("Upload failed:", err);
      if (btn) { btn.disabled = false; btn.textContent = t("validatePhotos"); }
      alert(lang === "fr" ? "Erreur lors de l'envoi. Vérifiez votre connexion." : "Upload error. Check your connection.");
    }
  }

  function updateManualPreviews() {
    [["preview-face", "empty-face", 0], ["preview-left", "empty-left", 1], ["preview-right", "empty-right", 2]].forEach(([pid, eid, i]) => {
      if (!S.captures[i]) return;
      const img = document.getElementById(pid), empty = document.getElementById(eid);
      if (img) { img.src = S.captures[i]; img.classList.remove("hidden"); }
      if (empty) empty.classList.add("hidden");
    });
  }

  // ─── ERROR ────────────────────────────────────────────────
  function showError(msg) {
    showScreen("fs-error");
    const el = document.getElementById("fs-error-text");
    if (el) el.textContent = msg;
    setTimeout(() => {
      const sc = document.getElementById("facescan-container"), uc = document.getElementById("manual-upload-container");
      if (sc) sc.classList.add("hidden");
      if (uc) uc.classList.remove("hidden");
      const sb = document.getElementById("switch-to-scan-btn");
      if (sb) sb.classList.remove("hidden");
    }, 2000);
    if (onFallbackToUpload) onFallbackToUpload();
  }

  // ─── MAIN FLOW ────────────────────────────────────────────
  async function startScanFlow() {
    S.phase = "permission";
    showScreen("fs-permission");
    document.getElementById("fs-perm-title").textContent = t("cameraPermTitle");
    document.getElementById("fs-perm-desc").textContent = t("cameraPermDesc");
    document.getElementById("fs-perm-btn").textContent = t("cameraPermBtn");

    document.getElementById("fs-perm-btn").onclick = async () => {
      S.phase = "loading";
      showScreen("fs-loading");
      document.getElementById("fs-loading-text").textContent = t("loading");

      const camOk = await requestCamera();
      if (!camOk) return;
      const meshOk = await initFaceMesh();
      if (!meshOk) { stopCamera(); return; }

      S.phase = "scanning";
      S.captureStep = 0;
      S.holdStartTime = null;
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
    init(containerId, options) {
      detectLang();
      containerEl = document.getElementById(containerId);
      if (!containerEl) return;
      onScanComplete = options?.onComplete || null;
      onFallbackToUpload = options?.onFallback || null;
      containerEl.innerHTML = buildScanUI();
      if (!navigator.mediaDevices?.getUserMedia) { showError(t("cameraNotSupported")); return; }
      startScanFlow();
    },
    destroy() {
      stopCamera();
      if (S.faceMesh) { try { S.faceMesh.close(); } catch (_) {} }
      for (let i = 0; i < 3; i++) if (S.captures[i]) URL.revokeObjectURL(S.captures[i]);
      S = resetState();
    },
    restart: restartScan,
  };
})();
