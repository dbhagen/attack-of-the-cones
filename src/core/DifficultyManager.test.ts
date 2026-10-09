import { describe, expect, it } from 'vitest';
import { DifficultyManager } from './DifficultyManager';
import type { DifficultyConfig } from './DifficultyManager';

const EASIEST: DifficultyConfig = {
  curveIntensity: 0.2,
  curveFrequency: 0.3,
  obstacleFrequency: 0.1,
  roadWidth: 3.0,
  spawnRate: 1.0,
};

describe('DifficultyManager', () => {
  it('starts at the easiest configuration', () => {
    const manager = new DifficultyManager();

    expect(manager.getCurrentDifficulty()).toEqual(EASIEST);
  });

  it('accumulates elapsed time and distance across update calls', () => {
    const manager = new DifficultyManager();

    manager.update(1.5, 10);
    manager.update(0.5, 5);

    expect(manager.getTimePlayed()).toBeCloseTo(2);
    expect(manager.getDistanceTraveled()).toBe(15);
  });

  it('is exactly halfway to hard when time and distance progress are both at 50%', () => {
    const manager = new DifficultyManager();

    // 150s of the 300s ramp and 500 of the 1000-unit ramp.
    manager.update(150, 500);

    const difficulty = manager.getCurrentDifficulty();
    expect(difficulty.curveIntensity).toBeCloseTo(0.5); // between 0.2 and 0.8
    expect(difficulty.curveFrequency).toBeCloseTo(0.5); // between 0.3 and 0.7
    expect(difficulty.obstacleFrequency).toBeCloseTo(0.3); // between 0.1 and 0.5
    expect(difficulty.roadWidth).toBeCloseTo(2.5); // between 3 and 2
    expect(difficulty.spawnRate).toBeCloseTo(1.5); // between 1 and 2
  });

  it('does not reach maximum difficulty on time or distance alone', () => {
    const timeOnly = new DifficultyManager();
    timeOnly.update(300, 0); // exhausts the 5-minute ramp only
    expect(timeOnly.getCurrentDifficulty().spawnRate).toBeCloseTo(1.5); // midpoint, not max 2

    const distanceOnly = new DifficultyManager();
    distanceOnly.update(0, 1000); // exhausts the 1000-unit ramp only
    expect(distanceOnly.getCurrentDifficulty().spawnRate).toBeCloseTo(1.5);
  });

  it('ramps every setting monotonically from easiest toward hardest', () => {
    const manager = new DifficultyManager();
    const samples: DifficultyConfig[] = [manager.getCurrentDifficulty()];

    for (let step = 0; step < 10; step++) {
      manager.update(30, 100); // 300s / 1000 units in total across the ramp
      samples.push(manager.getCurrentDifficulty());
    }

    for (let i = 1; i < samples.length; i++) {
      const prev = samples[i - 1];
      const current = samples[i];
      // progress only ever eases forward: hazards and spawn rate rise, road narrows
      expect(current.curveIntensity).toBeGreaterThanOrEqual(prev.curveIntensity - 1e-9);
      expect(current.curveFrequency).toBeGreaterThanOrEqual(prev.curveFrequency - 1e-9);
      expect(current.obstacleFrequency).toBeGreaterThanOrEqual(prev.obstacleFrequency - 1e-9);
      expect(current.spawnRate).toBeGreaterThanOrEqual(prev.spawnRate - 1e-9);
      expect(current.roadWidth).toBeLessThanOrEqual(prev.roadWidth + 1e-9);
    }
  });

  it('caps at the hardest configuration and never overshoots it', () => {
    const manager = new DifficultyManager();

    manager.update(300, 1000);
    const maxed = manager.getCurrentDifficulty();
    expect(maxed.curveIntensity).toBeCloseTo(0.8);
    expect(maxed.curveFrequency).toBeCloseTo(0.7);
    expect(maxed.obstacleFrequency).toBeCloseTo(0.5);
    expect(maxed.roadWidth).toBeCloseTo(2.0);
    expect(maxed.spawnRate).toBeCloseTo(2.0);

    manager.update(600, 2000); // keep playing well past both ramps
    const stillCapped = manager.getCurrentDifficulty();
    expect(stillCapped.curveIntensity).toBeCloseTo(0.8);
    expect(stillCapped.roadWidth).toBeCloseTo(2.0);
    expect(stillCapped.spawnRate).toBeCloseTo(2.0);
  });

  it('returns to the easiest configuration after reset', () => {
    const manager = new DifficultyManager();

    manager.update(120, 400);
    manager.reset();

    expect(manager.getTimePlayed()).toBe(0);
    expect(manager.getDistanceTraveled()).toBe(0);
    expect(manager.getCurrentDifficulty()).toEqual(EASIEST);
  });
});
