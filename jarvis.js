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

  function speak(msg) {
    voiceEl.textContent = msg;
    voiceEl.style.opacity = '1';
    clearTimeout(voiceTimeout);
    voiceTimeout = setTimeout(() => { voiceEl.style.opacity = '0.5'; }, 3500);
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
    temp: 30, power: 92, health: 98, cpu: 41, mem: 57,
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
    applyMetric('metric-temp', 'temp', 24, 38, 2);
    applyMetric('power-pct', 'power', 70, 100, 4, 'power-bar');
    applyMetric('health-pct', 'health', 88, 100, 2);
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
  }

  function stopDashboard() {
    clearInterval(clockTimer);
    clearInterval(metricsTimer);
    clearInterval(alertTimer);
    uptimeStart = null;
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

  /* theme toggle */
  const themeToggle = document.getElementById('theme-toggle');
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('darker-theme');
    speak(document.body.classList.contains('darker-theme') ? 'DARKER THEME ENGAGED' : 'STANDARD THEME RESTORED');
  });

  /* keyboard shortcuts */
  let sidebarsHidden = false;
  document.addEventListener('keydown', (e) => {
    if (!dashboardPage.classList.contains('active-page')) return;
    const key = e.key.toLowerCase();

    if (key === 'e') {
      goToLanding();
    } else if (key === 'r') {
      state = { temp: 30, power: 92, health: 98, cpu: 41, mem: 57, oi1: 87, oi2: 64, oi3: 99 };
      tickMetrics();
      speak('METRICS RESET');
    } else if (key === 's') {
      sidebarsHidden = !sidebarsHidden;
      document.getElementById('left-sidebar').classList.toggle('hidden-side', sidebarsHidden);
      document.getElementById('right-sidebar').classList.toggle('hidden-side', sidebarsHidden);
      speak(sidebarsHidden ? 'SIDEBARS HIDDEN' : 'SIDEBARS RESTORED');
    } else if (e.ctrlKey && e.shiftKey && key === 'j') {
      speak("I AM ALWAYS WATCHING, SIR.");
    }
  });

  /* prevent scroll jank on dashboard page background */
  landingPage.style.opacity = '1';
})();
