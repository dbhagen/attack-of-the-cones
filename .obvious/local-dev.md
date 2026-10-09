# Local Development — attack-of-the-cones

Reproducible setup for a fresh checkout. Verified on Node v20.20.2 / npm 10.8.2
(no `.nvmrc` is committed; vite ^7.2.1 requires Node `^20.19.0 || >=22.12.0` —
engines field of the installed `vite` package — so Node ≥ 20.19 is required).

## Install

```bash
npm ci          # clean install from package-lock.json
# or: npm install
```

## Dev server

```bash
npm run dev
```

Vite serves on **http://localhost:3000** and opens a browser tab automatically
(`server.port: 3000`, `open: true` in `vite.config.ts`).

## Production build & preview

```bash
npm run build     # tsc && vite build → dist/
npm run preview   # serves the dist/ build locally
```

## Tests

```bash
npm test -- --run # vitest, single run (plain `npm test` watches in a TTY)
```

The suite passes: vitest 4 in the node environment (pure-logic suites need no
DOM; jsdom is intentionally not a dependency) — 5 test files / 33 tests,
including a headless entry→logic→output game-loop smoke test. Verified
2026-10-09 on Node v20.20.2 (tests via PR #15, vite ^7.2.1 / vitest ^4.0.7 via
PR #11).

## Static checks

```bash
npm run typecheck # tsc --noEmit
npm run lint      # eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
```

## Environment variables

None are required today — the game reads no configuration from the environment;
all tuning lives in source. If runtime configuration is ever introduced, keep it
in a local `.env` file that is never committed (`.env` is listed in `.gitignore`).

## Deployment

Vercel handles deployment (`vercel.json`: framework `vite`, install
`npm install`, build `npm run build`, output `dist`, SPA rewrites). Live demo:
https://attack-of-the-cones.vercel.app
