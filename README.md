# Flying Kitty: Find Cloudy ☁️

A 3D search game: fly Kitty around the sky and find Cloudy, who is hiding
behind one of 100 clouds — before the 10-minute timer runs out!

Built with Babylon.js + TypeScript + Vite, installable as a PWA (iPad /
Android, landscape). Spec and design decisions live in `docs/spec.md`.

## How to play

- **Move**: arrow keys / WASD, or press-and-drag on a touch screen
- **Peek into a cloud**: fly close until it glows, then press SPACE or tap it
- Score starts at 9999 and drops 5 for every peek plus 5 per second that
  ticks by (floor is 1) — checked clouds turn gray but can still be
  (pointlessly) re-checked
- Find Cloudy before 10:00 runs out or she's lost in the clouds forever!
  The timer turns red for the final minute.
- Wins land on a local top-10 leaderboard (stored in localStorage) shown on
  the game-over screen; enter your name on the start screen — it's remembered
  for next time.

## Commands

```bash
npm install
npm run dev        # play at http://localhost:5173
npm run build      # type-check + production build + PWA service worker
npm run preview    # serve the production build
node scripts/smoke.mjs   # headless end-to-end smoke test (needs `npm run preview` running)
```

## Deploying to GitHub Pages

Push to `main` and `.github/workflows/deploy.yml` builds and publishes the
game automatically. One-time setup: in the repo settings, set
**Settings → Pages → Source** to **GitHub Actions**.

The workflow sets `BASE_PATH=/<repo-name>/` so the build works at
`https://<user>.github.io/<repo-name>/` regardless of the repo name. To test
that build locally:

```bash
BASE_PATH=/Cloudy/ npm run build
BASE_PATH=/Cloudy/ npm run preview   # http://localhost:4173/Cloudy/
node scripts/offline-test.mjs        # verifies the PWA works fully offline
```

The service worker precaches every asset (sprites, icons, JS, manifest), so
once the game is opened — or added to a home screen on iPad/Android — it
runs completely offline.

## Debug mode

Add `?debug=1` to the URL (or build with `VITE_DEBUG=1`) to outline the
winning cloud in red and expose `window.cloudyGame` for poking at the game.
