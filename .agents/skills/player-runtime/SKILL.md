---
name: player-runtime
description: Implement the TimeDrift player - sandboxed scene iframe host, gapless Web Audio looping, wall-clock timer, fades, end screen (R2), wake lock, media session and playlist sequencing. Use for FE-2, FE-5, FE-7.
---
# Player Runtime

## Scene host (`public/scene-host.html`)
- Embed it as `<iframe src="/scene-host.html?bundle=/media/scenes/<id>.js" sandbox="allow-scripts">`. **Never add allow-same-origin.**
- The host page sets the CSP meta: `default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; img-src data:`.
- The host imports the bundle, calls `mount(svg, opts)`, and listens for messages:
  `{type:'pause'}|{type:'resume'}|{type:'speed',value}|{type:'destroy'}`. It reports back `{type:'ready'}` or `{type:'error',message}`.
- The parent checks `event.source === iframe.contentWindow`. The iframe has an opaque origin, so post with `'*'`.

## Audio (gapless loop)
```ts
const ctx = new AudioContext();                 // create on the first user gesture (autoplay rules)
const buf = await ctx.decodeAudioData(await (await fetch(url)).arrayBuffer());
const gain = ctx.createGain(); gain.connect(ctx.destination); gain.gain.value = 0;
const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true; src.connect(gain); src.start();
gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 3);   // 3s fade in
```

## Timer (R1/R3/R2)
- `POST /api/sessions` returns `endsAt`. Calculate the remaining time from `endsAt - Date.now()` on every tick (once per second) so it survives tab throttling.
- At the end: ramp the gain to 0 over 10s, send `pause` to the scene, show EndScreen (Replay / Random / Back). Replay creates a **new** session (no cap).

## Device integration
- Wake Lock: `navigator.wakeLock.request('screen')` while playing. Request it again on `visibilitychange`.
- Media Session: title and artwork, plus play/pause handlers.
- `prefers-reduced-motion` → send `speed 0.25`.

## Playlist sequencing (FE-7)
For each item in order: load the next bundle and audio in the background about 15s before the item ends, crossfade the audio over 3s, and swap the iframe with a 600ms opacity fade. Skip items whose content is no longer published (R12).

## Tests
Unit-test the timer with fake timers. E2E E1 mocks the clock to check that 3 minutes ends correctly.
