# Phase P2 Creative Director Sign-Off & Content Pipeline Review (DIR-3)

**Author:** Creative Director  
**Date:** 2026-11-18  
**Scope:** Phase P2 Content Pipelines (`ML-2`, `BE-4`, `BE-5`, `ML-3`, `BE-6`, `FE-3`, `DIR-3`)  
**Guiding Vision:** *"Ink on warm paper, breathing slowly"*  
**Verdict:** **APPROVED (Sign-Off Complete)**

---

## 1. Executive Summary

As Creative Director for TimeDrift, I have reviewed the design, implementation specifications, and operational workflows across all Phase P2 content generation and curation pipelines. The system rigorously embodies our guiding aesthetic: meditative, unhurried, visually restrained, and sonically soothing.

All technical invariants established across `docs/creative/CREATIVE_BRIEF.md`, `docs/ba/P2_URD.md`, and `docs/phases/P2_TARGETS.md` have been met. The automated quality gates effectively defend the brand mood before human curation, and the editorial review controls in the Admin Studio provide full oversight.

---

## 2. Audio Generation Pipeline Review (`ML-2`, `BE-5`, `AUD-2`, `AUD-3`)

### 2.1. Processing & Mastering Specifications
- **Loudness Normalization:** Integrated loudness strictly normalized to **−16.0 LUFS** ($\pm 0.5$ LUFS) via `pyloudnorm` (BS.1770-4 filter). True peak hard-capped at **−1.0 dBTP** to eliminate clipping on DACs and headphones.
- **Equal-Power Seamless Crossfade:**
  - Extra duration generated: $T + 4.0\text{s}$.
  - Final 4.0s smoothly crossfaded into initial 4.0s using equal-power $(\sin / \cos)$ curves:
    $$\text{gain}_{\text{head}}(t) = \sin\left(\frac{\pi}{2} \cdot \frac{t}{4}\right), \quad \text{gain}_{\text{tail}}(t) = \cos\left(\frac{\pi}{2} \cdot \frac{t}{4}\right)$$
  - Aligned at the nearest zero-crossing point within $\pm 50\text{ ms}$, ensuring complete elimination of DC offset pops.
  - Headphone audition check: 3 consecutive loops show inaudible seams, no volume dips, and no phase cancellation.
- **Encoding:** Ogg Vorbis quality 5 (`-q:a 5`, $\approx 80\text{ kbps}$) at 32 kHz mono. Preserves acoustic warmth while keeping streaming bandwidth minimal.
- **Duration Constraint (R10):** Strictly limited to `{30, 45, 60}` seconds.

### 2.2. Music Generation Prompt Restraint & Tag Consistency
- **Tempo Envelope:** Daytime/Focus calm restricted to 60–85 BPM; Sleep/Night textures restricted to 50–65 BPM. Max ceiling: 85 BPM.
- **Tonal Palette:** Modally resolved (Major, Lydian, Dorian, Pentatonic). Dissonance, tension drops, and abrupt key modulations are prohibited.
- **Acoustic Textures:** Soft felted piano, nylon guitar, mellow Rhodes with vinyl warmth, legato analog strings, Tibetan bowls, ambient pads, light rain/cricket foley.
- **Strict Exclusions:** Zero human vocals (no synthesized choirs, hums, or vocal chops), zero brass, zero aggressive distortion, zero heavy percussion.

---

## 3. Scene Generation & Headless Validation Review (`ML-3`, `BE-6`, `SCN-2`, `SCN-3`)

### 3.1. Composition Geometry & Canvas Framing
- **Canvas ViewBox:** Fixed `0 0 1920 1080` (16:9 widescreen landscape).
- **Mobile 9:16 Center Safe Zone:**
  - Focus region: $x \in [660, 1260]$, $y \in [0, 1080]$ (center 600px width).
  - Primary narrative subjects (e.g. seated tea drinker, glowing porch lantern, sleeping cat, lone pine) are positioned within this safe zone.
  - Peripheral margins ($x < 660, x > 1260$) are dedicated to continuous ambient washes (distant mountain silhouettes, mist, bamboo).

### 3.2. Motion Restraint & Diurnal Dynamics
- **Figure Count Limit:** $\le 6$ animated figures/elements. Prevents visual clutter.
- **Kinematic Speed:** Cycle frequencies strictly $\le 0.5\text{ Hz}$ ($\ge 2.0\text{s}$ per cycle). Walking gait speed $\le 0.6$. Swaying and breathing trajectories feel organic, not mechanical.
- **Deterministic PRNG:** Driven solely by seeded Mulberry32 (`SceneOpts.seed`), ensuring reliable reproducibility.
- **Continuous Diurnal Transitions:** Dynamic color binding against continuous $\tau \in [0, 1]$ (`daynight.ts`). Midnight transitions maintain sumi ink washes with warm amber/ochre glows (`#F2C46D` / `#C28B38`) radiating from lanterns and paper windows without light snapping or palette flashes.

### 3.3. Multi-Stage Scene Validator Pipeline (`BE-6`)
Every generated scene passes four strict automated gates prior to editorial review:
1. **Stage 1 (Syntax & Security Scan):** Extraction of code block and immediate rejection of prohibited tokens (`fetch`, `eval`, `WebSocket`, `Worker`, `localStorage`, `document.cookie`).
2. **Stage 2 (TypeScript Compilation):** Strict typechecking against `@timedrift/scene-api` and `vendor/line-art-animation/lib`.
3. **Stage 3 (Module Bundling):** Minified bundling via `esbuild` (`--format=esm --target=es2022`).
4. **Stage 4 (Headless Chromium Sandbox Verification):** 3.0-second Playwright run inside sandboxed `public/scene-host.html`:
   - Zero console errors or uncaught exceptions.
   - SVG DOM child elements $\ge 20$.
   - Frame-to-frame pixel differential $> 0$ (verifies true kinetic motion).
   - CPU JS execution time $< 900\text{ ms}$ over 3.0s runtime ($< 30\%$ single-core threshold).

---

## 4. Admin Studio UI & Template Pairing Engine (`FE-3`, `AD-1` to `AD-5`)

### 4.1. Admin Studio Workflow Experience
- **Tags Manager (`AD-1`):** Complete bilingual support (`nameEn`, `nameVi`) and kebab-case slug validation. Usage counters prevent accidental detachment.
- **Music Studio (`AD-2`):**
  - Integrated 3-loop continuous player.
  - Quick-scrub loop seam inspector jumping directly to $-5\text{s} \to +5\text{s}$ relative to loop boundary.
  - Telemetry readouts for LUFS, true peak, and sample rate.
  - R10 publish gating and R12 dependency protection modals.
- **Scene Studio (`AD-3`):**
  - Dual-pane layout: Left pane for source code editor, compilation diagnostics, and retry progress; right pane for live sandboxed iframe.
  - Interactive $\tau$ time scrubber ($0.0 \to 1.0$) for immediate daylight verification.
  - Speed multiplier controls (`0.25x`, `1.0x`, `2.0x`, `10.0x`).
  - Translucent 9:16 mobile safe zone overlay guide.
- **Template Builder (`AD-4`):**
  - Live synchronized audio + scene playback preview.
  - Automated tag pre-population based on tag intersection.
  - R8 publish guard preventing publication of templates with unpublished assets.
- **User Manager (`AD-5`):** Clean role inspection and Pro entitlement management.

### 4.2. Intelligent Template Suggestion Engine (R7)
- Computes Jaccard similarity across emotion tags:
  $$\text{Score} = \frac{|\text{scene.tags} \cap \text{music.tags}|}{|\text{scene.tags} \cup \text{music.tags}|}$$
- Primary sorting prioritizes matches sharing $\ge 2$ tags.
- Weak pairings ($< 0.2$) are collapsed by default.
- Atmospheric pairing matches validated:
  - *Rain / Night:* Soft solo piano, warm rain foley, ambient pads.
  - *Morning / Meadow:* Fingerpicked acoustic guitar, gentle Rhodes, birdsong.
  - *Twilight / Stargazing:* Evolving ambient strings, music box, ethereal pads.
  - *Tea / Study:* Gentle lo-fi hip hop with subtle vinyl crackle.

---

## 5. Creative Director Sign-Off Checklist & Verification

| Checklist Item | Standard / Constraint | Status | Notes |
|---|---|:---:|---|
| **Aesthetic Mood** | "Ink on warm paper, breathing slowly"; no tension/discordance | **PASS** | Reflected in system prompts, guidelines, and seed content. |
| **Figure & Motion Restraint** | $\le 6$ figures, cycle $\le 0.5\text{ Hz}$, gait speed $\le 0.6$ | **PASS** | Validated in headless runtime and prompt instructions. |
| **Mobile Safe Zone** | 9:16 center crop ($x \in [660, 1260]$) contains primary focal elements | **PASS** | Visual overlay provided in AD-3; specified in scene prompts. |
| **Auditory Restraint** | 50–85 BPM, no human vocals, no harsh percussion, no brass | **PASS** | Enforced by prompt templates and worker validation. |
| **Mastering Quality** | $-16.0 \pm 0.5\text{ LUFS}$, true peak $\le -1.0\text{ dBTP}$ | **PASS** | Automated `pyloudnorm` stage with Pytest suite verification. |
| **Loop Seam Inaudibility** | 4s equal-power crossfade, zero-crossing alignment, 3-loop clean | **PASS** | Crossfade algorithm and seam inspection tools verified. |
| **Diurnal Continuity** | Smooth color transitions with continuous $\tau \in [0, 1]$; warm nocturnal glow | **PASS** | Validated with `daynight.ts` integration and interactive $\tau$ scrubber. |
| **Template Pairing Integrity** | $\ge 2$ shared tags or written artistic override; atmospheric resonance | **PASS** | Jaccard scoring engine (R7) and pairing validation enforced. |
| **Bilingual Parity** | Poetic English and Vietnamese names/descriptions | **PASS** | Schema and UI enforce required `nameEn` and `nameVi`. |
| **Security & Sandbox Isolation** | Scene executes in restricted iframe sandbox with strict CSP | **PASS** | Disallows `allow-same-origin`, blocks unsafe network/storage APIs. |

---

## 6. Sign-Off Verdict

**Phase P2 Content Pipelines are hereby SIGNED OFF and APPROVED.**

All components (`ML-2`, `BE-4`, `BE-5`, `ML-3`, `BE-6`, `FE-3`, and `DIR-3`) form a cohesive, production-grade foundation for generating, validating, and curating TimeDrift content. The team may proceed with confidence to Phase P3 (User Experience & Player Implementation).
