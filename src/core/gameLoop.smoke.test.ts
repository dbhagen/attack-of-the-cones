import { afterEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { DifficultyManager } from './DifficultyManager';
import { RoadGenerator } from './RoadGenerator';
import { ObstacleManager } from './ObstacleManager';

describe('headless game-loop smoke test', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('runs entry -> logic -> output: difficulty ramp, road chaining, cone spawning, collision, scoring, cleanup', () => {
    // Entry: tick inputs (seconds elapsed, distance driven) and a car position.
    // Logic: the same three managers the Game loop drives, with no rendering.
    // Output: observable segment/cone/score state at every stage.
    //
    // Note: the manager contract takes the distance driven THIS tick; Game.ts
    // currently feeds it a cumulative total (reported separately as a suspected
    // defect). The smoke test exercises the intended per-tick contract.

    // Cone labels touch document; stub the two calls they make (no jsdom needed).
    vi.stubGlobal('document', {
      createElement: () => ({ className: '', textContent: '' }),
      getElementById: () => null,
    });
    // Deterministic world: every spawn makes exactly one cone at the segment
    // start point with the road-edge offset; road curves always bend left.
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const difficultyManager = new DifficultyManager();
    const roadGenerator = new RoadGenerator();
    const obstacleManager = new ObstacleManager();
    const scene = new THREE.Scene();

    const carPosition = new THREE.Vector3(0, 0.4, 0);
    const ticks = 10;
    const secondsPerTick = 5;

    for (let i = 0; i < ticks; i++) {
      difficultyManager.update(secondsPerTick, 20);
      const difficulty = difficultyManager.getCurrentDifficulty();

      const segment = roadGenerator.generateSegment(difficulty);
      scene.add(segment.mesh);
      obstacleManager.generateConesForSegment(segment, difficulty.curveIntensity, scene);

      carPosition.z = segment.endZ;
      obstacleManager.removeConesBehind(carPosition.z, scene);
    }

    // Difficulty has moved off its easiest settings after 50s / 200 units.
    const ramped = difficultyManager.getCurrentDifficulty();
    expect(ramped.curveIntensity).toBeGreaterThan(0.2);
    expect(ramped.roadWidth).toBeLessThan(3);

    // Road: 10 chained segments, each exactly 20 units toward -Z, ids in order.
    const segments = roadGenerator.getActiveSegments();
    expect(segments).toHaveLength(ticks);
    segments.forEach((segment, i) => {
      expect(segment.id).toBe(i);
      expect(segment.endZ - segment.startZ).toBe(-20);
      if (i > 0) {
        expect(segment.startZ).toBe(segments[i - 1].endZ);
      }
    });

    // Cones: the first tick is inside the spawn spacing, the other nine each
    // spawn one cone; the cleanup horizon keeps only the newest one.
    const cones = obstacleManager.getCones();
    expect(cones).toHaveLength(1);
    expect(cones[0].position.z).toBe(-180);
    expect(cones[0].isHit).toBe(false);

    // Collision: drive into the remaining cone and the hit registers.
    const result = obstacleManager.checkCollisions(
      cones[0].position.clone(),
      0.5,
      new THREE.Vector3(0, 0, -20)
    );
    expect(result.coneHit).toBe(cones[0]);
    expect(cones[0].isHit).toBe(true);

    // Score: daniel mode counts the hit, normal mode does not.
    expect(obstacleManager.getScore('daniel')).toBe(1);
    expect(obstacleManager.getScore('normal')).toBe(0);
    expect(obstacleManager.getNearMissCount()).toBe(0);

    // Output surface: 10 road meshes plus the one surviving cone.
    expect(scene.children).toHaveLength(ticks + 1);

    // Restart: everything returns to a fresh state.
    obstacleManager.reset();
    roadGenerator.reset();
    difficultyManager.reset();
    expect(obstacleManager.getCones()).toHaveLength(0);
    expect(roadGenerator.getActiveSegments()).toHaveLength(0);
    expect(difficultyManager.getTimePlayed()).toBe(0);
    expect(difficultyManager.getCurrentDifficulty().curveIntensity).toBeCloseTo(0.2);
  });
});
