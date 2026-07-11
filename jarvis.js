(() => {
  'use strict';

  /* ============ DISABLE CONTEXT MENU ============ */
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  /* ============ PARTICLE BACKGROUND ============ */
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function makeParticles(n) {
    particles = Array.from({ length: n }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.4,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      a: Math.random() * 0.5 + 0.2
    }));
  }
  makeParticles(70);

  function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 217, 255, ${p.a})`;
      ctx.shadowColor = '#00d9ff';
      ctx.shadowBlur = 6;
      ctx.fill();
    });
    requestAnimationFrame(drawParticles);
  }
  requestAnimationFrame(drawParticles);

  /* ============ PAGE NAV / TRANSITIONS ============ */
  const landingPage = document.getElementById('landing-page');
  const dashboardPage = document.getElementById('dashboard-page');
  const initBtn = document.getElementById('init-btn');
  const transitionOverlay = document.getElementById('transition-overlay');
  const transitionText = document.getElementById('transition-text');
  const transitionBarFill = document.getElementById('transition-bar-fill');
  const shutdownOverlay = document.getElementById('shutdown-overlay');
  const shutdownBarFill = document.getElementById('shutdown-bar-fill');
  const exitBtn = document.getElementById('exit-btn');

  const initMessages = ['INITIALIZING...', 'LOADING PROTOCOLS...', 'CALIBRATING ARC REACTOR...', 'SYSTEM READY'];

  function runProgressBar(fill, duration, onDone) {
    let start = null;
    function step(ts) {
      if (!start) start = ts;
      const pct = Math.min(100, ((ts - start) / duration) * 100);
      fill.style.width = pct + '%';
      if (pct < 100) requestAnimationFrame(step);
      else onDone && onDone();
    }
    requestAnimationFrame(step);
  }

  function goToDashboard() {
    transitionOverlay.classList.add('show');
    requestAnimationFrame(() => transitionOverlay.classList.add('visible'));
    transitionBarFill.style.width = '0%';

    let msgIndex = 0;
    transitionText.textContent = initMessages[0];
    const msgInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % initMessages.length;
      transitionText.textContent = initMessages[msgIndex];
    }, 650);

    runProgressBar(transitionBarFill, 2600, () => {
      clearInterval(msgInterval);
      landingPage.classList.remove('active-page');
      landingPage.style.opacity = '0';
      dashboardPage.classList.add('active-page');
      requestAnimationFrame(() => { dashboardPage.style.opacity = '1'; });
      transitionOverlay.classList.remove('visible');
      setTimeout(() => transitionOverlay.classList.remove('show'), 500);
      startDashboard();
      speak('SYSTEM ONLINE. ALL PROTOCOLS ENGAGED.');
    });
  }

  function goToLanding() {
    shutdownOverlay.classList.add('show');
    requestAnimationFrame(() => shutdownOverlay.classList.add('visible'));
    shutdownBarFill.style.width = '0%';

    runProgressBar(shutdownBarFill, 1800, () => {
      dashboardPage.classList.remove('active-page');
      dashboardPage.style.opacity = '0';
      landingPage.classList.add('active-page');
      requestAnimationFrame(() => { landingPage.style.opacity = '1'; });
      shutdownOverlay.classList.remove('visible');
      setTimeout(() => shutdownOverlay.classList.remove('show'), 500);
      stopDashboard();
    });
  }

  initBtn.addEventListener('click', (e) => {
    const ripple = initBtn.querySelector('.init-ripple');
    const rect = initBtn.getBoundingClientRect();
    ripple.style.left = (e.clientX - rect.left) + 'px';
    ripple.style.top = (e.clientY - rect.top) + 'px';
    ripple.style.width = ripple.style.height = Math.max(rect.width, rect.height) * 1.2 + 'px';
    ripple.style.transform = 'translate(-50%,-50%) scale(0)';
    ripple.classList.remove('animate');
    void ripple.offsetWidth;
    ripple.classList.add('animate');
    goToDashboard();
  });

  exitBtn.addEventListener('click', goToLanding);

  /* ============ DASHBOARD LOGIC ============ */
  let clockTimer = null;
  let metricsTimer = null;
  let alertTimer = null;
  let uptimeStart = null;
  let uptimeTimer = null;
  const voiceEl = document.getElementById('voice-feedback');
  let voiceTimeout = null;

  function speak(msg, opts) {
    const duration = (opts && opts.duration) || 3500;
    voiceEl.textContent = msg;
    voiceEl.style.opacity = '1';
    clearTimeout(voiceTimeout);
    voiceTimeout = setTimeout(() => { voiceEl.style.opacity = '0.5'; }, duration);
  }

  function captionDuration(text) {
    return Math.min(15000, Math.max(3200, text.length * 65));
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  function updateClock() {
    const now = new Date();
    const t = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    document.getElementById('clock').textContent = t;
    document.getElementById('bottom-clock').textContent = t;
    const dateStr = now.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    document.getElementById('date-display').textContent = dateStr;

    if (uptimeStart) {
      const diff = Math.floor((Date.now() - uptimeStart) / 1000);
      const h = pad(Math.floor(diff / 3600));
      const m = pad(Math.floor((diff % 3600) / 60));
      const s = pad(diff % 60);
      document.getElementById('uptime').textContent = `${h}:${m}:${s}`;
    }
  }

  function countUp(el, from, to, duration = 600) {
    const start = performance.now();
    function step(ts) {
      const p = Math.min(1, (ts - start) / duration);
      const val = Math.round(from + (to - from) * p);
      el.textContent = val;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function randomWalk(current, min, max, maxStep) {
    let next = current + (Math.random() - 0.5) * maxStep;
    return Math.max(min, Math.min(max, Math.round(next)));
  }

  let state = {
    temp: 86, power: 92, health: 98, cpu: 41, mem: 57, // temp in Fahrenheit
    oi1: 87, oi2: 64, oi3: 99
  };

  function applyMetric(id, key, min, max, step, suffixBar) {
    const el = document.getElementById(id);
    const from = state[key];
    const to = randomWalk(from, min, max, step);
    state[key] = to;
    countUp(el, from, to);
    if (suffixBar) {
      const bar = document.getElementById(suffixBar);
      if (bar) bar.style.width = to + '%';
    }
  }

  function tickMetrics() {
    applyMetric('metric-temp', 'temp', 75, 100, 4); // Fahrenheit (was 24-38 Celsius)
    applyMetric('power-pct', 'power', 70, 100, 4, 'power-bar');
    applyMetric('cpu-pct', 'cpu', 15, 85, 8, 'cpu-bar');
    applyMetric('mem-pct', 'mem', 30, 90, 6, 'mem-bar');

    state.oi1 = randomWalk(state.oi1, 50, 99, 6);
    state.oi2 = randomWalk(state.oi2, 40, 99, 6);
    state.oi3 = randomWalk(state.oi3, 70, 100, 4);
    document.getElementById('oi-1').textContent = state.oi1 + '%';
    document.getElementById('oi-2').textContent = state.oi2 + '%';
    document.getElementById('oi-3').textContent = state.oi3 + '%';
  }

  const alertPool = [
    { text: 'Perimeter scan complete. No threats detected.', warn: false },
    { text: 'Minor power fluctuation stabilized.', warn: true },
    { text: 'Incoming telemetry synced.', warn: false },
    { text: 'Diagnostic sweep: all green.', warn: false },
    { text: 'Unidentified signal filtered.', warn: true },
    { text: 'Thermal regulators nominal.', warn: false }
  ];

  function pushAlert() {
    const feed = document.getElementById('alert-feed');
    const item = alertPool[Math.floor(Math.random() * alertPool.length)];
    const div = document.createElement('div');
    div.className = 'alert-item' + (item.warn ? ' warn' : '');
    div.textContent = item.text;
    feed.prepend(div);
    while (feed.children.length > 5) feed.removeChild(feed.lastChild);
    if (item.warn) speak('ALERT: ' + item.text.toUpperCase());
  }

  function startDashboard() {
    uptimeStart = Date.now();
    updateClock();
    clockTimer = setInterval(updateClock, 1000);
    metricsTimer = setInterval(tickMetrics, 3000);
    alertTimer = setInterval(pushAlert, 8000);
    if (typeof resumeWakeWordIfEnabled === 'function') resumeWakeWordIfEnabled();
  }

  function stopDashboard() {
    clearInterval(clockTimer);
    clearInterval(metricsTimer);
    clearInterval(alertTimer);
    uptimeStart = null;
    if (typeof stopVoiceListening === 'function') stopVoiceListening();
  }

  /* metric card expand + hover detail (create detail text lazily) */
  document.querySelectorAll('.metric-card').forEach((card) => {
    const detail = card.getAttribute('data-detail');
    if (detail) {
      const d = document.createElement('div');
      d.className = 'metric-detail';
      d.textContent = detail;
      card.appendChild(d);
    }
    card.addEventListener('click', () => {
      card.classList.toggle('expanded');
    });
  });

  /* sidebar view buttons */
  document.querySelectorAll('.hud-btn[data-view]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.hud-btn[data-view]').forEach((b) => b.classList.remove('active-toggle'));
      btn.classList.add('active-toggle');
      speak(btn.dataset.view.toUpperCase() + ' VIEW ENGAGED');
    });
  });

  /* theme toggle — the dark theme is the default (set on <body> in HTML);
     the standard theme is the alternate, opt-in option, remembered across
     visits. */
  const THEME_KEY = 'jarvis_theme_v1';
  const themeToggle = document.getElementById('theme-toggle');

  function updateThemeToggleLabel() {
    const isDarker = document.body.classList.contains('darker-theme');
    themeToggle.textContent = isDarker ? 'TOGGLE STANDARD THEME' : 'TOGGLE DARKER THEME';
  }

  if (localStorage.getItem(THEME_KEY) === 'standard') {
    document.body.classList.remove('darker-theme');
  }
  updateThemeToggleLabel();

  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('darker-theme');
    const isDarker = document.body.classList.contains('darker-theme');
    localStorage.setItem(THEME_KEY, isDarker ? 'dark' : 'standard');
    updateThemeToggleLabel();
    speak(isDarker ? 'DARKER THEME ENGAGED' : 'STANDARD THEME RESTORED');
  });

  /* fullscreen toggle — uses the real Fullscreen API so it genuinely
     takes over the whole screen (hiding browser chrome where the browser
     allows it), not just a CSS trick. Listens for fullscreenchange so the
     label/state stays correct even if the user exits via Esc or F11
     instead of the button. */
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const fullscreenTarget = document.documentElement;

  function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }

  function updateFullscreenLabel() {
    if (!fullscreenBtn) return;
    fullscreenBtn.textContent = isFullscreen() ? 'EXIT FULLSCREEN' : 'ENTER FULLSCREEN';
  }

  async function toggleFullscreen() {
    try {
      if (!isFullscreen()) {
        if (fullscreenTarget.requestFullscreen) {
          await fullscreenTarget.requestFullscreen();
        } else if (fullscreenTarget.webkitRequestFullscreen) {
          fullscreenTarget.webkitRequestFullscreen();
        } else {
          throw new Error('Fullscreen API not supported');
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      }
    } catch (err) {
      speak('FULLSCREEN MODE IS NOT AVAILABLE IN THIS BROWSER.');
    }
  }

  if (fullscreenBtn) {
    if (!document.documentElement.requestFullscreen && !document.documentElement.webkitRequestFullscreen) {
      fullscreenBtn.disabled = true;
      fullscreenBtn.title = 'Fullscreen is not supported in this browser';
    } else {
      fullscreenBtn.addEventListener('click', toggleFullscreen);
      document.addEventListener('fullscreenchange', updateFullscreenLabel);
      document.addEventListener('webkitfullscreenchange', updateFullscreenLabel);
    }
  }

  /* keyboard shortcuts */
  let sidebarsHidden = false;
  document.addEventListener('keydown', (e) => {
    if (!dashboardPage.classList.contains('active-page')) return;
    const key = e.key.toLowerCase();

    if (key === 'e') {
      goToLanding();
    } else if (key === 'r') {
      state = { temp: 86, power: 92, health: 98, cpu: 41, mem: 57, oi1: 87, oi2: 64, oi3: 99 };
      tickMetrics();
      speak('METRICS RESET');
    } else if (key === 's') {
      sidebarsHidden = !sidebarsHidden;
      document.getElementById('left-sidebar').classList.toggle('hidden-side', sidebarsHidden);
      document.getElementById('right-sidebar').classList.toggle('hidden-side', sidebarsHidden);
      speak(sidebarsHidden ? 'SIDEBARS HIDDEN' : 'SIDEBARS RESTORED');
    } else if (key === 'f') {
      toggleFullscreen();
    } else if (e.ctrlKey && e.shiftKey && key === 'j') {
      speak("I AM ALWAYS WATCHING, SIR.");
    }
  });

  /* ============ DECORATIVE HUD DIAL (non-interactive) ============
     Purely visual radar/gauge ring behind the reactor core. No event
     listeners are attached to it or its children. */
  function buildHudDial() {
    const container = document.getElementById('hud-dial');
    if (!container) return;
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 400 400');
    svg.setAttribute('class', 'hud-dial-svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');

    const cx = 200, cy = 200, rOuter = 190;

    [150, 172].forEach((r) => {
      const c = document.createElementNS(svgNS, 'circle');
      c.setAttribute('cx', cx);
      c.setAttribute('cy', cy);
      c.setAttribute('r', r);
      c.setAttribute('class', 'hud-ring-faint');
      svg.appendChild(c);
    });

    for (let deg = 0; deg < 360; deg += 6) {
      const isMajor = deg % 30 === 0;
      const rad = (deg * Math.PI) / 180;
      const len = isMajor ? 18 : 9;
      const x1 = cx + (rOuter - len) * Math.cos(rad);
      const y1 = cy + (rOuter - len) * Math.sin(rad);
      const x2 = cx + rOuter * Math.cos(rad);
      const y2 = cy + rOuter * Math.sin(rad);
      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', x1.toFixed(2));
      line.setAttribute('y1', y1.toFixed(2));
      line.setAttribute('x2', x2.toFixed(2));
      line.setAttribute('y2', y2.toFixed(2));
      line.setAttribute('class', 'hud-tick' + (isMajor ? ' major' : ''));
      svg.appendChild(line);
    }

    const rArc = 180, startDeg = -55, endDeg = 15;
    const sx = cx + rArc * Math.cos((startDeg * Math.PI) / 180);
    const sy = cy + rArc * Math.sin((startDeg * Math.PI) / 180);
    const ex = cx + rArc * Math.cos((endDeg * Math.PI) / 180);
    const ey = cy + rArc * Math.sin((endDeg * Math.PI) / 180);
    const arc = document.createElementNS(svgNS, 'path');
    arc.setAttribute('d', `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${rArc} ${rArc} 0 0 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`);
    arc.setAttribute('class', 'hud-arc-accent');
    svg.appendChild(arc);

    [-90, 205, -15].forEach((deg) => {
      const rad = (deg * Math.PI) / 180;
      const x2 = cx + 140 * Math.cos(rad);
      const y2 = cy + 140 * Math.sin(rad);
      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', cx);
      line.setAttribute('y1', cy);
      line.setAttribute('x2', x2.toFixed(2));
      line.setAttribute('y2', y2.toFixed(2));
      line.setAttribute('class', 'hud-spoke');
      svg.appendChild(line);
    });

    container.appendChild(svg);
  }
  buildHudDial();

  /* ============ REACTOR VOICE STATE ============ */
  const reactorCoreEl = document.getElementById('reactor-core');
  const reactorGroupEl = document.getElementById('reactor-core-group');
  const stopJarvisBtn = document.getElementById('stop-jarvis-btn');
  function setReactorState(state) {
    if (!reactorCoreEl) return;
    reactorCoreEl.classList.remove('thinking', 'speaking', 'listening-state');
    if (state && state !== 'idle') reactorCoreEl.classList.add(state);
    /* The core's own pulse/scale animation stays local to reactor-core;
       the group additionally gets the same state class so the "speaking"
       CSS can sweep the HUD tick marks forward around the core — the
       core itself and the reactor rings are unaffected. */
    if (reactorGroupEl) {
      reactorGroupEl.classList.remove('thinking', 'speaking', 'listening-state');
      if (state && state !== 'idle') reactorGroupEl.classList.add(state);
    }
    if (stopJarvisBtn) stopJarvisBtn.disabled = state !== 'speaking';
  }

  /* ============ RHYTHM-DRIVEN REACTOR TALK ANIMATION ============
     The core's motion while speaking is driven frame-by-frame from the
     actual pacing of the reply text, instead of a fixed generic loop:
     each word gets a slice of the total speech duration (weighted by its
     length, with extra weight for trailing punctuation so the core
     settles during natural pauses), and every animation frame looks up
     which word is "active" right now to compute how far into its pulse
     we are. For premium TTS audio, "now" is the audio element's real
     currentTime. For the browser's built-in voice, live SpeechSynthesis
     word-boundary events drive a decay pulse per word as it's actually
     spoken; a text-timed fallback loop covers browsers that don't fire
     boundary events, so the motion never goes fully static. */
  function setReactorTalkVars(scale, glow) {
    if (!reactorCoreEl) return;
    reactorCoreEl.style.setProperty('--reactor-talk-scale', scale.toFixed(4));
    reactorCoreEl.style.setProperty('--reactor-talk-glow', Math.max(0, Math.min(1, glow)).toFixed(4));
  }

  function clearReactorTalkVars() {
    if (!reactorCoreEl) return;
    reactorCoreEl.style.removeProperty('--reactor-talk-scale');
    reactorCoreEl.style.removeProperty('--reactor-talk-glow');
  }

  function buildWordEnvelope(text, totalDurationSec) {
    const words = (text || '').trim().split(/\s+/).filter(Boolean);
    if (!words.length || !isFinite(totalDurationSec) || totalDurationSec <= 0) return null;
    const weights = words.map((w) => {
      let weight = Math.max(1, w.replace(/[^\w']/g, '').length);
      if (/[,;:]$/.test(w)) weight += 1.2;
      if (/[.!?]$/.test(w)) weight += 2.4;
      return weight;
    });
    const totalWeight = weights.reduce((a, b) => a + b, 0) || 1;
    let t = 0;
    return words.map((word, i) => {
      const dur = (weights[i] / totalWeight) * totalDurationSec;
      const seg = { start: t, end: t + dur, seed: ((i * 37) % 7) / 7 };
      t += dur;
      return seg;
    });
  }

  function envelopeIntensityAt(envelope, elapsedSec) {
    if (!envelope) return 0;
    const seg = envelope.find((s) => elapsedSec >= s.start && elapsedSec < s.end) || envelope[envelope.length - 1];
    if (!seg) return 0;
    const span = Math.max(0.001, seg.end - seg.start);
    const phase = Math.min(1, Math.max(0, (elapsedSec - seg.start) / span));
    return Math.sin(phase * Math.PI) * (0.75 + seg.seed * 0.25);
  }

  let reactorTalkStopFn = null;

  function stopReactorTalkAnimation() {
    if (reactorTalkStopFn) reactorTalkStopFn();
    reactorTalkStopFn = null;
    clearReactorTalkVars();
  }

  /* Ties the core's motion to real playback position of the given <audio>
     element (premium TTS: OpenAI / ElevenLabs). */
  function driveReactorTalkFromAudio(audioEl, text) {
    stopReactorTalkAnimation();
    let envelope = null;
    let rafId = null;

    function tick() {
      if (audioEl.paused || audioEl.ended) { rafId = null; return; }
      const intensity = envelopeIntensityAt(envelope, audioEl.currentTime);
      setReactorTalkVars(1 + intensity * 0.07, intensity);
      rafId = requestAnimationFrame(tick);
    }
    function start() {
      envelope = buildWordEnvelope(text, audioEl.duration);
      if (!rafId) rafId = requestAnimationFrame(tick);
    }
    if (audioEl.duration && isFinite(audioEl.duration)) {
      start();
    } else {
      audioEl.addEventListener('loadedmetadata', start, { once: true });
    }

    reactorTalkStopFn = () => { if (rafId) cancelAnimationFrame(rafId); };
  }

  /* Ties the core's motion to the browser's built-in voice: a live pulse
     on every real word-boundary event where supported, decaying smoothly
     until the next word; a text-timed envelope fills in for browsers that
     don't fire boundary events, so it's never just a static glow. */
  function driveReactorTalkFromUtterance(utter, text) {
    stopReactorTalkAnimation();
    const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
    const estDuration = Math.max(0.6, words / 2.6);
    const envelope = buildWordEnvelope(text, estDuration);

    let usedBoundary = false;
    let fallbackRaf = null;
    let decayRaf = null;
    let fallbackStartTs = 0;

    function fallbackTick(ts) {
      if (usedBoundary) { fallbackRaf = null; return; }
      if (!fallbackStartTs) fallbackStartTs = ts;
      const elapsed = (ts - fallbackStartTs) / 1000;
      const intensity = envelopeIntensityAt(envelope, elapsed);
      setReactorTalkVars(1 + intensity * 0.07, intensity);
      fallbackRaf = requestAnimationFrame(fallbackTick);
    }
    fallbackRaf = requestAnimationFrame(fallbackTick);

    utter.onboundary = (e) => {
      if (e.name && e.name !== 'word') return;
      usedBoundary = true;
      if (fallbackRaf) { cancelAnimationFrame(fallbackRaf); fallbackRaf = null; }
      if (decayRaf) cancelAnimationFrame(decayRaf);
      const pulseStart = performance.now();
      const PULSE_MS = 240;
      (function decay(ts) {
        const phase = Math.min(1, (ts - pulseStart) / PULSE_MS);
        setReactorTalkVars(1 + (1 - phase) * 0.07, 1 - phase);
        if (phase < 1) decayRaf = requestAnimationFrame(decay);
      })(pulseStart);
    };

    reactorTalkStopFn = () => {
      if (fallbackRaf) cancelAnimationFrame(fallbackRaf);
      if (decayRaf) cancelAnimationFrame(decayRaf);
    };
  }

  /* ============ LIVE NETWORK STATUS ============ */
  function updateNetworkStatus() {
    const el = document.getElementById('network-status');
    if (!el) return;
    if (navigator.onLine) {
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      el.textContent = conn && conn.effectiveType ? `ONLINE (${conn.effectiveType.toUpperCase()})` : 'ONLINE';
      el.classList.remove('warn');
    } else {
      el.textContent = 'OFFLINE';
      el.classList.add('warn');
    }
  }
  window.addEventListener('online', () => { updateNetworkStatus(); speak('NETWORK LINK RESTORED'); });
  window.addEventListener('offline', () => { updateNetworkStatus(); speak('NETWORK LINK LOST'); });
  updateNetworkStatus();

  /* ============ CONNECTION SPEED TEST ============
     Uses Cloudflare's public, CORS-enabled speed test endpoints
     (the same ones used by @cloudflare/speedtest / speed.cloudflare.com)
     to measure real ping, download, and upload throughput. */
  const CF_DOWN_URL = 'https://speed.cloudflare.com/__down?bytes=';
  const CF_UP_URL = 'https://speed.cloudflare.com/__up';
  const SPEEDTEST_TIMEOUT_MS = 10000;

  const speedtestBtn = document.getElementById('speedtest-btn');
  const speedtestBarFill = document.getElementById('speedtest-bar-fill');
  const speedtestStatus = document.getElementById('speedtest-status');
  const stPingEl = document.getElementById('st-ping');
  const stDownEl = document.getElementById('st-download');
  const stUpEl = document.getElementById('st-upload');

  function setSpeedtestProgress(pct) {
    if (speedtestBarFill) speedtestBarFill.style.width = Math.max(0, Math.min(100, pct)) + '%';
  }

  /* Cache-bust so no proxy/CDN along the way ever serves a stale response
     for what should be a fresh timing measurement. */
  function cacheBust(url) {
    return url + (url.includes('?') ? '&' : '?') + '_r=' + Math.random().toString(36).slice(2);
  }

  /* Bare fetch() has no timeout, so a blocked/hanging request (a
     firewall or ad-blocker silently dropping the request, a dead
     connection, etc.) used to leave the test spinning forever with no
     feedback. Every request now aborts after SPEEDTEST_TIMEOUT_MS. */
  async function fetchWithTimeout(url, options, timeoutMs = SPEEDTEST_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  async function measurePing(samples = 4) {
    const times = [];
    for (let i = 0; i < samples; i++) {
      const start = performance.now();
      const res = await fetchWithTimeout(cacheBust(CF_DOWN_URL + '0'), { cache: 'no-store', mode: 'cors' }, 5000);
      if (!res.ok) throw new Error('Ping endpoint returned ' + res.status);
      times.push(performance.now() - start);
      setSpeedtestProgress((i + 1) / samples * 20);
    }
    times.sort((a, b) => a - b);
    return times[Math.floor(times.length / 2)];
  }

  async function measureDownload(bytes = 10_000_000) {
    const start = performance.now();
    const res = await fetchWithTimeout(cacheBust(CF_DOWN_URL + bytes), { cache: 'no-store', mode: 'cors' });
    if (!res.ok) throw new Error('Download endpoint returned ' + res.status);
    const blob = await res.blob();
    const durationSec = (performance.now() - start) / 1000;
    setSpeedtestProgress(65);
    const bits = blob.size * 8;
    return bits / durationSec / 1_000_000; // Mbps
  }

  async function measureUpload(bytes = 4_000_000) {
    const data = new Uint8Array(bytes);
    crypto.getRandomValues(data.subarray(0, Math.min(65536, bytes)));
    const start = performance.now();
    const res = await fetchWithTimeout(CF_UP_URL, { method: 'POST', body: data, cache: 'no-store', mode: 'cors' });
    if (!res.ok) throw new Error('Upload endpoint returned ' + res.status);
    const durationSec = (performance.now() - start) / 1000;
    setSpeedtestProgress(100);
    const bits = bytes * 8;
    return bits / durationSec / 1_000_000; // Mbps
  }

  let speedtestRunning = false;
  async function runSpeedTest() {
    if (speedtestRunning) return;
    if (!navigator.onLine) {
      speedtestStatus.textContent = 'No network connection detected.';
      return;
    }
    speedtestRunning = true;
    speedtestBtn.disabled = true;
    stPingEl.textContent = '--';
    stDownEl.textContent = '--';
    stUpEl.textContent = '--';
    setSpeedtestProgress(0);

    try {
      speedtestStatus.textContent = 'Measuring latency...';
      const ping = await measurePing();
      stPingEl.textContent = ping.toFixed(0) + ' ms';

      speedtestStatus.textContent = 'Measuring download speed...';
      let down;
      try {
        down = await measureDownload();
      } catch (err) {
        if (err.name === 'AbortError') throw err;
        down = await measureDownload(2_000_000); // retry smaller in case the link is just slow
      }
      stDownEl.textContent = down.toFixed(1) + ' Mbps';

      speedtestStatus.textContent = 'Measuring upload speed...';
      const up = await measureUpload();
      stUpEl.textContent = up.toFixed(1) + ' Mbps';

      speedtestStatus.textContent = 'Test complete.';
      speak('SPEED TEST COMPLETE. DOWNLOAD ' + down.toFixed(0) + ' MEGABITS PER SECOND.');
    } catch (err) {
      const isAbort = err && err.name === 'AbortError';
      speedtestStatus.textContent = isAbort
        ? 'Speed test timed out. Your connection may be slow, or a firewall/ad-blocker is blocking speed.cloudflare.com.'
        : 'Speed test failed: ' + (err && err.message ? err.message : 'network error.') +
          ' An ad-blocker or firewall may be blocking speed.cloudflare.com.';
      setSpeedtestProgress(0);
    } finally {
      speedtestRunning = false;
      speedtestBtn.disabled = false;
    }
  }

  if (speedtestBtn) speedtestBtn.addEventListener('click', runSpeedTest);

  /* ============ VOICE / AI CHAT ============
     Real speech-to-text (Web Speech API), real text generation (a
     user-configured OpenAI-compatible Chat Completions endpoint), and
     real text-to-speech (SpeechSynthesis). No canned responses. */
  const SETTINGS_KEY = 'jarvis_ai_settings_v1';
  const chatPanel = document.getElementById('chat-panel');
  const chatToggleBtn = document.getElementById('chat-toggle-btn');
  const chatCloseBtn = document.getElementById('chat-close-btn');
  const chatInput = document.getElementById('chat-input');
  const chatSendBtn = document.getElementById('chat-send-btn');
  const chatStatusEl = document.getElementById('chat-status');
  const micBtn = document.getElementById('mic-btn');

  const settingsModal = document.getElementById('settings-modal');
  const chatSettingsBtn = document.getElementById('chat-settings-btn');
  const settingsCancelBtn = document.getElementById('settings-cancel-btn');
  const settingsSaveBtn = document.getElementById('settings-save-btn');
  const settingsClearBtn = document.getElementById('settings-clear-btn');
  const settingsPreviewVoiceBtn = document.getElementById('settings-preview-voice-btn');
  const settingsProviderInput = document.getElementById('settings-provider');
  const settingsBaseUrlField = document.getElementById('baseurl-field');
  const settingsBaseUrlInput = document.getElementById('settings-baseurl');
  const settingsModelInput = document.getElementById('settings-model');
  const settingsApiKeyInput = document.getElementById('settings-apikey');
  const settingsProviderHint = document.getElementById('settings-provider-hint');
  const settingsTtsProviderInput = document.getElementById('settings-tts-provider');
  const settingsTtsKeyField = document.getElementById('tts-key-field');
  const settingsTtsApiKeyInput = document.getElementById('settings-tts-apikey');
  const settingsTtsVoiceField = document.getElementById('tts-voice-field');
  const settingsTtsVoiceInput = document.getElementById('settings-tts-voice');
  const settingsTtsHint = document.getElementById('settings-tts-hint');
  const settingsTtsPreviewStatus = document.getElementById('settings-tts-preview-status');

  const PROVIDER_PRESETS = {
    openai: {
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
      needsBaseUrl: true,
      hint: 'Uses the OpenAI Chat Completions API. Get a key at platform.openai.com.',
      keyPlaceholder: 'sk-...'
    },
    groq: {
      baseUrl: 'https://api.groq.com/openai/v1',
      model: 'llama-3.3-70b-versatile',
      needsBaseUrl: true,
      hint: 'Groq is OpenAI-compatible and typically very fast. Get a free key at console.groq.com.',
      keyPlaceholder: 'gsk_...'
    },
    gemini: {
      baseUrl: '',
      model: 'gemini-2.0-flash',
      needsBaseUrl: false,
      hint: 'Uses Google’s Gemini API directly (no base URL needed). Get a free key at aistudio.google.com/apikey.',
      keyPlaceholder: 'AIza...'
    },
    custom: {
      baseUrl: '',
      model: '',
      needsBaseUrl: true,
      hint: 'Any OpenAI-compatible Chat Completions endpoint (local model server, proxy, etc).',
      keyPlaceholder: 'API key'
    }
  };

  function loadAiSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }
  function saveAiSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
  function aiConfigured() {
    const s = loadAiSettings();
    if (!s.apiKey || !s.model) return false;
    const preset = PROVIDER_PRESETS[s.provider] || PROVIDER_PRESETS.openai;
    if (preset.needsBaseUrl && !s.baseUrl) return false;
    return true;
  }

  /* ============ VOICE (TEXT-TO-SPEECH) SETTINGS ============
     A warm, expressive, moderately-paced, low-to-mid-pitch masculine
     delivery — premium-assistant/audiobook-narrator territory rather
     than a flat, robotic browser voice. OpenAI's gpt-4o-mini-tts takes
     a plain-language style "instructions" string, so that description
     is passed through almost verbatim to steer the delivery. */
  const TTS_SETTINGS_KEY = 'jarvis_tts_settings_v1';
  const VOICE_STYLE_INSTRUCTIONS =
    'Speak in a warm, expressive, conversational tone with a polished, professional delivery, ' +
    'like a premium AI assistant or a skilled audiobook narrator. Use a low-to-mid pitch with a ' +
    'warm, balanced resonance — masculine but never harsh or overly deep. Keep the pacing moderate ' +
    'and easy to follow, never rushed. Articulate clearly with distinct pronunciation. Stay calm but ' +
    'engaging, confident without being overly enthusiastic, and vary emphasis and intonation ' +
    'naturally so it never sounds monotone or robotic.';

  const TTS_PROVIDER_PRESETS = {
    browser: {
      needsKey: false,
      needsVoice: false,
      hint: 'Uses your browser\'s built-in speech synthesis. Free, works offline, no setup — but sounds noticeably more synthetic than a premium voice.'
    },
    openai: {
      needsKey: true,
      voice: 'onyx',
      keyPlaceholder: 'sk-...',
      voicePlaceholder: 'onyx',
      hint: 'OpenAI text-to-speech (gpt-4o-mini-tts). "onyx" is a warm, low-mid male voice; also try "echo" or "fable". Get a key at platform.openai.com.'
    },
    elevenlabs: {
      needsKey: true,
      voice: 'pNInz6obpgDQGcFmaJgB',
      keyPlaceholder: 'API key',
      voicePlaceholder: 'Voice ID (default: Adam)',
      hint: 'ElevenLabs premium voice cloning/synthesis. Defaults to "Adam" — a warm, expressive male voice. Get a key at elevenlabs.io.'
    }
  };

  function loadTtsSettings() {
    try {
      const raw = localStorage.getItem(TTS_SETTINGS_KEY);
      return raw ? JSON.parse(raw) : { provider: 'browser' };
    } catch {
      return { provider: 'browser' };
    }
  }
  function saveTtsSettings(settings) {
    localStorage.setItem(TTS_SETTINGS_KEY, JSON.stringify(settings));
  }

  function applyTtsProviderUI(provider, opts) {
    const preset = TTS_PROVIDER_PRESETS[provider] || TTS_PROVIDER_PRESETS.browser;
    settingsTtsKeyField.style.display = preset.needsKey ? '' : 'none';
    settingsTtsVoiceField.style.display = preset.needsVoice === false ? 'none' : '';
    settingsTtsApiKeyInput.placeholder = preset.keyPlaceholder || 'API key';
    settingsTtsVoiceInput.placeholder = preset.voicePlaceholder || 'voice';
    settingsTtsHint.textContent = preset.hint || '';
    if (opts && opts.fillDefaults && !settingsTtsVoiceInput.value) {
      settingsTtsVoiceInput.value = preset.voice || '';
    }
  }

  if (settingsTtsProviderInput) {
    settingsTtsProviderInput.addEventListener('change', () => {
      settingsTtsVoiceInput.value = '';
      applyTtsProviderUI(settingsTtsProviderInput.value, { fillDefaults: true });
    });
  }

  function applyProviderUI(provider, opts) {
    const preset = PROVIDER_PRESETS[provider] || PROVIDER_PRESETS.openai;
    settingsBaseUrlField.style.display = preset.needsBaseUrl ? '' : 'none';
    settingsApiKeyInput.placeholder = preset.keyPlaceholder;
    settingsProviderHint.textContent = preset.hint;
    if (opts && opts.fillDefaults) {
      if (!settingsBaseUrlInput.value) settingsBaseUrlInput.value = preset.baseUrl;
      if (!settingsModelInput.value) settingsModelInput.value = preset.model;
    }
    settingsModelInput.placeholder = preset.model || 'model name';
  }

  if (settingsProviderInput) {
    settingsProviderInput.addEventListener('change', () => {
      settingsBaseUrlInput.value = '';
      settingsModelInput.value = '';
      applyProviderUI(settingsProviderInput.value, { fillDefaults: true });
    });
  }

  function openSettingsModal() {
    const s = loadAiSettings();
    const provider = s.provider || 'openai';
    settingsProviderInput.value = provider;
    settingsBaseUrlInput.value = s.baseUrl || '';
    settingsModelInput.value = s.model || '';
    settingsApiKeyInput.value = s.apiKey || '';
    applyProviderUI(provider, { fillDefaults: !s.apiKey });

    const ts = loadTtsSettings();
    const ttsProvider = ts.provider || 'browser';
    settingsTtsProviderInput.value = ttsProvider;
    settingsTtsApiKeyInput.value = ts.apiKey || '';
    settingsTtsVoiceInput.value = ts.voice || '';
    applyTtsProviderUI(ttsProvider, { fillDefaults: !ts.apiKey });
    if (settingsTtsPreviewStatus) settingsTtsPreviewStatus.textContent = '';

    settingsModal.classList.add('open');
  }
  function closeSettingsModal() { settingsModal.classList.remove('open'); }

  if (chatSettingsBtn) chatSettingsBtn.addEventListener('click', openSettingsModal);
  if (settingsCancelBtn) settingsCancelBtn.addEventListener('click', closeSettingsModal);
  if (settingsModal) {
    settingsModal.addEventListener('click', (e) => { if (e.target === settingsModal) closeSettingsModal(); });
  }
  if (settingsSaveBtn) {
    settingsSaveBtn.addEventListener('click', () => {
      // Voice settings are independent of the chat AI settings and must
      // always be saved, even if the chat fields below are left blank
      // (e.g. someone only wants to configure a premium voice and
      // already has chat set up, or hasn't set it up yet at all).
      const ttsProvider = settingsTtsProviderInput.value;
      const ttsPreset = TTS_PROVIDER_PRESETS[ttsProvider] || TTS_PROVIDER_PRESETS.browser;
      const ttsApiKey = settingsTtsApiKeyInput.value.trim();
      const ttsVoice = settingsTtsVoiceInput.value.trim();
      if (ttsProvider !== 'browser' && ttsApiKey) {
        saveTtsSettings({ provider: ttsProvider, apiKey: ttsApiKey, voice: ttsVoice || ttsPreset.voice });
      } else {
        saveTtsSettings({ provider: 'browser' });
      }

      const provider = settingsProviderInput.value;
      const preset = PROVIDER_PRESETS[provider] || PROVIDER_PRESETS.openai;
      const baseUrl = settingsBaseUrlInput.value.trim().replace(/\/+$/, '');
      const model = settingsModelInput.value.trim();
      const apiKey = settingsApiKeyInput.value.trim();
      if (!model || !apiKey || (preset.needsBaseUrl && !baseUrl)) {
        closeSettingsModal();
        chatStatusEl.textContent = ttsProvider !== 'browser' && ttsApiKey
          ? 'Voice settings saved. Fill in the AI provider fields too to enable chat.'
          : 'Please fill in the required fields to enable chat.';
        return;
      }
      saveAiSettings({ provider, baseUrl, model, apiKey });

      closeSettingsModal();
      chatStatusEl.textContent = 'AI connection configured. Ready to talk.';
      speak('AI CONNECTION CONFIGURED. READY TO TALK.');
    });
  }
  if (settingsClearBtn) {
    settingsClearBtn.addEventListener('click', () => {
      localStorage.removeItem(SETTINGS_KEY);
      localStorage.removeItem(TTS_SETTINGS_KEY);
      settingsApiKeyInput.value = '';
      settingsTtsApiKeyInput.value = '';
      settingsTtsProviderInput.value = 'browser';
      applyTtsProviderUI('browser');
      chatStatusEl.textContent = 'API keys cleared. Configure an AI provider in settings to enable real conversation.';
      speak('API KEYS CLEARED.');
      closeSettingsModal();
    });
  }
  if (settingsPreviewVoiceBtn) {
    settingsPreviewVoiceBtn.addEventListener('click', () => {
      const ttsProvider = settingsTtsProviderInput.value;
      const ttsPreset = TTS_PROVIDER_PRESETS[ttsProvider] || TTS_PROVIDER_PRESETS.browser;
      const ttsApiKey = settingsTtsApiKeyInput.value.trim();
      const ttsVoice = settingsTtsVoiceInput.value.trim() || ttsPreset.voice;
      const previewSettings = ttsProvider !== 'browser' && ttsApiKey
        ? { provider: ttsProvider, apiKey: ttsApiKey, voice: ttsVoice }
        : { provider: 'browser' };
      previewVoice(previewSettings);
    });
  }

  const BASE_SYSTEM_PROMPT = 'You are J.A.R.V.I.S., Tony Stark\'s AI assistant. Be concise, helpful, and a little witty. ' +
    'You have live read access to the dashboard sidebar readouts (temperature, power, CPU, memory, network, ' +
    'connection speed test, active protocols, alerts, uptime, local time). A snapshot of their current values is ' +
    'given below — use it to answer any question about them, but only bring them up when actually asked.';

  let conversationHistory = [
    { role: 'system', content: BASE_SYSTEM_PROMPT }
  ];

  function trimHistory() {
    if (conversationHistory.length > 21) {
      conversationHistory = [conversationHistory[0], ...conversationHistory.slice(-20)];
    }
  }

  /* Refreshes the system message with a fresh snapshot of the sidebar
     readouts right before every AI call, so the model always answers
     with current numbers instead of stale or made-up ones — without
     bloating the conversation history with a new message every turn. */
  function refreshSystemPromptWithSidebarSnapshot() {
    conversationHistory[0].content = BASE_SYSTEM_PROMPT + '\n\nCurrent dashboard readouts: ' + buildSidebarSummary() + '.';
  }

  /* OpenAI-compatible Chat Completions (OpenAI, Groq, local servers, etc.) */
  async function callOpenAiCompatible(userText, settings) {
    refreshSystemPromptWithSidebarSnapshot();
    conversationHistory.push({ role: 'user', content: userText });
    trimHistory();

    const res = await fetch(settings.baseUrl + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + settings.apiKey
      },
      body: JSON.stringify({
        model: settings.model,
        messages: conversationHistory,
        temperature: 0.7
      })
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`API error ${res.status}: ${errBody.slice(0, 200) || res.statusText}`);
    }

    const data = await res.json();
    const reply = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!reply) throw new Error('No response returned by the model.');
    conversationHistory.push({ role: 'assistant', content: reply });
    return reply.trim();
  }

  /* Google Gemini's generateContent API — different shape from OpenAI:
     history uses role "model" instead of "assistant", the system prompt
     is a separate field, and the API key is a query param, not a
     Bearer header. */
  async function callGemini(userText, settings) {
    refreshSystemPromptWithSidebarSnapshot();
    conversationHistory.push({ role: 'user', content: userText });
    trimHistory();

    const systemPrompt = conversationHistory[0].content;
    const contents = conversationHistory.slice(1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(settings.model)}:generateContent?key=${encodeURIComponent(settings.apiKey)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { temperature: 0.7 }
      })
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`API error ${res.status}: ${errBody.slice(0, 200) || res.statusText}`);
    }

    const data = await res.json();
    const reply = data && data.candidates && data.candidates[0] && data.candidates[0].content &&
      data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
    if (!reply) throw new Error('No response returned by the model.');
    conversationHistory.push({ role: 'assistant', content: reply });
    return reply.trim();
  }

  async function callAI(userText) {
    const settings = loadAiSettings();
    if (settings.provider === 'gemini') return callGemini(userText, settings);
    return callOpenAiCompatible(userText, settings);
  }

  /* ============ VOICE COMMANDS ============
     A handful of direct actions handled locally, without a round-trip to
     the AI — e.g. "Hey Jarvis, open YouTube". Checked first in
     sendChatMessage(); returns true if it handled the text itself. */
  function openUrlInNewTab(url) {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return a;
  }

  /* Browsers only allow a script to open a new tab during a genuine,
     still-"fresh" user gesture (a real click). A voice command recognized
     asynchronously from a SpeechRecognition result does NOT count as one
     — even if listening was originally started by a click — so the
     automatic open below is very often silently blocked by the popup
     blocker with no error to catch. There is no way to force it open
     from code; the only reliable fix is to also show a real, clickable
     link so a single tap (a genuine gesture) always gets the user there. */
  function offerManualLink(url, label) {
    clearTimeout(voiceTimeout);
    voiceEl.innerHTML = '';
    const text = document.createTextNode(label + ' — ');
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'TAP HERE IF IT DID NOT OPEN';
    voiceEl.appendChild(text);
    voiceEl.appendChild(link);
    voiceEl.style.opacity = '1';
  }

  /* "Hey Jarvis, open <name>" site shortcuts. Add more by adding an entry
     here. `match` is tested against the whole utterance (after stripping
     "hey jarvis"), so it's forgiving of real speech-to-text phrasing —
     filler words ("can you open..."), "please", punctuation, and common
     mis-transcriptions (e.g. "YouTube" heard as two words "you tube")
     all still match, since we only need the keyword to appear somewhere
     in the sentence, not the whole sentence to equal it exactly. */
  const VOICE_OPEN_SITES = [
    { url: 'https://www.youtube.com', label: 'YouTube', match: /you[\s-]*tube/ },
    { url: 'https://www.streamex.net', label: 'Entertainment', match: /entertainment/ },
    { url: 'https://www.tiktok.com', label: 'TikTok', match: /tik[\s-]*tok/ },
    { url: 'https://www.github.com', label: 'GitHub', match: /git[\s-]*hub/ },
    { url: 'https://claude.ai/new', label: 'Claude', match: /claude/ }
  ];
  const OPEN_VERB_RE = /\b(open|launch|start|go to|pull up|play)\b/;

  function tryHandleVoiceCommand(text) {
    // Strip a leading "hey jarvis" if it's still attached (e.g. typed
    // directly, rather than already stripped by the wake-word listener).
    const t = text.trim().replace(WAKE_PHRASE_RE, '').trim().toLowerCase();
    if (!OPEN_VERB_RE.test(t)) return false;

    for (const site of VOICE_OPEN_SITES) {
      if (site.match.test(t)) {
        openUrlInNewTab(site.url);
        speakReply('Opening ' + site.label + '. If it did not open automatically, tap the link on screen.');
        offerManualLink(site.url, 'OPENING ' + site.label.toUpperCase());
        return true;
      }
    }
    return false;
  }

  /* ============ WIDGET / SIDEBAR AWARENESS ============
     JARVIS can read the live readouts already on screen (left/right
     sidebar panels) and answer direct questions about them instantly,
     without a round trip to the AI — so it works even with no AI
     provider configured, and answers immediately rather than "thinking"
     about numbers that are already sitting in the DOM. Anything not
     covered by these direct patterns still reaches the AI, which also
     gets a live snapshot of the same readouts injected into its system
     prompt (see refreshSystemPromptWithSidebarSnapshot) so it can answer
     less literal, more conversational questions about the dashboard too. */
  function widgetText(id) {
    const el = document.getElementById(id);
    return el ? el.textContent.trim() : null;
  }

  function activeProtocols() {
    return Array.from(document.querySelectorAll('#protocol-list li'))
      .filter((li) => li.classList.contains('active'))
      .map((li) => li.textContent.trim());
  }

  function recentAlerts() {
    return Array.from(document.querySelectorAll('#alert-feed .alert-item')).map((el) => el.textContent.trim());
  }

  function buildSidebarSummary() {
    const ping = widgetText('st-ping');
    const speedLine = (!ping || ping === '--')
      ? 'the speed test has not been run yet'
      : `ping ${ping}, download ${widgetText('st-download')}, upload ${widgetText('st-upload')}`;
    const protocols = activeProtocols();
    const alerts = recentAlerts();
    return [
      `temperature ${widgetText('metric-temp')} degrees`,
      `power level ${widgetText('power-pct')} percent`,
      `CPU load ${widgetText('cpu-pct')} percent`,
      `memory usage ${widgetText('mem-pct')} percent`,
      `network status ${widgetText('network-status')}`,
      `${speedLine}`,
      `active protocols: ${protocols.length ? protocols.join(', ') : 'none'}`,
      `most recent alert: ${alerts.length ? alerts[0] : 'none, all systems nominal'}`,
      `session uptime ${widgetText('uptime')}`,
      `local time ${widgetText('clock')} on ${widgetText('date-display')}`
    ].join('; ');
  }

  /* `match` is tested after the wake phrase and a question-ish lead-in
     ("what's", "how much", "check", etc.) are stripped, so it stays
     forgiving of real phrasing the same way VOICE_OPEN_SITES is. */
  const WIDGET_QUERIES = [
    { match: /temperat|how hot|how warm/, answer: () => `Core temperature is ${widgetText('metric-temp')} degrees Fahrenheit.` },
    { match: /power level|power percent|\bpower\b/, answer: () => `Power level is at ${widgetText('power-pct')} percent.` },
    { match: /cpu|processor|processing load/, answer: () => `CPU load is at ${widgetText('cpu-pct')} percent.` },
    { match: /memory|\bram\b/, answer: () => `Memory usage is at ${widgetText('mem-pct')} percent.` },
    {
      match: /protocol/,
      answer: () => {
        const active = activeProtocols();
        return active.length ? `Active protocols are ${active.join(', ')}.` : 'No protocols are currently active.';
      }
    },
    {
      match: /alert/,
      answer: () => {
        const alerts = recentAlerts();
        return alerts.length ? `Latest alert: ${alerts[0]}.` : 'No alerts at this time. All systems nominal.';
      }
    },
    { match: /\btime\b(?!out)/, answer: () => `The local time is ${widgetText('clock')}.` },
    { match: /\bdate\b|what day/, answer: () => `Today is ${widgetText('date-display')}.` },
    { match: /uptime|how long.*(on|running|up)/, answer: () => `Session uptime is ${widgetText('uptime')}.` },
    { match: /network|connection status|\bonline\b|internet/, answer: () => `Network status is ${widgetText('network-status')}.` },
    {
      match: /speed test|\bping\b|download speed|upload speed|bandwidth/,
      answer: () => {
        const ping = widgetText('st-ping');
        if (!ping || ping === '--') return 'The connection speed test has not been run yet. Say "run speed test" or use the sidebar button.';
        return `Latest speed test: ping ${ping}, download ${widgetText('st-download')}, upload ${widgetText('st-upload')}.`;
      }
    },
    {
      match: /status report|system status|full report|how (are|is) (things|everything|the system)/,
      answer: () => `Status report: ${buildSidebarSummary()}.`
    }
  ];
  const WIDGET_QUESTION_RE = /\b(what|what's|whats|how|current|check|tell me|report|status)\b|\?$/;

  function tryHandleWidgetQuery(text) {
    const t = text.trim().replace(WAKE_PHRASE_RE, '').trim().toLowerCase();
    if (!t || !WIDGET_QUESTION_RE.test(t)) return false;

    for (const q of WIDGET_QUERIES) {
      if (q.match.test(t)) {
        speakInstant(q.answer());
        return true;
      }
    }
    return false;
  }

  /* Fetches spoken audio from a premium TTS provider as a Blob. Throws
     on any failure so the caller can fall back to the browser voice. */
  async function fetchPremiumTtsAudio(text, settings) {
    if (settings.provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + settings.apiKey
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini-tts',
          voice: settings.voice || 'onyx',
          input: text,
          instructions: VOICE_STYLE_INSTRUCTIONS
        })
      });
      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        throw new Error(`OpenAI TTS error ${res.status}: ${errBody.slice(0, 200) || res.statusText}`);
      }
      return res.blob();
    }

    if (settings.provider === 'elevenlabs') {
      const voiceId = settings.voice || 'pNInz6obpgDQGcFmaJgB';
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': settings.apiKey
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true }
        })
      });
      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        throw new Error(`ElevenLabs error ${res.status}: ${errBody.slice(0, 200) || res.statusText}`);
      }
      return res.blob();
    }

    throw new Error('No premium voice provider configured.');
  }

  /* Turns a fetchPremiumTtsAudio() failure into a message that actually
     tells the user what to fix, instead of a generic "it didn't work" —
     this is what used to make a bad key/voice ID look like the app just
     "wasn't detecting" the premium voice at all. */
  function describeTtsError(err, provider) {
    const label = provider === 'elevenlabs' ? 'ElevenLabs' : provider === 'openai' ? 'OpenAI voice' : 'Voice provider';
    const msg = err && err.message ? err.message : '';
    if (/Failed to fetch|NetworkError|TypeError/.test(msg)) {
      return provider === 'elevenlabs'
        ? label + ' request was blocked before it reached the server (network/CORS error). ' +
          'In your ElevenLabs account, make sure browser API access is allowed for this key.'
        : label + ' request was blocked before it reached the server (network/CORS error).';
    }
    if (/\b401\b/.test(msg)) return label + ' rejected the API key (401 unauthorized) — check it was copied correctly.';
    if (/\b(404|422)\b/.test(msg)) {
      return provider === 'elevenlabs'
        ? label + ' could not find that voice ID (' + msg.match(/\b(404|422)\b/)[0] + ') — check it was copied correctly, not the voice name.'
        : label + ' rejected the request (' + msg.match(/\b(404|422)\b/)[0] + ') — check the voice name/ID.';
    }
    return label + ' error: ' + (msg || 'request failed.');
  }

  let currentTtsAudio = null;
  function playAudioBlob(blob, text) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentTtsAudio = audio;
      audio.onplay = () => {
        setReactorState('speaking');
        driveReactorTalkFromAudio(audio, text || '');
      };
      audio.onended = () => {
        URL.revokeObjectURL(url);
        if (currentTtsAudio === audio) currentTtsAudio = null;
        stopReactorTalkAnimation();
        setReactorState('idle');
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        if (currentTtsAudio === audio) currentTtsAudio = null;
        stopReactorTalkAnimation();
        reject(new Error('Audio playback failed.'));
      };
      audio.play().catch(reject);
    });
  }

  function speakWithBrowserVoice(text, onDone) {
    if (!('speechSynthesis' in window)) {
      setReactorState('idle');
      onDone();
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1;
    utter.pitch = 0.9;
    utter.onstart = () => {
      setReactorState('speaking');
      driveReactorTalkFromUtterance(utter, text);
    };
    utter.onend = () => { stopReactorTalkAnimation(); setReactorState('idle'); onDone(); };
    utter.onerror = () => { stopReactorTalkAnimation(); setReactorState('idle'); onDone(); };
    window.speechSynthesis.speak(utter);
  }

  /* Bumped on every new speakReply() call and by the "STOP RESPONSE"
     button. Callbacks from a given speech attempt (premium audio ending,
     browser TTS ending) check this before acting on it, so a stopped or
     superseded utterance can never trigger auto-listen after the fact. */
  let ttsGeneration = 0;

  /* Speaks a reply aloud through the reactor core: real TTS audio plus a
     live caption under the core, with the core itself pulsing while it
     talks — this is the "conversation", there is no message log. Uses a
     configured premium voice provider if available, falling back to the
     browser's built-in voice on any failure. If the reply is itself a
     question, JARVIS starts listening for the answer the moment it stops
     talking — no "Hey Jarvis" or mic tap needed. */
  async function speakReply(text) {
    speak(text, { duration: captionDuration(text) });
    ttsGeneration++;
    const myGen = ttsGeneration;

    if (currentTtsAudio) {
      currentTtsAudio.pause();
      currentTtsAudio = null;
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    const ttsSettings = loadTtsSettings();
    if (ttsSettings.provider && ttsSettings.provider !== 'browser' && ttsSettings.apiKey) {
      try {
        const blob = await fetchPremiumTtsAudio(text, ttsSettings);
        if (myGen !== ttsGeneration) return; // stopped or superseded while fetching
        await playAudioBlob(blob, text);
        if (myGen !== ttsGeneration) return; // stopped mid-playback
        autoListenIfQuestion(text);
        return;
      } catch (err) {
        console.warn('Premium voice failed, falling back to browser voice:', err);
        const reason = describeTtsError(err, ttsSettings.provider);
        chatStatusEl.textContent = reason + ' — using built-in voice instead.';
        // This is otherwise easy to miss: the panel is closed during most
        // conversation flows (typing, wake word), so a silently swallowed
        // premium-voice failure looks indistinguishable from the premium
        // voice "just not being detected" at all. Surface it.
        chatPanel.classList.add('open');
      }
    }

    if (myGen !== ttsGeneration) return;
    speakWithBrowserVoice(text, () => {
      if (myGen !== ttsGeneration) return;
      autoListenIfQuestion(text);
    });
  }

  /* Stops JARVIS mid-response: halts whatever is currently playing
     (premium audio or browser speech synthesis) and cancels any pending
     listen window, without triggering auto-listen for the interrupted
     reply. */
  function stopJarvisSpeaking() {
    ttsGeneration++;
    if (currentTtsAudio) {
      currentTtsAudio.pause();
      currentTtsAudio = null;
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    stopReactorTalkAnimation();
    setReactorState('idle');
    if (typeof clearAwaitingCommand === 'function') clearAwaitingCommand();
    speak('RESPONSE STOPPED', { duration: 1500 });
  }

  if (stopJarvisBtn) {
    stopJarvisBtn.addEventListener('click', stopJarvisSpeaking);
  }

  /* Speaks a short sample line with whatever settings are currently in
     the settings form (even if unsaved), so the user can preview a
     voice before committing to it. */
  function previewVoice(ttsSettings) {
    const sample = "This is what I'll sound like when we talk. Shall we continue?";
    // The settings modal sits on top of (and fully hides) the chat panel
    // that chatStatusEl lives in, so status text written only there was
    // invisible while the modal was open — silently "not working" from
    // the user's perspective. Surface preview status in the modal itself.
    if (settingsTtsPreviewStatus) settingsTtsPreviewStatus.textContent = '';
    if (ttsSettings.provider !== 'browser' && ttsSettings.apiKey) {
      if (settingsTtsPreviewStatus) settingsTtsPreviewStatus.textContent = 'Loading voice preview…';
      if (settingsPreviewVoiceBtn) settingsPreviewVoiceBtn.disabled = true;
      fetchPremiumTtsAudio(sample, ttsSettings)
        .then((blob) => {
          if (settingsTtsPreviewStatus) settingsTtsPreviewStatus.textContent = 'Playing preview…';
          return playAudioBlob(blob, sample);
        })
        .then(() => {
          if (settingsTtsPreviewStatus) settingsTtsPreviewStatus.textContent = '';
        })
        .catch((err) => {
          if (settingsTtsPreviewStatus) {
            settingsTtsPreviewStatus.textContent = describeTtsError(err, ttsSettings.provider);
          }
          setReactorState('idle');
        })
        .finally(() => {
          if (settingsPreviewVoiceBtn) settingsPreviewVoiceBtn.disabled = false;
        });
    } else {
      if (settingsTtsPreviewStatus) settingsTtsPreviewStatus.textContent = 'Playing preview (browser voice)…';
      speakWithBrowserVoice(sample, () => {
        if (settingsTtsPreviewStatus) settingsTtsPreviewStatus.textContent = '';
      });
    }
  }

  /* Defined further down (voice recognition section); referenced here via
     hoisting. Only kicks in when speech recognition is actually available,
     and not if a previous listening window timed out with no response —
     that lockout (needsWakeWord) only lifts once the user says "Hey
     Jarvis" again or manually taps the mic. */
  function autoListenIfQuestion(text) {
    if (!recognition || needsWakeWord || !text.trim().endsWith('?')) return;
    ensureRecognitionRunning();
    beginAwaitingCommand("JARVIS asked a question — listening for your answer...");
  }

  /* Speaks a fixed, locally-known line immediately via the browser's
     built-in voice, bypassing any configured premium TTS provider. Used
     anywhere the reply doesn't need AI-quality phrasing and shouldn't
     wait on a network round trip — the wake-word greeting and the widget
     / sidebar readout answers above both want to feel instant. */
  function speakInstant(text) {
    speak(text, { duration: captionDuration(text) });
    ttsGeneration++;
    const myGen = ttsGeneration;
    if (currentTtsAudio) {
      currentTtsAudio.pause();
      currentTtsAudio = null;
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    speakWithBrowserVoice(text, () => {
      if (myGen !== ttsGeneration) return;
      autoListenIfQuestion(text);
    });
  }

  /* Bare "Hey Jarvis" with no trailing request: JARVIS greets the user
     out loud immediately, then autoListenIfQuestion (triggered because
     the greeting itself ends in "?") starts the timed listening window
     automatically. */
  function respondToWakeWord() {
    speakInstant('What do you need help with today?');
  }

  let sending = false;
  async function sendChatMessage(text) {
    text = (text || '').trim();
    if (!text || sending) return;

    chatInput.value = '';
    speak('YOU: ' + text, { duration: captionDuration(text) });

    if (tryHandleVoiceCommand(text)) return;
    if (tryHandleWidgetQuery(text)) return;

    if (!aiConfigured()) {
      chatStatusEl.textContent = 'AI not configured.';
      setTimeout(() => speak('NO AI PROVIDER CONFIGURED. OPEN SETTINGS TO CONNECT ME.', { duration: 5000 }), 1200);
      openSettingsModal();
      return;
    }

    sending = true;
    chatSendBtn.disabled = true;
    chatStatusEl.textContent = 'JARVIS is thinking...';
    setReactorState('thinking');

    try {
      const reply = await callAI(text);
      chatStatusEl.textContent = '';
      speakReply(reply);
    } catch (err) {
      setReactorState('idle');
      chatStatusEl.textContent = 'Request failed. Check your API settings and connection.';
      speak('ERROR: ' + (err && err.message ? err.message : 'REQUEST FAILED.'), { duration: 5000 });
    } finally {
      sending = false;
      chatSendBtn.disabled = false;
    }
  }

  if (chatToggleBtn) {
    chatToggleBtn.addEventListener('click', () => {
      chatPanel.classList.toggle('open');
      if (chatPanel.classList.contains('open')) {
        chatInput.focus();
        speak('VOICE INTERFACE ENGAGED');
      }
    });
  }
  if (chatCloseBtn) chatCloseBtn.addEventListener('click', () => chatPanel.classList.remove('open'));
  if (chatSendBtn) chatSendBtn.addEventListener('click', () => sendChatMessage(chatInput.value));
  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendChatMessage(chatInput.value);
    });
  }

  /* ============ SPEECH RECOGNITION + "HEY JARVIS" WAKE WORD ============
     A single continuous recognition session listens in the background
     once "Hey Jarvis" mode is enabled. Saying the wake phrase (optionally
     followed immediately by a question, e.g. "Hey Jarvis, what's the
     time?") answers out loud without ever opening the chat panel. The
     mic button just fast-forwards straight into "awaiting a command" so
     you don't have to say the wake phrase when the panel is already open. */
  const WAKE_PHRASE_RE = /\bhey,?\s*jarvis\b[,.!?\s]*/i;
  const wakeToggleBtn = document.getElementById('wake-toggle-btn');

  const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let recognitionActive = false;
  let wakeWordEnabled = false;
  let awaitingCommand = false;
  let awaitingTimeout = null;   // hard cap: give up if nothing usable is heard at all
  let silenceTimer = null;      // once speech starts, a pause this long ends the turn
  let awaitingTranscript = '';  // latest (interim or final) transcript heard this turn
  let needsWakeWord = false;    // set once a listening window times out with no response;
                                 // blocks auto-listen until "Hey Jarvis" (or the mic button) is used again

  const AWAITING_MAX_MS = 40000;   // wait up to 40s total for a response
  const AWAITING_SILENCE_MS = 3000; // then submit after 3s of silence following speech

  function setWakeToggleUI() {
    if (!wakeToggleBtn) return;
    wakeToggleBtn.textContent = 'HEY JARVIS: ' + (wakeWordEnabled ? 'ON' : 'OFF');
    wakeToggleBtn.classList.toggle('active-toggle', wakeWordEnabled);
  }

  function clearAwaitingCommand() {
    awaitingCommand = false;
    awaitingTranscript = '';
    clearTimeout(awaitingTimeout);
    awaitingTimeout = null;
    clearTimeout(silenceTimer);
    silenceTimer = null;
    if (micBtn) micBtn.classList.remove('listening');
    setReactorState('idle');
  }

  /* Ends the current listening turn: takes whatever transcript has been
     heard so far (interim or final) and sends it as the response. If
     nothing was said at all before the 40s cap, JARVIS goes silent and
     won't listen again on its own — only "Hey Jarvis" or the mic button
     can re-engage it from here. */
  function finalizeAwaitingCommand() {
    const transcript = awaitingTranscript.trim();
    clearAwaitingCommand();
    if (transcript) {
      sendChatMessage(transcript);
    } else {
      needsWakeWord = true;
      chatStatusEl.textContent = wakeWordEnabled ? 'Say "Hey Jarvis" to continue.' : '';
    }
  }

  /* Restarts the 3-second silence window. Called every time new speech
     is heard while awaiting a response, so the turn only ends once the
     user actually pauses for 3s — not merely because 3s have elapsed
     since listening began. */
  function resetSilenceTimer() {
    clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => {
      if (awaitingCommand) finalizeAwaitingCommand();
    }, AWAITING_SILENCE_MS);
  }

  function beginAwaitingCommand(statusText) {
    awaitingCommand = true;
    awaitingTranscript = '';
    if (micBtn) micBtn.classList.add('listening');
    chatStatusEl.textContent = statusText || 'Listening for your question...';
    setReactorState('listening-state');
    clearTimeout(silenceTimer);
    silenceTimer = null;
    clearTimeout(awaitingTimeout);
    awaitingTimeout = setTimeout(() => {
      if (awaitingCommand) finalizeAwaitingCommand();
    }, AWAITING_MAX_MS);
  }

  function ensureRecognitionRunning() {
    if (!recognition || recognitionActive) return;
    try {
      recognition.start();
    } catch {
      /* already started */
    }
  }

  function stopVoiceListening() {
    clearAwaitingCommand();
    if (recognition && recognitionActive) recognition.stop();
  }

  function resumeWakeWordIfEnabled() {
    if (wakeWordEnabled) ensureRecognitionRunning();
  }

  if (SpeechRecognitionCtor) {
    recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      recognitionActive = true;
    };

    recognition.onend = () => {
      recognitionActive = false;
      if (wakeWordEnabled || awaitingCommand) {
        setTimeout(ensureRecognitionRunning, 300);
      } else {
        if (micBtn) micBtn.classList.remove('listening');
        setReactorState('idle');
      }
    };

    recognition.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        wakeWordEnabled = false;
        setWakeToggleUI();
        clearAwaitingCommand();
        chatStatusEl.textContent = 'Microphone access denied. Enable it to use voice.';
        return;
      }
      if (e.error === 'no-speech' || e.error === 'aborted') return; // expected; onend auto-restarts
      clearAwaitingCommand();
      chatStatusEl.textContent = 'Microphone error: ' + e.error;
    };

    recognition.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        const transcript = result[0].transcript.trim();

        if (awaitingCommand) {
          if (transcript) {
            awaitingTranscript = transcript;
            resetSilenceTimer(); // heard something — the 3s "are they done?" window restarts
          }
          if (result.isFinal && transcript) finalizeAwaitingCommand();
          continue;
        }

        if (!result.isFinal || !transcript) continue;
        const match = transcript.match(WAKE_PHRASE_RE);
        if (!match) continue;
        needsWakeWord = false; // heard "Hey Jarvis" — lifts any lockout from a prior timeout
        const rest = transcript.slice(match.index + match[0].length).trim();
        if (rest.length > 1) {
          sendChatMessage(rest);
        } else {
          respondToWakeWord();
        }
      }
    };

    if (micBtn) {
      micBtn.addEventListener('click', () => {
        if (awaitingCommand) {
          clearAwaitingCommand();
          return;
        }
        needsWakeWord = false; // an explicit tap re-engages JARVIS same as saying the wake phrase
        ensureRecognitionRunning();
        beginAwaitingCommand();
      });
    }

    if (wakeToggleBtn) {
      wakeToggleBtn.addEventListener('click', () => {
        wakeWordEnabled = !wakeWordEnabled;
        setWakeToggleUI();
        if (wakeWordEnabled) {
          needsWakeWord = false;
          ensureRecognitionRunning();
          chatStatusEl.textContent = 'Wake word engaged. Say "Hey Jarvis" any time.';
          speak('WAKE WORD ENGAGED');
        } else {
          clearAwaitingCommand();
          chatStatusEl.textContent = '';
          speak('WAKE WORD DISENGAGED');
          if (recognition && recognitionActive) recognition.stop();
        }
      });
    }
  } else {
    if (micBtn) {
      micBtn.disabled = true;
      micBtn.title = 'Speech recognition is not supported in this browser';
    }
    if (wakeToggleBtn) {
      wakeToggleBtn.disabled = true;
      wakeToggleBtn.title = 'Speech recognition is not supported in this browser';
    }
  }

  /* ============ FLOATING WIDGETS ============
     Draggable pop-up widgets rendered onto the galaxy grid backdrop.
     Each widget type is a singleton: re-clicking its sidebar button
     brings the existing instance to the front instead of duplicating it. */
  const widgetsLayer = document.getElementById('widgets-layer');
  const openWidgets = {};
  let widgetZTop = 1;
  let widgetCascade = 0;

  function bringWidgetToFront(el) {
    widgetZTop += 1;
    el.style.zIndex = widgetZTop;
  }

  function makeWidgetDraggable(widgetEl, handleEl) {
    let dragging = false;
    let startX = 0, startY = 0, originX = 0, originY = 0;

    function onPointerDown(e) {
      dragging = true;
      bringWidgetToFront(widgetEl);
      const point = e.touches ? e.touches[0] : e;
      startX = point.clientX;
      startY = point.clientY;
      const rect = widgetEl.getBoundingClientRect();
      originX = rect.left;
      originY = rect.top;
      document.addEventListener('mousemove', onPointerMove);
      document.addEventListener('mouseup', onPointerUp);
      document.addEventListener('touchmove', onPointerMove, { passive: false });
      document.addEventListener('touchend', onPointerUp);
    }

    function onPointerMove(e) {
      if (!dragging) return;
      if (e.touches) e.preventDefault();
      const point = e.touches ? e.touches[0] : e;
      const dx = point.clientX - startX;
      const dy = point.clientY - startY;
      const maxX = window.innerWidth - widgetEl.offsetWidth;
      const maxY = window.innerHeight - widgetEl.offsetHeight;
      const nextX = Math.min(Math.max(0, originX + dx), Math.max(0, maxX));
      const nextY = Math.min(Math.max(0, originY + dy), Math.max(0, maxY));
      widgetEl.style.left = nextX + 'px';
      widgetEl.style.top = nextY + 'px';
    }

    function onPointerUp() {
      dragging = false;
      document.removeEventListener('mousemove', onPointerMove);
      document.removeEventListener('mouseup', onPointerUp);
      document.removeEventListener('touchmove', onPointerMove);
      document.removeEventListener('touchend', onPointerUp);
    }

    handleEl.addEventListener('mousedown', onPointerDown);
    handleEl.addEventListener('touchstart', onPointerDown, { passive: true });
  }

  function createWidget(id, title, bodyHtml) {
    if (openWidgets[id]) {
      bringWidgetToFront(openWidgets[id]);
      openWidgets[id].classList.add('widget-pulse');
      setTimeout(() => openWidgets[id] && openWidgets[id].classList.remove('widget-pulse'), 500);
      return openWidgets[id];
    }

    const el = document.createElement('div');
    el.className = 'widget-panel';
    el.innerHTML =
      '<div class="widget-header">' +
        '<span class="widget-title">' + title + '</span>' +
        '<button class="widget-close-btn" title="Close" aria-label="Close widget">&times;</button>' +
      '</div>' +
      '<div class="widget-body">' + bodyHtml + '</div>';

    const offset = (widgetCascade % 5) * 28;
    widgetCascade += 1;
    el.style.left = (80 + offset) + 'px';
    el.style.top = (140 + offset) + 'px';

    widgetsLayer.appendChild(el);
    openWidgets[id] = el;
    bringWidgetToFront(el);

    const header = el.querySelector('.widget-header');
    makeWidgetDraggable(el, header);
    el.addEventListener('mousedown', () => bringWidgetToFront(el));

    el.querySelector('.widget-close-btn').addEventListener('click', () => {
      el.remove();
      delete openWidgets[id];
    });

    return el;
  }

  /* -------- Web Info widget: live top stories via the Hacker News API
     (public, no API key, CORS-enabled) -------- */
  function openWebInfoWidget() {
    const el = createWidget(
      'webinfo',
      'WEB INFO — LIVE FEED',
      '<div class="webinfo-status" id="webinfo-status">Fetching latest stories&hellip;</div>' +
      '<ul class="webinfo-list" id="webinfo-list"></ul>' +
      '<button class="hud-btn" id="webinfo-refresh-btn">REFRESH</button>'
    );

    const statusEl = el.querySelector('#webinfo-status');
    const listEl = el.querySelector('#webinfo-list');
    const refreshBtn = el.querySelector('#webinfo-refresh-btn');

    async function loadTopStories() {
      statusEl.textContent = 'Fetching latest stories…';
      listEl.innerHTML = '';
      try {
        const idsRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
        if (!idsRes.ok) throw new Error('HTTP ' + idsRes.status);
        const ids = (await idsRes.json()).slice(0, 8);

        const items = await Promise.all(ids.map((id) =>
          fetch('https://hacker-news.firebaseio.com/v0/item/' + id + '.json').then((r) => r.json())
        ));

        listEl.innerHTML = items.map((item) => {
          if (!item) return '';
          const link = item.url || ('https://news.ycombinator.com/item?id=' + item.id);
          const title = (item.title || 'Untitled').replace(/</g, '&lt;');
          return '<li class="webinfo-item">' +
            '<a href="' + link + '" target="_blank" rel="noopener noreferrer">' + title + '</a>' +
            '<span class="webinfo-meta">▲ ' + (item.score || 0) + '</span>' +
          '</li>';
        }).join('');

        statusEl.textContent = 'Live — updated ' + new Date().toLocaleTimeString();
      } catch (err) {
        statusEl.textContent = 'Could not reach the network for live data: ' +
          (err && err.message ? err.message : 'unknown error');
      }
    }

    refreshBtn.addEventListener('click', loadTopStories);
    loadTopStories();
  }

  /* -------- Calculator widget -------- */
  function openCalculatorWidget() {
    const el = createWidget(
      'calculator',
      'CALCULATOR',
      '<input type="text" id="calc-display" class="calc-display" value="0" readonly>' +
      '<div class="calc-grid">' +
        '<button class="calc-btn calc-op" data-key="clear">C</button>' +
        '<button class="calc-btn calc-op" data-key="backspace">⌫</button>' +
        '<button class="calc-btn calc-op" data-key="%">%</button>' +
        '<button class="calc-btn calc-op" data-key="/">÷</button>' +
        '<button class="calc-btn" data-key="7">7</button>' +
        '<button class="calc-btn" data-key="8">8</button>' +
        '<button class="calc-btn" data-key="9">9</button>' +
        '<button class="calc-btn calc-op" data-key="*">×</button>' +
        '<button class="calc-btn" data-key="4">4</button>' +
        '<button class="calc-btn" data-key="5">5</button>' +
        '<button class="calc-btn" data-key="6">6</button>' +
        '<button class="calc-btn calc-op" data-key="-">−</button>' +
        '<button class="calc-btn" data-key="1">1</button>' +
        '<button class="calc-btn" data-key="2">2</button>' +
        '<button class="calc-btn" data-key="3">3</button>' +
        '<button class="calc-btn calc-op" data-key="+">+</button>' +
        '<button class="calc-btn calc-zero" data-key="0">0</button>' +
        '<button class="calc-btn" data-key=".">.</button>' +
        '<button class="calc-btn calc-op calc-equals" data-key="=">=</button>' +
      '</div>'
    );

    const display = el.querySelector('#calc-display');
    let expr = '';

    function render() {
      display.value = expr === '' ? '0' : expr;
    }

    function evaluate(expression) {
      if (!/^[0-9+\-*/.% ]+$/.test(expression)) throw new Error('Invalid input');
      // eslint-disable-next-line no-new-func
      const result = Function('"use strict"; return (' + expression + ')')();
      if (typeof result !== 'number' || !isFinite(result)) throw new Error('Invalid result');
      return result;
    }

    el.querySelector('.calc-grid').addEventListener('click', (e) => {
      const btn = e.target.closest('.calc-btn');
      if (!btn) return;
      const key = btn.dataset.key;

      if (key === 'clear') {
        expr = '';
      } else if (key === 'backspace') {
        expr = expr.slice(0, -1);
      } else if (key === '=') {
        try {
          expr = String(evaluate(expr));
        } catch {
          expr = 'ERROR';
        }
      } else {
        if (expr === 'ERROR') expr = '';
        expr += key;
      }
      render();
    });

    render();
  }

  const widgetWebInfoBtn = document.getElementById('widget-webinfo-btn');
  const widgetCalculatorBtn = document.getElementById('widget-calculator-btn');
  if (widgetWebInfoBtn) widgetWebInfoBtn.addEventListener('click', openWebInfoWidget);
  if (widgetCalculatorBtn) widgetCalculatorBtn.addEventListener('click', openCalculatorWidget);

  /* prevent scroll jank on dashboard page background */
  landingPage.style.opacity = '1';
})();
