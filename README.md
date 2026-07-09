# J.A.R.V.I.S - Interactive AI Interface

A fully interactive, Iron Man-inspired JARVIS AI interface built with vanilla HTML, CSS, and JavaScript. It features a holographic system dashboard, a real voice/text conversation with an AI model of your choice, and a real internet connection speed test — all running client-side, with no backend server required.

![JARVIS Interface](https://img.shields.io/badge/Status-Active-00d9ff?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)
![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-yellow?style=flat-square)

---

## 🎯 Features

### Landing Page
- **Hero Section**: Large animated JARVIS title with glowing cyan effects
- **Particle Effects**: Smooth floating particles animated across the screen
- **Feature Cards**: 4 interactive cards showcasing system capabilities
- **Call-to-Action**: "INITIALIZE SYSTEM" button with smooth transitions
- **Responsive Design**: Works on mobile, tablet, and desktop

### Main Dashboard
- **Arc Reactor Core**: Central animated glowing triangle with radiating rings
- **Real-time Clock**: Live HH:MM:SS digital display
- **System Metrics**: Stylized power/CPU/memory/thermal readouts for the HUD aesthetic
- **Live Network Status**: Real online/offline detection via the browser's Network Information API
- **Status Panels**: Active protocols, alerts, and notifications

### Real Voice & AI Chat
JARVIS includes an actual conversational assistant, not canned responses:
- **Speech-to-text** via the browser's Web Speech API (tap the mic button and talk)
- **Text generation** via any OpenAI-compatible Chat Completions endpoint that you configure with your own API key
- **Text-to-speech** replies via the browser's SpeechSynthesis API
- Conversation history is kept in-session for context-aware replies

> This is a static, client-only site with no backend. Your API key is stored **only** in your browser's `localStorage` and is sent **only** to the API base URL you configure — never anywhere else. See [AI Setup](#-ai-chat-setup) below.

### Real Internet Speed Test
A "CONNECTION SPEED TEST" panel in the dashboard measures your **actual** live connection:
- **Ping** — median round-trip latency over several requests
- **Download** — real throughput measured by downloading a payload and timing it
- **Upload** — real throughput measured by uploading a payload and timing it

It uses Cloudflare's public, CORS-enabled speed-test endpoints (`speed.cloudflare.com`), the same infrastructure behind `speed.cloudflare.com` and the `@cloudflare/speedtest` library — not a random or simulated number.

### Interactive Elements
- ✨ Smooth hover animations with glow effects
- 🎬 Page transitions with loading animations
- ⌨️ Keyboard shortcuts (E: Exit, R: Reset metrics, S: Toggle sidebars)
- 🖱️ Click feedback with ripple effects
- 📱 Fully responsive layout

---

## 🚀 Quick Start

### Prerequisites
- No build tools or external libraries required
- A modern browser (Chrome, Edge, or Safari recommended for full Web Speech API support)
- Served over **HTTPS** or `localhost` — browsers require a secure context for microphone access

### Installation

```bash
git clone https://github.com/RudraRM/Jarvis.git
cd Jarvis
```

Then either open `jarvis.html` directly, or serve it locally (recommended, especially for microphone access):

```bash
python -m http.server 8000
# then open http://localhost:8000/jarvis.html
```

No build process, no dependencies, no installation required.

---

## 📁 Project Structure

```
Jarvis/
│
├── jarvis.html   # Markup for the landing page, dashboard, chat panel, and settings modal
├── jarvis.css    # All styling and animations
├── jarvis.js     # All application logic (dashboard, network status, speed test, voice/AI chat)
└── README.md     # This file
```

---

## 🎮 Usage

### Landing Page
1. Open `jarvis.html` in your browser
2. Click **"INITIALIZE SYSTEM"** to enter the dashboard

### Dashboard
- **Metrics**: Click any metric card to expand its detail text
- **Speed Test**: In the right sidebar, click **RUN SPEED TEST** to measure your real ping, download, and upload speed
- **Voice Chat**: Click **VOICE CHAT** in the left sidebar to open the chat panel; type a message or tap the mic button to speak
- **Keyboard Shortcuts**:
  - **E** — Exit to landing page
  - **R** — Reset dashboard metrics
  - **S** — Toggle sidebar visibility

---

## 🤖 AI Chat Setup

The chat panel needs an AI provider to hold a real conversation:

1. Open the chat panel (**VOICE CHAT**) and click the gear icon.
2. Enter:
   - **API Base URL** — e.g. `https://api.openai.com/v1` (or any OpenAI-compatible endpoint, such as a local model server or a proxy you control)
   - **Model** — e.g. `gpt-4o-mini`
   - **API Key** — your provider's API key
3. Click **SAVE**.

Your key is written to `localStorage` under `jarvis_ai_settings_v1` and used only for requests to the base URL you supplied. Click **CLEAR KEY** at any time to remove it from your browser.

**Note on security**: because this project has no server, the API key is used directly from the browser. This is fine for personal/local use, but do not deploy a publicly shared instance with a key baked in — anyone visiting the page could read it from local storage or network requests. For a shared deployment, put a small proxy server in front of your AI provider instead of entering a key that others could see.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `E` | Exit to landing page |
| `R` | Reset dashboard metrics |
| `S` | Toggle sidebar visibility |

---

## 🎨 Customization

### Colors
Modify the color scheme in `jarvis.css`:
```css
:root {
  --dark: #0a0e27;
  --dark-2: #1a2a4a;
  --cyan: #00d9ff;
  --text: #e0e0e0;
  --green: #00ff00;
  --danger: #ff3b3b;
}
```

### Animation Speed
Adjust animation timings in `jarvis.css` (`transition` / `animation` rules).

---

## 🛠️ Technical Stack

- **HTML5** — semantic markup and structure
- **CSS3** — animations, flexbox/grid layout, CSS variables, media queries
- **Vanilla JavaScript** — DOM manipulation, Web Speech API (STT/TTS), Fetch API, Network Information API, no frameworks

---

## 🔧 Browser Support

| Browser | Dashboard | Speed Test | Voice Input (STT) | Voice Output (TTS) |
|---------|-----------|------------|--------------------|---------------------|
| Chrome / Edge | ✅ | ✅ | ✅ | ✅ |
| Safari | ✅ | ✅ | ✅ | ✅ |
| Firefox | ✅ | ✅ | ⚠️ Limited/no `SpeechRecognition` support | ✅ |

If your browser doesn't support `SpeechRecognition`, the mic button is disabled automatically but text chat still works.

---

## 📝 License

This project is licensed under the **MIT License**.

---

## 🙏 Acknowledgments

- Inspired by Iron Man's JARVIS system from Marvel
- Speed test powered by Cloudflare's public speed-test endpoints
