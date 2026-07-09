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

  const speedtestBtn = document.getElementById('speedtest-btn');
  const speedtestBarFill = document.getElementById('speedtest-bar-fill');
  const speedtestStatus = document.getElementById('speedtest-status');
  const stPingEl = document.getElementById('st-ping');
  const stDownEl = document.getElementById('st-download');
  const stUpEl = document.getElementById('st-upload');

  function setSpeedtestProgress(pct) {
    if (speedtestBarFill) speedtestBarFill.style.width = Math.max(0, Math.min(100, pct)) + '%';
  }

  async function measurePing(samples = 4) {
    const times = [];
    for (let i = 0; i < samples; i++) {
      const start = performance.now();
      await fetch(CF_DOWN_URL + '0', { cache: 'no-store', mode: 'cors' });
      times.push(performance.now() - start);
      setSpeedtestProgress((i + 1) / samples * 20);
    }
    times.sort((a, b) => a - b);
    return times[Math.floor(times.length / 2)];
  }

  async function measureDownload(bytes = 15_000_000) {
    const start = performance.now();
    const res = await fetch(CF_DOWN_URL + bytes, { cache: 'no-store', mode: 'cors' });
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
    await fetch(CF_UP_URL, { method: 'POST', body: data, cache: 'no-store', mode: 'cors' });
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
      const down = await measureDownload();
      stDownEl.textContent = down.toFixed(1) + ' Mbps';

      speedtestStatus.textContent = 'Measuring upload speed...';
      const up = await measureUpload();
      stUpEl.textContent = up.toFixed(1) + ' Mbps';

      speedtestStatus.textContent = 'Test complete.';
      speak('SPEED TEST COMPLETE. DOWNLOAD ' + down.toFixed(0) + ' MEGABITS PER SECOND.');
    } catch (err) {
      speedtestStatus.textContent = 'Speed test failed: ' + (err && err.message ? err.message : 'network error.');
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
  const chatMessagesEl = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const chatSendBtn = document.getElementById('chat-send-btn');
  const chatStatusEl = document.getElementById('chat-status');
  const micBtn = document.getElementById('mic-btn');

  const settingsModal = document.getElementById('settings-modal');
  const chatSettingsBtn = document.getElementById('chat-settings-btn');
  const settingsCancelBtn = document.getElementById('settings-cancel-btn');
  const settingsSaveBtn = document.getElementById('settings-save-btn');
  const settingsClearBtn = document.getElementById('settings-clear-btn');
  const settingsBaseUrlInput = document.getElementById('settings-baseurl');
  const settingsModelInput = document.getElementById('settings-model');
  const settingsApiKeyInput = document.getElementById('settings-apikey');

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
    return !!(s.apiKey && s.baseUrl && s.model);
  }

  function openSettingsModal() {
    const s = loadAiSettings();
    settingsBaseUrlInput.value = s.baseUrl || 'https://api.openai.com/v1';
    settingsModelInput.value = s.model || 'gpt-4o-mini';
    settingsApiKeyInput.value = s.apiKey || '';
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
      const baseUrl = settingsBaseUrlInput.value.trim().replace(/\/+$/, '');
      const model = settingsModelInput.value.trim();
      const apiKey = settingsApiKeyInput.value.trim();
      if (!baseUrl || !model || !apiKey) {
        chatStatusEl.textContent = 'Please fill in base URL, model, and API key to enable chat.';
        closeSettingsModal();
        return;
      }
      saveAiSettings({ baseUrl, model, apiKey });
      closeSettingsModal();
      chatStatusEl.textContent = 'AI connection configured. Ready to chat.';
      addChatMessage('system', 'AI connection configured.');
    });
  }
  if (settingsClearBtn) {
    settingsClearBtn.addEventListener('click', () => {
      localStorage.removeItem(SETTINGS_KEY);
      settingsApiKeyInput.value = '';
      chatStatusEl.textContent = 'API key cleared. Configure an AI provider in settings to enable real conversation.';
      closeSettingsModal();
    });
  }

  function addChatMessage(role, text) {
    const div = document.createElement('div');
    div.className = 'chat-msg ' + role;
    div.textContent = text;
    chatMessagesEl.appendChild(div);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
    return div;
  }

  let conversationHistory = [
    { role: 'system', content: 'You are J.A.R.V.I.S., Tony Stark\'s AI assistant. Be concise, helpful, and a little witty.' }
  ];

  async function callAI(userText) {
    const settings = loadAiSettings();
    conversationHistory.push({ role: 'user', content: userText });
    if (conversationHistory.length > 21) {
      conversationHistory = [conversationHistory[0], ...conversationHistory.slice(-20)];
    }

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

  function speakReply(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1;
    utter.pitch = 0.9;
    window.speechSynthesis.speak(utter);
  }

  let sending = false;
  async function sendChatMessage(text) {
    text = (text || '').trim();
    if (!text || sending) return;

    addChatMessage('user', text);
    chatInput.value = '';

    if (!aiConfigured()) {
      addChatMessage('system', 'No AI provider configured yet. Click the gear icon to add your API key and start a real conversation.');
      chatStatusEl.textContent = 'AI not configured.';
      openSettingsModal();
      return;
    }

    sending = true;
    chatSendBtn.disabled = true;
    chatStatusEl.textContent = 'JARVIS is thinking...';
    const thinkingEl = addChatMessage('system', 'Processing...');

    try {
      const reply = await callAI(text);
      thinkingEl.remove();
      addChatMessage('assistant', reply);
      speakReply(reply);
      speak('RESPONSE READY');
      chatStatusEl.textContent = '';
    } catch (err) {
      thinkingEl.remove();
      addChatMessage('error', 'Error: ' + (err && err.message ? err.message : 'request failed.'));
      chatStatusEl.textContent = 'Request failed. Check your API settings and connection.';
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

  /* Speech recognition (voice input) */
  const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let listening = false;

  if (SpeechRecognitionCtor) {
    recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      listening = true;
      micBtn.classList.add('listening');
      chatStatusEl.textContent = 'Listening...';
    };
    recognition.onend = () => {
      listening = false;
      micBtn.classList.remove('listening');
    };
    recognition.onerror = (e) => {
      listening = false;
      micBtn.classList.remove('listening');
      chatStatusEl.textContent = 'Microphone error: ' + e.error;
    };
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      sendChatMessage(transcript);
    };

    if (micBtn) {
      micBtn.addEventListener('click', () => {
        if (listening) {
          recognition.stop();
          return;
        }
        try {
          recognition.start();
        } catch {
          /* already started */
        }
      });
    }
  } else if (micBtn) {
    micBtn.disabled = true;
    micBtn.title = 'Speech recognition is not supported in this browser';
  }

  /* prevent scroll jank on dashboard page background */
  landingPage.style.opacity = '1';
})();
