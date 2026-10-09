# Orientation — attack-of-the-cones

Codebase map for agents. Everything below is from direct reads of the source at
commit `62e3c61` (main, 2026-10-09). Line numbers refer to that commit.

## Runtime architecture

Entry: `index.html` → `src/main.ts` → `new Game()` (`src/core/Game.ts`).

```
main.ts (DOMContentLoaded)
└── Game
    ├── owns scene / camera / renderer / clock (Game.ts:78-110)
    ├── input: window keydown/keyup → Set of e.key.toLowerCase() (Game.ts:169-177)
    ├── update loop, per frame while isPlaying (Game.ts:270-316):
    │   ├── handleInput → Car.applyForce (W/S) + direct X translation (A/D) (Game.ts:438-478)
    │   ├── Car.update — friction, velocity integration, speed clamp (Car.ts:95-137)
    │   ├── DifficultyManager.update — time+distance progress (DifficultyManager.ts:33-36)
    │   ├── manageRoadSegments — recycle segments behind, spawn ahead (Game.ts:605-648)
    │   ├── checkOnRoad — speed multiplier 1.5 on road / 0.5 off (Game.ts:480-529)
    │   ├── checkWorldCollisions — invisible side walls (Game.ts:531-559)
    │   ├── updateCones — fly/shake animations, dispose hit cones after 3 s (Game.ts:318-337)
    │   ├── checkConeCollisions — hit/near-miss scoring (Game.ts:339-364)
    │   └── updateCameraFollow — lagged Z follow, ≤10° look-at tilt (Game.ts:561-589)
    └── render: renderer.render + cone-label projection + HUD refresh (Game.ts:682-747)
```

## Modules

| File | Responsibility |
|---|---|
| `src/main.ts` | Bootstrap: create Game, hide loader, `?debug=1` overlay, HMR stub |
| `src/core/Game.ts` | Orchestrator: scene, input, loop, modes, scoring, camera, HUD |
| `src/core/Car.ts` | Car mesh + physics (force, friction, speed clamp, damage tilt) |
| `src/core/Wheel.ts` | Wheel mesh, health/detach, rotation from velocity |
| `src/core/Cone.ts` | Cone mesh, commit-message label, fly/shake animations, disposal |
| `src/core/ObstacleManager.ts` | Cone spawning per segment, collision/near-miss detection |
| `src/core/RoadGenerator.ts` | Procedural spline road segments + ribbon meshes |
| `src/core/DifficultyManager.ts` | Time/distance-scaled difficulty parameters |
| `src/utils/commitMessageGenerator.ts` | Random "type: STORY-nnnn …" label strings |

## Key types

- `GameMode = 'normal' | 'daniel'` — `src/core/ObstacleManager.ts:5`
- `DifficultyConfig` — curveIntensity, curveFrequency, obstacleFrequency, roadWidth, spawnRate — `src/core/DifficultyManager.ts:1-7`
- `RoadSegment` — mesh, CatmullRomCurve3 curve, startZ/endZ, width, id — `src/core/RoadGenerator.ts:4-11`
- `CarConfig` — wheel + chassis dimensions — `src/core/Car.ts:4-11`
- `WheelPosition` — FRONT_LEFT / FRONT_RIGHT / REAR_LEFT / REAR_RIGHT — `src/core/Wheel.ts:3-8`

## UI ↔ code contract (index.html IDs used by Game.ts)

`#app`, `#loading`, `#game-title`, `#start-menu`, `#start-normal`, `#start-daniel`,
`#back-button`, `#cone-labels`, `#near-miss-message`, `#cone-hit-message`,
`#debug-overlay` (+#fps, #draw-calls, #triangles), `#hud-overlay` (+#hud-speed,
#hud-distance, #hud-time, #hud-cones-hit, #hud-cones-missed, #hud-score).
Mode buttons are wired in the `Game` constructor (`Game.ts:140-155`).

## Scoring model (as implemented)

- Cone hit: Normal −10 (`Game.ts:354`), Daniel +3 (`Game.ts:352`)
- Near miss (either mode): +5 (`Game.ts:361`); detection band = hit distance + 0.6 (`ObstacleManager.ts:61-62`)
- Normal mode only: +10 per currently-unhit cone behind the car (`Game.ts:714-717`)
- Displayed score = coneScore + nearMissBonus (+ avoided-cone bonus in Normal)

## Observations worth a behavior test (code reads, not runtime-verified)

- The avoided-cone bonus in Normal mode is recomputed live from unhit cones still
  in the manager (`Game.ts:709-717`) while cones are culled 30 units behind the
  car (`ObstacleManager.ts:87-96`), so part of the displayed score can decrease
  over time. A behavior test pinning the intended scoring semantics would settle
  whether this is a bug.
- Collision detection is a single 3D distance check with a fixed 0.8 car radius
  (`Game.ts:343`, `ObstacleManager.ts:68-74`); cone geometry/height is not considered.

## Non-code but load-bearing

- `vercel.json` — Vite framework, install/build/dev commands, output `dist`, SPA rewrites.
- `vite.config.ts` — `@` alias, dev server port 3000 + `open: true`, ES2020 build target, sourcemaps, vitest config (jsdom).
- `Product.md` — original product spec; partially aspirational (see AGENTS.md).
