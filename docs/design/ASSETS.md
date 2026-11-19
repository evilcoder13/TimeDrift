# Visual Asset Specifications & PWA Icons (Owner: UI/UX Designer)

**Version:** 1.0.0  
**Status:** Approved for Foundation / P1 Scaffolding  
**Related Tasks:** DES-3, OPS-2, FE-1  
**Creative Brief Alignment:** [docs/creative/CREATIVE_BRIEF.md](file:///Users/daothang/Documents/Projects/TimeDrift/docs/creative/CREATIVE_BRIEF.md)

---

## 1. Brand Identity & App Icon Concept

### 1.1. Symbolic Concept: "The Drifting Water Droplet & Ink Ripple"
The TimeDrift emblem is a minimalist, single-stroke sumi ink water drop descending into concentric ripples, symbolizing both a slow-falling pendulum of time and a rain droplet creating infinite peaceful circles on still water.

- **Stroke Aesthetic:** Variable brush width (1.5px to 3.0px vector paths), hand-drawn tapering.
- **Palette Representation:**
  - *Light / Day Canvas:* Sumi Charcoal `#2B2A28` ink drop on warm handmade paper `#F4EFE6`.
  - *Dark / Night Canvas:* Luminous ivory `#EDE9DF` drop with an internal warm amber core `#F2C46D` against midnight wash `#161822`.

---

## 2. Icon & PWA Asset Inventory

All icons must be generated and stored under `public/icons/` and `public/` during asset preparation.

| File Path | Dimensions | Purpose | Maskable / Padding | Format |
|---|---|---|---|---|
| `public/favicon.ico` | 32 × 32, 16 × 16 | Browser tab favicon | Standard | `.ico` |
| `public/favicon.svg` | Scalable Vector | Modern SVG favicon with dark/light mode CSS | Scalable | `.svg` |
| `public/apple-touch-icon.png` | 180 × 180 | iOS Home Screen bookmark | 10% outer safe margin | `.png` |
| `public/icons/icon-192.png` | 192 × 192 | PWA standard icon (Android / Chrome) | Standard | `.png` |
| `public/icons/icon-512.png` | 512 × 512 | PWA high-res display & app stores | Standard | `.png` |
| `public/icons/maskable-512.png` | 512 × 512 | Android adaptive icon (safe zone circle 80%) | Safe zone: 410px diameter center | `.png` |
| `public/icons/badge-72.png` | 72 × 72 | Web push / media notification badge | Monochromatic silhouette | `.png` |

---

## 3. Web App Manifest Specification (`public/manifest.json`)

```json
{
  "name": "TimeDrift — Drift into Stillness",
  "short_name": "TimeDrift",
  "description": "Animated line-art scenes and looping acoustic melodies played on a gentle timer.",
  "start_url": "/",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#F4EFE6",
  "theme_color": "#F4EFE6",
  "categories": ["lifestyle", "relaxation", "music", "productivity"],
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icons/maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

---

## 4. SVG Vector Icon Master Source (`public/favicon.svg`)

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="100%" height="100%">
  <defs>
    <style>
      :root {
        --icon-bg: #F4EFE6;
        --icon-ink: #2B2A28;
        --icon-glow: #C28B38;
      }
      @media (prefers-color-scheme: dark) {
        :root {
          --icon-bg: #161822;
          --icon-ink: #EDE9DF;
          --icon-glow: #F2C46D;
        }
      }
      .bg { fill: var(--icon-bg); }
      .stroke-ink {
        stroke: var(--icon-ink);
        fill: none;
        stroke-width: 2.2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .glow-dot {
        fill: var(--icon-glow);
      }
    </style>
  </defs>
  
  <!-- Canvas Background -->
  <rect width="64" height="64" rx="14" class="bg" />

  <!-- Outer Ripple (Fading Time Horizon) -->
  <ellipse cx="32" cy="42" rx="20" ry="7" class="stroke-ink" stroke-opacity="0.3" stroke-dasharray="1 3" />
  
  <!-- Middle Ripple -->
  <ellipse cx="32" cy="42" rx="13" ry="4.5" class="stroke-ink" stroke-opacity="0.6" />

  <!-- Inner Ripple Point of Contact -->
  <ellipse cx="32" cy="42" rx="6" ry="2" class="stroke-ink" />

  <!-- Drifting Droplet / Hourglass Center Line -->
  <path d="M32 18 C32 18, 27 28, 27 34 C27 37 29.2 39 32 39 C34.8 39 37 37 37 34 C37 28 32 18 32 18 Z" class="stroke-ink" />

  <!-- Ambient Golden Glow Core (The Still Moment) -->
  <circle cx="32" cy="33" r="2.2" class="glow-dot" />
</svg>
```

---

## 5. System UI Empty & Fallback States

Empty states utilize minimalist line-art illustrations drawn with 1.5px ink strokes:

1. **Empty Templates State (`EmptySanctuary.svg`):**
   - Depiction: An empty wooden chair beside a rain-streaked window sill with a single drifting leaf.
   - Accompanying Copy:
     - EN: "The sanctuary is still. No spaces have been created yet."
     - VI: "Không gian đang tĩnh lặng. Chưa có hoạt cảnh nào được lưu."
2. **Offline Fallback State (`OfflineTea.svg`):**
   - Depiction: A warm teacup resting on an open book, steam gently curling upwards.
   - Accompanying Copy:
     - EN: "You are drifting offline. Ambient sounds will gently continue."
     - VI: "Bạn đang ngoại tuyến. Giai điệu mộc mạc vẫn sẽ tiếp tục nâng niu bạn."
3. **Audio Blocked / Autoplay Guard (`TapToBreathe.svg`):**
   - Depiction: Soft concentric rippling circle inviting a touch.
   - Accompanying Copy:
     - EN: "Tap anywhere to begin your drift."
     - VI: "Chạm nhẹ để bắt đầu hành trình tĩnh lặng."
