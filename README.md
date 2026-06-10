# Flying Kitty: Find Cloudy ☁️

A 3D search game: fly Kitty around the sky and find Cloudy, who is hiding
behind one of 40 clouds — before the 10-minute timer runs out!

Built with Babylon.js + TypeScript + Vite, installable as a PWA (iPad /
Android, landscape). Spec and design decisions live in `docs/spec.md`.

## How to play

- **Move**: arrow keys / WASD, or press-and-drag on a touch screen
- **Peek into a cloud**: fly close until it glows, then press SPACE or tap it
- Score starts at 9999 and drops 5 for every peek (floor is 1) — checked
  clouds turn gray but can still be (pointlessly) re-checked
- Find Cloudy before 10:00 runs out or she's lost in the clouds forever!

## Commands

```bash
npm install
npm run dev        # play at http://localhost:5173
npm run build      # type-check + production build + PWA service worker
npm run preview    # serve the production build
node scripts/smoke.mjs   # headless end-to-end smoke test (needs `npm run preview` running)
```

## Debug mode

Add `?debug=1` to the URL (or build with `VITE_DEBUG=1`) to outline the
winning cloud in red and expose `window.cloudyGame` for poking at the game.
