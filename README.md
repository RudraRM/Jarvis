# J.A.R.V.I.S - Interactive AI Interface

A fully interactive, Iron Man-inspired JARVIS AI interface built with vanilla HTML, CSS, and JavaScript. It features a holographic system dashboard, a real voice/text conversation with an AI model of your choice, and a real internet connection speed test — all running client-side, with no backend server required.

![JARVIS Interface](https://img.shields.io/badge/Status-Active-00d9ff?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)
![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-yellow?style=flat-square)

---

## 🎯 Features

### Landing Page
- **Hero Section**: Centered JARVIS title in Roboto Mono with glowing cyan effects
- **Particle Effects**: Smooth floating particles animated across the screen
- **Call-to-Action**: "INITIALIZE SYSTEM" button anchored to the bottom of the page
- **Responsive Design**: Works on mobile, tablet, and desktop

### Main Dashboard
- **Arc Reactor Core**: Central animated glowing triangle with radiating rings
- **Real-time Clock**: Live HH:MM:SS digital display
- **Live Temperature**: Real current weather for McKinney, TX (see [Live Temperature](#️-live-temperature) below) — not simulated
- **System Metrics**: Stylized power/CPU/memory readouts for the HUD aesthetic
- **Live Network Status**: Real online/offline detection via the browser's Network Information API
- **Status Panels**: Active protocols, alerts, and notifications
- **Fullscreen Mode**: A real Fullscreen API toggle at the bottom of the right sidebar (or press `F`)

### Real Voice & AI Chat
JARVIS includes an actual conversational assistant, not canned responses:
- **Speech-to-text** via the browser's Web Speech API (tap the mic button and talk)
- **"Hey Jarvis" wake word**: listens in the background and is **on by default** — no need to click anything before it starts working. Toggle it off/on any time with the **HEY JARVIS** button in the left sidebar.
- **Text generation** via any OpenAI-compatible Chat Completions endpoint or Google Gemini that you configure with your own API key
- **Text-to-speech** replies via the browser's built-in SpeechSynthesis API, or an optional premium voice (OpenAI TTS or ElevenLabs)
- **Live dashboard awareness**: JARVIS can read the sidebar readouts (temperature, power, CPU/memory, protocols, alerts, uptime, network, speed test) and answer direct questions about them instantly, with no AI provider required — see [Voice Commands](#️-voice-commands) below
- Conversation history is kept in-session for context-aware replies

> This is a static, client-only site with no backend. Your API key is stored **only** in your browser's `localStorage` and is sent **only** to the API base URL you configure — never anywhere else. See [AI Setup](#-ai-chat-setup) below.

### Real Internet Speed Test
A "CONNECTION SPEED TEST" panel in the dashboard measures your **actual** live connection:
- **Ping** — median round-trip latency over several requests
- **Download** — real throughput measured by downloading a payload and timing it
- **Upload** — real throughput measured by uploading a payload and timing it

It uses Cloudflare's public, CORS-enabled speed-test endpoints (`speed.cloudflare.com`), the same infrastructure behind `speed.cloudflare.com` and the `@cloudflare/speedtest` library — not a random or simulated number. You can also just say **"Hey Jarvis, run a speed test"** and JARVIS will run it and read the results back to you.

### Interactive Elements
- ✨ Smooth hover animations with glow effects
- 🎬 Page transitions with loading animations
- ⌨️ Keyboard shortcuts (E: Exit, R: Reset metrics, S: Toggle sidebars, F: Fullscreen)
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

or, using the included `package.json`:

```bash
npm start
# then open the URL it prints
```

No build process, no dependencies to install — `npm start` just runs `npx serve` to host the static files.

---

## 📁 Project Structure

```
Jarvis/
│
├── jarvis.html   # Markup for the landing page, dashboard, chat panel, and settings modal
├── jarvis.css    # All styling and animations
├── jarvis.js     # All application logic (dashboard, network status, speed test, voice/AI chat)
├── package.json  # Project metadata and a convenience `npm start` script
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
- **Fullscreen**: Click **ENTER FULLSCREEN** at the bottom of the right sidebar, or press `F`
- **Keyboard Shortcuts**:
  - **E** — Exit to landing page
  - **R** — Reset dashboard metrics
  - **S** — Toggle sidebar visibility
  - **F** — Toggle fullscreen

---

## 🗣️ Voice Commands

"Hey Jarvis" listens by default the moment the dashboard loads — no setup needed. Say the wake phrase alone and JARVIS greets you back instantly; say it followed by a request and JARVIS acts on it directly. Phrasing is forgiving (filler words, "please," minor mis-transcriptions like "you tube" all still match).

### Open a site
| Say | Opens |
|---|---|
| "Hey Jarvis, open YouTube" | `youtube.com` |
| "Hey Jarvis, open Entertainment" | `streamex.net` |
| "Hey Jarvis, open TikTok" | `tiktok.com` |
| "Hey Jarvis, open GitHub" | `github.com` |
| "Hey Jarvis, open Claude" | `claude.ai/new` |

JARVIS opens the site in a new tab and also shows an on-screen "TAP HERE IF IT DID NOT OPEN" link, since browsers can silently block a tab opened from a voice command.

### Read the sidebar
Answered instantly from the live dashboard readouts — no AI provider required:

| Say | Reads from |
|---|---|
| "Hey Jarvis, what is the temperature in McKinney Texas" | TEMPERATURE panel (live McKinney, TX weather) |
| "Hey Jarvis, what's the power level" | POWER LEVEL panel |
| "Hey Jarvis, what's the CPU load" | CPU LOAD panel |
| "Hey Jarvis, what's the memory usage" | MEMORY panel |
| "Hey Jarvis, what protocols are active" | ACTIVE PROTOCOLS panel |
| "Hey Jarvis, any alerts?" | ALERTS panel (most recent) |
| "Hey Jarvis, what is the time" | LOCAL TIME panel |
| "Hey Jarvis, what's the date" | date display |
| "Hey Jarvis, what's the uptime" | UPTIME panel |
| "Hey Jarvis, what's the network status" | NETWORK panel |
| "Hey Jarvis, what's my ping/download/upload speed" | last stored speed test result (or says none has run yet) |
| "Hey Jarvis, status report" | reads back everything above in one summary |

### Run the speed test
| Say | Behavior |
|---|---|
| "Hey Jarvis, do a speed test" (or "run"/"start"/"perform") | Actually triggers the real speed test, then reads back the fresh ping/download/upload results |

Anything more open-ended that isn't covered by the patterns above is sent to your configured AI provider, which also receives a live snapshot of the same sidebar readouts so it can answer accurately.

---

## 🤖 AI Chat Setup

The chat panel needs an AI provider to hold a real conversation. Open the chat panel (**VOICE CHAT**), click the gear icon, and pick a provider:

| Provider | API Key from | Base URL | Example model |
|----------|--------------|----------|----------------|
| **OpenAI** | [platform.openai.com](https://platform.openai.com/api-keys) | `https://api.openai.com/v1` (auto-filled) | `gpt-4o-mini` |
| **Groq** | [console.groq.com](https://console.groq.com/keys) | `https://api.groq.com/openai/v1` (auto-filled) | `llama-3.3-70b-versatile` |
| **Google Gemini** | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | not needed — Gemini uses its own endpoint automatically | `gemini-2.0-flash` |
| **Custom** | your own OpenAI-compatible server/proxy | whatever you run | whatever you host |

Selecting a provider auto-fills the base URL and a suggested model; the Base URL field hides itself for Gemini since it isn't used. Enter your API key and click **SAVE**.

Under the hood, OpenAI/Groq/Custom all go through the same OpenAI-compatible `chat/completions` request format. Gemini is wired up separately since Google's API has a different shape (`generateContent`, `contents`/`parts` instead of `messages`, and the key passed as a query parameter instead of a Bearer header) — the app picks the right request format automatically based on the provider you choose.

Your settings are written to `localStorage` under `jarvis_ai_settings_v1` and used only for requests to the selected provider. Click **CLEAR KEY** at any time to remove them from your browser.

**Note on security**: because this project has no server, the API key is used directly from the browser. This is fine for personal/local use, but do not deploy a publicly shared instance with a key baked in — anyone visiting the page could read it from local storage or network requests. For a shared deployment, put a small proxy server in front of your AI provider instead of entering a key that others could see.

### Premium Voice (optional)

By default JARVIS speaks with your browser's built-in voice. For a warmer, studio-quality voice, connect a premium TTS provider in the same settings modal:

| Provider | API Key from | Voice field |
|----------|--------------|-------------|
| **OpenAI TTS** | [platform.openai.com](https://platform.openai.com/api-keys) | voice name, e.g. `onyx` |
| **ElevenLabs** | [elevenlabs.io](https://elevenlabs.io/) | your voice ID |

Click **PREVIEW VOICE** to hear a sample before saving. If the premium voice ever fails (bad key, network error), JARVIS automatically falls back to the browser voice and surfaces the error in the chat panel instead of silently failing. Fixed, instant replies — the "Hey Jarvis" wake-word greeting and the direct sidebar-readout answers — always use the fast browser voice regardless of this setting, since they don't need to wait on a network round trip.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `E` | Exit to landing page |
| `R` | Reset dashboard metrics |
| `S` | Toggle sidebar visibility |
| `F` | Toggle fullscreen |

---

## 🌡️ Live Temperature

The TEMPERATURE panel shows the real current temperature for McKinney, TX — refreshed every 10 minutes — instead of a simulated value. `weather.com` can't be fetched directly from client-side JavaScript (no CORS headers for cross-origin requests, and scraping its HTML would violate its terms of use), so this pulls the same real-world reading from [Open-Meteo](https://open-meteo.com/), a free, no-API-key, CORS-enabled forecast API built for exactly this kind of client-side use.

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
- Live temperature powered by [Open-Meteo](https://open-meteo.com/)
