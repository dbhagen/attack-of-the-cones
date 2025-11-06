export interface DifficultyConfig {
  curveIntensity: number; // 0-1, how sharp curves can be
  curveFrequency: number; // How often curves occur
  obstacleFrequency: number; // How often obstacles appear
  roadWidth: number; // Width of the road
  spawnRate: number; // How fast new segments appear
}

export class DifficultyManager {
  private distanceTraveled: number = 0;
  private timePlayed: number = 0;

  // Base difficulty settings
  private baseDifficulty: DifficultyConfig = {
    curveIntensity: 0.2,
    curveFrequency: 0.3,
    obstacleFrequency: 0.1,
    roadWidth: 3.0,
    spawnRate: 1.0,
  };

  // Maximum difficulty caps
  private maxDifficulty: DifficultyConfig = {
    curveIntensity: 0.8,
    curveFrequency: 0.7,
    obstacleFrequency: 0.5,
    roadWidth: 2.0,
    spawnRate: 2.0,
  };

  constructor() {}

  public update(deltaTime: number, distanceDelta: number): void {
    this.timePlayed += deltaTime;
    this.distanceTraveled += distanceDelta;
  }

  public getCurrentDifficulty(): DifficultyConfig {
    // Difficulty scales with both time and distance
    const timeProgress = Math.min(this.timePlayed / 300, 1); // 5 minutes to max
    const distanceProgress = Math.min(this.distanceTraveled / 1000, 1); // 1000 units to max
    const overallProgress = (timeProgress + distanceProgress) / 2;

    // Use easing function for smooth progression
    const easedProgress = this.easeInOutCubic(overallProgress);

    return {
      curveIntensity: this.lerp(
        this.baseDifficulty.curveIntensity,
        this.maxDifficulty.curveIntensity,
        easedProgress
      ),
      curveFrequency: this.lerp(
        this.baseDifficulty.curveFrequency,
        this.maxDifficulty.curveFrequency,
        easedProgress
      ),
      obstacleFrequency: this.lerp(
        this.baseDifficulty.obstacleFrequency,
        this.maxDifficulty.obstacleFrequency,
        easedProgress
      ),
      roadWidth: this.lerp(
        this.baseDifficulty.roadWidth,
        this.maxDifficulty.roadWidth,
        easedProgress
      ),
      spawnRate: this.lerp(
        this.baseDifficulty.spawnRate,
        this.maxDifficulty.spawnRate,
        easedProgress
      ),
    };
  }

  private lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  public getDistanceTraveled(): number {
    return this.distanceTraveled;
  }

  public getTimePlayed(): number {
    return this.timePlayed;
  }

  public reset(): void {
    this.distanceTraveled = 0;
    this.timePlayed = 0;
  }
}
