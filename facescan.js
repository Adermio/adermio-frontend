/**
 * Adermio Face Scan v9.7 — Production Release
 *
 * v9.7 — faisceau affiné (band .11→.07, traits et halo en proportion).
 *
 * v9.6 — VAGUE D'ANALYSE : la lumière court SUR le maillage le long de l'axe
 * menton→front (suit l'inclinaison/rotation de la tête), z = volume, arêtes
 * groupées par paquets d'intensité (6 tracés, ~1,1 ms/frame). Remplace la
 * barre horizontale plate de la v9.5 (2D devant un visage 3D = cheap).
 *
 * v9.5 — FACE MESH OVERLAY (cosmétique) : trace le maillage des 468 landmarks
 * que MediaPipe calcule déjà à chaque frame (coût de calcul nul, 0 Ko de
 * dépendance : FACEMESH_TESSELATION est déjà dans face_mesh.js). Teal
 * #14B8A6, clippé à l'ovale, fondu doux, plus visible au placement qu'au
 * scan. Gate `MESH_ON = isHighEnd` : aucun travail par frame sur les
 * téléphones lents (ceux qui subissent les timeouts). Télémétrie
 * `mesh_overlay_on` dans scan_log. AUCUNE décision de capture n'en dépend.
 *
 * Multi-angle guided scan via MediaPipe Face Mesh (468 landmarks).
 *
 * v9.4 (fix du scan muet, 2026-07-15) — mesuré sur 30% des scans web :
 *  0 capture, 18-29 capture_watchdog, ~100 s d'attente, puis repli manuel
 *  à 3 photos (analyse dégradée). Cause : `canvas.toBlob` ne rappelait
 *  JAMAIS son callback (aucune erreur, juste le silence) → la promesse de
 *  capFrame restait pendante à vie et `S.capturing` bloquait tout ; le
 *  watchdog libérait le verrou à 3 s mais la capture suivante
 *  REDIMENSIONNAIT le canvas partagé `_cc` sous l'encodeur encore en vol
 *  → WebKit lâchait aussi celui-là → cascade infinie (le filet nourrissait
 *  la panne).
 *  - capFrame : un canvas NEUF par capture (plus de `_cc` partagé
 *    redimensionné sous un encodeur zombie) → isolation totale
 *  - capFrame : règlement GARANTI — toBlob a CAP_BLOB_MS (1200 ms), sinon
 *    bascule sur `toDataURL` (synchrone : rend ou jette, jamais de silence).
 *    On ne dépend plus du bon vouloir du navigateur.
 *  - `logger` passé en PARAMÈTRE (capFrame est module-level, `S` vit dans le
 *    scope de session — y référencer `S` = ReferenceError dans le callback =
 *    promesse pendante, soit le bug qu'on corrige ; cf. incident noFace v9.3.1)
 *  - Télémétrie `capture_sync_fallback` : mesure en prod la fréquence réelle
 *    du silence toBlob
 *
 * v9.1 (app-parity pass, 2026-07):
 *  - Preview redesigned to match the app's "Scan validé." hero (Face ID style):
 *    check hero + fusion copy + warning banners (face missing / borderline
 *    quality) + collapsible captures grid + "Je préfère importer manuellement"
 *  - Interrupted screen with RESUME (captures kept in memory) instead of the
 *    old error + forced manual fallback
 *  - Winner verification pass during the "Scan terminé" overlay: each bin's
 *    best capture is re-analyzed on its real JPEG pixels; unacceptable winners
 *    are swapped with their runner-up (port of the app's analyzeWinnersInBackground)
 *  - "ultra" device tier (≥6GB RAM + ≥6 cores): 1920×1440 stream + 1500px
 *    captures — upload resolution parity with the app's takePhoto+resize
 *  - refineLandmarks enabled on high-end devices (iris-refined mesh → finer
 *    pose + stability). The attention model ships inside the vendored
 *    packed-assets .data, so no extra network fetch.
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
 * v9.3.1 (audit fixes, 2026-07):
 *  - Capture path reverted to v9.1-identical (pre-capture light gate removed,
 *    force-accept restored) — the audit showed the 35-48 luma band stalled
 *  - Hysteresis guaranteed-exit: 3 consecutive raw-OK probes force-unlatch
 *    (stable light in the margin band could latch forever after the webcam
 *    auto-exposure ramp)
 *  - Error frames (getImageData throw) no longer pollute the EMA nor mutate
 *    a shared singleton; out-of-frame landmarks no longer pollute skin
 *    patches (pv = valid patch count + yaw shipped in telemetry)
 *  - Pill: re-derivable visibility (auto-hides 4s after light recovers,
 *    survives resume), hidden BEFORE the complete overlay, click guarded in
 *    complete/preview, moved below the guidance chevrons (+58px)
 *  - noFace frames stamp _lightFrameT (no more 500ms phantom badLightMs) and
 *    use performance.now (pre-existing clock mix killed pose samples after
 *    the first face loss)
 *
 * v9.3 (light metering rework, 2026-07):
 *  - analyzeBright is now a PURE single-pass measurement: legacy face/bg
 *    means + histograms (percentiles, dark/clipped pixel shares) + 3×3 SKIN
 *    patches anchored on FaceMesh landmarks (forehead/nose/cheeks/chin) read
 *    from the same ImageData — measures actual skin, immune to dark hair /
 *    bright background polluting the bounding-box mean
 *  - evalLight(): EMA smoothing (α=0.35) + hysteresis on dark/bright/backlit
 *    flags — ENTRY thresholds unchanged (brightMin/Max/backlightRatio), only
 *    the EXIT requires a margin → no more flag flicker under webcam
 *    auto-exposure. Rich metrics ride along in telemetry only; decisions
 *    still run on the legacy metric until phase-2 calibration
 *
 * v9.2 (light telemetry + escape hatch, 2026-07):
 *  - Light telemetry: "light" events (face/bg luma, 1/3s, cap 40) during
 *    calibration+scanning, luma stamped on pose samples and capture events —
 *    feeds real-data threshold calibration BEFORE any tightening (phase 2)
 *  - Persistent escape hatch: after 12s of CUMULATIVE bad light, the existing
 *    "Importer manuellement" pill appears — the scan keeps running (no cutoff)
 *  - Neutral light guidance: state the problem ("Ajustez votre éclairage"),
 *    never prescribe the remedy (window vs lamp vs turn around)
 *  - (v9.2 gated captures on light and exempted light from the force-accept;
 *    the v9.3.1 audit proved both were de-facto tightenings that could stall
 *    scans v9.1 completed — REVERTED, capture path is v9.1-identical)
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

  // "ultra" tier: proven RAM + cores → we can afford a 1920×1440 stream and
  // 1500px captures (upload-resolution parity with the app, whose takePhoto
  // output is resized to 1500px before upload anyway). iOS never exposes
  // deviceMemory so iPhones stay on the safe 1280×960 "high" path.
  var isUltra = (function () {
    var mem = navigator.deviceMemory || 0;
    var cores = navigator.hardwareConcurrency || 0;
    return mem >= 6 && cores >= 6;
  })();

  var deviceTier = isUltra ? "ultra" : (isHighEnd ? "high" : (navigator.deviceMemory && navigator.deviceMemory <= 2 ? "low" : "mid"));

  /* Face mesh overlay (v9.5) — RÉSERVÉ aux appareils capables.
     Le scan a connu deux incidents récents (« scan muet » v9.4, timeouts) qui
     frappent surtout les téléphones lents : on n'ajoute AUCUN travail par
     frame sur ces appareils. Le tracé est batché (un seul beginPath/stroke
     pour ~2556 segments, ~1,5 ms mesuré), mais la règle reste : high-end
     only, et jamais au prix d'une capture. */
  var MESH_ON = isHighEnd;

  var CAM_W = isUltra ? 1920 : (isHighEnd ? 1280 : 640);
  var CAM_H = isUltra ? 1440 : (isHighEnd ? 960 : 480);
  var CAP_MAX = isUltra ? 1500 : (isHighEnd ? 1280 : 800);

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
      permBtn: "Démarrer le scan",
      permManualBtn: "Importer manuellement",
      permTimeHint: "~15 secondes",
      retakeManualLabel: "Photo",
      retakeScanLabel: "Scan",
      denied: "Accès caméra refusé. Utilisez l'import manuel.",
      notSupported: "Navigateur incompatible. Utilisez l'import manuel.",
      noDevice: "Aucune caméra frontale détectée.",
      loading: "Chargement de l'analyse faciale…",
      loadTimeout: "Chargement trop long. Vérifiez votre connexion.",

      calibTitle: "Positionnez votre visage",
      calibSub: "Placez votre visage dans l'ovale",
      calibReady: "Parfait, ne bougez pas",
      calibReadySub: "Position idéale",

      // Shown until MediaPipe's first result lands. The progressive copy below
      // ramps up clarity as the wait drags on:
      //   0–4s   → neutral "loading engine"
      //   4–12s  → "slow connection detected"
      //   12s+   → "weak connection" + inline fallback button so the user can
      //            switch to manual upload without backing out of the scan
      initializingTitle: "Initialisation de l'analyse…",
      initializingSub: "Préparation du moteur de détection",
      initializingTitleSlow: "Connexion lente détectée",
      initializingSubSlow: "Téléchargement du moteur en cours…",
      initializingTitleVerySlow: "La connexion est faible",
      initializingSubVerySlow: "Vous pouvez basculer en import manuel",
      initFallbackBtn: "Importer manuellement",
      initializingTimeout: "Connexion trop lente. Utilisez l'import manuel.",

      countdownSub: "Préparez-vous, le scan va commencer",

      // Position issues — checkPosition() in scan-engine.ts
      moveCloser: "Rapprochez-vous",
      moveCloserSub: "Votre visage est trop loin",
      moveBack: "Reculez légèrement",
      moveBackSub: "Votre visage est trop proche",
      lowLight: "Éclairage insuffisant",
      lowLightSub: "Ajustez votre éclairage",
      strongLight: "Lumière trop forte",
      strongLightSub: "Ajustez votre éclairage",
      backlight: "Contre-jour détecté",
      backlightSub: "Ajustez votre éclairage",
      centerFace: "Centrez votre visage",
      centerFaceSub: "Placez-vous dans l'ovale",
      pitchOff: "Regardez droit devant",
      pitchOffSub: "Ne baissez/levez pas la tête",
      rollOff: "Redressez la tête",
      rollOffSub: "Ne penchez pas la tête sur le côté",

      noFace: "Aucun visage détecté",
      noFaceSub: "Placez votre visage dans l'ovale",
      interrupted: "Scan interrompu",
      interruptedSub: "Relancez le scan ou utilisez l'import manuel",
      rotateTitle: "Tournez votre téléphone",
      rotateSub: "Le scan fonctionne en mode portrait",

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
      qualityLowSub: "Tenez-vous stable",
      lightDuringScan: "Éclairage insuffisant",
      lightDuringScanSub: "Ajustez votre éclairage",

      // Retake-only mode (one bin)
      retakeFor: "Reprise de l'angle",

      captured: "Capturé",
      binFace: "Face", binSemiR: "Semi D", binRight: "Profil D", binWideR: "Large D",
      binSemiL: "Semi G", binLeft: "Profil G", binWideL: "Large G",
      distance: "Distance", light: "Lumière", stability: "Stabilité",

      previewTitle: "Vos captures",
      previewHint: "Tapez sur une photo pour l'agrandir",

      // Preview — verbatim app (lib/i18n/fr/scan.json "preview"/"errors"/"zoom")
      previewValidated: "Scan validé.",
      previewFusion: "Adermio a fusionné vos 7 angles en un profil cutané unique.",
      validateCta: "Valider et continuer",
      validateHelper: "Une photo de face est requise pour valider",
      preferManual: "Je préfère importer manuellement",
      warnFaceTitle: "Photo de face manquante",
      warnFaceBody: "La photo de face est indispensable pour l'analyse.",
      warnQualityTitle: "Qualité d'image limite",
      warnQualityBody: "Vos photos pourraient être insuffisantes pour une analyse précise. Recommencez sous une meilleure lumière pour de meilleurs résultats.",
      zoomBadge: "Optionnel",
      zoomTapReplace: "Tapez pour remplacer",

      // Position (verbatim app "calibration")
      placeFaceInOval: "Placez votre visage dans l'ovale",
      adjustPhone: "Ajustez la position de votre téléphone",
      moveCloserPhoneSub: "Approchez le téléphone",
      moveBackPhoneSub: "Éloignez le téléphone",

      // Guidance PRO v4 — verbatim app (lib/i18n/fr/scan.json "guidance")
      almostRight: "Encore un tout petit peu à droite",
      almostLeft: "Encore un tout petit peu à gauche",
      almostSub: "Vous y êtes presque",
      comeBackCenter: "Revenez face à la caméra",
      comeBackCenterSub: "Regardez l'objectif",
      comeBackRight: "Tournez légèrement à droite",
      comeBackLeft: "Tournez légèrement à gauche",
      comeBackSub: "Ajustez votre position",

      // Interrupted screen (resume — verbatim app)
      intSub: "Vos captures sont conservées. Reprenez là où vous en étiez.",
      btnResume: "Reprendre le scan",

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
      permBtn: "Start scan",
      permManualBtn: "Upload manually",
      permTimeHint: "~15 seconds",
      retakeManualLabel: "Photo",
      retakeScanLabel: "Scan",
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
      initializingTitleSlow: "Slow connection detected",
      initializingSubSlow: "Downloading the engine…",
      initializingTitleVerySlow: "Weak connection",
      initializingSubVerySlow: "You can switch to manual upload",
      initFallbackBtn: "Upload manually",
      initializingTimeout: "Connection too slow. Use manual upload.",

      countdownSub: "Get ready, scan is about to start",

      moveCloser: "Move closer",
      moveCloserSub: "Your face is too far",
      moveBack: "Move slightly back",
      moveBackSub: "Your face is too close",
      lowLight: "Insufficient lighting",
      lowLightSub: "Adjust your lighting",
      strongLight: "Too much light",
      strongLightSub: "Adjust your lighting",
      backlight: "Backlight detected",
      backlightSub: "Adjust your lighting",
      centerFace: "Center your face",
      centerFaceSub: "Place yourself in the oval",
      pitchOff: "Look straight ahead",
      pitchOffSub: "Don't tilt your head up or down",
      rollOff: "Straighten your head",
      rollOffSub: "Don't tilt your head sideways",

      noFace: "No face detected",
      noFaceSub: "Place your face in the oval",
      interrupted: "Scan interrupted",
      interruptedSub: "Restart the scan or use manual upload",
      rotateTitle: "Rotate your phone",
      rotateSub: "The scan only works in portrait",

      scanFace: "Look at the camera",
      scanFaceSub: "Stay facing forward",
      scanRight1: "Turn your head to the right",
      scanRight1Sub: "Slowly, show your profile",
      scanRight2: "Keep turning right",
      scanRight2Sub: "Show your profile",
      scanRight3: "A little more to the right",
      scanRight3Sub: "Show your ear",
      scanLeft1: "Turn your head to the left",
      scanLeft1Sub: "Slowly, show your profile",
      scanLeft2: "Keep turning left",
      scanLeft2Sub: "Show your profile",
      scanLeft3: "A little more to the left",
      scanLeft3Sub: "Show your ear",
      scanDone: "Scan complete",
      scanDoneSub: "Analyzing your captures…",

      qualityLow: "Quality too low",
      qualityLowSub: "Hold still",
      lightDuringScan: "Insufficient lighting",
      lightDuringScanSub: "Adjust your lighting",

      retakeFor: "Retaking",

      captured: "Captured",
      binFace: "Front", binSemiR: "Semi R", binRight: "Profile R", binWideR: "Wide R",
      binSemiL: "Semi L", binLeft: "Profile L", binWideL: "Wide L",
      distance: "Distance", light: "Light", stability: "Stability",

      previewTitle: "Your captures",
      previewHint: "Tap a photo to enlarge",

      previewValidated: "Scan complete.",
      previewFusion: "Adermio has merged your 7 angles into a unique skin profile.",
      validateCta: "Validate and continue",
      validateHelper: "A front photo is required to validate",
      preferManual: "I'd rather import manually",
      warnFaceTitle: "Face photo missing",
      warnFaceBody: "The front photo is essential for analysis.",
      warnQualityTitle: "Borderline image quality",
      warnQualityBody: "Your photos may not be sufficient for accurate analysis. Try again with better lighting for best results.",
      zoomBadge: "Optional",
      zoomTapReplace: "Tap to replace",

      placeFaceInOval: "Place your face inside the oval",
      adjustPhone: "Adjust your phone position",
      moveCloserPhoneSub: "Bring the phone closer",
      moveBackPhoneSub: "Move the phone further",

      almostRight: "Just a tiny bit more to the right",
      almostLeft: "Just a tiny bit more to the left",
      almostSub: "You're almost there",
      comeBackCenter: "Come back facing the camera",
      comeBackCenterSub: "Look at the lens",
      comeBackRight: "Turn slightly to the right",
      comeBackLeft: "Turn slightly to the left",
      comeBackSub: "Adjust your position",

      intSub: "Your captures are saved. Pick up where you left off.",
      btnResume: "Resume scan",

      excellent: "Excellent", good: "Good", ok: "OK", missing: "Missing",
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
    es: {
      permTitle: "Análisis en alta definición",
      permDesc: "7 capturas automáticas desde diferentes ángulos para máxima precisión. No se conservan datos de vídeo.",
      permBtn: "Iniciar el escaneo",
      permManualBtn: "Subir manualmente",
      permTimeHint: "~15 segundos",
      retakeManualLabel: "Foto",
      retakeScanLabel: "Escaneo",
      denied: "Acceso a la cámara denegado. Usa la subida manual.",
      notSupported: "Navegador no compatible. Usa la subida manual.",
      noDevice: "No se ha detectado ninguna cámara frontal.",
      loading: "Cargando el análisis facial…",
      loadTimeout: "Carga demasiado lenta. Verifica tu conexión.",

      calibTitle: "Coloca tu rostro",
      calibSub: "Coloca tu rostro dentro del óvalo",
      calibReady: "Perfecto, no te muevas",
      calibReadySub: "Posición ideal",

      initializingTitle: "Iniciando el análisis…",
      initializingSub: "Cargando el motor de detección",
      initializingTitleSlow: "Conexión lenta detectada",
      initializingSubSlow: "Descargando el motor…",
      initializingTitleVerySlow: "Conexión débil",
      initializingSubVerySlow: "Puedes cambiar a la subida manual",
      initFallbackBtn: "Subir manualmente",
      initializingTimeout: "Conexión demasiado lenta. Usa la subida manual.",

      countdownSub: "Prepárate, el escaneo va a empezar",

      moveCloser: "Acércate",
      moveCloserSub: "Tu rostro está demasiado lejos",
      moveBack: "Aléjate un poco",
      moveBackSub: "Tu rostro está demasiado cerca",
      lowLight: "Iluminación insuficiente",
      lowLightSub: "Ajusta tu iluminación",
      strongLight: "Demasiada luz",
      strongLightSub: "Ajusta tu iluminación",
      backlight: "Contraluz detectado",
      backlightSub: "Ajusta tu iluminación",
      centerFace: "Centra tu rostro",
      centerFaceSub: "Colócate dentro del óvalo",
      pitchOff: "Mira al frente",
      pitchOffSub: "No inclines la cabeza arriba o abajo",
      rollOff: "Endereza la cabeza",
      rollOffSub: "No inclines la cabeza hacia un lado",

      noFace: "No se detecta ningún rostro",
      noFaceSub: "Coloca tu rostro dentro del óvalo",
      interrupted: "Escaneo interrumpido",
      interruptedSub: "Reinicia el escaneo o usa la subida manual",
      rotateTitle: "Gira tu teléfono",
      rotateSub: "El escaneo solo funciona en modo retrato",

      scanFace: "Mira a la cámara",
      scanFaceSub: "Quédate mirando al frente",
      scanRight1: "Gira la cabeza a la derecha",
      scanRight1Sub: "Despacio, muestra tu perfil",
      scanRight2: "Sigue girando a la derecha",
      scanRight2Sub: "Muestra tu perfil",
      scanRight3: "Un poco más a la derecha",
      scanRight3Sub: "Muestra tu oreja",
      scanLeft1: "Gira la cabeza a la izquierda",
      scanLeft1Sub: "Despacio, muestra tu perfil",
      scanLeft2: "Sigue girando a la izquierda",
      scanLeft2Sub: "Muestra tu perfil",
      scanLeft3: "Un poco más a la izquierda",
      scanLeft3Sub: "Muestra tu oreja",
      scanDone: "Escaneo completado",
      scanDoneSub: "Analizando tus capturas…",

      qualityLow: "Calidad insuficiente",
      qualityLowSub: "Mantente quieto",
      lightDuringScan: "Iluminación insuficiente",
      lightDuringScanSub: "Ajusta tu iluminación",

      retakeFor: "Repitiendo el ángulo",

      captured: "Capturado",
      binFace: "Frente", binSemiR: "Semi D", binRight: "Perfil D", binWideR: "Amplio D",
      binSemiL: "Semi I", binLeft: "Perfil I", binWideL: "Amplio I",
      distance: "Distancia", light: "Luz", stability: "Estabilidad",

      previewTitle: "Tus capturas",
      previewHint: "Toca una foto para ampliarla",

      previewValidated: "Escaneo validado.",
      previewFusion: "Adermio ha fusionado tus 7 ángulos en un perfil cutáneo único.",
      validateCta: "Validar y continuar",
      validateHelper: "Se requiere una foto frontal para validar",
      preferManual: "Prefiero subir manualmente",
      warnFaceTitle: "Falta la foto frontal",
      warnFaceBody: "La foto frontal es imprescindible para el análisis.",
      warnQualityTitle: "Calidad de imagen justa",
      warnQualityBody: "Tus fotos podrían ser insuficientes para un análisis preciso. Vuelve a intentarlo con mejor luz para obtener mejores resultados.",
      zoomBadge: "Opcional",
      zoomTapReplace: "Toca para reemplazar",

      placeFaceInOval: "Coloca tu rostro dentro del óvalo",
      adjustPhone: "Ajusta la posición de tu teléfono",
      moveCloserPhoneSub: "Acerca el teléfono",
      moveBackPhoneSub: "Aleja el teléfono",

      almostRight: "Un poquito más a la derecha",
      almostLeft: "Un poquito más a la izquierda",
      almostSub: "Ya casi estás",
      comeBackCenter: "Vuelve a mirar a la cámara",
      comeBackCenterSub: "Mira al objetivo",
      comeBackRight: "Gira ligeramente a la derecha",
      comeBackLeft: "Gira ligeramente a la izquierda",
      comeBackSub: "Ajusta tu posición",

      intSub: "Tus capturas se han conservado. Continúa donde lo dejaste.",
      btnResume: "Reanudar el escaneo",

      excellent: "Excelente", good: "Bien", ok: "Aceptable", missing: "Falta",
      keep: "Conservar", retakeOne: "Volver a tomar",
      retake: "Repetir", validate: "Validar y continuar",
      restart: "Reiniciar el escaneo",
      uploading: "Enviando…",
      uploadFail: "Error de envío, inténtalo de nuevo",

      zoomBtn: "Añadir un primer plano",
      zoomSub: "Foto de una zona específica (opcional)",
      zoomAdded: "Primer plano añadido",

      noDataStored: "No se conservan datos de vídeo",
      anglesCaptured: "ángulos capturados",
      angleCaptured: "ángulo capturado",
    },
  };

  /* ═══════════════════════════════════════════════════════════
     CONFIG — synced with mobile app (lib/scan-engine.ts CFG)
     ═══════════════════════════════════════════════════════════ */
  var CFG = {
    // 0.40 restored (2026-07-08, retour terrain Antoine) : le web à 0.32
    // acceptait des visages plus lointains que l'app. Les deux plateformes
    // partagent le seuil nominal 0.32, mais l'app mesure la BOUNDING BOX
    // MLKit (plus grande) là où le web mesure la distance front→menton du
    // mesh MediaPipe (plus petite) — à seuil égal, le web était donc
    // physiquement plus permissif. 0.40 sur la mesure mesh ≈ 0.32 sur la
    // bbox MLKit → même distance effective que l'app.
    faceSizeMin: 0.40,
    faceSizeMax: 0.70,  // unchanged — still allow very close zoom-in
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
    lightSampleMs: 3000,     // v9.2 — télémétrie lumière : 1 event / 3s (calibration + scan)
    lightFallbackMs: 12000,  // v9.2 — lumière mauvaise CUMULÉE avant d'offrir l'import manuel
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

  function headPose(m, aspect) {
    var lc = pt(m, LM.lCheek), rc = pt(m, LM.rCheek), ch = pt(m, LM.chin), fh = pt(m, LM.forehead);
    var hx = rc.x - lc.x, hy = rc.y - lc.y, hz = rc.z - lc.z;
    var vx = fh.x - ch.x, vy = fh.y - ch.y, vz = fh.z - ch.z;
    var nx = hy * vz - hz * vy, ny = hz * vx - hx * vz, nz = hx * vy - hy * vx;
    var nLen = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1e-9;
    // MediaPipe normalizes x by video WIDTH and y by HEIGHT (z ~ width-scaled).
    // In portrait (h>w) that anisotropy understates the y-terms of the normal,
    // which INFLATES the measured pitch by ~h/w (1.78 on a 9:16 phone stream):
    // pitchMax 20° behaved like a ~11° physical gate — users holding the phone
    // slightly low got stuck on pitchOff (field report, ES launch test).
    // Corrected normal in isotropic (width) units is (A·nx, ny, A·nz), so only
    // the pitch denominator changes. Yaw is left as-is on purpose: its ratio
    // nx/nz cancels the y-scale, so the tuned bin thresholds stay valid. Roll
    // is left as-is too (under-measured = more tolerant, field-validated).
    var A = aspect || 1;
    var pLen = Math.sqrt(A * A * (nx * nx + nz * nz) + ny * ny) || 1e-9;
    // Roll: rotation of the cheek-to-cheek line in the image plane (z dropped).
    // atan2(hy, hx) gives the angle of the cheek vector vs horizontal.
    return {
      yaw: (Math.atan2(nx, -nz) * 180) / Math.PI,
      pitch: (Math.asin(Math.max(-1, Math.min(1, -ny / pLen))) * 180) / Math.PI,
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
  var _bc = null, _bx = null, _lc = null, _lx = null, _blurBuf = null;

  // v9.3 — Mesure de lumière enrichie, UNE seule passe sur la frame 120×90 :
  //   • moyennes visage/fond (métrique LEGACY — les seuils actuels s'y réfèrent)
  //   • histogrammes → percentiles + part de pixels sombres (<30) / cramés
  //     (>250) sur le visage : détecte le demi-visage dans l'ombre et le flash
  //     cramé que la MOYENNE ne voit pas (100 uniforme ≠ moitié 30 / moitié 170)
  //   • patchs de PEAU 3×3 ancrés sur les landmarks (front/nez/joues/menton),
  //     lus dans la MÊME ImageData : mesure la peau réelle, insensible aux
  //     cheveux foncés / fond clair que la bounding box mélange à la moyenne
  // Fonction PURE (mesure only) : les décisions dark/bright/bl sont prises par
  // evalLight() — lissage + hystérèse (l'auto-exposition webcam fait osciller
  // la mesure brute, les flags ne doivent pas clignoter).
  var SKIN_LM = [151, 6, 50, 280, 200]; // front, arête du nez, joue G, joue D, menton

  function patchLuma(d, sw, sh, nx, ny) {
    var cx = Math.max(1, Math.min(sw - 2, Math.round(nx * sw)));
    var cy = Math.max(1, Math.min(sh - 2, Math.round(ny * sh)));
    var s = 0;
    for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
      var i = ((cy + dy) * sw + (cx + dx)) * 4;
      s += d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
    }
    return s / 9;
  }

  function percentileFromHist(hist, total, p) {
    if (total <= 0) return 0;
    var target = total * p, acc = 0;
    for (var b = 0; b < 64; b++) { acc += hist[b]; if (acc >= target) return b * 4 + 2; }
    return 254;
  }

  function neutralBright() {
    // Objet FRAIS à chaque appel — JAMAIS un singleton : evalLight écrit les
    // flags dans l'objet retourné, un singleton serait muté et S.cBr en
    // deviendrait un alias partagé entre frames (audit v9.3.1). `err:true`
    // signale à evalLight que les valeurs sont FABRIQUÉES (frame en échec) et
    // ne doivent pas entrer dans l'EMA.
    return { face: 128, bg: 128, r: 1, skinMed: 128, skinMin: 128, darkShare: 0, clipShare: 0, asym: 0, bgP90: 128, faceP10: 128, pv: 0, err: true };
  }

  function analyzeBright(video, m) {
    if (!_bc) { _bc = document.createElement("canvas"); _bx = _bc.getContext("2d", { willReadFrequently: true }); }
    var sw = 120, sh = 90; _bc.width = sw; _bc.height = sh;
    try { _bx.drawImage(video, 0, 0, sw, sh); var d = _bx.getImageData(0, 0, sw, sh).data; }
    catch (e) { return neutralBright(); }
    var fb = faceBounds(m);
    var fs = 0, fp = 0, bs = 0, bp = 0, fDark = 0, fClip = 0;
    var fHist = new Int32Array(64), bHist = new Int32Array(64);
    for (var y = 0; y < sh; y++) for (var x = 0; x < sw; x++) {
      var i = (y * sw + x) * 4;
      var l = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
      var nx2 = x / sw, ny2 = y / sh;
      if (nx2 >= fb.x0 && nx2 <= fb.x1 && ny2 >= fb.y0 && ny2 <= fb.y1) {
        fs += l; fp++; fHist[Math.min(63, l >> 2)]++;
        if (l < 30) fDark++; else if (l > 250) fClip++;
      } else { bs += l; bp++; bHist[Math.min(63, l >> 2)]++; }
    }
    var face = fp > 0 ? fs / fp : 128, bg = bp > 0 ? bs / bp : 128;
    // Patchs peau : lus dans la même ImageData (les landmarks sont normalisés
    // 0..1 sur la frame vidéo, exactement comme faceBounds → même mapping).
    var patchVals = [null, null, null, null, null];
    if (m && m.length > 280) {
      for (var k = 0; k < SKIN_LM.length; k++) {
        var lm = m[SKIN_LM[k]];
        // Landmark hors cadre (MediaPipe renvoie x/y <0 ou >1 au bord) : le
        // clamp de patchLuma mesurerait le BORD (fond/cheveux) au lieu de la
        // peau → patch INVALIDÉ (audit v9.3.1). `pv` (nb de patchs valides)
        // part en télémétrie pour que la calibration phase 2 filtre.
        if (lm && lm.x >= 0 && lm.x <= 1 && lm.y >= 0 && lm.y <= 1) {
          patchVals[k] = patchLuma(d, sw, sh, lm.x, lm.y);
        }
      }
    }
    var patches = [];
    for (var k2 = 0; k2 < patchVals.length; k2++) if (patchVals[k2] != null) patches.push(patchVals[k2]);
    var sorted = patches.slice().sort(function (a, b2) { return a - b2; });
    return {
      face: face, bg: bg, r: bg > 1 ? face / bg : 1,
      skinMed: sorted.length ? sorted[Math.floor(sorted.length / 2)] : face,
      skinMin: sorted.length ? sorted[0] : face,
      darkShare: fp > 0 ? fDark / fp : 0,
      clipShare: fp > 0 ? fClip / fp : 0,
      // Asymétrie : uniquement si les DEUX joues sont des patchs valides.
      asym: (patchVals[2] != null && patchVals[3] != null) ? Math.abs(patchVals[2] - patchVals[3]) : 0,
      pv: patches.length,
      bgP90: percentileFromHist(bHist, bp, 0.9),
      faceP10: percentileFromHist(fHist, fp, 0.1),
    };
  }

  // v9.3 — Décision lissée + hystérèse. Les seuils d'ENTRÉE en état mauvais
  // sont EXACTEMENT les seuils historiques (brightMin/brightMax/backlightRatio
  // — aucun resserrage de facto) ; seule la SORTIE exige une marge (+8 luma /
  // +0.08 ratio) et la mesure est lissée (EMA α=0.35, ~0.5s de constante de
  // temps au rythme des probes) → les flags ne clignotent plus au rythme de
  // l'auto-exposition. Les métriques riches (patchs peau, percentiles, parts
  // sombres/cramées) sont TRANSPORTÉES pour la télémétrie mais ne décident
  // encore rien : c'est la calibration phase 2 qui fera ce basculement.
  // `face` reste la valeur BRUTE instantanée (analyzePhotoQuality juge LA
  // frame capturée, pas une moyenne glissante).
  function evalLight(S, raw) {
    var fl = S._lFlags || { dark: false, bright: false, bl: false };
    // Frame en échec (getImageData a jeté) : valeurs fabriquées (128) — ne
    // JAMAIS les injecter dans l'EMA, sinon un hiccup vidéo fait sortir un
    // vrai état sombre de l'hystérèse (EMA 30 → 64 sans changement de
    // lumière, audit v9.3.1). On rejoue les flags courants tels quels.
    if (raw.err) {
      raw.dark = fl.dark; raw.bright = fl.bright; raw.bl = fl.bl;
      raw.ok = !fl.dark && !fl.bright && !fl.bl;
      return raw;
    }
    var a = 0.35;
    S._lEmaF = S._lEmaF == null ? raw.face : S._lEmaF + a * (raw.face - S._lEmaF);
    S._lEmaB = S._lEmaB == null ? raw.bg : S._lEmaB + a * (raw.bg - S._lEmaB);
    var emaR = S._lEmaB > 1 ? S._lEmaF / S._lEmaB : 1;
    // Verdict BRUT v9.1 (sans lissage) : sert d'override de sortie garanti.
    var rawOk = raw.face >= CFG.brightMin && raw.face <= CFG.brightMax && !(raw.r < CFG.backlightRatio && raw.bg > 80);
    S._lRawOkStreak = rawOk ? (S._lRawOkStreak || 0) + 1 : 0;
    var dark = fl.dark ? S._lEmaF < CFG.brightMin + 8 : S._lEmaF < CFG.brightMin;
    var bright = fl.bright ? S._lEmaF > CFG.brightMax - 8 : S._lEmaF > CFG.brightMax;
    var bgHigh = S._lEmaB > 80;
    var bl = fl.bl ? (emaR < CFG.backlightRatio + 0.08 && bgHigh) : (emaR < CFG.backlightRatio && bgHigh);
    // Anti-piège du régime permanent (audit v9.3.1) : une lumière STABLE dans
    // la bande de marge (ex. luma 44 ∈ [40,48)) restait latchée POUR TOUJOURS
    // — la rampe d'auto-exposition au boot garantissait le latch initial, et
    // la v9.1 considérait 44 comme OK. Règle : 3 probes consécutives au
    // verdict BRUT v9.1 bon ⇒ déverrouillage forcé. En régime permanent les
    // flags convergent donc vers la sémantique v9.1 (<1s) ; seuls les
    // transitoires (spikes d'auto-exposition) restent lissés.
    if (S._lRawOkStreak >= 3) { dark = false; bright = false; bl = false; }
    S._lFlags = { dark: dark, bright: bright, bl: bl };
    raw.ok = !dark && !bright && !bl;
    raw.dark = dark; raw.bright = bright; raw.bl = bl;
    return raw;
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
     WINNER VERIFICATION — port of the app's analyzeWinnersInBackground.
     The per-capture quality gate uses brightness/blur sampled from the LIVE
     video a few frames before the capture (≤200ms of drift). This pass
     re-measures each bin's winning JPEG on its REAL stored pixels during the
     1.5s "Scan terminé" overlay, and swaps in the runner-up when the winner
     turns out unacceptable. Analysis window: center 60% crop downscaled to
     120×120 — same scale as analyzeBlur, so CFG.postBlurMinReject and the
     brightness reject thresholds stay directly comparable.
     ═══════════════════════════════════════════════════════════ */
  function analyzeBlobQuality(blob) {
    return new Promise(function (resolve) {
      var bmpPromise = (typeof createImageBitmap === "function")
        ? createImageBitmap(blob).catch(function () { return null; })
        : Promise.resolve(null);
      bmpPromise.then(function (bmp) {
        if (!bmp) { resolve(null); return; }
        try {
          var cw = 120, ch = 120;
          var cv = document.createElement("canvas");
          cv.width = cw; cv.height = ch;
          var cx = cv.getContext("2d", { willReadFrequently: true });
          // Center 60% crop — winners are face-centered by construction
          // (captures only fire when distOk + centering hold).
          var sx = bmp.width * 0.2, sy = bmp.height * 0.2;
          var sw = bmp.width * 0.6, sh = bmp.height * 0.6;
          cx.drawImage(bmp, sx, sy, sw, sh, 0, 0, cw, ch);
          var d = cx.getImageData(0, 0, cw, ch).data;
          try { bmp.close(); } catch (_) {}
          var g = new Float32Array(cw * ch);
          var lumaSum = 0;
          for (var i = 0; i < g.length; i++) {
            g[i] = d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114;
            lumaSum += g[i];
          }
          var sum = 0, n = 0;
          for (var y = 1; y < ch - 1; y++) for (var x = 1; x < cw - 1; x++) {
            var lap = -4 * g[y * cw + x] + g[(y - 1) * cw + x] + g[(y + 1) * cw + x] + g[y * cw + x - 1] + g[y * cw + x + 1];
            sum += lap * lap; n++;
          }
          resolve({ luma: lumaSum / g.length, lap: n > 0 ? sum / n : 0 });
        } catch (e) {
          try { bmp.close(); } catch (_) {}
          resolve(null);
        }
      });
    });
  }

  function blobQualityUnacceptable(q) {
    return q.luma < CFG.postBrightMinReject || q.luma > CFG.postBrightMaxReject || q.lap < CFG.postBlurMinReject;
  }

  /* ═══════════════════════════════════════════════════════════
     v9.8 — SCORING SUR PIXELS RÉELS (jalon 1, spec 2026-07-15)
     Fonctions PURES (aucune capture de CFG/S) : extraites telles
     quelles par tests/scan-quality.test.mjs. Ne pas les faire
     dépendre de l'extérieur — passer les constantes en paramètre.
     ═══════════════════════════════════════════════════════════ */

  // Score d'un candidat sur les mesures RÉELLES de son JPEG.
  // Remplace le proxy vidéo (aveugle au flou de mouvement créé dans les
  // ~100 ms entre la mesure preview et la capture). La stabilité sort du
  // score : elle n'était qu'un proxy du flou, désormais mesuré.
  function scoreCandidateReal(lap, luma, absYaw, idealYaw, C) {
    var sharp = Math.min(1, lap / C.blurIdeal);
    var angle = Math.max(0, 1 - Math.abs(absYaw - idealYaw) / 25);
    var expo = Math.max(0, 1 - Math.abs(luma - C.brightIdeal) / C.brightIdeal);
    return sharp * 0.45 + angle * 0.35 + expo * 0.20;
  }

  // Verdict accept/reject sur mesures réelles — mêmes seuils durs et même
  // priorité (lumière avant flou) que analyzePhotoQuality, qui reste le
  // repli quand le blob ne se décode pas.
  function realQualityVerdict(lap, luma, C) {
    if (luma < C.postBrightMinReject) return "lowLight";
    if (luma > C.postBrightMaxReject) return "strongLight";
    if (lap < C.postBlurMinReject) return "blur";
    return null;
  }

  // Borne supérieure du score réel quand netteté/expo sont encore inconnues
  // (pré-flight : l'angle, lui, est connu avant capture).
  function bestPossibleRealScore(absYaw, idealYaw) {
    var angle = Math.max(0, 1 - Math.abs(absYaw - idealYaw) / 25);
    return 0.45 + angle * 0.35 + 0.20;
  }

  // Sélection finale d'un bin : meilleur candidat UTILISABLE (candidats déjà
  // triés score desc), sinon moins-pire (idx 0). Un provisoire (blob non
  // décodé) est utilisable — bénéfice du doute, comme aujourd'hui.
  // proxyRank = rang qu'aurait eu le vainqueur sous l'ancien score proxy →
  // mesure directe, dans scan_log, de ce que le scoring réel change.
  function selectBinFinal(cands, C) {
    var winnerIdx = 0, winnerUsable = false;
    for (var i = 0; i < cands.length; i++) {
      var u = cands[i].provisional || realQualityVerdict(cands[i].lap, cands[i].luma, C) === null;
      if (u) { winnerIdx = i; winnerUsable = true; break; }
    }
    var rank = 1;
    for (var j = 0; j < cands.length; j++) {
      if (j !== winnerIdx && cands[j].pScore > cands[winnerIdx].pScore) rank++;
    }
    return { winnerIdx: winnerIdx, winnerUsable: winnerUsable, proxyRank: rank };
  }

  // Équivalent overallScore d'analyzePhotoQuality, sur mesures réelles —
  // sert uniquement à pScore (télémétrie proxyRank de final_selection).
  function quality0to1(lap, luma) {
    var b = Math.max(0, 1 - Math.abs(luma - CFG.brightIdeal) / 90);
    var s = Math.min(1, lap / CFG.blurIdeal);
    return b * 0.5 + s * 0.5;
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
    this.samples = [];
    this.sessionStart = 0;
  }
  ScanLogger.prototype.start = function (tier) {
    this.events = [];
    this.samples = [];
    this.sessionStart = Date.now();
    this.events.push({ type: "scan_start", timestamp: this.sessionStart, deviceTier: tier });
  };
  // Échantillon de pose (1 point / 2s pendant le scan, cap 60) : diagnostic
  // sans image des scans qui stagnent — dit si l'utilisateur n'a jamais
  // tourné, a tourné trop loin, est sorti du cadre ou a posé le téléphone.
  ScanLogger.prototype.logPoseSample = function (s) {
    if (this.samples.length < 60) this.samples.push(s);
  };
  ScanLogger.prototype.log = function (e) { this.events.push(e); };
  ScanLogger.prototype.logCapture = function (bin, score, wasNew, f, b, sm, lap) {
    var e = { type: "capture", timestamp: Date.now(), bin: bin, score: score, wasNew: wasNew, f: f, b: b, sm: sm };
    if (lap !== undefined) e.lap = lap; // v9.8 : netteté réelle du JPEG banké
    this.events.push(e);
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
      samples: this.samples,
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

  /* ═══════════════════════════════════════════════════════════
     STATE
     ═══════════════════════════════════════════════════════════ */
  function mkState() {
    var bins = {};
    for (var i = 0; i < BIN_IDS.length; i++) bins[BIN_IDS[i]] = [];
    return {
      phase: "idle", bins: bins, calibSince: null,
      countdownStart: null, scanStart: null, lastCapt: 0, lastProbe: 0, lastNewBinAt: 0, lastPoseSample: 0, _capturingSince: 0, _capGen: 0,
      prev: null, prevT: null,
      // Face mesh overlay (v9.5) — cosmétique, aucune décision n'en dépend
      mesh: { lm: null, t: 0, vw: 0, vh: 0, op: 0, logged: false },
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
      // v9.2 — lumière : cumul du temps en éclairage jugé mauvais + télémétrie.
      badLightMs: 0, _lightFrameT: 0, _lastLightEvt: 0, lightEvts: 0, lightPillShown: false, _lastBadT: 0, _pillLogged: false,
      _lEmaF: null, _lEmaB: null, _lFlags: null, _lRawOkStreak: 0, // v9.3 — lissage + hystérèse lumière
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
    /* Pre-scan choice screen — matches the design Antoine validated:
         primary "Démarrer le scan" pill (scan-corners icon) over a dashed
         "Importer manuellement" pill, with the privacy line below. The two
         CTAs live INSIDE the widget so the post-scan flow can return to this
         choice (via "Recommencer le scan") without falling back to a
         confusing standalone manual button outside the widget. */
    + '<div id="fs-perm" style="padding:20px 24px 22px;text-align:center;background:#FAFAF9;color:#1f2937;">'
    + '<button id="fs-go" style="width:100%;padding:18px 20px;border:none;border-radius:9999px;background:#0F3D39;color:#fff;font-size:13px;font-weight:700;cursor:pointer;letter-spacing:1.5px;text-transform:uppercase;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 8px 20px -8px rgba(15,61,57,.4);">'
    +   '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/></svg>'
    +   t.permBtn
    + '</button>'
    + '<p style="font-size:11px;color:#a8a29e;margin:10px 0 14px;font-weight:400;">' + t.permTimeHint + '</p>'
    + '<button id="fs-perm-manual" type="button" style="width:100%;padding:14px 20px;border:1px dashed #d6d3d1;border-radius:9999px;background:transparent;color:#a8a29e;font-size:11px;font-weight:700;cursor:pointer;letter-spacing:1.5px;text-transform:uppercase;display:flex;align-items:center;justify-content:center;gap:8px;transition:border-color .15s,color .15s;">'
    +   '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>'
    +   t.permManualBtn
    + '</button>'
    + '<div style="display:flex;align-items:center;gap:5px;justify-content:center;margin-top:14px;opacity:.4;">'
    + '<svg width="11" height="11" fill="none" stroke="#44403C" stroke-width="1.5" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'
    + '<span style="font-size:9px;color:#44403C;font-weight:500;letter-spacing:.05em;">' + t.noDataStored + '</span>'
    + '</div>'
    + '</div>'
    + '<div id="fs-load" style="display:none;padding:64px 28px;text-align:center;background:#FAFAF9;color:#1f2937;">'
    + '<div style="width:36px;height:36px;margin:0 auto 20px;border:2px solid #e7e5e4;border-top-color:#0F3D39;border-radius:50%;animation:fsSpin .7s linear infinite;"></div>'
    + '<p style="font-size:13px;color:#78716c;font-weight:400;">' + t.loading + '</p>'
    + '</div>'
    /* Scan screen — DOM-driven overlay (matches mobile step7.tsx layout):
       canvas only paints the dim mask + oval border + progress arc.
       Everything else (top bar, dots, instructions, arrows, countdown,
       badges, progress bar, complete overlay) is DOM, mirroring the mobile
       View hierarchy 1:1 in placement, animation and styling. */
    + '<div id="fs-scan" style="display:none;position:relative;background:#000;overflow:hidden;width:100%;height:100%;">'
    + '<video id="fs-v" playsinline autoplay muted style="width:100%;height:100%;display:block;object-fit:cover;transform:scaleX(-1);"></video>'
    + '<canvas id="fs-ov" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1;"></canvas>'

    /* Top bar: cancel × + dot strip + gallery shortcut (parity with mobile cTop) */
    + '<div id="fs-top" style="position:absolute;top:0;left:0;right:0;display:flex;justify-content:space-between;align-items:center;padding:calc(12px + env(safe-area-inset-top, 0px)) 16px 0;z-index:10;">'
    +   '<button id="fs-cancel" class="fs-cBtn" aria-label="Fermer">'
    +     '<svg width="18" height="18" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>'
    +   '</button>'
    +   '<div id="fs-dots-strip" style="display:flex;align-items:center;gap:4px;"></div>'
    +   '<button id="fs-gallery" class="fs-cBtn" aria-label="Importer">'
    +     '<svg width="18" height="18" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>'
    +   '</button>'
    + '</div>'

    /* Retake banner — anchored ABOVE the bottom controls (was at top, where it
       overlapped the dot strip and the instructions during retake-scan mode).
       Sits between the under-oval chevrons and the progress bar so it never
       fights the position-guidance copy for screen real estate. */
    + '<div id="fs-retakebadge" style="display:none;position:absolute;bottom:calc(72px + env(safe-area-inset-bottom, 0px));left:50%;transform:translateX(-50%);z-index:6;padding:7px 16px;border-radius:999px;background:rgba(20,184,166,.22);border:1px solid rgba(20,184,166,.5);color:#5eead4;font-size:10.5px;font-weight:600;letter-spacing:.6px;text-transform:uppercase;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);box-shadow:0 6px 16px -8px rgba(0,0,0,.4);white-space:nowrap;"></div>'

    /* Instructions ABOVE the oval — wrapped in a backdrop-blur pill so they
       stay legible regardless of what the camera is pointing at (white walls,
       windows, mixed lighting). Real-user feedback: the previous floating
       white text vanished on bright scenes. The pill auto-shrinks to content
       width thanks to inline-block. z-index 11 + pointer-events:none means it
       overlays the top bar visually on small phones (iPhone SE) without
       blocking the close/gallery buttons underneath. */
    + '<div id="fs-instr-above" style="position:absolute;top:calc(46% - 45.9vw - 65px);left:0;right:0;display:flex;justify-content:center;z-index:11;pointer-events:none;padding:0 16px;">'
    +   '<div style="display:inline-block;padding:9px 18px;border-radius:18px;background:rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.10);backdrop-filter:blur(12px) saturate(1.3);-webkit-backdrop-filter:blur(12px) saturate(1.3);text-align:center;max-width:100%;box-shadow:0 4px 16px -4px rgba(0,0,0,.4);">'
    +     '<p id="fs-t1" style="color:#fff;font-size:19px;font-weight:700;margin:0 0 3px;font-family:\'DM Sans\',sans-serif;line-height:1.2;letter-spacing:-0.1px;"></p>'
    +     '<p id="fs-t2" style="color:rgba(255,255,255,.78);font-size:13px;margin:0;font-weight:400;line-height:1.35;font-family:\'DM Sans\',sans-serif;"></p>'
    +   '</div>'
    + '</div>'

    /* Side chevron arrow — vertically centered on the oval, animated translateX */
    + '<div id="fs-arrow-side" class="fs-arrow-side" style="display:none;">'
    +   '<svg width="32" height="32" fill="none" stroke="#14B8A6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>'
    + '</div>'

    /* Triple chevrons under the oval (1.0/0.5/0.2 opacity, animated) */
    /* Capteurs Distance/Lumière/Stabilité — ancrés JUSTE SOUS L'OVALE
       (même repère que les chevrons : 46% = centre, 45.9vw = rayon), là où
       l'œil est déjà posé. Ils étaient collés en bas de l'écran en 9px : à
       l'opposé du regard et illisibles. Icône + libellé + pastille colorée :
       on lit l'état d'un coup d'œil sans décoder un point de 5px. */
    + '<div id="fs-badges-row">'
    +   '<div class="fs-badge" id="fs-bdg-dist">'
    +     '<svg class="fs-bico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>'
    +     '<span class="fs-blbl">' + t.distance + '</span>'
    +   '</div>'
    +   '<div class="fs-badge" id="fs-bdg-light">'
    +     '<svg class="fs-bico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/></svg>'
    +     '<span class="fs-blbl">' + t.light + '</span>'
    +   '</div>'
    +   '<div class="fs-badge" id="fs-bdg-stab">'
    +     '<svg class="fs-bico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>'
    +     '<span class="fs-blbl">' + t.stability + '</span>'
    +   '</div>'
    + '</div>'

    + '<div id="fs-arrow-under" class="fs-arrow-under" style="display:none;">'
    +   '<svg width="22" height="22" fill="none" stroke="#14B8A6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" style="opacity:1;"><polyline points="9 18 15 12 9 6"/></svg>'
    +   '<svg width="22" height="22" fill="none" stroke="#14B8A6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" style="opacity:.5;margin-left:-8px;"><polyline points="9 18 15 12 9 6"/></svg>'
    +   '<svg width="22" height="22" fill="none" stroke="#14B8A6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" style="opacity:.2;margin-left:-8px;"><polyline points="9 18 15 12 9 6"/></svg>'
    + '</div>'

    /* Countdown circle (80×80, centered on oval) */
    + '<div id="fs-countdown" style="display:none;position:absolute;top:46%;left:50%;transform:translate(-50%, -50%);width:80px;height:80px;border-radius:50%;background:rgba(0,0,0,.6);align-items:center;justify-content:center;z-index:8;pointer-events:none;">'
    +   '<span id="fs-cd-num" style="color:#fff;font-size:42px;font-weight:700;line-height:1;font-family:\'DM Sans\',sans-serif;"></span>'
    + '</div>'

    /* Complete overlay (1.5s freeze + checkmark before preview).
       z-index 11 so it covers the top bar (z=10) just like the mobile
       absoluteFillObject overlay covers cTop. */
    + '<div id="fs-complete-overlay" style="display:none;position:absolute;inset:0;background:rgba(0,0,0,.6);z-index:11;pointer-events:none;flex-direction:column;align-items:center;justify-content:center;">'
    +   '<svg width="64" height="64" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="#14B8A6"/><polyline points="8 12 11 15 16 9" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>'
    +   '<p style="color:#fff;font-size:18px;font-weight:700;margin:14px 0 0;font-family:\'DM Sans\',sans-serif;">' + t.scanDone + '</p>'
    + '</div>'

    /* Inline manual-upload fallback shown during the "very slow connection"
       phase of init (after 12s with no first frame) — lets the user bail out
       to the manual upload flow without backing out of the scan entirely. */
    + '<button id="fs-init-fallback" style="display:none;position:absolute;top:calc(46% + 45.9vw + 58px);left:50%;transform:translateX(-50%);padding:11px 22px;border-radius:999px;border:1px solid rgba(20,184,166,.45);background:rgba(20,184,166,.14);color:#5eead4;font-size:12px;font-weight:600;cursor:pointer;z-index:7;letter-spacing:.4px;text-transform:uppercase;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);align-items:center;gap:6px;">'
    +   '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>'
    +   t.initFallbackBtn
    + '</button>'

    /* Bottom: progress bar + Distance/Lumière/Stabilité badges */
    + '<div id="fs-bot" style="position:absolute;bottom:calc(16px + env(safe-area-inset-bottom, 0px));left:0;right:0;display:flex;flex-direction:column;align-items:center;gap:8px;padding:0 24px;z-index:6;pointer-events:none;">'
    +   '<div id="fs-pbar" style="width:100%;height:3px;background:rgba(255,255,255,.15);border-radius:2px;overflow:hidden;"><div id="fs-pfill" style="width:0;height:100%;background:#14B8A6;border-radius:2px;transition:width .25s;"></div></div>'
    + '</div>'
    + '</div>'

    /* Preview — port of the app's "Scan validé." screen (v2 redesign
       2026-06-04 in FaceCaptureScreen.tsx): warning banners → BARE teal check
       ("encoche teal — pas de fond, pas de bordure") → Playfair Italic title →
       optional close-up card with a floating "Optionnel" badge. No captures
       grid (the app removed it), and no in-widget footer either: on the web
       the form's own CONTINUER button advances (with its face-photo gate) and
       its back button returns to the scan/manual choice — the app's VALIDER /
       manual / restart actions would be redundant here (decision Antoine
       2026-07-08). */
    + '<div id="fs-prev" style="display:none;padding:28px 24px 32px;background:#FAFAF9;color:#1f2937;font-family:\'DM Sans\',sans-serif;">'

    /* Warning banners (app st.warningBanner / warningBannerSoft) */
    + '<div id="fs-warn-face" style="display:none;flex-direction:row;align-items:center;gap:10px;padding:12px 14px;border-radius:12px;margin-bottom:12px;border:1px solid rgba(239,68,68,.3);background:#FEF2F2;">'
    +   '<svg width="16" height="16" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>'
    +   '<div style="flex:1;text-align:left;">'
    +     '<p style="font-size:12px;font-weight:700;color:#EF4444;margin:0;">' + t.warnFaceTitle + '</p>'
    +     '<p style="font-size:11px;color:#78716C;margin:2px 0 0;font-weight:400;line-height:15px;">' + t.warnFaceBody + '</p>'
    +   '</div>'
    + '</div>'
    + '<div id="fs-warn-quality" style="display:none;flex-direction:row;align-items:center;gap:10px;padding:12px 14px;border-radius:12px;margin-bottom:12px;border:1px solid rgba(212,180,131,.4);background:#FEFAF3;">'
    +   '<svg width="16" height="16" fill="none" stroke="#D4B483" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" style="flex-shrink:0;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
    +   '<div style="flex:1;text-align:left;">'
    +     '<p style="font-size:12px;font-weight:700;color:#0F3D39;margin:0;">' + t.warnQualityTitle + '</p>'
    +     '<p style="font-size:11px;color:#78716C;margin:2px 0 0;font-weight:400;line-height:15px;">' + t.warnQualityBody + '</p>'
    +   '</div>'
    + '</div>'

    /* Hero — app st.validHero: bare check (no circle), Playfair Italic 30 */
    + '<div id="fs-valid-hero" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 0;">'
    +   '<div style="margin-bottom:16px;"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>'
    +   '<p style="font-family:\'Playfair Display\',serif;font-style:italic;font-size:30px;color:#0F3D39;margin:0 0 18px;text-align:center;line-height:38px;font-weight:400;">' + t.previewValidated + '</p>'
    +   '<p style="font-size:13px;color:#78716C;margin:0 auto;text-align:center;line-height:19px;max-width:320px;font-weight:300;">' + t.previewFusion + '</p>'
    + '</div>'

    /* Optional close-up — app zoomBlock (floating "Optionnel" badge over a
       dashed card; filled state = white card + 48px thumb + remove) */
    + '<div id="fs-zoom-wrap" style="margin-top:16px;">'
    + '<input type="file" id="fs-zoom-input" accept="image/*" capture="environment" style="display:none;"/>'
    + '<div id="fs-zoom-empty-wrap" style="position:relative;">'
    +   '<span style="position:absolute;top:-8px;left:16px;padding:2px 8px;border-radius:999px;background:#FAFAF9;border:1px solid #CCFBF1;z-index:1;font-size:9px;font-weight:700;color:#0D9488;letter-spacing:.6px;text-transform:uppercase;">' + t.zoomBadge + '</span>'
    +   '<button id="fs-zoom-btn" type="button" style="width:100%;display:flex;flex-direction:row;align-items:center;gap:12px;padding:14px 16px;border-radius:14px;border:1px dashed #D6D3D1;background:transparent;cursor:pointer;text-align:left;font-family:\'DM Sans\',sans-serif;">'
    +     '<svg width="18" height="18" fill="none" stroke="#78716C" stroke-width="1.7" stroke-linecap="round" viewBox="0 0 24 24" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>'
    +     '<span style="flex:1;"><span style="display:block;font-size:13px;font-weight:700;color:#0F3D39;">' + t.zoomBtn + '</span><span style="display:block;font-size:11px;color:#78716C;font-weight:300;margin-top:1px;">' + t.zoomSub + '</span></span>'
    +   '</button>'
    + '</div>'
    + '<div id="fs-zoom-filled" style="display:none;flex-direction:row;align-items:center;gap:12px;padding:10px 12px;border-radius:14px;border:1px solid #E7E5E4;background:#fff;">'
    +   '<img id="fs-zoom-img" style="width:48px;height:48px;border-radius:10px;object-fit:cover;display:block;" alt=""/>'
    +   '<span style="flex:1;text-align:left;"><span style="display:block;font-size:13px;font-weight:700;color:#0F3D39;">' + t.zoomAdded + '</span><span style="display:block;font-size:11px;color:#78716C;font-weight:300;margin-top:1px;">' + t.zoomTapReplace + '</span></span>'
    +   '<button id="fs-zoom-remove" type="button" style="padding:4px;border:none;background:none;cursor:pointer;color:#A8A29E;flex-shrink:0;">'
    +     '<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>'
    +   '</button>'
    + '</div>'
    + '</div>'

    + '</div>'

    + '<div id="fs-err" style="display:none;padding:52px 28px;text-align:center;background:#FAFAF9;color:#1f2937;">'
    + '<div style="width:48px;height:48px;margin:0 auto 16px;border-radius:50%;border:1.5px solid #fecaca;display:flex;align-items:center;justify-content:center;background:#fef2f2;">'
    + '<svg width="20" height="20" fill="none" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>'
    + '</div>'
    + '<p id="fs-em" style="font-size:13px;color:#991b1b;margin:0;font-weight:400;line-height:1.6;"></p>'
    + '</div>'

    /* Interrupted screen — resume-friendly (app parity: captures are kept in
       memory, "Reprendre le scan" re-enters calibration with the bins intact
       instead of dumping the user to an error + forced manual fallback). */
    + '<div id="fs-int" style="display:none;padding:48px 28px 36px;text-align:center;background:#FAFAF9;color:#1f2937;">'
    + '<div style="width:56px;height:56px;margin:0 auto 16px;border-radius:50%;background:rgba(20,184,166,.10);display:flex;align-items:center;justify-content:center;">'
    +   '<svg width="24" height="24" fill="none" stroke="#0F3D39" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="10" y1="9" x2="10" y2="15"/><line x1="14" y1="9" x2="14" y2="15"/></svg>'
    + '</div>'
    + '<p style="font-size:18px;font-weight:700;color:#0F3D39;margin:0 0 6px;font-family:\'DM Sans\',sans-serif;">' + t.interrupted + '</p>'
    + '<p id="fs-int-sub" style="font-size:13px;color:#78716c;margin:0 auto 22px;max-width:280px;font-weight:400;line-height:1.5;">' + t.intSub + '</p>'
    + '<button id="fs-int-resume" type="button" style="width:100%;max-width:320px;padding:16px 20px;border:none;border-radius:9999px;background:#0F3D39;color:#fff;font-size:12.5px;font-weight:700;cursor:pointer;letter-spacing:1.5px;text-transform:uppercase;display:block;margin:0 auto 10px;box-shadow:0 8px 20px -8px rgba(15,61,57,.4);">' + t.btnResume + '</button>'
    + '<button id="fs-int-restart" type="button" style="width:100%;max-width:320px;padding:12px;border:1px solid #e7e5e4;border-radius:2rem;background:transparent;color:#a8a29e;font-size:11px;font-weight:500;cursor:pointer;display:block;margin:0 auto;">' + t.restart + '</button>'
    + '</div>'

    /* Landscape overlay — shown automatically when width > height during the
       scan (DOM elements positioned via calc(46% ± 45.9vw) don\'t fit in
       landscape and would render off-screen). screen.orientation.lock is not
       reliable on iOS, so we just ask the user to rotate. */
    + '<div id="fs-rotate" style="display:none;position:fixed;inset:0;z-index:11000;background:#0F3D39;color:#fff;flex-direction:column;align-items:center;justify-content:center;padding:32px;text-align:center;font-family:\'DM Sans\',sans-serif;">'
    +   '<svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" style="margin-bottom:18px;animation:fsRotateNudge 1.6s ease-in-out infinite;"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12" y2="18.01"/></svg>'
    +   '<p style="font-size:18px;font-weight:700;margin:0 0 6px;">' + t.rotateTitle + '</p>'
    +   '<p style="font-size:13px;color:rgba(255,255,255,.7);margin:0;font-weight:300;">' + t.rotateSub + '</p>'
    + '</div>'

    + '</div>'
    + '<style>'
    + '@keyframes fsSpin{to{transform:rotate(360deg)}}'
    /* Top-bar circular buttons (parity with mobile cBtn 40×40) */
    + '.fs-cBtn{width:40px;height:40px;border-radius:50%;border:none;background:rgba(0,0,0,.35);cursor:pointer;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);padding:0;}'
    /* Dot strip (parity with mobile dots/dot/dotDone) */
    + '.fs-dot{width:20px;height:20px;border-radius:50%;background:rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;}'
    + '.fs-dot.done{background:#14B8A6;}'
    + '.fs-dot-cnt{font-size:11px;font-weight:700;color:rgba(255,255,255,.5);margin-left:6px;font-family:\'DM Sans\',sans-serif;}'
    /* Bottom badges (parity with mobile sB / sOk / sBad) */
    + '#fs-badges-row{position:absolute;top:calc(46% + 45.9vw + 18px);left:0;right:0;display:flex;justify-content:center;gap:7px;z-index:7;pointer-events:none;padding:0 12px;}'
    /* Fond sombre + flou : lisible quel que soit l\'arrière-plan (mur clair,
       fenêtre, contre-jour) — l\'ancien fond à 4% disparaissait sur clair. */
    + '.fs-badge{display:flex;align-items:center;gap:5px;padding:7px 11px;border-radius:999px;background:rgba(0,0,0,.42);border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);color:rgba(255,255,255,.55);font-family:\'DM Sans\',sans-serif;transition:background .25s,border-color .25s,color .25s;}'
    + '.fs-badge.ok{background:rgba(20,184,166,.26);border-color:rgba(20,184,166,.6);color:#5eead4;}'
    + '.fs-badge.bad{background:rgba(239,68,68,.26);border-color:rgba(239,68,68,.65);color:#fca5a5;}'
    /* Le capteur en défaut pulse : c\'est LUI qu\'il faut corriger, il doit
       attirer l\'œil sans qu\'on ait à comparer trois pastilles. */
    + '.fs-badge.bad{animation:fsBdgPulse 1.5s ease-in-out infinite;}'
    + '@keyframes fsBdgPulse{0%,100%{opacity:1;}50%{opacity:.62;}}'
    + '.fs-bico{width:13px;height:13px;flex:0 0 auto;}'
    + '.fs-blbl{font-size:11px;font-weight:600;letter-spacing:.2px;white-space:nowrap;}'
    /* Side chevron arrow — vertically centred on the oval, slides on the X axis */
    + '.fs-arrow-side{position:absolute;top:46%;z-index:7;pointer-events:none;}'
    + '.fs-arrow-side.dir-right{right:14px;left:auto;animation:fsArrowSlideR 1.4s ease-in-out infinite;}'
    + '.fs-arrow-side.dir-left{left:14px;right:auto;animation:fsArrowSlideL 1.4s ease-in-out infinite;}'
    + '.fs-arrow-side.dir-left>svg{transform:scaleX(-1);}'
    + '@keyframes fsArrowSlideR{0%,100%{transform:translateY(-50%) translateX(0)}50%{transform:translateY(-50%) translateX(12px)}}'
    + '@keyframes fsArrowSlideL{0%,100%{transform:translateY(-50%) translateX(0)}50%{transform:translateY(-50%) translateX(-12px)}}'
    /* Triple chevrons under the oval — same X slide animation */
    + '.fs-arrow-under{position:absolute;top:calc(46% + 45.9vw + 66px);left:0;right:0;display:none;align-items:center;justify-content:center;z-index:7;pointer-events:none;}'
    + '.fs-arrow-under.dir-right{display:flex;animation:fsArrowSlideUR 1.4s ease-in-out infinite;}'
    + '.fs-arrow-under.dir-left{display:flex;animation:fsArrowSlideUL 1.4s ease-in-out infinite;}'
    + '.fs-arrow-under.dir-left>svg{transform:scaleX(-1);}'
    + '@keyframes fsArrowSlideUR{0%,100%{transform:translateX(0)}50%{transform:translateX(12px)}}'
    + '@keyframes fsArrowSlideUL{0%,100%{transform:translateX(0)}50%{transform:translateX(-12px)}}'
    /* Countdown circle visibility helper */
    + '#fs-countdown.show{display:flex !important;}'
    + '#fs-complete-overlay.show{display:flex !important;}'
    /* Rotate-to-portrait overlay */
    + '#fs-rotate.show{display:flex !important;}'
    + '@keyframes fsRotateNudge{0%,100%{transform:rotate(0deg)}50%{transform:rotate(-90deg)}}'
    + '</style>';
  }

  /* ═══════════════════════════════════════════════════════════
     OVERLAY DRAWING — minimal, matches mobile SVG layer
     Canvas paints only:
       1. Dim mask outside the oval
       2. Oval border (white dim while scanning, teal once allGood in calibration)
       3. Progress arc (clockwise from 12 o'clock, scaled to filled/7)
     Everything else (badges, dot strip, arrows, countdown, instructions) is
     driven from DOM elements positioned over the canvas.

     Geometry (matches mobile lib step7.tsx):
       cy = container height × 0.46
       rx = container width × 0.34
       ry = container width × 0.459 (gives 1.35 aspect ratio — face-shaped,
            independent of container height so the oval looks the same on any phone)
     ═══════════════════════════════════════════════════════════ */
  /* ═══════════════════════════════════════════════════════════
     FACE MESH + VAGUE D'ANALYSE (v9.6)

     Le maillage des 468 landmarks MediaPipe (déjà calculés par onResInner)
     sert de trame ; une VAGUE DE LUMIÈRE la parcourt du menton au front.

     Pourquoi ce design plutôt qu'une barre horizontale (v9.5, jugée « cheap ») :
     une barre est un objet 2D posé DEVANT un visage 3D — elle traverse le nez
     et les orbites à plat. Ici, ce sont les ARÊTES DU MAILLAGE qui s'illuminent :
     comme le maillage épouse le relief, la lumière plonge dans les orbites,
     contourne le nez et longe la mâchoire. C'est la surface qui est révélée.

     L'axe de balayage est le vecteur menton(152) → front(10) EN ESPACE ÉCRAN :
     la vague suit donc l'inclinaison et la rotation de la tête sans aucune
     correction — c'est la géométrie qui s'en charge. Le z de MediaPipe module
     l'intensité (ce qui est près de la caméra brille plus) → volume.

     Perf (mesurée au banc d'essai, ~1,1 ms/frame — budget 33 ms à 30 fps) :
     une opacité par arête imposerait 2556 stroke() → intenable. On GROUPE donc
     les arêtes par paquet d'intensité (MESH_NB) → 1 tracé pour la trame + 6
     tracés pour la vague. Les tampons sont alloués UNE fois (zéro GC par frame).

     Deux pièges de mapping, obligatoires pour coller au visage affiché :
       1. object-fit:cover — les landmarks sont normalisés dans le repère NATIF
          de la vidéo, pas dans le conteneur.
       2. transform:scaleX(-1) — la vidéo est en miroir, le canvas non.

     Purement cosmétique : AUCUNE décision de capture n'en dépend.
     ═══════════════════════════════════════════════════════════ */
  var MESH_NB = 6;                                  // paquets d'intensité
  var _mBuckets = (function () {                    // alloués une seule fois
    var a = []; for (var i = 0; i < MESH_NB; i++) a.push([]);
    return a;
  })();
  var _mS = new Float32Array(468);                  // projection sur l'axe du visage
  var _mZ = new Float32Array(468);                  // profondeur

  function drawMesh(ctx, w, h, S, cx, cy, rx, ry, now) {
    if (!MESH_ON) return;
    var M = S.mesh;
    var TESS = window.FACEMESH_TESSELATION;
    if (!TESS || !M.lm || !M.vw || !M.vh) return;

    // Opacités arbitrées sur planche comparative (vraie photo, géométrie réelle).
    // On vend une analyse de PEAU : elle doit rester lisible sous la trame.
    var target = 0;
    if (now - M.t < 250) {   // landmarks frais uniquement (sinon trame figée)
      if (S.phase === "calibrating" || S.phase === "countdown") target = 0.38;
      else if (S.phase === "scanning") target = 0.20;
    }
    M.op += (target - M.op) * 0.12;                 // fondu ~400 ms
    if (M.op < 0.004) { M.op = 0; return; }

    var lm = M.lm;
    var scale = Math.max(w / M.vw, h / M.vh);
    var dw = M.vw * scale, dh = M.vh * scale;
    var ox = (w - dw) / 2, oy = (h - dh) / 2;
    // miroir X (vidéo scaleX(-1), canvas non)
    function PX(p) { return w - (ox + p.x * dw); }
    function PY(p) { return oy + p.y * dh; }

    // Axe du visage : menton → front. C'est lui qui fait suivre la tête.
    var chin = lm[152], brow = lm[10];
    if (!chin || !brow) return;
    var cxp = PX(chin), cyp = PY(chin);
    var ax = PX(brow) - cxp, ay = PY(brow) - cyp;
    var alen = Math.sqrt(ax * ax + ay * ay) || 1;
    ax /= alen; ay /= alen;

    var zMin = 1e9, zMax = -1e9, i, p, z;
    for (i = 0; i < 468; i++) {
      p = lm[i]; if (!p) { _mS[i] = -9; _mZ[i] = 0; continue; }
      _mS[i] = ((PX(p) - cxp) * ax + (PY(p) - cyp) * ay) / alen;   // 0 menton → 1 front
      z = p.z || 0; _mZ[i] = z;
      if (z < zMin) zMin = z; if (z > zMax) zMax = z;
    }
    var zRange = (zMax - zMin) || 1;

    // Vague : va-et-vient lent et adouci (la lenteur fait le premium).
    var SWEEP_MS = 3600;
    var ph = (now % (SWEEP_MS * 2)) / SWEEP_MS;     // 0 → 2
    var k = ph > 1 ? 2 - ph : ph;                   // 0 → 1 → 0
    k = k * k * (3 - 2 * k);                        // smoothstep : ralentit aux extrémités
    // Course recadrée sur la ZONE DENSE du maillage (mesuré au banc : la trame
    // compte ~700-880 arêtes entre s=0.2 et 0.7, mais seulement 48 au sommet du
    // front et 109 au menton). Le smoothstep ralentit aux extrémités : sur une
    // course 0→1 il faisait donc traîner la vague là où il n'y a rien à
    // éclairer (pire moment : 26 arêtes = trou visuel). Recadrée en 0.10→0.92,
    // le pire moment passe à 124 arêtes (5×) et la pause se fait sur la
    // mâchoire puis le front — là où il y a de la matière.
    var sweep = 0.10 + k * 0.82;
    // Largeur arbitrée au banc : 0.11 faisait « tache », 0.05 s'effilochait
    // aux extrémités (54 arêtes au pire moment). 0.07 = trait net qui garde
    // de la matière partout (83 au pire moment, 3× au-dessus du trou v9.6).
    var BAND = 0.07;

    for (i = 0; i < MESH_NB; i++) _mBuckets[i].length = 0;

    var ia, ib, sm, d, inten, zn, b;
    for (i = 0; i < TESS.length; i++) {
      ia = TESS[i][0]; ib = TESS[i][1];
      sm = (_mS[ia] + _mS[ib]) * 0.5;
      d = sm - sweep; if (d < 0) d = -d;
      if (d > BAND) continue;
      inten = 1 - (d / BAND); inten *= inten;       // falloff quadratique
      zn = 1 - (((_mZ[ia] + _mZ[ib]) * 0.5 - zMin) / zRange);   // 1 = proche caméra
      inten *= (0.55 + 0.45 * zn);
      b = (inten * MESH_NB) | 0; if (b > MESH_NB - 1) b = MESH_NB - 1;
      _mBuckets[b].push(ia, ib);
    }

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.clip();                                     // jamais de débord sur le masque

    // 1. Trame — un seul tracé batché pour les 2556 arêtes
    ctx.beginPath();
    for (i = 0; i < TESS.length; i++) {
      var a1 = lm[TESS[i][0]], b1 = lm[TESS[i][1]];
      if (!a1 || !b1) continue;
      ctx.moveTo(PX(a1), PY(a1)); ctx.lineTo(PX(b1), PY(b1));
    }
    ctx.strokeStyle = "rgba(244,63,94," + (M.op * 0.85).toFixed(3) + ")";
    ctx.lineWidth = 0.4;
    ctx.stroke();

    // 2. Vague — un tracé par paquet (6 au lieu de 2556)
    for (b = 0; b < MESH_NB; b++) {
      var arr = _mBuckets[b];
      if (!arr.length) continue;
      var lvl = (b + 0.5) / MESH_NB;
      ctx.beginPath();
      for (i = 0; i < arr.length; i += 2) {
        var a2 = lm[arr[i]], b2 = lm[arr[i + 1]];
        ctx.moveTo(PX(a2), PY(a2)); ctx.lineTo(PX(b2), PY(b2));
      }
      var op = M.op * 1.9 * lvl; if (op > 0.95) op = 0.95;
      // Lumière BLANCHE qui révèle la trame rouge : registre « instrument de
      // mesure ». Un faisceau rouge dirait « alerte » — et ajouterait du rouge
      // sur une peau à rougeurs, exactement ce qu'on ne veut pas.
      ctx.strokeStyle = "rgba(255,235,240," + op.toFixed(3) + ")";
      ctx.lineWidth = 0.4 + lvl * 0.7;
      ctx.shadowColor = "rgba(255,235,240," + (op * 0.8).toFixed(3) + ")";
      ctx.shadowBlur = lvl * 4;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  function drawOverlay(ctx, w, h, S, t) {
    ctx.clearRect(0, 0, w, h);
    if (S.phase !== "calibrating" && S.phase !== "scanning" && S.phase !== "countdown" && S.phase !== "complete") return;

    var cx = w / 2, cy = h * 0.46;
    var rx = w * 0.34;
    var ry = w * 0.459;
    // Cap ry to half the container height so the oval never overflows in landscape
    if (ry > h * 0.48) ry = h * 0.48;

    // Dim outside oval
    ctx.fillStyle = "rgba(0,0,0,.55)";
    ctx.beginPath(); ctx.rect(0, 0, w, h);
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2, true);
    fillEvenOdd(ctx);

    // Maillage — après le masque (donc sur la vidéo claire de l'ovale),
    // avant l'ovale/l'arc qui doivent rester au-dessus.
    drawMesh(ctx, w, h, S, cx, cy, rx, ry, performance.now());

    // Oval border — teal when allGood during calibration, dim white otherwise.
    // During scanning we always show the dim base ring (the progress arc carries
    // the "active" colour, just like the mobile SVG layer).
    var scanning = (S.phase === "scanning" || S.phase === "complete");
    var allOk = S.st.dist && S.st.light;
    if (scanning) {
      ctx.strokeStyle = "rgba(255,255,255,.15)";
      ctx.lineWidth = 2;
    } else {
      ctx.strokeStyle = allOk ? "#14B8A6" : "rgba(255,255,255,.3)";
      ctx.lineWidth = allOk ? 2.5 : 1.5;
    }
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();

    // Progress arc — driven by filled/7 instead of elapsed time so it visually
    // tracks captured angles (parity with mobile progressArcLen calculation).
    if (scanning) {
      var filled = 0;
      for (var i = 0; i < BIN_IDS.length; i++) if (S.bins[BIN_IDS[i]].length > 0) filled++;
      if (filled > 0) {
        var arcSpan = (filled / 7) * Math.PI * 2;
        ctx.strokeStyle = "#14B8A6";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, -Math.PI / 2, -Math.PI / 2 + arcSpan);
        ctx.stroke();
        ctx.lineCap = "butt";
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════
     GUIDANCE PRO v4 — exact port of the app's getGuidance()
     (lib/scan-engine.ts, "guidance hybride PROGRESSION-AWARE").

     Rules (in order):
       1. Face missing: head already turned (|physYaw| ≥ 10°) →
          "Revenez face à la caméra" ; otherwise "Regardez la caméra".
       2. Target = first missing bin in web-priority order
          (semi_left → left → wide_left → semi_right → right → wide_right).
       3. Current pose ALREADY in the target's range → SILENCE (capture is
          about to fire; telling the user to hold still mid-gesture confuses
          more than it helps — founder decision 2026-06-08).
       4. Direction = sign of (targetPhysYaw − currentPhysYaw) → always the
          shortest path, even after overshooting a bin.
       5. Stage: face-range → start · |delta|<12° → "Encore un tout petit
          peu" · overshoot <30° → "Tournez légèrement" · overshoot ≥30° →
          start · else 0/1/2 same-side bins captured → start/continue/more.
     ═══════════════════════════════════════════════════════════ */
  var BIN_PHYSICAL_YAW = {
    face: 0,
    semi_left: 20, left: 38, wide_left: 55,    // chin → user's right
    semi_right: -20, right: -38, wide_right: -55, // chin → user's left
  };
  var GUIDE_PRIORITY = ["semi_left", "left", "wide_left", "semi_right", "right", "wide_right"];

  function toPhysicalYaw(absYaw, showsRight) { return showsRight ? -absYaw : absYaw; }

  function getGuidancePro(bins, currentAbsYaw, showsRight, t) {
    function has(id) { return bins[id].length > 0; }

    // 1. Face not captured yet
    if (!has("face")) {
      var currentPhys0 = toPhysicalYaw(currentAbsYaw, showsRight);
      if (Math.abs(currentPhys0) >= 10) {
        return { t1: t.comeBackCenter, t2: t.comeBackCenterSub, dir: currentPhys0 > 0 ? "left" : "right" };
      }
      return { t1: t.scanFace, t2: t.scanFaceSub, dir: "none" };
    }

    // 2. Next target
    var target = null;
    for (var i = 0; i < GUIDE_PRIORITY.length; i++) {
      if (!has(GUIDE_PRIORITY[i])) { target = GUIDE_PRIORITY[i]; break; }
    }
    if (!target) return { t1: t.scanDone, t2: t.scanDoneSub, dir: "none" };

    // 3. Pose already in target range → silence (capture fires in 1-2 frames)
    var noseXapprox = showsRight ? 0.7 : 0.3;
    var currentBin = classifyBin(currentAbsYaw, noseXapprox);
    if (currentBin === target) return { t1: "", t2: "", dir: "none" };

    // 4. Direction — shortest path to target
    var currentPhys = toPhysicalYaw(currentAbsYaw, showsRight);
    var targetPhys = BIN_PHYSICAL_YAW[target];
    var delta = targetPhys - currentPhys;
    var absDelta = Math.abs(delta);
    var physDir = delta > 0 ? "right" : "left";

    // 5. Stage
    var targetSide = (target === "semi_left" || target === "left" || target === "wide_left") ? "left" : "right";
    var isOvershoot = targetSide === "left" ? currentPhys > targetPhys : currentPhys < targetPhys;

    var stage;
    if (currentBin === "face") {
      stage = "start";
    } else if (absDelta < 12) {
      stage = "almost";
    } else if (isOvershoot) {
      stage = absDelta < 30 ? "comeBack" : "start";
    } else {
      var sameSide = targetSide === "left"
        ? ["semi_left", "left", "wide_left"]
        : ["semi_right", "right", "wide_right"];
      var captured = 0;
      for (var j = 0; j < sameSide.length; j++) if (has(sameSide[j])) captured++;
      stage = captured === 0 ? "start" : (captured === 1 ? "continue" : "more");
    }

    // 6. Message
    if (stage === "almost") {
      return { t1: physDir === "right" ? t.almostRight : t.almostLeft, t2: t.almostSub, dir: physDir };
    }
    if (stage === "comeBack") {
      return { t1: physDir === "right" ? t.comeBackRight : t.comeBackLeft, t2: t.comeBackSub, dir: physDir };
    }
    if (stage === "continue") {
      return { t1: physDir === "right" ? t.scanRight2 : t.scanLeft2, t2: physDir === "right" ? t.scanRight2Sub : t.scanLeft2Sub, dir: physDir };
    }
    if (stage === "more") {
      return { t1: physDir === "right" ? t.scanRight3 : t.scanLeft3, t2: physDir === "right" ? t.scanRight3Sub : t.scanLeft3Sub, dir: physDir };
    }
    // "start"
    return { t1: physDir === "right" ? t.scanRight1 : t.scanLeft1, t2: physDir === "right" ? t.scanRight1Sub : t.scanLeft1Sub, dir: physDir };
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
    // Use the same base path as formulaire2.html's pre-warm so the browser
    // hits its HTTP cache (or the SW's pre-cached copy) — never the CDN.
    // Falls back to the jsdelivr URL if the script tag had to use it.
    var base = (typeof window !== "undefined" && window._adermioMediaPipeBase) ||
               "/vendor/mediapipe/face_mesh/";
    var fm = new window.FaceMesh({
      locateFile: function (f) { return base + f; },
    });
    // refineLandmarks (attention model — iris/lip-refined mesh) on high-end
    // devices: finer landmark positions → better pose + stability estimates.
    // The attention model lives inside the same vendored packed-assets .data,
    // so enabling it costs CPU only, no extra network fetch. Low/mid devices
    // keep the lighter mesh to preserve frame rate.
    fm.setOptions({ maxNumFaces: 1, refineLandmarks: isHighEnd, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
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

  /* Conversion dataURL → Blob, 100% synchrone (aucune API async, donc
     aucun risque de silence). Retourne null si le dataURL est inexploitable. */
  function dataURLToBlob(durl) {
    if (typeof durl !== "string") return null;
    var comma = durl.indexOf(",");
    if (comma < 0) return null;
    var meta = durl.slice(0, comma);
    var mm = meta.match(/^data:([^;,]+)/);
    var mime = mm ? mm[1] : "image/jpeg";
    var body = durl.slice(comma + 1);
    var bin;
    try {
      bin = meta.indexOf(";base64") >= 0 ? atob(body) : decodeURIComponent(body);
    } catch (e) { return null; }
    var n = bin.length;
    var u8 = new Uint8Array(n);
    for (var i = 0; i < n; i++) u8[i] = bin.charCodeAt(i);
    var blob;
    try { blob = new Blob([u8], { type: mime }); } catch (e) { return null; }
    return blob && blob.size > 0 ? blob : null;
  }

  /* Délai au-delà duquel on cesse d'attendre toBlob et on encode en
     synchrone. Une capture normale se règle en <300 ms ; 1200 ms laisse
     de la marge aux appareils lents sans jamais atteindre le watchdog (3 s). */
  var CAP_BLOB_MS = 1200;

  /* ═══ capFrame — v9.4 (2026-07-15), fix du scan muet ═══
     Deux bugs corrigés, mesurés sur 30% des scans web (0 capture, 18-29
     watchdogs, ~100 s d'attente puis repli manuel à 3 photos) :

     1. CANVAS PARTAGÉ. `_cc` était réutilisé et REDIMENSIONNÉ à chaque
        capture (`_cc.width = vw`). Quand un toBlob précédent encodait
        encore (cas du watchdog qui libère le verrou à 3 s), le redimension-
        nement invalidait son backing store : WebKit lâchait son callback
        EN SILENCE, et l'encodeur zombie contaminait la capture suivante →
        cascade infinie. Chaque capture a désormais SON canvas : aucun
        encodeur en vol ne peut être perturbé par la capture suivante.

     2. PROMESSE JAMAIS RÉGLÉE. `toBlob` est asynchrone et peut ne jamais
        rappeler (aucune erreur, juste le silence) → la promesse restait
        pendante à vie et `S.capturing` bloquait tout. On lui laisse
        CAP_BLOB_MS, puis on bascule sur `toDataURL` : synchrone, donc il
        rend ou il jette — jamais de silence. La promesse se règle TOUJOURS.

     On ne cherche plus à savoir POURQUOI le navigateur se tait : on cesse
     d'en dépendre.

     `logger` est passé en PARAMÈTRE : capFrame est module-level alors que
     l'état de session `S` vit dans le scope de la session (var S = mkState()).
     Y référencer `S` lèverait un ReferenceError DANS le callback → la promesse
     ne se règlerait jamais = le bug qu'on corrige (cf. incident noFace v9.3.1). */
  function capFrame(video, logger) {
    return new Promise(function (res) {
      var rawW = video.videoWidth || 640, rawH = video.videoHeight || 480;
      var scale = rawW > CAP_MAX ? CAP_MAX / rawW : 1;
      var vw = Math.round(rawW * scale), vh = Math.round(rawH * scale);

      var cv = document.createElement("canvas");
      cv.width = vw; cv.height = vh;
      var cx = cv.getContext("2d");
      if (!cx) { res(null); return; }
      cx.setTransform(-1, 0, 0, 1, vw, 0);
      try { cx.drawImage(video, 0, 0, vw, vh); } catch (e) { res(null); return; }
      cx.setTransform(1, 0, 0, 1, 0, 0);

      var settled = false, timer = 0;
      function done(blob, viaSync) {
        if (settled) return;
        settled = true;
        if (timer) { clearTimeout(timer); timer = 0; }
        // Télémétrie : mesure en prod combien de captures ne doivent leur
        // survie qu'au repli synchrone (= fréquence réelle du silence toBlob).
        // Entièrement sous try/catch : la télémétrie ne doit JAMAIS empêcher
        // le res() ci-dessous (sinon promesse pendante = le bug d'origine).
        try {
          if (viaSync && logger && logger.log) {
            logger.log({ type: "capture_sync_fallback", timestamp: Date.now(), ok: !!blob });
          }
        } catch (e) { /* no-op */ }
        res(blob || null);
      }

      timer = setTimeout(function () {
        if (settled) return;
        var b = null;
        try { b = dataURLToBlob(cv.toDataURL("image/jpeg", CFG.jpegQ)); } catch (e) { b = null; }
        done(b, true);
      }, CAP_BLOB_MS);

      try {
        cv.toBlob(function (b) { done(b, false); }, "image/jpeg", CFG.jpegQ);
      } catch (e) {
        // toBlob indisponible/jette : on n'attend pas, on encode tout de suite.
        if (timer) { clearTimeout(timer); timer = 0; }
        var bs = null;
        try { bs = dataURLToBlob(cv.toDataURL("image/jpeg", CFG.jpegQ)); } catch (e2) { bs = null; }
        done(bs, true);
      }
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
    var lang = opts.lang || (function () {
      var docLang = (document.documentElement.lang || "").substring(0, 2).toLowerCase();
      if (docLang === "en") return "en";
      if (docLang === "es") return "es";
      return "fr";
    })();
    var t = T[lang] || T.fr;
    var onDone = opts.onComplete || null;
    var onFall = opts.onFallback || null;
    // onReturn: invoked when the user taps "Recommencer le scan" in the
    // preview. Lets the caller (formulaire2) take over the post-preview
    // navigation — typically routing back to its own pre-scan choice screen.
    // If unset, we fall back to the legacy in-widget restart() behaviour.
    var onReturn = opts.onReturn || null;
    // autoStart: when true, the widget never displays its own fs-perm screen.
    // Used by formulaire2 since the scan-vs-manual choice now lives in the
    // form itself (its own step), so the widget should jump straight into
    // the camera load phase as soon as init() runs.
    var autoStart = !!opts.autoStart;
    var S = mkState(), dead = false;

    container.innerHTML = buildUI(t);
    function $(sel) { return container.querySelector(sel); }
    var $perm = $("#fs-perm"), $load = $("#fs-load"), $scan = $("#fs-scan");
    var $prev = $("#fs-prev"), $err = $("#fs-err"), $int = $("#fs-int");
    var $v = $("#fs-v"), $ov = $("#fs-ov");
    var $t1 = $("#fs-t1"), $t2 = $("#fs-t2"), $em = $("#fs-em");
    var $retakeBadge = $("#fs-retakebadge");
    var $dotsStrip = $("#fs-dots-strip");
    var $arrowSide = $("#fs-arrow-side"), $arrowUnder = $("#fs-arrow-under");
    var $countdown = $("#fs-countdown"), $cdNum = $("#fs-cd-num");
    var $completeOv = $("#fs-complete-overlay");
    var $pfill = $("#fs-pfill");
    var $bdgDist = $("#fs-bdg-dist"), $bdgLight = $("#fs-bdg-light"), $bdgStab = $("#fs-bdg-stab");
    var ctx = $ov.getContext("2d");

    // Populate the dot strip once (mobile keeps these as DOM elements with
    // checkmark icons, indexed by bin id so we can toggle .done individually).
    var dotEls = {};
    for (var di = 0; di < DOT_ORDER.length; di++) {
      var dEl = document.createElement("div");
      dEl.className = "fs-dot";
      dEl.setAttribute("data-bin", DOT_ORDER[di]);
      dEl.innerHTML = '<svg width="9" height="9" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" style="display:none;"><polyline points="20 6 9 17 4 12"/></svg>';
      $dotsStrip.appendChild(dEl);
      dotEls[DOT_ORDER[di]] = dEl;
    }
    var $dotCnt = document.createElement("span");
    $dotCnt.className = "fs-dot-cnt";
    $dotCnt.textContent = "0/7";
    $dotsStrip.appendChild($dotCnt);

    // ── DOM update helpers (called from onRes + finish) ──
    function updateBadge($el, v) {
      $el.classList.toggle("ok", v === true);
      $el.classList.toggle("bad", v === false);
    }
    function updateDots() {
      var filled = 0;
      for (var i = 0; i < BIN_IDS.length; i++) {
        var has = S.bins[BIN_IDS[i]].length > 0;
        if (has) filled++;
        var el = dotEls[BIN_IDS[i]];
        if (el) {
          el.classList.toggle("done", has);
          var sv = el.querySelector("svg");
          if (sv) sv.style.display = has ? "" : "none";
        }
      }
      $dotCnt.textContent = filled + "/7";
      $pfill.style.width = (filled / 7 * 100) + "%";
    }
    // Instruction pill — app parity: when guidance returns empty strings
    // (pose already in the target bin's range → capture fires immediately),
    // the pill disappears entirely instead of showing an empty bubble.
    var $instrWrap = $("#fs-instr-above");
    function setInstr(t1, t2) {
      var empty = !t1 && !t2;
      // "flex" explicite — le conteneur est stylé inline (display:flex pour
      // centrer la pilule) : remettre "" retirerait le flex et la pilule
      // retomberait en block collée en haut à gauche.
      $instrWrap.style.display = empty ? "none" : "flex";
      $t1.textContent = t1 || "";
      $t2.textContent = t2 || "";
    }

    function setSideArrow(dir) {
      if (!dir || dir === "none") { $arrowSide.style.display = "none"; return; }
      $arrowSide.style.display = "block";
      $arrowSide.classList.toggle("dir-right", dir === "right");
      $arrowSide.classList.toggle("dir-left", dir === "left");
    }
    function setUnderArrows(dir) {
      if (!dir || dir === "none") {
        $arrowUnder.style.display = "none";
        $arrowUnder.classList.remove("dir-right", "dir-left");
        return;
      }
      // Inline style wins over class display, so we set it explicitly here
      // (the base class only carries layout — display is JS-driven).
      $arrowUnder.style.display = "flex";
      $arrowUnder.classList.toggle("dir-right", dir === "right");
      $arrowUnder.classList.toggle("dir-left", dir === "left");
    }
    function showCountdown(num) {
      $cdNum.textContent = num;
      $countdown.classList.add("show");
    }
    function hideCountdown() { $countdown.classList.remove("show"); }
    function showCompleteOverlay() { $completeOv.classList.add("show"); }
    function hideCompleteOverlay() { $completeOv.classList.remove("show"); }
    function clearGuideUI() {
      // Used when transitioning out of scan (preview / finish): hide all the
      // floating overlay bits so a stale arrow doesn't linger on top of preview.
      setSideArrow("none");
      setUnderArrows("none");
      hideCountdown();
    }

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
      var map = { perm: $perm, load: $load, scan: $scan, prev: $prev, err: $err, int: $int };
      [$perm, $load, $scan, $prev, $err, $int].forEach(function (e) { e.style.display = "none"; });
      map[name].style.display = "";
      if (name === "scan" || name === "load") enterFullscreen();
      else exitFullscreen();
      // Re-evaluate landscape overlay on every phase change so a user who
      // already had the phone in landscape sees the warning immediately on
      // entering scan (not only when they actually rotate).
      checkOrientation();
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

    var $rotate = $("#fs-rotate");
    function checkOrientation() {
      // Show the "rotate to portrait" overlay only during phases where the
      // scanner UI is on-screen — perm/preview/err are vertical-flow content
      // that survives landscape just fine.
      var inScan = (S.phase === "load" || S.phase === "calibrating" ||
                    S.phase === "countdown" || S.phase === "scanning" ||
                    S.phase === "complete");
      var landscape = window.innerWidth > window.innerHeight;
      if ($rotate) $rotate.classList.toggle("show", inScan && landscape);
    }
    var resizeHandler = function () {
      checkOrientation();
      if (S.phase === "calibrating" || S.phase === "scanning" || S.phase === "countdown") resize();
    };
    window.addEventListener("resize", resizeHandler);
    window.addEventListener("orientationchange", resizeHandler);

    // ── Lifecycle: release the camera when the user backgrounds the tab ──
    // iOS Safari otherwise keeps the camera light on (privacy + battery
    // concern), and on resume the dead MediaStream silently never produces
    // frames again — burning CPU in the rAF loop with no recovery. We bail
    // out cleanly and force the user to restart the scan from the perm screen.
    function onVisibilityChange() {
      if (document.visibilityState === "hidden") {
        if (S.phase === "calibrating" || S.phase === "scanning" || S.phase === "countdown" || S.phase === "load") {
          stopCam(S);
          if (S.idleDraw) { clearInterval(S.idleDraw); S.idleDraw = null; }
          // App parity: captures stay in memory and the user gets a proper
          // "interrupted" screen with a RESUME action (the old behaviour
          // dumped them on an error screen + auto manual fallback after 3s,
          // throwing away everything already captured).
          S._interrupted = true;
          if (!dead) showInterrupted();
        }
      }
    }

    function showInterrupted() {
      S.phase = "idle";
      clearGuideUI();
      show("int");
      S.logger.log({ type: "scan_interrupted", timestamp: Date.now() });
    }

    // Interrupted-screen actions. Resume keeps everything (bins, retake
    // target, logger session) and simply re-enters calibration — the camera
    // stream was stopped, so beginCalibration re-requests it.
    $("#fs-int-resume").addEventListener("click", function () {
      S._interrupted = false;
      S.calibSince = null;
      S.fc = 0;
      S.cBr = null; S.cBl = null;
      S.prev = null; S.prevT = null;
      // v9.3.1 — l'environnement lumineux a pu changer pendant l'interruption
      // (lampe allumée/éteinte) : mesure vierge, et le pill redevient
      // re-dérivable au lieu d'être tué par l'idleDraw du resume.
      S._lEmaF = null; S._lEmaB = null; S._lFlags = null; S._lRawOkStreak = 0;
      S._lightFrameT = 0; S.lightPillShown = false;
      S.logger.log({ type: "scan_resumed", timestamp: Date.now() });
      beginCalibration(false);
    });
    $("#fs-int-restart").addEventListener("click", function () {
      S._interrupted = false;
      if (onReturn) {
        if (window.AdermioFaceScan) window.AdermioFaceScan.destroy();
        onReturn();
        return;
      }
      if (window.AdermioFaceScan) window.AdermioFaceScan.restart();
    });
    function onPageHide() {
      // pagehide fires on tab close, navigation away, and bfcache freeze. Always
      // release the camera regardless of state — leaving tracks alive would keep
      // the iOS camera indicator on after the page is gone.
      stopCam(S);
      try { if ($v) $v.srcObject = null; } catch (_) {}
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);

    show("perm"); S.phase = "perm";

    // autoStart skips the fs-perm screen — the host page (formulaire2) owns
    // the scan/manual choice, so we jump straight into camera-load. We defer
    // by a tick so the host has time to render the container in the DOM
    // before MediaPipe starts requesting WebGL contexts on it.
    if (autoStart) {
      setTimeout(function () {
        if (dead || S.phase !== "perm") return;
        startClicked = true;
        beginCalibration(true);
      }, 0);
    }

    /* ── Cancel button (during scan) ────────── */
    $("#fs-cancel").addEventListener("click", function () {
      stopCam(S); exitFullscreen(); S.phase = "idle";
      // If face was already captured during the session, returning to preview
      // is more useful than dropping the user back to the perm screen.
      var hasFace = S.bins.face.length > 0;
      if (hasFace) { showPreview(false); return; }
      if (onFall && !dead) onFall(); else show("perm");
    });

    /* ── Gallery shortcut — switches to manual upload mid-scan ───── */
    var $gallery = $("#fs-gallery");
    if ($gallery) {
      $gallery.addEventListener("click", function () {
        stopCam(S); exitFullscreen(); S.phase = "idle";
        if (onFall && !dead) onFall();
      });
    }

    /* ── Start button ──────────────────────── */
    var startClicked = false;
    $("#fs-go").addEventListener("click", function () {
      if (startClicked) return;
      startClicked = true;
      beginCalibration(true);
    });

    /* ── In-perm manual upload button ────────────────────────────
       Antoine moved the manual-upload affordance into the perm screen so the
       user has a clear "scan or manual" choice up-front. The fallback is
       wired to switchToManualUpload (passed in via opts.onFallback). */
    var $permManual = $("#fs-perm-manual");
    if ($permManual) {
      $permManual.addEventListener("click", function () {
        if (onFall && !dead) onFall();
      });
    }

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
          // 16:9 cameras (some Android front cameras) crop tighter, so the
          // face appears proportionally smaller. Scale the 4:3 thresholds
          // down by the same ~0.845 ratio as before (0.40 → 0.34).
          CFG.faceSizeMin = 0.34; CFG.faceSizeMax = 0.75;
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
          setInstr(t.calibTitle, t.calibSub);
        } else {
          setInstr(t.initializingTitle, t.initializingSub);
        }

        // Progressive feedback during MediaPipe boot — keeps the user informed
        // even when the network is dragging. Stage transitions are one-way so
        // the copy doesn't flicker between states. Once the first frame lands
        // the idleDraw clears itself and the regular position guidance takes over.
        var bootStart = performance.now();
        var firstFrameTimeoutMs = enginePreWarmed ? 12000 : 25000;
        var $initFallback = $("#fs-init-fallback");
        var initStage = enginePreWarmed ? "warm" : "neutral";
        S.idleDraw = setInterval(function () {
          if (S.fc > 0 || dead) {
            clearInterval(S.idleDraw); S.idleDraw = null;
            if ($initFallback) { $initFallback.style.display = "none"; S.lightPillShown = false; }
            return;
          }
          var elapsed = performance.now() - bootStart;

          // Cold-start staircase: neutral → slow → very-slow → timeout.
          // Pre-warmed boots skip these (the timeout still applies but the user
          // shouldn't see the slow-connection copy unless something is genuinely wrong).
          if (!enginePreWarmed) {
            if (elapsed > 12000 && initStage !== "verySlow") {
              initStage = "verySlow";
              setInstr(t.initializingTitleVerySlow, t.initializingSubVerySlow);
              if ($initFallback) $initFallback.style.display = "inline-flex";
            } else if (elapsed > 4000 && initStage === "neutral") {
              initStage = "slow";
              setInstr(t.initializingTitleSlow, t.initializingSubSlow);
            }
          }

          if (elapsed > firstFrameTimeoutMs) {
            clearInterval(S.idleDraw); S.idleDraw = null;
            if ($initFallback) { $initFallback.style.display = "none"; S.lightPillShown = false; }
            if (!dead) showErr(t.initializingTimeout);
            return;
          }
          resize();
          var rect = $scan.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) drawOverlay(ctx, rect.width, rect.height, S, t);
        }, 100);

        // Inline fallback button → drops out of scan into the manual upload flow,
        // same path as the gallery shortcut and the cancel-after-no-face case.
        if ($initFallback) {
          $initFallback.onclick = function () {
            // v9.3.1 — jamais pendant complete/preview : le scan est acquis,
            // un tap tardif ne doit pas le jeter.
            if (dead || S.phase === "complete" || S.phase === "preview") return;
            if (S.idleDraw) { clearInterval(S.idleDraw); S.idleDraw = null; }
            $initFallback.style.display = "none";
            // v9.2 — trace la sortie (boot lent OU lumière) + persiste le
            // scanLog : les sessions qui basculent en manuel sont précieuses
            // pour la calibration des seuils.
            S.logger.log({ type: "fallback_manual", timestamp: Date.now(), badLightMs: Math.round(S.badLightMs || 0), phase: S.phase });
            try { if (window.formState) window.formState.scanLog = S.logger.toJSON(); } catch (_) {}
            stopCam(S); exitFullscreen(); S.phase = "idle";
            if (onFall && !dead) onFall();
          };
        }

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
    // Garde anti-crash : une exception dans le traitement d'UN frame ne doit
    // JAMAIS tuer la boucle (vécu : ReferenceError dans noFace → scan gelé,
    // instruction figée, bascules massives en manuel la nuit du 12-13/07).
    // L'erreur devient un événement de télémétrie (cap 20) et le frame
    // suivant repart. Filet ultime : si les erreurs empêchent la branche
    // scanning d'atteindre son propre check de timeout, on force la fin.
    function onRes(results) {
      try {
        onResInner(results);
      } catch (e) {
        S._frameErrs = (S._frameErrs || 0) + 1;
        if (S._frameErrs <= 20) {
          try { S.logger.log({ type: "frame_error", timestamp: Date.now(), error: String((e && e.message) || e).slice(0, 140), n: S._frameErrs }); } catch (_) {}
        }
        try {
          if (S.phase === "scanning" && S.scanStart && performance.now() - S.scanStart > CFG.timeoutMs + 5000) {
            S.logger.logTimeout(0);
            finish();
          }
        } catch (_) {}
      }
    }

    function onResInner(results) {
      if (dead || (S.phase !== "calibrating" && S.phase !== "scanning" && S.phase !== "countdown")) return;
      var now = performance.now();
      var marks = results.multiFaceLandmarks && results.multiFaceLandmarks[0];

      if (!marks || marks.length < 468) { noFace(); return; }
      if (S.noFaceT) { clearTimeout(S.noFaceT); S.noFaceT = null; }

      // Face mesh overlay (v9.5) — on mémorise les landmarks DÉJÀ calculés par
      // MediaPipe (coût de calcul nul : on ne faisait que les jeter). Les dims
      // natives de la vidéo servent au mapping object-fit:cover de drawMesh.
      if (MESH_ON) {
        S.mesh.lm = marks;
        S.mesh.t = now;
        S.mesh.vw = $v.videoWidth || 0;
        S.mesh.vh = $v.videoHeight || 0;
        if (!S.mesh.logged) {
          S.mesh.logged = true;
          S.logger.log({ type: "mesh_overlay_on", timestamp: Date.now(), tier: deviceTier });
        }
      }

      S.fc++;
      var dt = S.prevT ? now - S.prevT : 33;
      var pose = headPose(marks, ($v.videoWidth > 0) ? $v.videoHeight / $v.videoWidth : 1);
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
        S.cBr = evalLight(S, analyzeBright($v, marks));
        S.cBl = analyzeBlur($v, marks);
        S.lastProbe = now;
      }
      var br = S.cBr || { ok: true, face: 128, bg: 128, dark: false, bright: false, bl: false, skinMed: 128, skinMin: 128, darkShare: 0, clipShare: 0, asym: 0, bgP90: 128, faceP10: 128, pv: 0 };
      var bl = S.cBl || { s: 30 };

      var pos = checkPosition(sz, noseX, pose.pitch, pose.roll, br, t);

      // Vertical placement gate — app parity (FaceCaptureScreen inOvalY):
      // the nose must sit within ±0.20 of the oval's vertical center (0.46).
      // Without it a face parked at the very top/bottom of the frame passed
      // calibration on the web while the app rejected it.
      var noseY = nose.y;
      var inOvalY = Math.abs(noseY - 0.46) < 0.20;
      if (pos.allGood && !inOvalY) {
        pos = {
          distOk: pos.distOk, centerOk: pos.centerOk, pitchOk: pos.pitchOk,
          rollOk: pos.rollOk, lightOk: pos.lightOk, allGood: false,
          msg: t.placeFaceInOval, sub: t.adjustPhone,
        };
      }

      S.st.dist = pos.distOk; S.st.light = br.ok; S.st.stab = stab <= CFG.stabMax;
      S.prev = marks; S.prevT = now;

      // DOM badges + dot strip + progress bar — sync every frame so the live
      // status visible in the bottom row matches what the calibration logic sees.
      updateBadge($bdgDist, S.st.dist);
      updateBadge($bdgLight, S.st.light);
      updateBadge($bdgStab, S.st.stab);
      updateDots();

      // ── v9.2 : télémétrie lumière + échappatoire persistante ──
      // (a) 1 event "light" / lightSampleMs (cap 40) : luminance visage/fond
      //     réelle → base de calibration des seuils (phase 2, données prod).
      // (b) Cumul du temps passé en lumière jugée mauvaise. Au-delà de
      //     lightFallbackMs, on AFFICHE le bouton d'import manuel existant
      //     (fs-init-fallback) sans couper le scan — échappatoire, pas
      //     couperet : l'utilisateur choisit de continuer ou de basculer.
      if (S.phase === "calibrating" || S.phase === "scanning") {
        var lightDt = S._lightFrameT ? Math.min(now - S._lightFrameT, 500) : 0;
        if (!br.ok) { S.badLightMs += lightDt; S._lastBadT = now; }
        if (now - S._lastLightEvt >= CFG.lightSampleMs && S.lightEvts < 40) {
          S._lastLightEvt = now; S.lightEvts++;
          S.logger.log({ type: "light", timestamp: Date.now(), f: Math.round(br.face), b: Math.round(br.bg), sm: Math.round(br.skinMed), sn: Math.round(br.skinMin), ds: Math.round(br.darkShare * 100), cs: Math.round(br.clipShare * 100), ay: Math.round(br.asym), b9: Math.round(br.bgP90), p1: Math.round(br.faceP10), pv: br.pv || 0, y: Math.round(Math.abs(pose.yaw)), ok: br.ok ? 1 : 0, ph: S.phase === "calibrating" ? "c" : "s" });
        }
        // Pill RE-DÉRIVABLE (audit v9.3.1) : visible ⟺ budget dépassé ET
        // lumière mauvaise récente (≤4s). Il se cache donc tout seul quand
        // l'utilisateur corrige son éclairage (fini le tap accidentel dans la
        // zone des chevrons qui jetait les angles capturés), réapparaît
        // instantanément si ça replonge, et survit à un resume (l'ancien
        // one-shot `!lightPillShown` était tué à jamais par l'idleDraw).
        var pillShould = S.badLightMs >= CFG.lightFallbackMs && (now - S._lastBadT) <= 4000;
        if (pillShould !== S.lightPillShown) {
          S.lightPillShown = pillShould;
          var $fbLight = $("#fs-init-fallback");
          if ($fbLight) $fbLight.style.display = pillShould ? "inline-flex" : "none";
          if (pillShould && !S._pillLogged) {
            S._pillLogged = true;
            S.logger.log({ type: "light_fallback_shown", timestamp: Date.now(), badLightMs: Math.round(S.badLightMs) });
          }
        }
      }
      S._lightFrameT = now;

      // ── CALIBRATION ──
      if (S.phase === "calibrating") {
        // Defensive cleanup of overlays in case the user is re-entering
        // calibration (post-retake or via state-machine reset).
        hideCountdown();
        if (S._guideDir && S._guideDir !== "none") {
          setSideArrow("none"); setUnderArrows("none"); S._guideDir = "none";
        }
        setInstr(pos.msg, pos.sub);

        if (pos.allGood) {
          if (!S.calibSince) S.calibSince = now;
          if (now - S.calibSince >= CFG.calibMs) {
            S.phase = "countdown"; S.countdownStart = now;
            S.logger.log({ type: "calibration_ok", timestamp: Date.now(), durationMs: now - (S.calibSince || now) });
            S.logger.log({ type: "countdown_start", timestamp: Date.now() });
            setInstr("", t.countdownSub);
            if (navigator.vibrate) navigator.vibrate(40);
          } else {
            setInstr(t.calibReady, t.calibReadySub);
          }
        } else { S.calibSince = null; }
      }

      // ── COUNTDOWN ──
      // Mobile renders the countdown in an 80×80 black-circle overlay centred
      // on the oval, with the "Préparez-vous…" copy still visible above. Web
      // mirrors that: fs-countdown is the circle, instr-above keeps t1/t2.
      if (S.phase === "countdown") {
        var cdElapsed = now - S.countdownStart;
        var sec = Math.ceil(3 - cdElapsed / 1000);
        if (sec >= 1) {
          showCountdown(sec.toString());
          setInstr("", t.countdownSub); // digit lives in the countdown circle
        }
        if (cdElapsed >= 3000) {
          hideCountdown();
          S.phase = "scanning"; S.scanStart = now; S.lastNewBinAt = now;
          S.logger.log({ type: "scanning_start", timestamp: Date.now() });
          var g = getGuidancePro(S.bins, absYaw, noseX > 0.5, t);
          setInstr(g.t1, g.t2);
          S._guideDir = g.dir;
          setSideArrow(g.dir);
          setUnderArrows(g.dir);
          if (navigator.vibrate) navigator.vibrate([60, 30, 60]);
        }
      }

      // ── SCANNING ──
      if (S.phase === "scanning") {
        var scanElapsed = now - S.scanStart;
        var nextDir = "none";

        // Échantillonnage de pose (1/2s) : yaw physique signé (droite < 0),
        // bin classifié, distance ok, visage vu. Le pendant "face perdue"
        // est loggé dans noFace().
        if (now - S.lastPoseSample >= 2000) {
          S.lastPoseSample = now;
          S.logger.logPoseSample({
            t: Math.round(scanElapsed / 1000),
            yaw: Math.round(toPhysicalYaw(absYaw, noseX > 0.5)),
            bin: classifyBin(absYaw, noseX) || "none",
            dist: pos.distOk ? 1 : 0,
            l: Math.round(br.face), b: Math.round(br.bg),
            face: 1,
          });
        }

        // Quality-hint overrides (after multiple post-capture rejects)
        if (S.qualityHint === "lightDuringScan") {
          setInstr(t.lightDuringScan, t.lightDuringScanSub);
        } else if (S.qualityHint === "qualityLow") {
          setInstr(t.qualityLow, t.qualityLowSub);
        } else if (!pos.distOk && sz < CFG.faceSizeMin) {
          // App parity: en phase scanning le sous-message parle du TÉLÉPHONE
          // ("Approchez le téléphone") — l'user est en rotation, c'est le
          // device qu'il doit bouger, pas lui.
          setInstr(t.moveCloser, t.moveCloserPhoneSub);
        } else if (!pos.distOk && sz > CFG.faceSizeMax) {
          setInstr(t.moveBack, t.moveBackPhoneSub);
        } else if (br.dark) {
          setInstr(t.lowLight, t.lowLightSub);
        } else if (br.bright) {
          setInstr(t.strongLight, t.strongLightSub);
        } else if (br.bl) {
          setInstr(t.backlight, t.backlightSub);
        } else if (!pos.pitchOk) {
          setInstr(t.pitchOff, t.pitchOffSub);
        } else if (!pos.rollOk) {
          setInstr(t.rollOff, t.rollOffSub);
        } else {
          var guide = getGuidancePro(S.bins, absYaw, noseX > 0.5, t);
          setInstr(guide.t1, guide.t2);
          nextDir = guide.dir;
        }
        // Drive the DOM chevrons (both side + under-oval) — they only show when
        // the user is supposed to turn. Other guidance states hide them so the
        // arrow doesn't conflict with a "fix your lighting" message.
        if (S._guideDir !== nextDir) {
          setSideArrow(nextDir);
          setUnderArrows(nextDir);
          S._guideDir = nextDir;
        }

        // Adaptive capture cadence (matches mobile step7.tsx): high-end devices
        // can sustain 150ms intervals for finer top-K selection; low/mid-end
        // devices throttle to 300ms to avoid frame drops during analysis.
        var captureInterval = isHighEnd ? CFG.captureMs : CFG.captureMs * 2;

        // Watchdog du verrou de capture : si une promesse capFrame ne se
        // règle JAMAIS (canvas.toBlob qui ne rappelle pas — observé en prod :
        // scan …6l51kcy2 muet après sa 4e capture, poses valides côté droit,
        // 0 tentative/0 rejet/0 erreur pendant 40s), S.capturing reste true
        // et bloque toutes les captures suivantes en silence. Au-delà de 3s
        // (une capture normale se règle en <300ms), on libère le verrou et
        // on le trace — diagnostic et remède en un.
        if (S.capturing && S._capturingSince && now - S._capturingSince > 3000) {
          S.capturing = false;
          S._capGen = (S._capGen || 0) + 1; // invalide la promesse zombie
          S.logger.log({ type: "capture_watchdog", timestamp: Date.now(), stuckMs: Math.round(now - S._capturingSince) });
          S._capturingSince = 0;
        }

        if (now - S.lastCapt >= captureInterval && !S.capturing && pos.distOk) {
          tryCapture(marks, pose, br, bl, stab, absYaw, noseX, now);
        }

        var filled = 0;
        for (var fi = 0; fi < BIN_IDS.length; fi++) { if (S.bins[BIN_IDS[fi]].length > 0) filled++; }

        // Retake mode: finish as soon as the target bin has a capture
        if (S.retake && S.bins[S.retake].length > 0) { finish(); return; }

        if (filled >= 7) { finish(); return; }
        // Early finish: 3+ essential bins after 20s, ONLY once the user has
        // stalled (no NEW bin filled for 12s). Without the stall guard this
        // fired the instant the first right-side bin landed (guidance does the
        // left side first), truncating active scans at 5/7 — telemetry
        // 2026-07-11: wide_right missing in 69/100 scans, left side complete.
        var hasEssential = S.bins.face.length > 0
          && (S.bins.right.length > 0 || S.bins.semi_right.length > 0 || S.bins.wide_right.length > 0)
          && (S.bins.left.length > 0 || S.bins.semi_left.length > 0 || S.bins.wide_left.length > 0);
        var stalledMs = now - (S.lastNewBinAt || S.scanStart);
        if (hasEssential && filled >= 3 && scanElapsed > 20000 && stalledMs > 12000 && !S.retake) { finish(); return; }
        if (scanElapsed > CFG.timeoutMs) { S.logger.logTimeout(filled); finish(); return; }
      }

      var rect = $scan.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) drawOverlay(ctx, rect.width, rect.height, S, t);
    }

    function noFace() {
      // Échantillon "visage perdu" pendant le scan (pendant de l'échantillon
      // de pose du branch scanning) — sans lui, un scan où l'utilisateur sort
      // du cadre serait indistinguable d'un scan où il ne tourne pas.
      // v9.3.1 — horodater AUSSI les frames sans visage : sinon le retour du
      // visage facturait jusqu'à 500ms de « mauvaise lumière » fantôme à
      // badLightMs sur la foi de flags figés d'avant la perte.
      // `now` n'existe QUE dans onRes — le référencer ici jetait une
      // ReferenceError au premier frame sans visage et tuait toute la boucle
      // MediaPipe (message figé, captures mortes → bascules en manuel).
      var nfNow = performance.now();
      S._lightFrameT = nfNow;
      if (S.phase === "scanning" && S.scanStart) {
        if (nfNow - S.lastPoseSample >= 2000) {
          S.lastPoseSample = nfNow;
          S.logger.logPoseSample({ t: Math.round((nfNow - S.scanStart) / 1000), face: 0 });
        }
      }
      setInstr(t.noFace, t.noFaceSub);
      S.st = { dist: null, light: null, stab: null }; S.calibSince = null;
      // Reset the bottom badges visually too (no face → unknown state)
      updateBadge($bdgDist, null);
      updateBadge($bdgLight, null);
      updateBadge($bdgStab, null);
      if (!S.noFaceT) {
        S.noFaceT = setTimeout(function () {
          // Fire only if we're still actively waiting for a face — including
          // mid-countdown, where MediaPipe stutter on low-end devices used to
          // silently keep the timer running and pop a misleading "no face"
          // error after the scan had moved on.
          var stillWaiting = (S.phase === "calibrating" || S.phase === "countdown" || S.phase === "scanning");
          if (stillWaiting && !dead && !S._interrupted) {
            S.logger.log({ type: "no_face", timestamp: Date.now(), durationMs: 0 });
            showErr(t.noFace);
          }
          S.noFaceT = null;
        }, CFG.noFaceMs);
      }
      var rect = $scan.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) drawOverlay(ctx, rect.width, rect.height, S, t);
    }

    /* ── Capture (with post-capture quality validation) ───── */
    function tryCapture(marks, pose, br, bl, stab, absYaw, noseX, now) {
      var detectedBin = classifyBin(absYaw, noseX);
      if (!detectedBin) return;
      // (v9.3.1) Le gate lumière pré-capture introduit en v9.2 a été RETIRÉ :
      // l'audit a montré un resserrage de facto (seuils live 40/235 + sortie
      // d'hystérèse 48/227 vs rejet post-capture 35/240 → la bande 35-48,
      // acceptée en v9.1, ne produisait plus AUCUNE tentative) et la perte de
      // la garantie de progression. Chemin de capture = v9.1 bit-identique
      // jusqu'à la calibration phase 2.
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

      // Pre-flight rejection (v9.8) : les scores stockés sont RÉELS. Borne
      // supérieure du candidat = angle connu, netteté/expo optimistes à 1.
      // Si même ça ne bat pas le pire stocké, on économise un takePhoto.
      var bestPossible = bestPossibleRealScore(absYaw, BIN_IDEAL_YAW[binId]);
      if (bin.length >= CFG.binTopN && bestPossible <= bin[bin.length - 1].score) return;

      S.capturing = true; S.lastCapt = now; S._capturingSince = now;
      // Génération de capture — défense en profondeur : si le watchdog avait
      // libéré le verrou pendant qu'une promesse traînait, sa résolution
      // tardive s'appliquerait à un état de bins périmé. Depuis v9.4 capFrame
      // se règle toujours en <1,2 s (repli synchrone) donc le watchdog (3 s)
      // ne devrait plus jamais firer — on garde la garde par sécurité.
      var capGen = (S._capGen = (S._capGen || 0) + 1);
      capFrame($v, S.logger).then(function (blob) {
        if (capGen !== S._capGen) return;
        if (!blob || dead) { S.capturing = false; return; }

        // v9.8 — verdict et score sur les PIXELS RÉELS du JPEG capturé
        // (le proxy vidéo mesuré ~100 ms avant la capture était aveugle au
        // flou de mouvement créé pendant la rotation de tête).
        // analyzeBlobQuality ≈ 15 ms (bitmap 120×120) ; le verrou S.capturing
        // reste posé pendant ce temps, très en-deçà du watchdog 3 s.
        // RETURN obligatoire : le .catch existant de capFrame doit attraper
        // toute erreur d'ici (sinon verrou coincé jusqu'au watchdog).
        return analyzeBlobQuality(blob).then(function (q) {
          // Génération périmée → le watchdog a repris le verrou (une capture
          // plus récente le détient peut-être) : NE PAS y toucher, sortir.
          if (capGen !== S._capGen) return;

          var quality, realLap, realLuma, provisional;
          if (q) {
            provisional = false;
            realLap = q.lap; realLuma = q.luma;
            var reason = realQualityVerdict(q.lap, q.luma, CFG);
            quality = { isAcceptable: reason === null, rejectReason: reason };
          } else {
            // Décodage impossible → bénéfice du doute : comportement proxy
            // intégral (verdict + valeurs preview), marqué provisoire.
            provisional = true;
            realLap = bl.s; realLuma = br.face;
            quality = analyzePhotoQuality(br, bl);
          }

          if (!quality.isAcceptable) {
            S.retakeRejects++;
            S.logger.logRejected(binId, quality.rejectReason || "quality_low");
            if (DEBUG) console.log("[FaceScan] Rejected " + binId + ": " + quality.rejectReason +
              " (luma=" + realLuma.toFixed(0) + ", lap=" + realLap.toFixed(1) + (provisional ? ", proxy" : "") + ")");

            var isLight = (quality.rejectReason === "lowLight" || quality.rejectReason === "strongLight");

            if (isLight) {
              S.qualityHint = "lightDuringScan";
              if (navigator.vibrate) navigator.vibrate([20, 40, 20]);
            } else if (S.retakeRejects >= CFG.rejectGuidanceAfter) {
              S.qualityHint = "qualityLow";
            }

            if (S.retakeRejects >= CFG.rejectForceAfter) {
              // Force-accept this one to avoid infinite loop.
              // (v9.3.1 : l'exemption lumière tentée en v9.2 supprimait la
              // garantie de progression — un scan v9.1 finissait TOUJOURS,
              // au pire avec le bandeau « qualité limite » en preview. Restauré
              // à l'identique ; à re-trancher en phase 2 avec seuils calibrés.)
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

          // Score stocké = RÉEL ; pScore = l'ancien score proxy, conservé pour
          // la télémétrie proxyRank de final_selection (provisoire : quality
          // EST le résultat d'analyzePhotoQuality → réutiliser son overallScore).
          var pScore = preScore * 0.6 +
            ((provisional ? quality.overallScore : quality0to1(realLap, realLuma)) * 0.4);
          var realScore = provisional
            ? pScore
            : scoreCandidateReal(realLap, realLuma, absYaw, BIN_IDEAL_YAW[binId], CFG);

          var wasEmpty = bin.length === 0;
          bin.push({ blob: blob, url: URL.createObjectURL(blob), score: realScore,
                     pScore: pScore, lap: realLap, luma: realLuma, provisional: provisional });
          bin.sort(function (a, b) { return b.score - a.score; });
          while (bin.length > CFG.binTopN) { var rm = bin.pop(); URL.revokeObjectURL(rm.url); }

          S.logger.logCapture(binId, realScore, wasEmpty, Math.round(br.face), Math.round(br.bg),
            Math.round(br.skinMed), Math.round(realLap * 10) / 10);
          // performance.now OBLIGATOIRE : même horloge que `now`/scanStart/stalledMs.
          // (Le Date.now historique rendait stalledMs négatif dès la 1re capture →
          // filet de stagnation mort, tous les bloqués partaient au timeout 90s.)
          if (wasEmpty) S.lastNewBinAt = performance.now();
          if (wasEmpty && navigator.vibrate) navigator.vibrate(25);
          S.capturing = false;
        });
      }).catch(function (e) {
        if (capGen !== S._capGen) return;
        S.logger.logError(e && e.message ? e.message : "capFrame_failed");
        S.capturing = false;
      });
    }

    function finish() {
      if (S.phase === "preview" || S.phase === "complete") return;
      // v9.3.1 — cacher le pill AVANT l'overlay « Scan terminé » : l'overlay
      // est pointer-events:none, un tap le TRAVERSAIT vers le pill resté
      // visible dessous → onFall en pleine séquence de finish = scan complet
      // jeté silencieusement.
      try { var $fbFin = $("#fs-init-fallback"); if ($fbFin) $fbFin.style.display = "none"; } catch (_) {}
      S.lightPillShown = false;
      var binsFilled = 0;
      for (var i = 0; i < BIN_IDS.length; i++) if (S.bins[BIN_IDS[i]].length > 0) binsFilled++;
      S.logger.logComplete(binsFilled);
      var wasRetake = !!S.retake;
      // Mobile parity: short "Scan terminé" overlay before transitioning to
      // preview. We freeze the camera in place (don't stopCam yet — the live
      // last frame stays under the dark overlay) and switch phase to "complete"
      // so onRes drops out of the scanning branch without redrawing arrows.
      S.phase = "complete";
      clearGuideUI();
      setInstr("", "");
      showCompleteOverlay();
      if (navigator.vibrate) navigator.vibrate([50, 25, 50]);

      // Winner verification runs DURING the 1.5s overlay (parity with the
      // app's analyzeWinnersInBackground): re-measure every bin winner on its
      // real JPEG pixels, swap in the runner-up when the winner is
      // unacceptable and the runner-up is clean. Must complete before
      // showPreview → doUpload so the corrected winner is what gets uploaded.
      // v9.8 — sélection finale exhaustive : les scores réels sont déjà
      // connus (mesurés à la capture) → plus AUCUN décodage ici, juste un
      // choix + un log. Remplace verifyWinners (qui ne re-mesurait que le
      // vainqueur + son dauphin pendant l'overlay de 1,5 s). L'événement
      // winner_swap est remplacé par final_selection (proxyRank > 1 = le
      // scoring réel a changé la photo envoyée).
      function selectFinal() {
        var okCount = 0, filledCount = 0;
        var summary = {};
        try {
          for (var vi = 0; vi < BIN_IDS.length; vi++) {
            var binId = BIN_IDS[vi];
            var bin = S.bins[binId];
            if (!bin.length) continue;
            filledCount++;
            var sel = selectBinFinal(bin, CFG);
            if (sel.winnerIdx !== 0) {
              var w = bin.splice(sel.winnerIdx, 1)[0];
              bin.unshift(w); // l'upload et la preview lisent bin[0]
            }
            if (sel.winnerUsable) okCount++;
            summary[binId] = {
              n: bin.length,
              winner: { lap: Math.round(bin[0].lap * 10) / 10, luma: Math.round(bin[0].luma),
                        score: Math.round(bin[0].score * 100) / 100, prov: bin[0].provisional ? 1 : 0 },
              usable: sel.winnerUsable ? 1 : 0,
              proxyRank: sel.proxyRank,
              cands: bin.map(function (c) { return [Math.round(c.lap * 10) / 10, Math.round(c.luma)]; }),
            };
          }
          // App parity (allWinnersBad) : AUCUN vainqueur utilisable →
          // bandeau doré "Qualité d'image limite".
          S._allWinnersBad = filledCount > 0 && okCount === 0;
          S.logger.log({ type: "final_selection", timestamp: Date.now(), bins: summary });
        } catch (e) {
          // La sélection ne doit JAMAIS bloquer la fin du scan : en cas de
          // pépin, bin[0] (déjà trié score desc) part tel quel.
          S.logger.logError("selectFinal: " + (e && e.message ? e.message : "unknown"));
        }
        return Promise.resolve();
      }

      var overlayDelay = new Promise(function (res) { setTimeout(res, 1500); });
      Promise.all([selectFinal(), overlayDelay]).then(function () {
        if (dead) return;
        hideCompleteOverlay();
        S.phase = "preview";
        stopCam(S);
        // Persist scan log to formState so it ships with the form submission
        try {
          if (window.formState) window.formState.scanLog = S.logger.toJSON();
        } catch (_) {}
        S.retake = null;
        S.retakeRejects = 0;
        S.qualityHint = null;
        // v9.2 — preview atteint : l'échappatoire lumière n'a plus lieu d'être,
        // et un éventuel retake repart avec un budget lumière neuf.
        try { var $fbDone = $("#fs-init-fallback"); if ($fbDone) $fbDone.style.display = "none"; } catch (_) {}
        S.lightPillShown = false; S.badLightMs = 0;
        showPreview(wasRetake);
      });
    }

    /* ── Preview — app-exact "Scan validé." screen ───────────
       Banner/hero/CTA states mirror FaceCaptureScreen.tsx phase==="preview":
         - face missing  → red banner, hero hidden, CTA disabled + helper
         - allWinnersBad → gold banner (face present), hero hidden
         - otherwise     → hero visible, CTA enabled
       The captures grid + per-angle retake modal were removed to match the
       app's v2 redesign (no grid — "Scan validé." hero carries the signal). */
    function updatePreviewMeta() {
      var faceMissing = S.bins.face.length === 0;
      var allBad = !!S._allWinnersBad;

      $("#fs-warn-face").style.display = faceMissing ? "flex" : "none";
      $("#fs-warn-quality").style.display = (!faceMissing && allBad) ? "flex" : "none";
      $("#fs-valid-hero").style.display = (!faceMissing && !allBad) ? "flex" : "none";
    }

    function showPreview(wasRetake) {
      show("prev");
      updatePreviewMeta();

      // Optional close-up (zoom) — app zoomBlock behaviour: empty card ↔
      // filled card with thumb + remove; tapping the filled card replaces.
      var $zIn = $("#fs-zoom-input");
      var $zEmpty = $("#fs-zoom-empty-wrap"), $zFilled = $("#fs-zoom-filled"), $zImg = $("#fs-zoom-img");
      function renderZoom() {
        var hasZoom = !!S.zoomFile;
        $zEmpty.style.display = hasZoom ? "none" : "";
        $zFilled.style.display = hasZoom ? "flex" : "none";
      }
      renderZoom();
      $("#fs-zoom-btn").onclick = function () { $zIn.click(); };
      $zFilled.onclick = function (e) {
        if (e.target.closest && e.target.closest("#fs-zoom-remove")) return;
        $zIn.click();
      };
      $("#fs-zoom-remove").onclick = function (e) {
        e.stopPropagation();
        S.zoomFile = null;
        if (window.formState && window.formState.photos && window.formState.photos.zoom) {
          window.formState.photos.zoom = { key: "", getUrl: "" };
        }
        renderZoom();
      };
      $zIn.onchange = function (e) {
        var f = e.target.files && e.target.files[0]; if (!f) return;
        S.zoomFile = f;
        var reader = new FileReader();
        reader.onload = function (ev) { $zImg.src = ev.target.result; renderZoom(); };
        reader.readAsDataURL(f);
        // Upload zoom immediately when selected (with compression + retry)
        compressBlob(f).then(function (compressed) {
          var zoomFileObj = new File([compressed], "scan_zoom_" + Date.now() + ".jpg", { type: "image/jpeg" });
          if (typeof window.uploadToS3Presigned === "function" && !S._debugNoUpload) {
            withRetry(function () {
              return window.uploadToS3Presigned({ file: zoomFileObj, jobId: (window.formState && window.formState.jobId) || "", type: "zoom" });
            }, "zoom_upload")
              .then(function (result) { if (window.formState) window.formState.photos.zoom = { key: result.key, getUrl: result.getUrl }; })
              .catch(function () {});
          }
        });
        e.target.value = "";
      };

      // After a retake, run the upload again so the new photo lands on S3
      doUpload(wasRetake);
    }


    /* ── Upload ───────────────────────────── */
    function doUpload(wasRetake) {
      if (S._debugNoUpload) return; // dev harness (#fsdebug) — no network
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
        if (dead) return;
        if (!result) {
          // Surface the failure so the user knows to retry instead of being
          // silently stuck on the photo-required validation gate.
          var photoErr = document.getElementById("photo-error");
          if (photoErr) {
            photoErr.classList.remove("hidden");
            photoErr.textContent = t.uploadFail;
          }
          return;
        }
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
          // Abort if the scanner was destroyed mid-queue. Without this the
          // pending uploads keep mutating window.formState.photos AFTER the
          // form has already been submitted (or the user retook + we have
          // a stale upload from a previous session overwriting the new key).
          if (dead) return;
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

    /* ── Dev-only visual harness ─────────────────────────────────
       Activated ONLY when the page URL carries #fsdebug: fills the bins
       with synthetic captures and jumps straight to the preview screen so
       the preview/warning states can be inspected without a camera.
       No-op in production URLs. */
    if (typeof location !== "undefined" && (location.hash || "").indexOf("fsdebug") >= 0) {
      window.__fsDebugPreview = function (opts2) {
        opts2 = opts2 || {};
        S._debugNoUpload = true; // never hit the real presign API with synthetic blobs
        var skip = opts2.skipBins || [];
        var lowScore = !!opts2.lowScore;
        S._allWinnersBad = !!opts2.allBad;
        var colors = { face: "#8aa", semi_right: "#a98", right: "#9a8", wide_right: "#89a", semi_left: "#a89", left: "#98a", wide_left: "#aa8" };
        var pending = 0;
        for (var i = 0; i < BIN_IDS.length; i++) {
          (function (binId) {
            if (skip.indexOf(binId) >= 0) { S.bins[binId] = []; return; }
            pending++;
            var cv = document.createElement("canvas");
            cv.width = 300; cv.height = 400;
            var cx2 = cv.getContext("2d");
            cx2.fillStyle = colors[binId] || "#999";
            cx2.fillRect(0, 0, 300, 400);
            cx2.fillStyle = "#fff"; cx2.font = "20px sans-serif";
            cx2.fillText(binId, 20, 200);
            cv.toBlob(function (b) {
              S.bins[binId] = [{ blob: b, url: URL.createObjectURL(b), score: lowScore ? 0.2 : 0.6 }];
              pending--;
              if (pending === 0) { S.phase = "preview"; showPreview(false); }
            }, "image/jpeg", 0.8);
          })(BIN_IDS[i]);
        }
        if (pending === 0) { S.phase = "preview"; showPreview(false); }
      };
      window.__fsDebugInterrupted = function () { showInterrupted(); };
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
      window.removeEventListener("orientationchange", resizeHandler);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
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
        _bc = null; _bx = null; _lc = null; _lx = null; _blurBuf = null;
        this._i = createScanner(this._el, this._o);
      }
    },
  };
})();
