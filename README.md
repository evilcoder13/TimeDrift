# TimeDrift ⏳

> **"Ink on warm paper, breathing slowly"**  
> A tranquil, meditative web application combining animated SVG line-art scenes with seamless looping generative acoustics, timed to bring presence and stillness.

[![Next.js 15](https://img.shields.io/badge/Next.js-15_App_Router-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict_Mode-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-Washi_Theme-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg)](LICENSE)

---

## ✨ Features

- 🌿 **Meditative Audiovisual Pairing**: Handcrafted and AI-generated line-art scenes matched with acoustic and ambient soundscapes based on 12 curated feeling tags (`#calm`, `#focus`, `#peaceful`, `#rainy`, `#night`, `#morning`...).
- ⏳ **Customizable Timer Engine**: Free sessions from 3 to 15 minutes; extended sessions up to 720 minutes (12 hours) with serene fade-outs.
- 🧘 **Immersive Receding Chrome**: Controls and pointer gently recede to `opacity: 0` after 4 seconds of inactivity, leaving only pure art and sound.
- 🎨 **Adaptive Diurnal Palette**: Smooth day-to-night transitions—from warm washi rice paper (`#F7F4EE`) to deep sumi ink night charcoal (`#161822`) with warm lantern accents.
- 🎧 **Gapless Web Audio Engine**: Dual-buffer audio looper with 4.0s equal-power crossfades, BS.1770 -16 LUFS loudness normalization, and a gentle 10.0s fade-out upon timer expiration.
- 🛡️ **Isolated Sandboxed Canvas**: Untrusted generated scene scripts execute strictly inside a sandboxed iframe (`sandbox="allow-scripts"` without same-origin) governed by strict Content Security Policies.
- 🌐 **Full Bilingual Support (EN & VI)**: 100% key parity with unhurried, poetic Vietnamese phrasing and typography optimized for Vietnamese diacritics via Fraunces & Inter.
- 📱 **Installable PWA**: Offline-ready app shell precached with responsive center-third framing ($X \in [640, 1280]$) for 9:16 mobile viewports.
- 🛠️ **Admin Studio Cockpit**:
  - **Music Studio**: Generate acoustic loops via MusicGen-small on CPU, inspect loop seams, and normalize loudness.
  - **Scene Studio**: Generate and edit line-art scenes with real-time Day/Night $\tau$ scrubbers and mobile safe-zone overlays.
  - **Template Builder**: Automated pairing with Jaccard tag similarity scoring.

---

## 🏗️ Architecture

```
                                  ┌─────────────────────────────┐
                                  │      Client Browser         │
                                  │ (Next.js PWA / Web Audio)   │
                                  └──────────────┬──────────────┘
                                                 │
                                                 │ postMessage RPC
                                                 ▼
┌─────────────────────────────┐   HTTP API       ┌─────────────────────────────┐
│    Admin Studio Cockpit     ├─────────────────►│   Sandboxed Scene Host      │
│ (Prompt, Audition, Scrubber)│                  │  (public/scene-host.html)   │
└──────────────┬──────────────┘                  └─────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                            Next.js 15 Backend                                │
│  - Rules Engine (R1–R12)      - Auth.js v5 (Magic Link / Google OAuth)      │
│  - DB Serial Job Runner        - Multi-stage Scene Validator (AST + esbuild)  │
└──────────────┬─────────────────────────┬─────────────────────────────────────┘
               │                         │
               ▼                         ▼
┌─────────────────────────────┐   ┌─────────────────────────────┐
│  Python MusicGen Worker     │   │  Local LLM Worker (llama.cpp)│
│  (:8100 FastAPI / CPU torch)│   │  (:8000 / Qwen2.5-Coder GGUF│
└─────────────────────────────┘   └─────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: $\ge 22.18$
- **Python**: $\ge 3.11$ (for local MusicGen and LLM workers)
- **SQLite3**: $\ge 3.40$
- **ffmpeg** (for audio processing)

### Option A: Local Development from Terminal (No Docker required)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/evilcoder13/TimeDrift.git
   cd TimeDrift
   ```

2. **Install Node dependencies & setup database:**
   ```bash
   npm install && npx playwright install chromium
   cp .env.example .env
   npx prisma migrate dev --name init
   npm run seed
   ```

3. **Start the background AI workers:**
   - **Terminal 1 (MusicGen Worker on :8100):**
     ```bash
     cd worker/music && ./run.sh
     ```
   - **Terminal 2 (Lightweight llama.cpp LLM Worker on :8000):**
     ```bash
     cd worker/llm && ./run.sh
     ```

4. **Start Web Application (port 3000):**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### Option B: Fully Offline Local AI Stack via Docker

Run the entire suite (Next.js Web + Python MusicGen Worker + Local llama.cpp LLM Worker) inside an isolated Docker network:

```bash
docker compose -f docker-compose.local-ai.yml up -d
```
All three components run locally on your machine with persistent storage volumes and zero external network calls.

---

## 🧪 Testing & Verification

TimeDrift comes with an exhaustive test suite covering business rules, generative pipelines, and end-to-end user journeys:

```bash
# Typecheck
npm run typecheck

# Unit & Server Business Rules Tests (Vitest - 61 tests)
npm run test

# Python Music Worker Tests (Pytest)
cd worker/music && pytest

# Playwright E2E & Accessibility Suite (E1–E10)
npm run e2e
```

---

## 🙏 Acknowledgements & Credits

TimeDrift is built upon the wonderful work of the open-source community:

- **[line-art-animation](https://github.com/JDhruv14/line-art-animation)** by [@JDhruv14](https://github.com/JDhruv14): The elegant mathematical foundations for SVG stroke kinematics, minimum-jerk curves, and organic gait simulation that power TimeDrift's visual soul.
- **[llama.cpp](https://github.com/ggerganov/llama.cpp)** & **[llama-cpp-python](https://github.com/abetlen/llama-cpp-python)**: Blazing-fast, ultra-low-memory local LLM inference on CPU and Apple Silicon.
- **[Qwen2.5-Coder](https://github.com/QwenLM/Qwen2.5-Coder)** by Alibaba Cloud: High-precision compact coding LLM for procedural line-art scene code synthesis.
- **[Meta AI MusicGen](https://github.com/facebookresearch/audiocraft)** (`facebook/musicgen-small`): For state-of-the-art controllable acoustic generation on CPU.
- **[Next.js](https://nextjs.org/)** by Vercel: The React Framework for the Web.
- **[Tailwind CSS](https://tailwindcss.com/)**: For the utility-first CSS styling engine.
- **[Prisma](https://www.prisma.io/)**: Next-generation Node.js and TypeScript ORM for SQLite.
- **[Auth.js](https://authjs.dev/)** (NextAuth.js): Flexible authentication for the modern web.
- **[next-intl](https://next-intl-docs.vercel.app/)**: Thoughtful internationalization for Next.js App Router.
- **[pyloudnorm](https://github.com/csteinmetz1/pyloudnorm)**: Precise ITU-R BS.1770-4 audio loudness normalization.
- **[Fraunces Font](https://github.com/undercasetype/Fraunces)** & **[Inter Font](https://github.com/rsms/inter)**: Typography that brings warmth, character, and flawless Vietnamese diacritics.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
