import * as THREE from 'three';

export enum WheelPosition {
  FRONT_LEFT = 'FRONT_LEFT',
  FRONT_RIGHT = 'FRONT_RIGHT',
  REAR_LEFT = 'REAR_LEFT',
  REAR_RIGHT = 'REAR_RIGHT',
}

export interface WheelConfig {
  position: WheelPosition;
  radius: number;
  width: number;
  maxHealth: number;
}

export class Wheel {
  public mesh: THREE.Mesh;
  public position: WheelPosition;
  public health: number;
  public maxHealth: number;
  public isAttached: boolean;
  public radius: number;
  public width: number;

  // Physics properties
  private rollingFriction = 0.01; // Coefficient for rolling resistance
  private angularVelocity = 0; // Rotation speed of the wheel

  constructor(config: WheelConfig) {
    this.position = config.position;
    this.radius = config.radius;
    this.width = config.width;
    this.maxHealth = config.maxHealth;
    this.health = config.maxHealth;
    this.isAttached = true;

    // Create voxel-style wheel mesh
    this.mesh = this.createWheelMesh();
  }

  private createWheelMesh(): THREE.Mesh {
    // Create a voxel-style wheel using a cylinder
    const geometry = new THREE.CylinderGeometry(
      this.radius,
      this.radius,
      this.width,
      8, // Low segment count for voxel aesthetic
      1,
      false
    );

    const material = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a, // Dark tire color
      flatShading: true,
      metalness: 0.3,
      roughness: 0.8,
    });

    const mesh = new THREE.Mesh(geometry, material);

    // Rotate to align with car orientation (cylinder is vertical by default)
    mesh.rotation.z = Math.PI / 2;

    return mesh;
  }

  public takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);

    // Update visual to show damage
    const healthPercent = this.health / this.maxHealth;
    const material = this.mesh.material as THREE.MeshStandardMaterial;

    if (healthPercent > 0.5) {
      material.color.setHex(0x1a1a1a); // Dark
    } else if (healthPercent > 0.25) {
      material.color.setHex(0x3a3a3a); // Lighter (showing wear)
    } else if (healthPercent > 0) {
      material.color.setHex(0x5a5a5a); // Even lighter (heavily damaged)
    }

    // Wheel falls off when health reaches zero
    if (this.health <= 0 && this.isAttached) {
      this.detach();
    }
  }

  public detach(): void {
    this.isAttached = false;
    // Could add falling animation or particle effects here
  }

  public rotate(deltaTime: number, velocity: number): void {
    if (!this.isAttached) return;

    // Calculate angular velocity based on linear velocity
    // v = ω * r, so ω = v / r
    this.angularVelocity = velocity / this.radius;

    // Rotate the wheel mesh
    this.mesh.rotation.x += this.angularVelocity * deltaTime;
  }

  public getRollingResistance(): number {
    return this.isAttached ? this.rollingFriction : 0;
  }

  public getHealthPercent(): number {
    return this.health / this.maxHealth;
  }
}
