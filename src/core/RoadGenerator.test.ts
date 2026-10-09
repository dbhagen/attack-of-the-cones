import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { RoadGenerator } from './RoadGenerator';
import type { DifficultyConfig } from './DifficultyManager';

const easyConfig: DifficultyConfig = {
  curveIntensity: 0.2,
  curveFrequency: 0.3,
  obstacleFrequency: 0.1,
  roadWidth: 3.0,
  spawnRate: 1.0,
};

const maxConfig: DifficultyConfig = {
  curveIntensity: 1,
  curveFrequency: 1,
  obstacleFrequency: 0.5,
  roadWidth: 2.0,
  spawnRate: 2.0,
};

describe('RoadGenerator', () => {
  it('starts the first segment at the origin, 20 units long, with the configured width', () => {
    const generator = new RoadGenerator();

    const segment = generator.generateSegment(easyConfig);

    expect(segment.id).toBe(0);
    expect(segment.startZ).toBe(0);
    expect(segment.endZ).toBe(-20);
    expect(segment.width).toBe(easyConfig.roadWidth);
    expect(segment.curve.getPoint(0).x).toBe(0); // starts straight out of the origin
  });

  it('chains segments end to end, always advancing 20 units toward -Z', () => {
    const generator = new RoadGenerator();

    const segments = [
      generator.generateSegment(easyConfig),
      generator.generateSegment(maxConfig),
      generator.generateSegment(easyConfig),
    ];

    segments.forEach((segment, i) => {
      expect(segment.id).toBe(i);
      expect(segment.endZ - segment.startZ).toBe(-20);
      if (i > 0) {
        expect(segment.startZ).toBe(segments[i - 1].endZ);
      }
    });
    expect(segments[2].endZ).toBe(-60);
    expect(generator.getActiveSegments()).toHaveLength(3);
  });

  it('matches the spline endpoints to the segment boundaries', () => {
    const generator = new RoadGenerator();

    generator.generateSegment(easyConfig);
    const second = generator.generateSegment(easyConfig);

    expect(second.startZ).toBe(-20);
    expect(second.curve.getPoint(0).z).toBeCloseTo(second.startZ, 6);
    expect(second.curve.getPoint(1).z).toBeCloseTo(second.endZ, 6);
  });

  it('produces a perfectly straight road when curve frequency is zero', () => {
    const generator = new RoadGenerator();
    const straightConfig: DifficultyConfig = { ...easyConfig, curveFrequency: 0 };

    for (let i = 0; i < 3; i++) {
      const segment = generator.generateSegment(straightConfig);
      for (const point of segment.curve.getPoints(50)) {
        expect(Math.abs(point.x)).toBeLessThan(1e-9);
      }
    }
  });

  it('keeps even maximum-intensity curves inside a bounded corridor', () => {
    const generator = new RoadGenerator();

    // Control points are clamped to x in [-4, 4]; the Catmull-Rom spline between
    // them may overshoot slightly, so assert a generous playable corridor.
    for (let i = 0; i < 20; i++) {
      const segment = generator.generateSegment(maxConfig);
      for (const point of segment.curve.getPoints(30)) {
        expect(Math.abs(point.x)).toBeLessThanOrEqual(6);
      }
    }
  });

  it('builds a ribbon mesh with paired edge vertices, uvs, and triangulated indices', () => {
    const generator = new RoadGenerator();

    const segment = generator.generateSegment(easyConfig);

    expect(segment.mesh).toBeInstanceOf(THREE.Mesh);
    const geometry = segment.mesh.geometry;
    const positionCount = geometry.getAttribute('position').count;
    expect(positionCount).toBeGreaterThan(0);
    expect(positionCount % 2).toBe(0); // left/right edge pair per sample point
    expect(geometry.getAttribute('uv').count).toBe(positionCount);
    const index = geometry.index;
    expect(index).not.toBeNull();
    expect(index?.count ?? 0).toBeGreaterThan(0);
    expect((index?.count ?? 0) % 3).toBe(0); // whole triangles only
  });

  it('removes exactly the requested segment from the active list', () => {
    const generator = new RoadGenerator();

    const first = generator.generateSegment(easyConfig);
    const second = generator.generateSegment(easyConfig);
    const third = generator.generateSegment(easyConfig);

    generator.removeSegment(second);

    const remaining = generator.getActiveSegments();
    expect(remaining).toHaveLength(2);
    expect(remaining[0]).toBe(first);
    expect(remaining[1]).toBe(third);
  });

  it('restarts from the origin with fresh ids after reset', () => {
    const generator = new RoadGenerator();

    generator.generateSegment(easyConfig);
    generator.generateSegment(easyConfig);
    generator.reset();

    expect(generator.getActiveSegments()).toHaveLength(0);

    const fresh = generator.generateSegment(easyConfig);
    expect(fresh.id).toBe(0);
    expect(fresh.startZ).toBe(0);
    expect(fresh.endZ).toBe(-20);
  });
});
