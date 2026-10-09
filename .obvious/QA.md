# QA — attack-of-the-cones

What quality assurance exists, what can be verified headlessly today, and what
cannot. Proof results below were captured on Node v20.20.2 against commit
`62e3c61` (main) on 2026-10-09.

## Verifiable headlessly today

| Check | Command | Status @ 62e3c61 |
|---|---|---|
| Typecheck | `npm run typecheck` | ✅ passes |
| Lint (0 warnings allowed) | `npm run lint` | ✅ passes |
| Production build | `npm run build` | ✅ passes (dist: 498.61 kB JS / 8.87 kB HTML) |

`npm ci` note: on this repo's pre-provisioned sandbox the existing
`node_modules` is root-owned, so `npm ci` hits `EACCES` when it tries to replace
it. On any normal fresh clone `npm ci` works as documented in
`.obvious/local-dev.md`; the typecheck/lint/build results above were produced
with the lockfile-consistent installed tree (vite 5.4.21, vitest 1.6.1, three
0.160.1).

## Automated tests — arriving

`npm test` (vitest, jsdom environment configured in `vite.config.ts`) does not
run today: `jsdom` is not installed and there are no test files, so vitest exits
with `MISSING DEPENDENCY 'jsdom'`. A parallel unit on this wave is repairing the
test runner and adding tests; when that lands, update this section.

## Boundary: the game runtime itself

The 3D runtime — WebGL rendering via Three.js, the requestAnimationFrame loop,
keyboard input, collision feel, camera follow, cone animations, HUD refresh —
requires a real browser and cannot be verified headlessly here. Manual smoke
path for a human or browser-automation session:

1. `npm run dev` → http://localhost:3000 opens automatically.
2. Start menu shows "Play Normal Mode" / "Play Daniel Mode" buttons.
3. Pick a mode → HUD appears (speed / distance / time / cones hit / cones missed / score).
4. Drive with WASD or arrows: W accelerates, S brakes/reverses, A/D steer
   (steering strength scales with forward speed).
5. Normal mode: a near miss shows "Near miss!" (+5); hitting a cone shows a red
   "-10 points" message. Daniel mode: hits show a green "+3 points" message.
6. Hit cones turn grey, fly off with spin, and are removed ~3 s later; near-miss
   cones flash white and shake.
7. `?debug=1` query param shows the FPS / draw-calls / triangles overlay.

What a smoke pass cannot establish here: sustained frame rate on target
hardware, mobile/touch behavior (Product.md aspirations — no touch controls are
implemented), and long-session memory behavior.

## Deployment

Vercel builds and hosts the demo (`vercel.json`, GitHub integration):
https://attack-of-the-cones.vercel.app — verified live (HTTP 200, page title
"Attack of Cones") on 2026-10-09.
