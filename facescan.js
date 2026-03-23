/**
 * Adermio Face Scan v5.2
 *
 * Fixes from v5.1:
 *  - Direction detection via nose.x position (camera-agnostic, no yaw sign dependency)
 *  - Ultra-permissive capture gates: only face size required during scan
 *  - Brightness/blur/stability affect SCORE only, never block capture
 *  - Design matches Adermio brand: teal/stone, DM Sans/Playfair, no emojis
 *  - Debug console logs for diagnostics
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
      permTitle: "Scan facial intelligent",
      permDesc: "Notre technologie analyse votre visage en quelques secondes pour garantir des photos optimales. Aucune vidéo n'est enregistrée.",
      permBtn: "Activer la caméra",
      denied: "Accès caméra refusé. Importez vos photos manuellement.",
      notSupported: "Navigateur incompatible. Utilisez l'import manuel.",
      noDevice: "Aucune caméra frontale détectée.",
      loading: "Initialisation...",
      calibTitle: "Positionnez votre visage",
      calibReady: "Parfait, ne bougez pas",
      moveCloser: "Rapprochez-vous",
      moveBack: "Reculez légèrement",
      centerFace: "Centrez votre visage",
      lowLight: "Luminosité insuffisante",
      strongLight: "Lumière trop forte",
      backlight: "Contre-jour détecté",
      holdStill: "Restez immobile",
      noFace: "Aucun visage détecté",
      noFaceHint: "Assurez-vous que votre visage est visible",
      scanTitle: "Scan en cours",
      turnRight: "Tournez lentement vers la droite",
      backCenter: "Revenez face caméra",
      turnLeft: "Tournez lentement vers la gauche",
      finishing: "Finalisation...",
      binFace: "Face",
      binSemiR: "Semi D",
      binRight: "Profil D",
      binSemiL: "Semi G",
      binLeft: "Profil G",
      distance: "Distance",
      light: "Lumière",
      stability: "Stabilité",
      previewTitle: "Vos captures",
      excellent: "Excellent",
      good: "Bon",
      ok: "Correct",
      missing: "Manquant",
      retake: "Refaire",
      validate: "Valider et continuer",
      restart: "Recommencer le scan",
      uploading: "Envoi en cours...",
    },
    en: {
      permTitle: "Smart face scan",
      permDesc: "Our technology analyzes your face in a few seconds to ensure optimal photos. No video is recorded.",
      permBtn: "Enable camera",
      denied: "Camera access denied. Upload your photos manually.",
      notSupported: "Browser not supported. Use manual upload.",
      noDevice: "No front camera detected.",
      loading: "Initializing...",
      calibTitle: "Position your face",
      calibReady: "Perfect, hold still",
      moveCloser: "Move closer",
      moveBack: "Move back slightly",
      centerFace: "Center your face",
      lowLight: "Not enough light",
      strongLight: "Too much light",
      backlight: "Backlight detected",
      holdStill: "Hold still",
      noFace: "No face detected",
      noFaceHint: "Make sure your face is visible",
      scanTitle: "Scanning",
      turnRight: "Slowly turn to the right",
      backCenter: "Come back to center",
      turnLeft: "Slowly turn to the left",
      finishing: "Finishing...",
      binFace: "Front",
      binSemiR: "Semi R",
      binRight: "Profile R",
      binSemiL: "Semi L",
      binLeft: "Profile L",
      distance: "Distance",
      light: "Light",
      stability: "Stability",
      previewTitle: "Your captures",
      excellent: "Excellent",
      good: "Good",
      ok: "Fair",
      missing: "Missing",
      retake: "Retake",
      validate: "Validate and continue",
      restart: "Restart scan",
      uploading: "Uploading...",
    },
  };

  /* ═══════════════════════════════════════════════════════════
     CONFIG
     ═══════════════════════════════════════════════════════════ */
  const CFG = {
    faceSizeMin: 0.18,
    faceSizeMax: 0.60,
    centerMaxOff: 0.18,
    faceYawMax: 12,
    semiYawMin: 13,
    semiYawMax: 33,
    profYawMin: 27,
    profYawMax: 60,
    pitchMax: 20,
    brightMin: 40,
    brightMax: 235,
    brightIdeal: 130,
    backlightRatio: 0.50,
    blurThresh: 6,
    blurIdeal: 45,
    stabMax: 0.20,
    calibMs: 700,
    captureMs: 150,
    timeoutMs: 25000,
    noFaceMs: 12000,
    binTopN: 3,
    jpegQ: 0.92,
    expensiveEvery: 4,
  };

  /* ═══════════════════════════════════════════════════════════
     BIN DEFINITIONS (direction via nose.x, NOT yaw sign)
     ═══════════════════════════════════════════════════════════ */
  const BIN_IDS = ["face", "semi_right", "right", "semi_left", "left"];
  const BIN_LABELS = {
    face: "binFace", semi_right: "binSemiR", right: "binRight",
    semi_left: "binSemiL", left: "binLeft",
  };
  const BIN_IDEAL_ABS_YAW = {
    face: 0, semi_right: 22, right: 42, semi_left: 22, left: 42,
  };

  /**
   * Determine which bin a frame belongs to.
   * Uses absolute yaw for magnitude, nose.x for direction (camera-agnostic).
   * In raw front-camera coords: nose.x < 0.5 = user turns right, nose.x > 0.5 = user turns left.
   */
  function classifyBin(absYaw, noseX) {
    const turnsRight = noseX < 0.5;
    if (absYaw < CFG.faceYawMax) return "face";
    if (absYaw >= CFG.semiYawMin && absYaw < CFG.profYawMin) {
      return turnsRight ? "semi_right" : "semi_left";
    }
    if (absYaw >= CFG.profYawMin && absYaw <= CFG.profYawMax) {
      return turnsRight ? "right" : "left";
    }
    // In overlap zone between semi and prof
    if (absYaw >= CFG.semiYawMin && absYaw <= CFG.profYawMax) {
      return absYaw < 30
        ? (turnsRight ? "semi_right" : "semi_left")
        : (turnsRight ? "right" : "left");
    }
    return null; // Dead zone (yaw 12-13) or beyond 60
  }

  /* ═══════════════════════════════════════════════════════════
     LANDMARKS
     ═══════════════════════════════════════════════════════════ */
  const LM = {
    nose: 1, bridge: 6,
    lCheek: 234, rCheek: 454,
    chin: 152, forehead: 10,
    contour: [10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109,10],
  };

  /* ═══════════════════════════════════════════════════════════
     GEOMETRY
     ═══════════════════════════════════════════════════════════ */
  function pt(m, i) { const p = m[i]; return { x: p.x, y: p.y, z: p.z }; }
  function d2(a, b) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }

  function faceBounds(m) {
    let x0 = 1, x1 = 0, y0 = 1, y1 = 0;
    for (const i of LM.contour) { const p = m[i]; if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x; if (p.y < y0) y0 = p.y; if (p.y > y1) y1 = p.y; }
    return { x0, x1, y0, y1 };
  }

  function headPose(m) {
    const lc = pt(m, LM.lCheek), rc = pt(m, LM.rCheek), ch = pt(m, LM.chin), fh = pt(m, LM.forehead);
    const hx = rc.x - lc.x, hy = rc.y - lc.y, hz = rc.z - lc.z;
    const vx = fh.x - ch.x, vy = fh.y - ch.y, vz = fh.z - ch.z;
    const nx = hy * vz - hz * vy, ny = hz * vx - hx * vz, nz = hx * vy - hy * vx;
    const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1e-9;
    return {
      yaw: (Math.atan2(nx, -nz) * 180) / Math.PI,
      pitch: (Math.asin(Math.max(-1, Math.min(1, -ny / nLen))) * 180) / Math.PI,
    };
  }

  function faceSize(m) { return d2(pt(m, LM.forehead), pt(m, LM.chin)); }

  function stabPerSec(curr, prev, dt) {
    if (!prev || dt < 1) return 0;
    let sum = 0, n = 0;
    for (let i = 0; i < curr.length && i < prev.length; i += 10) { sum += d2(curr[i], prev[i]); n++; }
    return n > 0 ? sum / n / (dt / 1000) : 0;
  }

  /* ═══════════════════════════════════════════════════════════
     IMAGE ANALYSIS
     ═══════════════════════════════════════════════════════════ */
  let _bc = null, _bx = null, _lc = null, _lx = null, _cc = null, _cx = null;

  function analyzeBright(video, m) {
    if (!_bc) { _bc = document.createElement("canvas"); _bx = _bc.getContext("2d", { willReadFrequently: true }); }
    const sw = 120, sh = 90; _bc.width = sw; _bc.height = sh;
    _bx.drawImage(video, 0, 0, sw, sh);
    const d = _bx.getImageData(0, 0, sw, sh).data;
    const fb = faceBounds(m);
    let fs = 0, fp = 0, bs = 0, bp = 0;
    for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
      const i = (y * sw + x) * 4;
      const l = d[i] * 0.299 + d[i+1] * 0.587 + d[i+2] * 0.114;
      const nx = x / sw, ny = y / sh;
      if (nx >= fb.x0 && nx <= fb.x1 && ny >= fb.y0 && ny <= fb.y1) { fs += l; fp++; } else { bs += l; bp++; }
    }
    const face = fp > 0 ? fs / fp : 128, bg = bp > 0 ? bs / bp : 128;
    const r = bg > 1 ? face / bg : 1;
    return {
      face, bg, r,
      ok: face >= CFG.brightMin && face <= CFG.brightMax && !(r < CFG.backlightRatio && bg > 80),
      dark: face < CFG.brightMin, light: face > CFG.brightMax, bl: r < CFG.backlightRatio && bg > 80,
    };
  }

  function analyzeBlur(video, m) {
    if (!_lc) { _lc = document.createElement("canvas"); _lx = _lc.getContext("2d", { willReadFrequently: true }); }
    const fb = faceBounds(m);
    const vw = video.videoWidth || 640, vh = video.videoHeight || 480;
    const sx = fb.x0 * vw, sy = fb.y0 * vh, sw = (fb.x1 - fb.x0) * vw, sh = (fb.y1 - fb.y0) * vh;
    if (sw < 10 || sh < 10) return { s: 0, ok: false };
    const cw = 120, ch = 120; _lc.width = cw; _lc.height = ch;
    _lx.drawImage(video, sx, sy, sw, sh, 0, 0, cw, ch);
    const d = _lx.getImageData(0, 0, cw, ch).data;
    const g = new Float32Array(cw * ch);
    for (let i = 0; i < g.length; i++) g[i] = d[i*4] * 0.299 + d[i*4+1] * 0.587 + d[i*4+2] * 0.114;
    let sum = 0, n = 0;
    for (let y = 1; y < ch - 1; y++) for (let x = 1; x < cw - 1; x++) {
      const lap = -4 * g[y*cw+x] + g[(y-1)*cw+x] + g[(y+1)*cw+x] + g[y*cw+x-1] + g[y*cw+x+1];
      sum += lap * lap; n++;
    }
    const s = n > 0 ? sum / n : 0;
    return { s, ok: s >= CFG.blurThresh };
  }

  /* ═══════════════════════════════════════════════════════════
     SCORING
     ═══════════════════════════════════════════════════════════ */
  function score(br, bl, stab, absYaw, idealAbsYaw) {
    const bS = Math.max(0, 1 - Math.abs(br.face - CFG.brightIdeal) / 90);
    const lS = Math.min(1, bl.s / CFG.blurIdeal);
    const tS = Math.max(0, 1 - stab / (CFG.stabMax * 6));
    const aS = Math.max(0, 1 - Math.abs(absYaw - idealAbsYaw) / 25);
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
    const bins = {}; for (const id of BIN_IDS) bins[id] = [];
    return {
      phase: "idle", bins, calibSince: null,
      scanStart: null, lastCapt: 0,
      prev: null, prevT: null,
      noFaceT: null, fc: 0,
      cBr: null, cBl: null,
      st: { dist: null, light: null, stab: null },
      fm: null, cam: null, stream: null,
      meta: null, retake: null, capturing: false,
    };
  }

  /* ═══════════════════════════════════════════════════════════
     POLYFILL
     ═══════════════════════════════════════════════════════════ */
  if (typeof CanvasRenderingContext2D !== "undefined" && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      const rad = typeof r === "number" ? r : (r && r[0]) || 0;
      this.beginPath(); this.moveTo(x + rad, y);
      this.arcTo(x+w, y, x+w, y+h, rad); this.arcTo(x+w, y+h, x, y+h, rad);
      this.arcTo(x, y+h, x, y, rad); this.arcTo(x, y, x+w, y, rad);
      this.closePath(); return this;
    };
  }

  /* ═══════════════════════════════════════════════════════════
     UI — Adermio Brand Design
     Colors: dark=#0F3D39  primary=#14B8A6  light=#F0FDFA  cream=#FAFAF9  sand=#E7E5E4  gold=#D4B483
     Fonts: Playfair Display (serif), DM Sans (sans)
     ═══════════════════════════════════════════════════════════ */
  function buildUI(t) {
    return `
<div id="fs-root" style="position:relative;width:100%;max-width:400px;margin:0 auto;border-radius:1.5rem;overflow:hidden;background:#0F3D39;font-family:'DM Sans',sans-serif;">

  <div id="fs-perm" style="padding:40px 28px;text-align:center;background:linear-gradient(160deg,#0F3D39,#1a4f4a);color:#fff;">
    <div style="width:56px;height:56px;margin:0 auto 20px;border-radius:50%;border:1.5px solid rgba(20,184,166,.3);display:flex;align-items:center;justify-content:center;">
      <svg width="24" height="24" fill="none" stroke="#14B8A6" stroke-width="1.5" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M2 17l20 0"/></svg>
    </div>
    <h3 style="font-family:'Playfair Display',serif;font-size:20px;font-weight:600;margin:0 0 8px;letter-spacing:-.2px;">${t.permTitle}</h3>
    <p style="font-size:12px;color:rgba(255,255,255,.55);margin:0 0 28px;line-height:1.7;font-weight:300;">${t.permDesc}</p>
    <button id="fs-go" style="width:100%;padding:15px;border:none;border-radius:2rem;background:#14B8A6;color:#fff;font-size:14px;font-weight:600;cursor:pointer;letter-spacing:.4px;text-transform:uppercase;transition:opacity .15s;">${t.permBtn}</button>
  </div>

  <div id="fs-load" style="display:none;padding:60px 28px;text-align:center;background:#0F3D39;color:#fff;">
    <div style="width:36px;height:36px;margin:0 auto 20px;border:2px solid rgba(255,255,255,.1);border-top-color:#14B8A6;border-radius:50%;animation:fsSpin .7s linear infinite;"></div>
    <p style="font-size:13px;color:rgba(255,255,255,.5);font-weight:400;">${t.loading}</p>
  </div>

  <div id="fs-scan" style="display:none;position:relative;aspect-ratio:3/4;background:#000;">
    <video id="fs-v" playsinline autoplay muted style="width:100%;height:100%;object-fit:cover;transform:scaleX(-1);"></video>
    <canvas id="fs-ov" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;"></canvas>
    <div id="fs-fl" style="display:none;position:absolute;inset:0;background:rgba(20,184,166,.15);pointer-events:none;z-index:5;transition:opacity .25s;"></div>
    <div style="position:absolute;bottom:0;left:0;right:0;padding:16px 20px 22px;background:linear-gradient(transparent,rgba(0,0,0,.75));text-align:center;z-index:4;">
      <p id="fs-t1" style="color:#fff;font-size:14px;font-weight:600;margin:0;font-family:'DM Sans',sans-serif;"></p>
      <p id="fs-t2" style="color:rgba(255,255,255,.5);font-size:11px;margin:5px 0 0;font-weight:400;"></p>
    </div>
  </div>

  <div id="fs-prev" style="display:none;padding:24px;background:linear-gradient(160deg,#0F3D39,#1a4f4a);color:#fff;">
    <h3 style="font-family:'Playfair Display',serif;font-size:18px;font-weight:600;margin:0 0 16px;text-align:center;">${t.previewTitle}</h3>
    <div id="fs-g1" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:6px;"></div>
    <div id="fs-g2" style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin-bottom:20px;"></div>
    <button id="fs-ok" style="width:100%;padding:15px;border:none;border-radius:2rem;background:#14B8A6;color:#fff;font-size:14px;font-weight:600;cursor:pointer;text-transform:uppercase;letter-spacing:.4px;">${t.validate}</button>
    <button id="fs-re" style="width:100%;padding:12px;margin-top:8px;border:1px solid rgba(255,255,255,.1);border-radius:2rem;background:transparent;color:rgba(255,255,255,.45);font-size:12px;font-weight:500;cursor:pointer;">${t.restart}</button>
  </div>

  <div id="fs-err" style="display:none;padding:48px 28px;text-align:center;background:#0F3D39;color:#fff;">
    <div style="width:48px;height:48px;margin:0 auto 16px;border-radius:50%;border:1.5px solid rgba(239,68,68,.2);display:flex;align-items:center;justify-content:center;">
      <svg width="20" height="20" fill="none" stroke="#ef4444" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
    </div>
    <p id="fs-em" style="font-size:13px;color:#f87171;margin:0;font-weight:400;"></p>
  </div>
</div>
<style>@keyframes fsSpin{to{transform:rotate(360deg)}}</style>`;
  }

  /* ═══════════════════════════════════════════════════════════
     OVERLAY
     ═══════════════════════════════════════════════════════════ */
  function drawOv(ctx, w, h, S, t) {
    ctx.clearRect(0, 0, w, h);
    if (S.phase !== "calibrating" && S.phase !== "scanning") return;

    const cx = w / 2, cy = h * 0.42, rx = w * 0.34, ry = h * 0.29;

    // Dim
    ctx.fillStyle = "rgba(0,0,0,.45)";
    ctx.beginPath(); ctx.rect(0, 0, w, h);
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2, true);
    ctx.fill("evenodd");

    // Oval
    const ok = S.st.dist && S.st.light;
    ctx.strokeStyle = ok ? "#14B8A6" : "rgba(255,255,255,.35)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();

    // Progress ring
    if (S.phase === "scanning" && S.scanStart) {
      const p = Math.min(1, (performance.now() - S.scanStart) / CFG.timeoutMs);
      ctx.strokeStyle = "rgba(20,184,166,.35)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx + 5, ry + 5, 0, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
      ctx.stroke();
    }

    // Badges
    drawBadges(ctx, w, h, S.st, t);

    // Bin dots
    if (S.phase === "scanning") drawBins(ctx, w, h, S, t);
  }

  function drawBadges(ctx, w, h, st, t) {
    const items = [
      { k: "dist", l: t.distance },
      { k: "light", l: t.light },
      { k: "stab", l: t.stability },
    ];
    const bw = 72, bh = 24, gap = 6;
    const tw = items.length * bw + (items.length - 1) * gap;
    let x = (w - tw) / 2;
    const y = h * 0.81;

    for (const b of items) {
      const v = st[b.k];
      ctx.fillStyle = v === true ? "rgba(20,184,166,.15)" : v === false ? "rgba(239,68,68,.12)" : "rgba(255,255,255,.06)";
      ctx.beginPath(); ctx.roundRect(x, y, bw, bh, 6); ctx.fill();
      ctx.fillStyle = v === true ? "#14B8A6" : v === false ? "#f87171" : "rgba(255,255,255,.3)";
      ctx.font = "500 9px 'DM Sans',sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(b.l, x + bw / 2, y + bh / 2);
      x += bw + gap;
    }
  }

  function drawBins(ctx, w, h, S, t) {
    const order = ["left", "semi_left", "face", "semi_right", "right"];
    const labels = order.map((id) => t[BIN_LABELS[id]]);
    const tw = w * 0.80, sx = (w - tw) / 2, y = h * 0.055;
    const sp = tw / (order.length - 1), r = 8;

    // Line
    ctx.strokeStyle = "rgba(255,255,255,.08)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(sx, y); ctx.lineTo(sx + tw, y); ctx.stroke();

    for (let i = 0; i < order.length; i++) {
      const dx = sx + i * sp;
      const has = S.bins[order[i]].length > 0;

      ctx.beginPath(); ctx.arc(dx, y, r, 0, Math.PI * 2);
      ctx.fillStyle = has ? "#14B8A6" : "rgba(255,255,255,.06)";
      ctx.fill();
      if (has) { ctx.strokeStyle = "rgba(20,184,166,.4)"; ctx.lineWidth = 1.5; ctx.stroke(); }

      if (has) {
        ctx.fillStyle = "#fff"; ctx.font = "600 8px 'DM Sans',sans-serif";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("\u2713", dx, y + 0.5);
      }

      ctx.fillStyle = has ? "rgba(20,184,166,.8)" : "rgba(255,255,255,.25)";
      ctx.font = "500 7px 'DM Sans',sans-serif"; ctx.textAlign = "center";
      ctx.fillText(labels[i], dx, y + r + 9);
    }

    const count = BIN_IDS.filter((id) => S.bins[id].length > 0).length;
    ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.font = "600 11px 'DM Sans',sans-serif";
    ctx.textAlign = "center"; ctx.fillText(count + "/5", w / 2, y + r + 23);
  }

  /* ═══════════════════════════════════════════════════════════
     CAMERA / MEDIAPIPE
     ═══════════════════════════════════════════════════════════ */
  async function reqCam() {
    return navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false,
    });
  }
  function initFM(cb) {
    const fm = new window.FaceMesh({ locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}` });
    fm.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
    fm.onResults(cb); return fm;
  }
  function startCam(v, fm) {
    // Manual rAF loop instead of MediaPipe Camera utility (broken on iOS/WebKit)
    let running = true, processing = false;
    function tick() {
      if (!running) return;
      requestAnimationFrame(tick);              // schedule next BEFORE processing
      if (v.readyState >= 2 && !processing) {
        processing = true;
        fm.send({ image: v })
          .catch((e) => console.warn("[Adermio] fm.send error:", e))
          .finally(() => { processing = false; });
      }
    }
    requestAnimationFrame(tick);
    return { stop() { running = false; } };
  }
  function stopCam(S) {
    if (S.cam) { try { S.cam.stop(); } catch (_) {} S.cam = null; }
    if (S.stream) { S.stream.getTracks().forEach((tr) => tr.stop()); S.stream = null; }
    if (S.noFaceT) { clearTimeout(S.noFaceT); S.noFaceT = null; }
  }

  function capFrame(video) {
    return new Promise((res) => {
      const vw = video.videoWidth || 1280, vh = video.videoHeight || 960;
      if (!_cc) { _cc = document.createElement("canvas"); _cx = _cc.getContext("2d"); }
      _cc.width = vw; _cc.height = vh; _cx.drawImage(video, 0, 0, vw, vh);
      _cc.toBlob((b) => res(b), "image/jpeg", CFG.jpegQ);
    });
  }

  function phaseInstr(elapsed, t) {
    if (elapsed < 4000) return t.turnRight;
    if (elapsed < 6500) return t.backCenter;
    if (elapsed < 10500) return t.turnLeft;
    if (elapsed < 13000) return t.backCenter;
    return t.finishing;
  }

  /* ═══════════════════════════════════════════════════════════
     MAIN SCANNER
     ═══════════════════════════════════════════════════════════ */
  function createScanner(container, opts) {
    const lang = opts.lang || (((document.documentElement.lang || "").substring(0, 2) === "en") ? "en" : "fr");
    const t = T[lang] || T.fr;
    const onDone = opts.onComplete || null;
    const onFall = opts.onFallback || null;
    let S = mkState(), dead = false;

    container.innerHTML = buildUI(t);
    const $ = (sel) => container.querySelector(sel);
    const $perm = $("#fs-perm"), $load = $("#fs-load"), $scan = $("#fs-scan");
    const $prev = $("#fs-prev"), $err = $("#fs-err");
    const $v = $("#fs-v"), $ov = $("#fs-ov"), $fl = $("#fs-fl");
    const $t1 = $("#fs-t1"), $t2 = $("#fs-t2"), $em = $("#fs-em");
    const ctx = $ov.getContext("2d");

    function show(name) {
      [$perm,$load,$scan,$prev,$err].forEach((e) => (e.style.display = "none"));
      ({ perm: $perm, load: $load, scan: $scan, prev: $prev, err: $err })[name].style.display = "";
    }
    function err(msg) { $em.textContent = msg; show("err"); S.phase = "idle"; setTimeout(() => { if (onFall && !dead) onFall(); }, 2500); }
    function flash() { $fl.style.display = ""; $fl.style.opacity = "1"; setTimeout(() => { $fl.style.opacity = "0"; }, 200); setTimeout(() => { $fl.style.display = "none"; }, 350); }
    function resize() {
      const r = $scan.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
      $ov.width = r.width * dpr; $ov.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    show("perm"); S.phase = "perm";

    $("#fs-go").addEventListener("click", async () => {
      show("load"); S.phase = "load";
      try {
        if (!navigator.mediaDevices?.getUserMedia) { err(t.notSupported); return; }
        S.stream = await reqCam();
        $v.srcObject = S.stream;
        await new Promise((ok, no) => { $v.addEventListener("loadedmetadata", ok, { once: true }); setTimeout(() => no(new Error("timeout")), 10000); });
        try { await $v.play(); } catch (_) {}   // explicit play() required on iOS
        S.fm = initFM(onRes);
        S.cam = startCam($v, S.fm);
        S.phase = "calibrating"; show("scan"); resize();
        $t1.textContent = t.calibTitle; $t2.textContent = t.centerFace;
        console.log("[Adermio] Scan initialized, entering calibration");
      } catch (e) {
        console.error("[Adermio] Camera error:", e);
        if (e.name === "NotAllowedError") err(t.denied);
        else if (e.name === "NotFoundError") err(t.noDevice);
        else err(t.denied);
      }
    });

    /* ── MediaPipe callback ───────────────────── */
    function onRes(results) {
      if (dead || (S.phase !== "calibrating" && S.phase !== "scanning")) return;
      const now = performance.now();
      const marks = results.multiFaceLandmarks?.[0];

      if (!marks || marks.length < 468) { noFace(); return; }
      if (S.noFaceT) { clearTimeout(S.noFaceT); S.noFaceT = null; }

      S.fc++;
      const dt = S.prevT ? now - S.prevT : 33;
      const pose = headPose(marks);
      const sz = faceSize(marks);
      const st = stabPerSec(marks, S.prev, dt);
      const nose = marks[LM.nose];
      const centered = Math.abs(nose.x - 0.5) < CFG.centerMaxOff;
      const absYaw = Math.abs(pose.yaw);

      if (S.fc % CFG.expensiveEvery === 0 || !S.cBr) {
        S.cBr = analyzeBright($v, marks);
        S.cBl = analyzeBlur($v, marks);
      }
      const br = S.cBr || { ok: true, face: 128, dark: false, light: false, bl: false };
      const bl = S.cBl || { ok: true, s: 30 };

      const distOk = sz >= CFG.faceSizeMin && sz <= CFG.faceSizeMax;
      S.st.dist = distOk; S.st.light = br.ok; S.st.stab = st <= CFG.stabMax;
      S.prev = marks; S.prevT = now;

      // Debug log every 30 frames
      if (S.fc % 30 === 0) {
        console.log(`[Adermio] yaw=${pose.yaw.toFixed(1)} abs=${absYaw.toFixed(1)} noseX=${nose.x.toFixed(3)} size=${sz.toFixed(3)} bright=${br.face.toFixed(0)} blur=${bl.s.toFixed(1)} stab=${st.toFixed(3)} phase=${S.phase}`);
      }

      // ── CALIBRATION ──
      if (S.phase === "calibrating") {
        if (sz < CFG.faceSizeMin) { $t1.textContent = t.moveCloser; $t2.textContent = ""; }
        else if (sz > CFG.faceSizeMax) { $t1.textContent = t.moveBack; $t2.textContent = ""; }
        else if (br.dark) { $t1.textContent = t.lowLight; $t2.textContent = ""; }
        else if (br.light) { $t1.textContent = t.strongLight; $t2.textContent = ""; }
        else if (br.bl) { $t1.textContent = t.backlight; $t2.textContent = ""; }
        else if (!centered) { $t1.textContent = t.centerFace; $t2.textContent = ""; }
        else { $t1.textContent = t.calibTitle; $t2.textContent = ""; }

        const calibOk = distOk && br.ok && centered;
        if (calibOk) {
          if (!S.calibSince) S.calibSince = now;
          if (now - S.calibSince >= CFG.calibMs) {
            S.phase = "scanning"; S.scanStart = now;
            $t1.textContent = t.scanTitle; $t2.textContent = t.turnRight;
            if (navigator.vibrate) navigator.vibrate(60);
            console.log("[Adermio] Calibration passed, starting scan");
          } else {
            $t1.textContent = t.calibReady; $t2.textContent = "";
          }
        } else { S.calibSince = null; }
      }

      // ── SCANNING ──
      if (S.phase === "scanning") {
        const elapsed = now - S.scanStart;
        $t1.textContent = t.scanTitle; $t2.textContent = phaseInstr(elapsed, t);

        if (elapsed > CFG.timeoutMs) { finish(); return; }

        // CAPTURE — only hard gate: face detected + reasonable size
        if (now - S.lastCapt >= CFG.captureMs && !S.capturing && distOk) {
          tryCapt(marks, pose, br, bl, st, absYaw, nose.x, now);
        }

        // Auto-finish
        const filled = BIN_IDS.filter((id) => S.bins[id].length > 0).length;
        if (filled >= 5 && elapsed > 4000 && absYaw < CFG.faceYawMax) { finish(); return; }
        if (filled >= 3 && elapsed > 16000) { finish(); return; }
      }

      const rect = $scan.getBoundingClientRect();
      drawOv(ctx, rect.width, rect.height, S, t);
    }

    function noFace() {
      $t1.textContent = t.noFace; $t2.textContent = t.noFaceHint;
      S.st = { dist: null, light: null, stab: null }; S.calibSince = null;
      if (!S.noFaceT) { S.noFaceT = setTimeout(() => { if ((S.phase === "calibrating" || S.phase === "scanning") && !dead) err(t.noFace); }, CFG.noFaceMs); }
      const rect = $scan.getBoundingClientRect();
      drawOv(ctx, rect.width, rect.height, S, t);
    }

    /* ── Capture ─────────────────────────────── */
    async function tryCapt(marks, pose, br, bl, st, absYaw, noseX, now) {
      const binId = S.retake ? S.retake : classifyBin(absYaw, noseX);
      if (!binId) return;
      if (S.retake && binId !== S.retake) return;

      const idealAbs = BIN_IDEAL_ABS_YAW[binId];
      const sc = score(br, bl, st, absYaw, idealAbs);
      const bin = S.bins[binId];
      if (bin.length >= CFG.binTopN && sc <= bin[bin.length - 1].score) return;

      S.capturing = true; S.lastCapt = now;
      try {
        const blob = await capFrame($v);
        if (!blob || dead) { S.capturing = false; return; }
        const wasEmpty = bin.length === 0;
        bin.push({ blob, url: URL.createObjectURL(blob), score: sc });
        bin.sort((a, b) => b.score - a.score);
        while (bin.length > CFG.binTopN) { const rm = bin.pop(); URL.revokeObjectURL(rm.url); }
        if (wasEmpty) {
          flash(); if (navigator.vibrate) navigator.vibrate(30);
          console.log(`[Adermio] Bin "${binId}" first capture, score=${sc.toFixed(3)}`);
        }
      } catch (e) { console.warn("[Adermio] Capture failed:", e); }
      S.capturing = false;
    }

    function finish() {
      if (S.phase === "preview") return;
      S.phase = "preview"; stopCam(S);
      if (navigator.vibrate) navigator.vibrate([60, 30, 60]);
      const filled = BIN_IDS.filter((id) => S.bins[id].length > 0).length;
      console.log(`[Adermio] Scan finished, ${filled}/5 bins filled`);
      showPrev();
    }

    /* ── Preview ─────────────────────────────── */
    function showPrev() {
      show("prev");
      const g1 = $("#fs-g1"), g2 = $("#fs-g2");
      g1.innerHTML = ""; g2.innerHTML = "";
      ["face", "semi_right", "right"].forEach((id) => g1.appendChild(card(id)));
      ["semi_left", "left"].forEach((id) => g2.appendChild(card(id)));
      $("#fs-ok").onclick = () => upload();
      $("#fs-re").onclick = () => { if (window.AdermioFaceScan) window.AdermioFaceScan.restart(); };
    }

    function card(binId) {
      const best = S.bins[binId][0] || null;
      const q = best ? qLabel(best.score, t) : qLabel(0, t);
      const label = t[BIN_LABELS[binId]];
      const el = document.createElement("div");
      el.style.cssText = "border-radius:12px;overflow:hidden;background:rgba(255,255,255,.04);text-align:center;";

      if (best) {
        el.innerHTML = `<img src="${best.url}" style="width:100%;aspect-ratio:3/4;object-fit:cover;display:block;"/>
          <div style="padding:8px 4px;">
            <span style="display:inline-block;padding:2px 10px;border-radius:2rem;font-size:9px;font-weight:600;color:${q.c};background:rgba(255,255,255,.06);letter-spacing:.3px;">${q.l}</span>
            <p style="font-size:8px;color:rgba(255,255,255,.3);margin:4px 0 0;font-weight:500;text-transform:uppercase;letter-spacing:.8px;">${label}</p>
          </div>`;
      } else {
        el.innerHTML = `<div style="width:100%;aspect-ratio:3/4;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.02);">
            <svg width="20" height="20" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          </div>
          <div style="padding:8px 4px;">
            <span style="display:inline-block;padding:2px 10px;border-radius:2rem;font-size:9px;font-weight:600;color:${q.c};background:rgba(255,255,255,.06);letter-spacing:.3px;">${q.l}</span>
            <p style="font-size:8px;color:rgba(255,255,255,.3);margin:4px 0 0;font-weight:500;text-transform:uppercase;letter-spacing:.8px;">${label}</p>
            <button data-bin="${binId}" style="margin-top:6px;padding:3px 12px;border:1px solid rgba(20,184,166,.25);border-radius:2rem;background:transparent;color:#14B8A6;font-size:9px;font-weight:600;cursor:pointer;letter-spacing:.3px;">${t.retake}</button>
          </div>`;
        el.querySelector("button")?.addEventListener("click", () => retakeBin(binId));
      }
      return el;
    }

    /* ── Retake ───────────────────────────────── */
    async function retakeBin(binId) {
      S.bins[binId].forEach((e) => URL.revokeObjectURL(e.url)); S.bins[binId] = [];
      S.retake = binId; show("scan");
      try {
        S.stream = await reqCam(); $v.srcObject = S.stream;
        await new Promise((r) => $v.addEventListener("loadedmetadata", r, { once: true }));
        S.fm = initFM(onRes); S.cam = startCam($v, S.fm);
        S.phase = "scanning"; S.scanStart = performance.now();
        S.fc = 0; S.prev = null; S.prevT = null; S.cBr = null; S.cBl = null; S.capturing = false;
        resize(); $t1.textContent = t.retake; $t2.textContent = t[BIN_LABELS[binId]];
        const chk = setInterval(() => { if (S.bins[binId].length > 0 || dead) { clearInterval(chk); S.retake = null; if (!dead) finish(); } }, 400);
        setTimeout(() => { clearInterval(chk); S.retake = null; if (S.phase === "scanning" && !dead) finish(); }, 10000);
      } catch (e) { console.error("[Adermio] Retake error:", e); S.retake = null; showPrev(); }
    }

    /* ── Upload ───────────────────────────────── */
    async function upload() {
      const $btn = $("#fs-ok"); $btn.textContent = t.uploading; $btn.disabled = true; $btn.style.opacity = ".5";
      try {
        const map = [
          { bin: "face", s3: "face", fk: "face" },
          { bin: "semi_right", s3: "semi_right", fk: null },
          { bin: "right", s3: "right", fk: "right" },
          { bin: "semi_left", s3: "semi_left", fk: null },
          { bin: "left", s3: "left", fk: "left" },
        ];
        for (const { bin, s3, fk } of map) {
          const best = S.bins[bin][0]; if (!best) continue;
          const file = new File([best.blob], `scan_${s3}_${Date.now()}.jpg`, { type: "image/jpeg" });
          if (typeof window.uploadToS3Presigned === "function") {
            const { key, getUrl } = await window.uploadToS3Presigned({ file, jobId: window.formState?.jobId || "", type: s3 });
            if (fk && window.formState) window.formState.photos[fk] = { key, getUrl };
          }
        }
        if (window.validationState) window.validationState.facePhotoUploaded = true;
        syncPrev();
        if (onDone) onDone({ bins: Object.fromEntries(BIN_IDS.map((id) => [id, S.bins[id].length > 0])) });
        const mc = document.getElementById("manual-upload-container"), sc = document.getElementById("facescan-container");
        if (mc && sc) { sc.classList.add("hidden"); mc.classList.remove("hidden"); }
      } catch (e) { console.error("[Adermio] Upload error:", e); $btn.textContent = t.validate; $btn.disabled = false; $btn.style.opacity = "1"; }
    }

    function syncPrev() {
      const map = { face: "face", right: "left", left: "right" };
      for (const [bin, pType] of Object.entries(map)) {
        const best = S.bins[bin]?.[0]; if (!best) continue;
        const pe = document.getElementById(`preview-${pType}`), ee = document.getElementById(`empty-${pType}`);
        if (pe) { pe.src = best.url; pe.classList.remove("hidden"); }
        if (ee) ee.classList.add("hidden");
      }
    }

    function destroy() {
      dead = true; stopCam(S);
      for (const id of BIN_IDS) { S.bins[id].forEach((e) => URL.revokeObjectURL(e.url)); S.bins[id] = []; }
      S.phase = "idle";
    }

    return { destroy };
  }

  /* ═══════════════════════════════════════════════════════════
     PUBLIC API
     ═══════════════════════════════════════════════════════════ */
  window.AdermioFaceScan = {
    _i: null, _el: null, _o: null,
    init(id, opts = {}) {
      const el = document.getElementById(id);
      if (!el) { console.error("[Adermio] Container not found:", id); return; }
      if (this._i) this._i.destroy();
      this._el = el; this._o = opts;
      this._i = createScanner(el, opts);
    },
    destroy() { if (this._i) { this._i.destroy(); this._i = null; } },
    restart() {
      if (this._el && this._o) {
        if (this._i) this._i.destroy();
        _bc = null; _bx = null; _lc = null; _lx = null; _cc = null; _cx = null;
        this._i = createScanner(this._el, this._o);
      }
    },
  };
})();
