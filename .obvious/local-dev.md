# Local Development — attack-of-the-cones

Reproducible setup for a fresh checkout. Verified on Node v20.20.2 / npm 10.8.2
(no `.nvmrc` is committed; any current Node 20 LTS should behave the same).

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
npm test          # vitest (single run in non-interactive shells)
```

Current state (this wave): vitest is configured in `vite.config.ts` (jsdom
environment) but `jsdom` is not installed and there are no test files, so the
command fails today with `MISSING DEPENDENCY 'jsdom'`. A parallel unit on this
wave is repairing the test runner and adding tests; treat the test gate as
"arriving" until that lands.

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
