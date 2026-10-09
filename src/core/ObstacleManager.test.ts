import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { ObstacleManager } from './ObstacleManager';
import type { Cone } from './Cone';
import type { RoadSegment } from './RoadGenerator';

// Cone builds an HTML label in its constructor and removes it in dispose().
// The two document calls that label logic makes are stubbed here instead of
// pulling jsdom into devDependencies: collision state, scoring, and the real
// three.js geometry/materials all run for real.
function stubConeLabelDom(): void {
  vi.stubGlobal('document', {
    createElement: () => ({ className: '', textContent: '' }),
    getElementById: () => null,
  });
}

function makeStraightSegment(startZ: number, id = 0, width = 3): RoadSegment {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i < 5; i++) {
    points.push(new THREE.Vector3(0, 0, startZ - (i * 20) / 4));
  }
  return {
    mesh: new THREE.Mesh(),
    curve: new THREE.CatmullRomCurve3(points),
    startZ,
    endZ: startZ - 20,
    width,
    id,
  };
}

describe('ObstacleManager', () => {
  let scene: THREE.Scene;
  let manager: ObstacleManager;

  beforeEach(() => {
    stubConeLabelDom();
    scene = new THREE.Scene();
    manager = new ObstacleManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // Deterministic spawn: with Math.random pinned to 0, a generating segment
  // produces exactly one cone at the segment start point, offset by
  // (0 - 0.5) * width on x.
  function spawnOneConeAt(startZ: number, difficulty = 0): Cone {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    manager.generateConesForSegment(makeStraightSegment(startZ), difficulty, scene);
    vi.restoreAllMocks();
    return manager.getCones()[0];
  }

  describe('generateConesForSegment', () => {
    it('does not spawn until a segment is a full spacing interval past the last cone', () => {
      // difficulty 0 => spacing 15; the cursor starts at z=0, so a segment
      // starting at -10 is too close, one at -20 clears the gate.
      manager.generateConesForSegment(makeStraightSegment(-10), 0, scene);

      expect(manager.getCones()).toHaveLength(0);
      expect(scene.children).toHaveLength(0);

      manager.generateConesForSegment(makeStraightSegment(-20), 0, scene);

      expect(manager.getCones()).toHaveLength(1);
      expect(scene.children).toHaveLength(1);
    });

    it('advances the spawn cursor so following segments must clear the spacing again', () => {
      spawnOneConeAt(-20);

      // -30 is only 10 past the cone spawned at -20: inside the spacing of 15.
      manager.generateConesForSegment(makeStraightSegment(-30), 0, scene);
      expect(manager.getCones()).toHaveLength(1);

      // -40 is 20 past -20: spawns even though nothing else changed.
      manager.generateConesForSegment(makeStraightSegment(-40), 0, scene);
      expect(manager.getCones()).toHaveLength(2);
    });

    it('spawns more often as difficulty rises', () => {
      const easyScene = new THREE.Scene();
      const hardScene = new THREE.Scene();
      const easyManager = new ObstacleManager();
      const hardManager = new ObstacleManager();
      vi.spyOn(Math, 'random').mockReturnValue(0);

      // spacing: 15 at difficulty 0, 5 at difficulty 1
      easyManager.generateConesForSegment(makeStraightSegment(-20), 0, easyScene);
      hardManager.generateConesForSegment(makeStraightSegment(-20), 1, hardScene);
      easyManager.generateConesForSegment(makeStraightSegment(-30), 0, easyScene);
      hardManager.generateConesForSegment(makeStraightSegment(-30), 1, hardScene);

      // -30 is 10 past -20: inside easy spacing (15), outside hard spacing (5).
      expect(easyManager.getCones()).toHaveLength(1);
      expect(hardManager.getCones()).toHaveLength(2);
    });

    it('places cones on the road surface inside the segment bounds', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.2); // offset (0.2 - 0.5) * 3 = -0.9

      const segment = makeStraightSegment(-20);
      manager.generateConesForSegment(segment, 0, scene);

      const cone = manager.getCones()[0];
      expect(Math.abs(cone.position.x)).toBeLessThanOrEqual(segment.width / 2 + 1e-9);
      expect(cone.position.y).toBeGreaterThan(0); // standing on the road, not sunk in
      expect(cone.position.z).toBeGreaterThanOrEqual(segment.endZ - 1e-9);
      expect(cone.position.z).toBeLessThanOrEqual(segment.startZ + 1e-9);
      expect(scene.children).toContain(cone.mesh);
    });
  });

  describe('checkCollisions', () => {
    it('reports nothing when the car is far from every cone', () => {
      const cone = spawnOneConeAt(-20);

      const result = manager.checkCollisions(
        cone.position.clone().add(new THREE.Vector3(10, 0, 0)),
        0.5
      );

      expect(result.coneHit).toBeUndefined();
      expect(result.nearMiss).toBeUndefined();
      expect(cone.isHit).toBe(false);
      expect(cone.wasNearMiss).toBe(false);
    });

    it('registers a direct hit when the car overlaps a cone and marks it', () => {
      const cone = spawnOneConeAt(-20);

      const result = manager.checkCollisions(
        cone.position.clone(),
        0.5,
        new THREE.Vector3(0, 0, -20)
      );

      expect(result.coneHit).toBe(cone);
      expect(cone.isHit).toBe(true);
    });

    it('does not re-report a cone that is already hit', () => {
      const cone = spawnOneConeAt(-20);
      manager.checkCollisions(cone.position.clone(), 0.5);

      const secondPass = manager.checkCollisions(cone.position.clone(), 0.5);

      expect(secondPass.coneHit).toBeUndefined();
      expect(secondPass.nearMiss).toBeUndefined();
    });

    it('marks a near miss once, without counting it as a hit', () => {
      const cone = spawnOneConeAt(-20);
      // hit range is carRadius + 0.8 = 1.3; near-miss range is 1.9; 1.6 sits between.
      const carPosition = cone.position.clone().add(new THREE.Vector3(1.6, 0, 0));

      const result = manager.checkCollisions(carPosition, 0.5);

      expect(result.nearMiss).toBe(cone);
      expect(result.coneHit).toBeUndefined();
      expect(cone.wasNearMiss).toBe(true);
      expect(cone.isHit).toBe(false);

      const secondPass = manager.checkCollisions(carPosition, 0.5);
      expect(secondPass.nearMiss).toBeUndefined(); // not re-marked
      expect(manager.getNearMissCount()).toBe(1);
    });

    it('ignores cones beyond the near-miss range', () => {
      const cone = spawnOneConeAt(-20);

      const result = manager.checkCollisions(
        cone.position.clone().add(new THREE.Vector3(2.5, 0, 0)),
        0.5
      );

      expect(result.coneHit).toBeUndefined();
      expect(result.nearMiss).toBeUndefined();
      expect(cone.wasNearMiss).toBe(false);
    });

    it('treats an overlapping pass as a direct hit, never a near miss', () => {
      const cone = spawnOneConeAt(-20);

      const result = manager.checkCollisions(cone.position.clone(), 0.5);

      expect(result.coneHit).toBe(cone);
      expect(cone.wasNearMiss).toBe(false); // the hit check wins and returns immediately
    });
  });

  describe('scoring', () => {
    it('counts hit cones in daniel mode and ignores them in normal mode', () => {
      const cone = spawnOneConeAt(-20);

      expect(manager.getScore('normal')).toBe(0);
      expect(manager.getScore('daniel')).toBe(0);

      cone.markAsHit();

      expect(manager.getScore('daniel')).toBe(1);
      expect(manager.getScore('normal')).toBe(0);
    });

    it('counts only unhit cones the car has already passed in normal mode', () => {
      const cone = spawnOneConeAt(-20);

      // Cones only ever spawn at negative z, so simulate a cone the car has
      // driven past (the car travels toward -z) by moving it behind the car.
      cone.position.z = 10;
      expect(manager.getScore('normal')).toBe(1);

      cone.markAsHit();
      expect(manager.getScore('normal')).toBe(0);
      expect(manager.getScore('daniel')).toBe(1);
    });
  });

  describe('cleanup and reset', () => {
    it('keeps cones near the car and removes ones well behind it from manager and scene', () => {
      const cone = spawnOneConeAt(-20);

      // car at -45: the cleanup horizon is z > -45 + 30 = -15; the cone at -20 stays.
      manager.removeConesBehind(-45, scene);
      expect(manager.getCones()).toHaveLength(1);
      expect(scene.children).toHaveLength(1);

      // car at -55: horizon z > -25; the cone at -20 is behind the car now.
      manager.removeConesBehind(-55, scene);
      expect(manager.getCones()).toHaveLength(0);
      expect(scene.children).toHaveLength(0);
      expect(manager.getCones()).not.toContain(cone);
    });

    it('restores a fresh spawning cursor and empties the cone list on reset', () => {
      spawnOneConeAt(-20);
      manager.reset();

      expect(manager.getCones()).toHaveLength(0);

      // the cursor is back at 0: -10 is inside the spacing again, -20 clears it
      manager.generateConesForSegment(makeStraightSegment(-10), 0, scene);
      expect(manager.getCones()).toHaveLength(0);
      manager.generateConesForSegment(makeStraightSegment(-20), 0, scene);
      expect(manager.getCones()).toHaveLength(1);
    });
  });
});
