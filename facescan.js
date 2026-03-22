/**
 * Adermio Face Scan — Guided face capture using MediaPipe Face Mesh
 * Replaces manual photo upload with real-time guided scanning.
 *
 * Dependencies (loaded via CDN in HTML):
 *   - @mediapipe/face_mesh
 *   - @mediapipe/camera_utils
 */

(function () {
  "use strict";

  // ─── TRANSLATIONS ──────────────────────────────────────────
  const T = {
    fr: {
      startScan: "Scanner ma peau",
      switchToUpload: "Importer manuellement",
      switchToScan: "Utiliser le scan guidé",
      cameraPermTitle: "Accès à la caméra",
      cameraPermDesc: "Nous avons besoin de votre caméra pour capturer les photos de votre visage. Aucune vidéo n'est enregistrée ni transmise — seules les photos finales sont utilisées pour l'analyse.",
      cameraPermBtn: "Autoriser la caméra",
      cameraDenied: "Accès à la caméra refusé. Vous pouvez importer vos photos manuellement.",
      cameraNotSupported: "Votre navigateur ne supporte pas l'accès à la caméra. Utilisez l'import manuel.",
      noCameraDevice: "Aucune caméra frontale détectée. Utilisez l'import manuel.",
      loading: "Chargement du scan facial...",
      stepFace: "Face",
      stepLeft: "Profil gauche",
      stepRight: "Profil droit",
      instructionFace: "Placez votre visage dans l'oval",
      instructionLeft: "Tournez doucement la tête vers la droite",
      instructionRight: "Tournez doucement la tête vers la gauche",
      moveCloser: "Rapprochez-vous",
      moveBack: "Reculez un peu",
      centerFace: "Centrez votre visage dans l'oval",
      moreLightNeeded: "Cherchez un endroit plus lumineux",
      tooMuchLight: "Trop de lumière directe, décalez-vous",
      holdStill: "Ne bougez plus...",
      capturing: "Capture...",
      captureSuccess: "Capturé !",
      noFaceDetected: "Aucun visage détecté",
      noFaceHint: "Assurez-vous que votre visage est visible et bien éclairé",
      previewTitle: "Vos photos",
      retake: "Reprendre",
      validatePhotos: "Valider les photos",
      scanAnother: "Recommencer le scan",
    },
    en: {
      startScan: "Scan my skin",
      switchToUpload: "Upload manually",
      switchToScan: "Use guided scan",
      cameraPermTitle: "Camera access",
      cameraPermDesc: "We need your camera to capture photos of your face. No video is recorded or transmitted — only the final photos are used for analysis.",
      cameraPermBtn: "Allow camera",
      cameraDenied: "Camera access denied. You can upload your photos manually.",
      cameraNotSupported: "Your browser does not support camera access. Use manual upload.",
      noCameraDevice: "No front camera detected. Use manual upload.",
      loading: "Loading face scan...",
      stepFace: "Face",
      stepLeft: "Left profile",
      stepRight: "Right profile",
      instructionFace: "Place your face in the oval",
      instructionLeft: "Slowly turn your head to the right",
      instructionRight: "Slowly turn your head to the left",
      moveCloser: "Move closer",
      moveBack: "Move back a little",
      centerFace: "Center your face in the oval",
      moreLightNeeded: "Find a brighter spot",
      tooMuchLight: "Too much direct light, move aside",
      holdStill: "Hold still...",
      capturing: "Capturing...",
      captureSuccess: "Captured!",
      noFaceDetected: "No face detected",
      noFaceHint: "Make sure your face is visible and well-lit",
      previewTitle: "Your photos",
      retake: "Retake",
      validatePhotos: "Validate photos",
      scanAnother: "Restart scan",
    },
  };

  // ─── CONSTANTS / THRESHOLDS ────────────────────────────────
  const THRESHOLDS = {
    // Inter-pupillary distance in normalized coords (0-1 range relative to video width)
    pupilDistMin: 0.08,   // too far (lowered for profiles where apparent distance shrinks)
    pupilDistMax: 0.35,   // too close
    // Face centering — max offset from oval center (normalized)
    centerMaxOffset: 0.15,
    // Yaw angles (degrees)
    faceYawMax: 12,
    profileYawMin: 12,    // lowered — the ratio*120 formula underestimates real angles
    profileYawMax: 55,    // widened range to be more forgiving
    // Pitch (degrees)
    pitchMax: 15,
    // Brightness (0-255)
    brightnessMin: 45,
    brightnessMax: 230,
    // Stability — max average landmark movement between frames (normalized)
    stabilityMaxDelta: 0.012,  // doubled — turning head naturally involves movement
    // Number of consecutive "good" frames before auto-capture
    goodFramesNeeded: 5,  // reduced from 8 — faster capture
    // No face timeout (ms)
    noFaceTimeout: 10000,
    // Capture JPEG quality
    jpegQuality: 0.92,
  };

  // Key landmark indices
  const LM = {
    noseTip: 1,
    leftIris: 468,     // MediaPipe iris landmarks (if available)
    rightIris: 473,
    leftEyeInner: 133,
    rightEyeInner: 362,
    leftEyeOuter: 33,
    rightEyeOuter: 263,
    leftCheek: 234,
    rightCheek: 454,
    chin: 152,
    forehead: 10,
    leftJaw: 172,
    rightJaw: 397,
  };

  // ─── STATE ─────────────────────────────────────────────────
  let lang = "fr";
  let scanState = {
    phase: "idle",          // idle | permission | loading | scanning | preview
    captureStep: 0,         // 0=face, 1=left, 2=right
    captures: [null, null, null],
    captureBlobs: [null, null, null],
    goodFrameCount: 0,
    lastLandmarks: null,
    prevLandmarks: null,
    noFaceTimer: null,
    showNoFaceHint: false,
    currentInstruction: "",
    ovalColor: "white",     // white | yellow | green
    isCapturing: false,
    faceMesh: null,
    camera: null,
    videoStream: null,
    animFrameId: null,
  };

  // DOM refs (set during init)
  let containerEl = null;
  let videoEl = null;
  let canvasEl = null;
  let overlayCanvasEl = null;
  let ctx = null;
  let overlayCtx = null;

  // Callbacks
  let onScanComplete = null;  // (captures: {face: Blob, left: Blob, right: Blob}) => void
  let onFallbackToUpload = null;

  // ─── HELPERS ───────────────────────────────────────────────
  function t(key) {
    return (T[lang] && T[lang][key]) || T.fr[key] || key;
  }

  function detectLang() {
    const htmlLang = document.documentElement.lang || "fr";
    lang = htmlLang.startsWith("en") ? "en" : "fr";
  }

  // ─── FACE GEOMETRY UTILS ───────────────────────────────────

  function getLandmark(landmarks, idx) {
    if (!landmarks || !landmarks[idx]) return null;
    return { x: landmarks[idx].x, y: landmarks[idx].y, z: landmarks[idx].z || 0 };
  }

  function distance2D(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  function computePupilDistance(landmarks) {
    // Use eye outer corners as reliable proxy (iris landmarks may not always be available)
    const left = getLandmark(landmarks, LM.leftEyeOuter);
    const right = getLandmark(landmarks, LM.rightEyeOuter);
    if (!left || !right) return 0;
    return distance2D(left, right);
  }

  function computeNoseCenter(landmarks) {
    const nose = getLandmark(landmarks, LM.noseTip);
    return nose;
  }

  function computeYaw(landmarks) {
    // Yaw = horizontal rotation
    // Compare distance from nose to left cheek vs nose to right cheek
    const nose = getLandmark(landmarks, LM.noseTip);
    const leftCheek = getLandmark(landmarks, LM.leftCheek);
    const rightCheek = getLandmark(landmarks, LM.rightCheek);
    if (!nose || !leftCheek || !rightCheek) return 0;

    const dLeft = distance2D(nose, leftCheek);
    const dRight = distance2D(nose, rightCheek);

    // Ratio approach: when facing straight, dLeft ≈ dRight
    // When turned left (showing right profile), dLeft > dRight
    // When turned right (showing left profile), dLeft < dRight
    const ratio = (dLeft - dRight) / (dLeft + dRight);

    // Convert to approximate degrees (empirical mapping)
    // ratio of ~0.35 corresponds to roughly 40-45 degrees
    const yawDeg = ratio * 120;

    return yawDeg;
  }

  function computePitch(landmarks) {
    // Pitch = vertical tilt
    // Compare vertical position of nose relative to eyes and chin
    const nose = getLandmark(landmarks, LM.noseTip);
    const forehead = getLandmark(landmarks, LM.forehead);
    const chin = getLandmark(landmarks, LM.chin);
    if (!nose || !forehead || !chin) return 0;

    const faceHeight = chin.y - forehead.y;
    if (faceHeight <= 0) return 0;

    // Expected nose position is roughly 60% down from forehead to chin
    const expectedNoseY = forehead.y + faceHeight * 0.6;
    const deviation = (nose.y - expectedNoseY) / faceHeight;

    // Convert to approximate degrees
    return deviation * 80;
  }

  function computeStability(currentLandmarks, previousLandmarks) {
    if (!previousLandmarks || !currentLandmarks) return 999;

    // Sample a few key landmarks for stability check
    const indices = [LM.noseTip, LM.leftEyeOuter, LM.rightEyeOuter, LM.chin, LM.forehead];
    let totalDelta = 0;
    let count = 0;

    for (const idx of indices) {
      const curr = getLandmark(currentLandmarks, idx);
      const prev = getLandmark(previousLandmarks, idx);
      if (curr && prev) {
        totalDelta += distance2D(curr, prev);
        count++;
      }
    }

    return count > 0 ? totalDelta / count : 999;
  }

  // ─── BRIGHTNESS ANALYSIS ──────────────────────────────────

  function analyzeBrightness(videoElement, canvas) {
    const w = 160;
    const h = 120;
    const tmpCanvas = document.createElement("canvas");
    tmpCanvas.width = w;
    tmpCanvas.height = h;
    const tmpCtx = tmpCanvas.getContext("2d", { willReadFrequently: true });
    tmpCtx.drawImage(videoElement, 0, 0, w, h);

    const imageData = tmpCtx.getImageData(0, 0, w, h);
    const data = imageData.data;

    let totalLum = 0;
    const step = 16; // sample every 16th pixel for performance
    let count = 0;

    for (let i = 0; i < data.length; i += 4 * step) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Perceived luminance
      totalLum += 0.299 * r + 0.587 * g + 0.114 * b;
      count++;
    }

    return count > 0 ? totalLum / count : 128;
  }

  // ─── CAPTURE ──────────────────────────────────────────────

  function captureFrame(videoElement) {
    const captureCanvas = document.createElement("canvas");
    captureCanvas.width = videoElement.videoWidth;
    captureCanvas.height = videoElement.videoHeight;
    const captureCtx = captureCanvas.getContext("2d");
    captureCtx.drawImage(videoElement, 0, 0);

    return new Promise((resolve) => {
      captureCanvas.toBlob(
        (blob) => resolve(blob),
        "image/jpeg",
        THRESHOLDS.jpegQuality
      );
    });
  }

  // ─── OVAL OVERLAY DRAWING ─────────────────────────────────

  function drawOverlay(ovalColor, instruction, captureStep) {
    if (!overlayCtx || !overlayCanvasEl) return;

    const w = overlayCanvasEl.width;
    const h = overlayCanvasEl.height;
    overlayCtx.clearRect(0, 0, w, h);

    // Semi-transparent background outside oval
    overlayCtx.fillStyle = "rgba(0, 0, 0, 0.5)";
    overlayCtx.fillRect(0, 0, w, h);

    // Oval cutout
    const cx = w / 2;
    const cy = h * 0.42;
    const rx = w * 0.35;
    const ry = h * 0.32;

    overlayCtx.save();
    overlayCtx.globalCompositeOperation = "destination-out";
    overlayCtx.beginPath();
    overlayCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    overlayCtx.fill();
    overlayCtx.restore();

    // Oval border
    const colors = {
      white: "rgba(255, 255, 255, 0.6)",
      yellow: "rgba(250, 204, 21, 0.8)",
      green: "rgba(20, 184, 166, 1)",
    };
    overlayCtx.strokeStyle = colors[ovalColor] || colors.white;
    overlayCtx.lineWidth = ovalColor === "green" ? 4 : 2.5;
    overlayCtx.beginPath();
    overlayCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    overlayCtx.stroke();

    // Glow effect when green
    if (ovalColor === "green") {
      overlayCtx.strokeStyle = "rgba(20, 184, 166, 0.3)";
      overlayCtx.lineWidth = 12;
      overlayCtx.beginPath();
      overlayCtx.ellipse(cx, cy, rx + 4, ry + 4, 0, 0, Math.PI * 2);
      overlayCtx.stroke();
    }
  }

  // ─── UI RENDERING ─────────────────────────────────────────

  function buildScanUI() {
    const html = `
      <div id="facescan-root" class="relative w-full max-w-md mx-auto" style="touch-action: manipulation;">

        <!-- Permission screen -->
        <div id="fs-permission" class="hidden text-center py-8 px-4 space-y-5 animate-fade-in">
          <div class="w-16 h-16 mx-auto rounded-full bg-brand-primary/10 flex items-center justify-center">
            <svg class="w-8 h-8 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
          </div>
          <h3 class="font-serif text-xl text-brand-dark" id="fs-perm-title"></h3>
          <p class="text-sm text-stone-500 leading-relaxed max-w-xs mx-auto" id="fs-perm-desc"></p>
          <button type="button" id="fs-perm-btn" class="w-full py-3.5 rounded-2xl bg-brand-primary text-white font-bold text-sm tracking-wide hover:bg-brand-primary/90 transition-all"></button>
        </div>

        <!-- Loading screen -->
        <div id="fs-loading" class="hidden text-center py-12 space-y-4 animate-fade-in">
          <div class="w-10 h-10 mx-auto border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          <p class="text-sm text-stone-500" id="fs-loading-text"></p>
        </div>

        <!-- Scan screen -->
        <div id="fs-scan" class="hidden animate-fade-in">
          <!-- Progress bar -->
          <div class="flex items-center justify-center gap-2 mb-4 px-2" id="fs-progress">
            <div class="flex items-center gap-1.5" id="fs-prog-0">
              <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold" id="fs-prog-dot-0">1</div>
              <span class="text-xs font-medium" id="fs-prog-label-0"></span>
            </div>
            <div class="w-6 h-px bg-stone-300"></div>
            <div class="flex items-center gap-1.5" id="fs-prog-1">
              <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold" id="fs-prog-dot-1">2</div>
              <span class="text-xs font-medium" id="fs-prog-label-1"></span>
            </div>
            <div class="w-6 h-px bg-stone-300"></div>
            <div class="flex items-center gap-1.5" id="fs-prog-2">
              <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold" id="fs-prog-dot-2">3</div>
              <span class="text-xs font-medium" id="fs-prog-label-2"></span>
            </div>
          </div>

          <!-- Video container -->
          <div class="relative w-full rounded-[2rem] overflow-hidden bg-black shadow-xl" style="aspect-ratio: 3/4;">
            <video id="fs-video" autoplay playsinline muted class="absolute inset-0 w-full h-full object-cover" style="-webkit-transform: scaleX(-1); transform: scaleX(-1);"></video>
            <canvas id="fs-overlay" class="absolute inset-0 w-full h-full pointer-events-none" style="-webkit-transform: scaleX(-1); transform: scaleX(-1);"></canvas>

            <!-- Instruction text overlay -->
            <div class="absolute bottom-0 left-0 right-0 p-4 text-center pointer-events-none">
              <div id="fs-instruction" class="inline-block px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm text-white text-sm font-medium transition-all duration-300"></div>
            </div>

            <!-- Capture flash -->
            <div id="fs-flash" class="absolute inset-0 bg-white pointer-events-none opacity-0 transition-opacity duration-150" style="z-index:20;"></div>
          </div>

          <!-- No face hint -->
          <div id="fs-noface-hint" class="hidden mt-3 text-center">
            <p class="text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2 inline-block"></p>
          </div>
        </div>

        <!-- Preview screen -->
        <div id="fs-preview" class="hidden animate-fade-in space-y-4">
          <h3 class="font-serif text-xl text-brand-dark text-center" id="fs-preview-title"></h3>

          <div class="grid grid-cols-3 gap-3" id="fs-preview-grid">
            <div class="space-y-2 text-center">
              <div class="relative aspect-[3/4] rounded-xl overflow-hidden bg-stone-900 shadow-md">
                <img id="fs-prev-0" class="w-full h-full object-cover" style="-webkit-transform: scaleX(-1); transform: scaleX(-1);">
              </div>
              <span class="text-[10px] font-bold uppercase tracking-wide text-stone-400" id="fs-prev-label-0"></span>
              <button type="button" class="text-[10px] text-brand-primary font-bold uppercase tracking-wider hover:underline" data-retake="0" id="fs-retake-0"></button>
            </div>
            <div class="space-y-2 text-center">
              <div class="relative aspect-[3/4] rounded-xl overflow-hidden bg-stone-900 shadow-md">
                <img id="fs-prev-1" class="w-full h-full object-cover" style="-webkit-transform: scaleX(-1); transform: scaleX(-1);">
              </div>
              <span class="text-[10px] font-bold uppercase tracking-wide text-stone-400" id="fs-prev-label-1"></span>
              <button type="button" class="text-[10px] text-brand-primary font-bold uppercase tracking-wider hover:underline" data-retake="1" id="fs-retake-1"></button>
            </div>
            <div class="space-y-2 text-center">
              <div class="relative aspect-[3/4] rounded-xl overflow-hidden bg-stone-900 shadow-md">
                <img id="fs-prev-2" class="w-full h-full object-cover" style="-webkit-transform: scaleX(-1); transform: scaleX(-1);">
              </div>
              <span class="text-[10px] font-bold uppercase tracking-wide text-stone-400" id="fs-prev-label-2"></span>
              <button type="button" class="text-[10px] text-brand-primary font-bold uppercase tracking-wider hover:underline" data-retake="2" id="fs-retake-2"></button>
            </div>
          </div>

          <button type="button" id="fs-validate-btn" class="w-full py-3.5 rounded-2xl bg-brand-primary text-white font-bold text-sm tracking-wide hover:bg-brand-primary/90 transition-all shadow-lg"></button>
          <button type="button" id="fs-restart-btn" class="w-full py-2.5 rounded-2xl border border-stone-200 text-stone-500 text-xs font-bold tracking-wide hover:border-brand-primary hover:text-brand-primary transition-all"></button>
        </div>

        <!-- Error/fallback message -->
        <div id="fs-error" class="hidden text-center py-6 px-4 space-y-3 animate-fade-in">
          <div class="w-12 h-12 mx-auto rounded-full bg-amber-50 flex items-center justify-center">
            <svg class="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p class="text-sm text-stone-600" id="fs-error-text"></p>
        </div>
      </div>
    `;
    return html;
  }

  function updateProgressUI() {
    const steps = [t("stepFace"), t("stepLeft"), t("stepRight")];
    for (let i = 0; i < 3; i++) {
      const dot = document.getElementById(`fs-prog-dot-${i}`);
      const label = document.getElementById(`fs-prog-label-${i}`);
      if (label) label.textContent = steps[i];

      if (!dot) continue;

      if (scanState.captures[i]) {
        // Completed
        dot.className = "w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold bg-brand-primary border-brand-primary text-white";
        dot.innerHTML = '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>';
      } else if (i === scanState.captureStep) {
        // Current
        dot.className = "w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold border-brand-primary text-brand-primary";
        dot.textContent = String(i + 1);
      } else {
        // Upcoming
        dot.className = "w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold border-stone-300 text-stone-400";
        dot.textContent = String(i + 1);
      }
    }
  }

  function updateInstructionUI(text) {
    const el = document.getElementById("fs-instruction");
    if (el && el.textContent !== text) {
      el.textContent = text;
    }
  }

  function showScreen(screen) {
    const screens = ["fs-permission", "fs-loading", "fs-scan", "fs-preview", "fs-error"];
    screens.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle("hidden", id !== screen);
    });
  }

  // ─── CAMERA & MEDIAPIPE SETUP ─────────────────────────────

  async function requestCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showError(t("cameraNotSupported"));
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });
      scanState.videoStream = stream;
      return true;
    } catch (err) {
      console.warn("Camera access denied:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        showError(t("cameraDenied"));
      } else if (err.name === "NotFoundError") {
        showError(t("noCameraDevice"));
      } else {
        showError(t("cameraDenied"));
      }
      return false;
    }
  }

  async function initFaceMesh() {
    if (!window.FaceMesh) {
      console.error("MediaPipe FaceMesh not loaded");
      showError(t("cameraNotSupported"));
      return false;
    }

    const faceMesh = new window.FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      },
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults(onFaceMeshResults);

    scanState.faceMesh = faceMesh;
    return true;
  }

  function startCamera() {
    if (!videoEl || !scanState.videoStream) return;

    videoEl.srcObject = scanState.videoStream;
    videoEl.play().catch(() => {});

    // Resize overlay canvas to match video
    videoEl.addEventListener("loadedmetadata", () => {
      if (overlayCanvasEl) {
        overlayCanvasEl.width = videoEl.videoWidth;
        overlayCanvasEl.height = videoEl.videoHeight;
      }
    });

    // Start sending frames to FaceMesh
    if (window.Camera && scanState.faceMesh) {
      const camera = new window.Camera(videoEl, {
        onFrame: async () => {
          if (scanState.phase === "scanning" && scanState.faceMesh) {
            await scanState.faceMesh.send({ image: videoEl });
          }
        },
        width: 1280,
        height: 960,
      });
      camera.start();
      scanState.camera = camera;
    } else {
      // Fallback: manual frame sending via requestAnimationFrame
      function sendFrame() {
        if (scanState.phase !== "scanning") return;
        if (scanState.faceMesh && videoEl.readyState >= 2) {
          scanState.faceMesh.send({ image: videoEl }).then(() => {
            scanState.animFrameId = requestAnimationFrame(sendFrame);
          });
        } else {
          scanState.animFrameId = requestAnimationFrame(sendFrame);
        }
      }
      scanState.animFrameId = requestAnimationFrame(sendFrame);
    }

    // Start no-face timeout
    resetNoFaceTimer();
  }

  function stopCamera() {
    if (scanState.camera) {
      try { scanState.camera.stop(); } catch (_) {}
      scanState.camera = null;
    }
    if (scanState.animFrameId) {
      cancelAnimationFrame(scanState.animFrameId);
      scanState.animFrameId = null;
    }
    if (scanState.videoStream) {
      scanState.videoStream.getTracks().forEach((track) => track.stop());
      scanState.videoStream = null;
    }
    if (videoEl) {
      videoEl.srcObject = null;
    }
    clearNoFaceTimer();
  }

  // ─── NO FACE TIMEOUT ─────────────────────────────────────

  function resetNoFaceTimer() {
    clearNoFaceTimer();
    scanState.showNoFaceHint = false;
    const hint = document.getElementById("fs-noface-hint");
    if (hint) hint.classList.add("hidden");

    scanState.noFaceTimer = setTimeout(() => {
      scanState.showNoFaceHint = true;
      const hint = document.getElementById("fs-noface-hint");
      if (hint) {
        hint.classList.remove("hidden");
        hint.querySelector("p").textContent = t("noFaceHint");
      }
    }, THRESHOLDS.noFaceTimeout);
  }

  function clearNoFaceTimer() {
    if (scanState.noFaceTimer) {
      clearTimeout(scanState.noFaceTimer);
      scanState.noFaceTimer = null;
    }
  }

  // ─── FACE MESH RESULTS HANDLER ────────────────────────────

  function onFaceMeshResults(results) {
    if (scanState.phase !== "scanning" || scanState.isCapturing) return;

    const landmarks = results.multiFaceLandmarks && results.multiFaceLandmarks[0];

    if (!landmarks || landmarks.length < 468) {
      // No face detected
      scanState.goodFrameCount = 0;
      scanState.ovalColor = "white";
      drawOverlay("white", "");
      updateInstructionUI(t("noFaceDetected"));
      return;
    }

    // Face detected — reset no-face timer
    resetNoFaceTimer();

    // Save landmarks for stability check
    scanState.prevLandmarks = scanState.lastLandmarks;
    scanState.lastLandmarks = landmarks;

    // Run all checks
    const checks = evaluateConditions(landmarks);

    if (checks.allGood) {
      scanState.goodFrameCount++;
      scanState.ovalColor = "green";

      if (scanState.goodFrameCount >= THRESHOLDS.goodFramesNeeded) {
        // Auto-capture!
        performCapture();
        return;
      }
      updateInstructionUI(t("holdStill"));
    } else {
      scanState.goodFrameCount = 0;
      scanState.ovalColor = checks.faceDetected ? "yellow" : "white";
      updateInstructionUI(checks.instruction);
    }

    drawOverlay(scanState.ovalColor, "");
  }

  function evaluateConditions(landmarks) {
    const step = scanState.captureStep; // 0=face, 1=left, 2=right
    let instruction = "";
    let allGood = true;
    const isProfile = step > 0;

    // 1. Distance check (relaxed for profiles since apparent pupil distance shrinks when turning)
    const pupilDist = computePupilDistance(landmarks);
    const minDist = isProfile ? THRESHOLDS.pupilDistMin * 0.5 : THRESHOLDS.pupilDistMin;
    if (pupilDist < minDist) {
      instruction = t("moveCloser");
      allGood = false;
    } else if (pupilDist > THRESHOLDS.pupilDistMax) {
      instruction = t("moveBack");
      allGood = false;
    }

    // 2. Centering check (only for face step — skip for profiles)
    if (allGood && step === 0) {
      const nose = computeNoseCenter(landmarks);
      if (nose) {
        const offsetX = Math.abs(nose.x - 0.5);
        const offsetY = Math.abs(nose.y - 0.42);
        if (offsetX > THRESHOLDS.centerMaxOffset || offsetY > THRESHOLDS.centerMaxOffset) {
          instruction = t("centerFace");
          allGood = false;
        }
      }
    }

    // 3. Yaw check
    // IMPORTANT: Video is mirrored (scaleX(-1)), but landmarks follow raw video coords.
    // So we need to check: when user physically turns right → left cheek visible → yaw sign depends on raw coords.
    // We use absolute yaw value and just check magnitude for profiles.
    if (allGood) {
      const yaw = computeYaw(landmarks);
      const absYaw = Math.abs(yaw);

      // Debug logging (temporary — helps calibrate thresholds)
      if (step > 0 && Math.random() < 0.05) {
        console.log(`[FaceScan] step=${step} yaw=${yaw.toFixed(1)} absYaw=${absYaw.toFixed(1)} pupil=${pupilDist.toFixed(3)}`);
      }

      if (step === 0) {
        // Face: need straight ahead
        if (absYaw > THRESHOLDS.faceYawMax) {
          instruction = t("instructionFace");
          allGood = false;
        }
      } else if (step === 1) {
        // Left profile: user turns head to the right physically
        // Accept any sufficient yaw in either direction since mirror may flip the sign
        if (absYaw < THRESHOLDS.profileYawMin || absYaw > THRESHOLDS.profileYawMax) {
          instruction = t("instructionLeft");
          allGood = false;
        }
      } else if (step === 2) {
        // Right profile: user turns head to the left physically
        // Same approach: accept sufficient yaw magnitude
        if (absYaw < THRESHOLDS.profileYawMin || absYaw > THRESHOLDS.profileYawMax) {
          instruction = t("instructionRight");
          allGood = false;
        }
      }
    }

    // 4. Pitch check (relaxed for profiles)
    if (allGood) {
      const pitch = computePitch(landmarks);
      const maxPitch = isProfile ? THRESHOLDS.pitchMax * 1.5 : THRESHOLDS.pitchMax;
      if (Math.abs(pitch) > maxPitch) {
        instruction = step === 0 ? t("instructionFace") : (step === 1 ? t("instructionLeft") : t("instructionRight"));
        allGood = false;
      }
    }

    // 5. Brightness check
    if (allGood && videoEl) {
      const brightness = analyzeBrightness(videoEl);
      if (brightness < THRESHOLDS.brightnessMin) {
        instruction = t("moreLightNeeded");
        allGood = false;
      } else if (brightness > THRESHOLDS.brightnessMax) {
        instruction = t("tooMuchLight");
        allGood = false;
      }
    }

    // 6. Stability check (relaxed for profiles — head is naturally moving more)
    if (allGood) {
      const stability = computeStability(landmarks, scanState.prevLandmarks);
      const maxDelta = isProfile ? THRESHOLDS.stabilityMaxDelta * 2 : THRESHOLDS.stabilityMaxDelta;
      if (stability > maxDelta) {
        instruction = t("holdStill");
        allGood = false;
      }
    }

    // Default instruction if all good
    if (allGood) {
      instruction = t("holdStill");
    } else if (!instruction) {
      const fallbacks = [t("instructionFace"), t("instructionLeft"), t("instructionRight")];
      instruction = fallbacks[step];
    }

    return { allGood, instruction, faceDetected: true };
  }

  // ─── CAPTURE LOGIC ────────────────────────────────────────

  async function performCapture() {
    if (scanState.isCapturing) return;
    scanState.isCapturing = true;

    updateInstructionUI(t("capturing"));

    // Flash effect
    const flash = document.getElementById("fs-flash");
    if (flash) {
      flash.style.opacity = "0.7";
      setTimeout(() => { flash.style.opacity = "0"; }, 200);
    }

    try {
      const blob = await captureFrame(videoEl);
      const step = scanState.captureStep;

      scanState.captureBlobs[step] = blob;
      scanState.captures[step] = URL.createObjectURL(blob);

      updateInstructionUI(t("captureSuccess"));
      updateProgressUI();

      // Move to next step or finish
      await new Promise((r) => setTimeout(r, 600));

      if (step < 2) {
        scanState.captureStep = step + 1;
        scanState.goodFrameCount = 0;
        scanState.isCapturing = false;
        updateProgressUI();
        // Show new instruction
        const instructions = [t("instructionFace"), t("instructionLeft"), t("instructionRight")];
        updateInstructionUI(instructions[scanState.captureStep]);
      } else {
        // All 3 captured — show preview
        scanState.isCapturing = false;
        showPreview();
      }
    } catch (err) {
      console.error("Capture failed:", err);
      scanState.isCapturing = false;
      scanState.goodFrameCount = 0;
    }
  }

  // ─── PREVIEW SCREEN ──────────────────────────────────────

  function showPreview() {
    stopCamera();
    scanState.phase = "preview";
    showScreen("fs-preview");

    const labels = [t("stepFace"), t("stepLeft"), t("stepRight")];
    for (let i = 0; i < 3; i++) {
      const img = document.getElementById(`fs-prev-${i}`);
      const label = document.getElementById(`fs-prev-label-${i}`);
      const retake = document.getElementById(`fs-retake-${i}`);

      if (img) img.src = scanState.captures[i] || "";
      if (label) label.textContent = labels[i];
      if (retake) retake.textContent = t("retake");
    }

    document.getElementById("fs-preview-title").textContent = t("previewTitle");
    document.getElementById("fs-validate-btn").textContent = t("validatePhotos");
    document.getElementById("fs-restart-btn").textContent = t("scanAnother");

    // Retake handlers
    document.querySelectorAll("[data-retake]").forEach((btn) => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.retake, 10);
        retakeCapture(idx);
      };
    });

    // Validate handler
    document.getElementById("fs-validate-btn").onclick = validateAndUpload;

    // Restart handler
    document.getElementById("fs-restart-btn").onclick = restartScan;
  }

  async function retakeCapture(stepIndex) {
    // Revoke old URL
    if (scanState.captures[stepIndex]) {
      URL.revokeObjectURL(scanState.captures[stepIndex]);
    }
    scanState.captures[stepIndex] = null;
    scanState.captureBlobs[stepIndex] = null;

    // Restart scan at that step
    scanState.captureStep = stepIndex;
    scanState.goodFrameCount = 0;
    scanState.phase = "scanning";

    showScreen("fs-scan");
    updateProgressUI();

    const ok = await requestCamera();
    if (!ok) return;
    startCamera();
  }

  function restartScan() {
    // Clean up old captures
    for (let i = 0; i < 3; i++) {
      if (scanState.captures[i]) {
        URL.revokeObjectURL(scanState.captures[i]);
      }
      scanState.captures[i] = null;
      scanState.captureBlobs[i] = null;
    }
    scanState.captureStep = 0;
    scanState.goodFrameCount = 0;

    startScanFlow();
  }

  // ─── VALIDATE & UPLOAD TO S3 (reusing existing presign flow) ──

  async function validateAndUpload() {
    const validateBtn = document.getElementById("fs-validate-btn");
    if (validateBtn) {
      validateBtn.disabled = true;
      validateBtn.textContent = "...";
    }

    try {
      const types = ["face", "left", "right"];

      for (let i = 0; i < 3; i++) {
        const blob = scanState.captureBlobs[i];
        if (!blob) continue;

        // Create a File object from the blob for compatibility with existing upload function
        const fileName = `scan_${types[i]}_${Date.now()}.jpg`;
        const file = new File([blob], fileName, { type: "image/jpeg" });

        // Use the existing uploadToS3Presigned function from formulaire2
        if (typeof window.uploadToS3Presigned === "function") {
          const { key, getUrl } = await window.uploadToS3Presigned({
            file,
            jobId: window.formState ? window.formState.jobId : "",
            type: types[i],
          });

          // Store in formState (same structure as manual upload)
          if (window.formState) {
            window.formState.photos[types[i]] = { key, getUrl };
          }
        } else if (typeof uploadToS3Presigned === "function") {
          const { key, getUrl } = await uploadToS3Presigned({
            file,
            jobId: formState.jobId,
            type: types[i],
          });
          formState.photos[types[i]] = { key, getUrl };
        }
      }

      // Mark face as uploaded for validation
      if (window.validationState) {
        window.validationState.facePhotoUploaded = true;
      } else if (typeof validationState !== "undefined") {
        validationState.facePhotoUploaded = true;
      }

      // Update preview images in the manual upload section too (for consistency)
      updateManualUploadPreviews();

      // Notify completion
      if (onScanComplete) {
        onScanComplete({
          face: scanState.captureBlobs[0],
          left: scanState.captureBlobs[1],
          right: scanState.captureBlobs[2],
        });
      }

      // Show success state on validate button
      if (validateBtn) {
        validateBtn.textContent = "✓";
        validateBtn.classList.add("bg-green-500");
        validateBtn.classList.remove("bg-brand-primary");
      }

      // Auto-hide scan UI after short delay and show the manual upload section with previews
      setTimeout(() => {
        // Switch to showing the upload section with the captured photos
        const scanContainer = document.getElementById("facescan-container");
        const uploadContainer = document.getElementById("manual-upload-container");
        if (scanContainer) scanContainer.classList.add("hidden");
        if (uploadContainer) uploadContainer.classList.remove("hidden");

        // Show switch-to-scan button
        const switchBtn = document.getElementById("switch-to-scan-btn");
        if (switchBtn) switchBtn.classList.remove("hidden");
      }, 800);

    } catch (err) {
      console.error("Upload failed:", err);
      if (validateBtn) {
        validateBtn.disabled = false;
        validateBtn.textContent = t("validatePhotos");
      }
      alert(lang === "fr"
        ? "Erreur lors de l'envoi des photos. Vérifiez votre connexion."
        : "Error uploading photos. Check your connection.");
    }
  }

  function updateManualUploadPreviews() {
    // Update the original upload preview images with scan captures
    const mapping = [
      { idx: 0, previewId: "preview-face", emptyId: "empty-face" },
      { idx: 1, previewId: "preview-left", emptyId: "empty-left" },
      { idx: 2, previewId: "preview-right", emptyId: "empty-right" },
    ];

    for (const { idx, previewId, emptyId } of mapping) {
      if (!scanState.captures[idx]) continue;
      const img = document.getElementById(previewId);
      const empty = document.getElementById(emptyId);
      if (img) {
        img.src = scanState.captures[idx];
        img.classList.remove("hidden");
      }
      if (empty) {
        empty.classList.add("hidden");
      }
    }
  }

  // ─── ERROR / FALLBACK ─────────────────────────────────────

  function showError(message) {
    showScreen("fs-error");
    const el = document.getElementById("fs-error-text");
    if (el) el.textContent = message;

    // Show manual upload as fallback
    setTimeout(() => {
      const scanContainer = document.getElementById("facescan-container");
      const uploadContainer = document.getElementById("manual-upload-container");
      if (scanContainer) scanContainer.classList.add("hidden");
      if (uploadContainer) uploadContainer.classList.remove("hidden");

      const switchBtn = document.getElementById("switch-to-scan-btn");
      if (switchBtn) switchBtn.classList.remove("hidden");
    }, 2000);

    if (onFallbackToUpload) onFallbackToUpload();
  }

  // ─── MAIN FLOW ────────────────────────────────────────────

  async function startScanFlow() {
    scanState.phase = "permission";
    showScreen("fs-permission");

    // Fill permission screen text
    document.getElementById("fs-perm-title").textContent = t("cameraPermTitle");
    document.getElementById("fs-perm-desc").textContent = t("cameraPermDesc");
    document.getElementById("fs-perm-btn").textContent = t("cameraPermBtn");

    document.getElementById("fs-perm-btn").onclick = async () => {
      scanState.phase = "loading";
      showScreen("fs-loading");
      document.getElementById("fs-loading-text").textContent = t("loading");

      const cameraOk = await requestCamera();
      if (!cameraOk) return;

      const meshOk = await initFaceMesh();
      if (!meshOk) {
        stopCamera();
        return;
      }

      // Start scanning
      scanState.phase = "scanning";
      scanState.captureStep = 0;
      scanState.goodFrameCount = 0;
      showScreen("fs-scan");
      updateProgressUI();
      updateInstructionUI(t("instructionFace"));

      // Get video/canvas refs
      videoEl = document.getElementById("fs-video");
      overlayCanvasEl = document.getElementById("fs-overlay");
      if (overlayCanvasEl) {
        overlayCtx = overlayCanvasEl.getContext("2d");
      }

      startCamera();
    };
  }

  // ─── PUBLIC API ───────────────────────────────────────────

  window.AdermioFaceScan = {
    /**
     * Initialize the face scan UI inside a container element.
     * @param {string} containerId - ID of the container element
     * @param {object} options
     * @param {function} options.onComplete - Called with {face, left, right} blobs after validation
     * @param {function} options.onFallback - Called when falling back to manual upload
     */
    init: function (containerId, options) {
      detectLang();
      containerEl = document.getElementById(containerId);
      if (!containerEl) {
        console.error("FaceScan: container not found:", containerId);
        return;
      }

      onScanComplete = options?.onComplete || null;
      onFallbackToUpload = options?.onFallback || null;

      containerEl.innerHTML = buildScanUI();

      // Check if camera API is available at all
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showError(t("cameraNotSupported"));
        return;
      }

      startScanFlow();
    },

    /**
     * Clean up resources (call when leaving the page/step).
     */
    destroy: function () {
      stopCamera();
      if (scanState.faceMesh) {
        try { scanState.faceMesh.close(); } catch (_) {}
        scanState.faceMesh = null;
      }
      for (let i = 0; i < 3; i++) {
        if (scanState.captures[i]) {
          URL.revokeObjectURL(scanState.captures[i]);
        }
      }
      scanState = {
        phase: "idle",
        captureStep: 0,
        captures: [null, null, null],
        captureBlobs: [null, null, null],
        goodFrameCount: 0,
        lastLandmarks: null,
        prevLandmarks: null,
        noFaceTimer: null,
        showNoFaceHint: false,
        currentInstruction: "",
        ovalColor: "white",
        isCapturing: false,
        faceMesh: null,
        camera: null,
        videoStream: null,
        animFrameId: null,
      };
    },

    /** Restart the scan from scratch */
    restart: restartScan,
  };
})();
