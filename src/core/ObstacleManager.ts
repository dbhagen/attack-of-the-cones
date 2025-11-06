import * as THREE from 'three';
import { Cone } from './Cone';
import { RoadSegment } from './RoadGenerator';

export type GameMode = 'normal' | 'daniel';

export interface CollisionResult {
  coneHit?: Cone;
  nearMiss?: Cone;
}

export class ObstacleManager {
  private cones: Cone[] = [];
  private lastConeZ: number = 0;
  private baseSpacing: number = 15; // Base distance between cones
  private minSpacing: number = 5; // Minimum spacing at high difficulty

  constructor() {}

  public generateConesForSegment(
    segment: RoadSegment,
    difficulty: number, // 0-1, increases over time
    scene: THREE.Scene
  ): void {
    // Calculate spacing based on difficulty (more frequent as difficulty increases)
    const spacing = this.baseSpacing - (this.baseSpacing - this.minSpacing) * difficulty;

    // Only generate if this segment is far enough from the last cone
    if (segment.startZ < this.lastConeZ - spacing) {
      // Generate cones along this segment
      const numCones = Math.floor(Math.random() * 3) + 1; // 1-3 cones per segment

      for (let i = 0; i < numCones; i++) {
        // Get a random point along the segment's curve
        const t = Math.random();
        const point = segment.curve.getPointAt(t);

        // Randomly place cone on or near the road
        const offsetFromCenter = (Math.random() - 0.5) * segment.width;
        const conePosition = new THREE.Vector3(
          point.x + offsetFromCenter,
          0,
          point.z
        );

        const cone = new Cone(conePosition);
        this.cones.push(cone);
        scene.add(cone.mesh);
      }

      this.lastConeZ = segment.startZ;
    }
  }

  public checkCollisions(
    carPosition: THREE.Vector3,
    carRadius: number
  ): CollisionResult {
    const result: CollisionResult = {};
    const hitDistance = carRadius + 0.3; // Distance for direct hit
    const nearMissDistance = hitDistance + 0.5; // Near miss is slightly farther than hit

    for (const cone of this.cones) {
      // Skip cones that are already hit
      if (cone.isHit) continue;

      const distance = carPosition.distanceTo(cone.position);

      // Direct hit - check this FIRST, even if cone was marked as near miss
      if (distance < hitDistance) {
        cone.markAsHit();
        result.coneHit = cone;
        return result; // Only process one collision per frame
      }

      // Near miss - only mark if not already marked
      if (distance < nearMissDistance && !cone.wasNearMiss) {
        cone.markAsNearMiss();
        result.nearMiss = cone;
      }
    }

    return result;
  }

  public removeConesBehind(zPosition: number, scene: THREE.Scene): void {
    const conesToRemove = this.cones.filter(cone => cone.position.z > zPosition + 30);

    conesToRemove.forEach(cone => {
      scene.remove(cone.mesh);
      cone.dispose();
    });

    this.cones = this.cones.filter(cone => cone.position.z <= zPosition + 30);
  }

  public getCones(): Cone[] {
    return this.cones;
  }

  public getScore(mode: GameMode): number {
    if (mode === 'normal') {
      // Normal mode: count cones that were NOT hit
      const passedCones = this.cones.filter(cone => !cone.isHit && cone.position.z > 0);
      return passedCones.length;
    } else {
      // Daniel mode: count cones that WERE hit
      const hitCones = this.cones.filter(cone => cone.isHit);
      return hitCones.length;
    }
  }

  public getNearMissCount(): number {
    return this.cones.filter(cone => cone.wasNearMiss).length;
  }

  public reset(): void {
    this.cones = [];
    this.lastConeZ = 0;
  }
}
