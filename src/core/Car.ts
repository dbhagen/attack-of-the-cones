import * as THREE from 'three';
import { Wheel, WheelPosition } from './Wheel';

export interface CarConfig {
  wheelRadius: number;
  wheelWidth: number;
  wheelHealth: number;
  chassisWidth: number;
  chassisLength: number;
  chassisHeight: number;
}

export class Car {
  public group: THREE.Group;
  private chassis: THREE.Mesh;
  private wheels: Map<WheelPosition, Wheel>;

  // Physics properties
  private velocity: THREE.Vector3;
  private acceleration: THREE.Vector3;
  private maxSpeed = 10;
  private speedMultiplier = 1.0; // Modifier for on-road/off-road
  private dragCoefficient = 0.5; // Base drag when wheels are missing
  private rollingFrictionCoefficient = 0.01; // Normal rolling resistance
  private groundFrictionCoefficient = 0.6; // Friction when dragging on ground

  // Car dimensions
  private config: CarConfig;

  constructor(config: CarConfig) {
    this.config = config;
    this.group = new THREE.Group();
    this.wheels = new Map();
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.acceleration = new THREE.Vector3(0, 0, 0);

    this.createChassis();
    this.createWheels();
  }

  private createChassis(): void {
    const geometry = new THREE.BoxGeometry(
      this.config.chassisWidth,
      this.config.chassisHeight,
      this.config.chassisLength
    );

    const material = new THREE.MeshStandardMaterial({
      color: 0xff6b6b,
      flatShading: true,
      metalness: 0.4,
      roughness: 0.6,
    });

    this.chassis = new THREE.Mesh(geometry, material);
    this.chassis.position.y = this.config.chassisHeight / 2 + this.config.wheelRadius;
    this.group.add(this.chassis);
  }

  private createWheels(): void {
    const wheelConfig = {
      radius: this.config.wheelRadius,
      width: this.config.wheelWidth,
      maxHealth: this.config.wheelHealth,
    };

    // Calculate wheel positions relative to chassis
    const wheelOffsetX = this.config.chassisWidth / 2 + this.config.wheelWidth / 2;
    const wheelOffsetZ = this.config.chassisLength / 2 - this.config.wheelRadius;

    // Front Left
    const frontLeft = new Wheel({ ...wheelConfig, position: WheelPosition.FRONT_LEFT });
    frontLeft.mesh.position.set(-wheelOffsetX, this.config.wheelRadius, wheelOffsetZ);
    this.wheels.set(WheelPosition.FRONT_LEFT, frontLeft);
    this.group.add(frontLeft.mesh);

    // Front Right
    const frontRight = new Wheel({ ...wheelConfig, position: WheelPosition.FRONT_RIGHT });
    frontRight.mesh.position.set(wheelOffsetX, this.config.wheelRadius, wheelOffsetZ);
    this.wheels.set(WheelPosition.FRONT_RIGHT, frontRight);
    this.group.add(frontRight.mesh);

    // Rear Left
    const rearLeft = new Wheel({ ...wheelConfig, position: WheelPosition.REAR_LEFT });
    rearLeft.mesh.position.set(-wheelOffsetX, this.config.wheelRadius, -wheelOffsetZ);
    this.wheels.set(WheelPosition.REAR_LEFT, rearLeft);
    this.group.add(rearLeft.mesh);

    // Rear Right
    const rearRight = new Wheel({ ...wheelConfig, position: WheelPosition.REAR_RIGHT });
    rearRight.mesh.position.set(wheelOffsetX, this.config.wheelRadius, -wheelOffsetZ);
    this.wheels.set(WheelPosition.REAR_RIGHT, rearRight);
    this.group.add(rearRight.mesh);
  }

  public update(deltaTime: number): void {
    // Calculate physics based on wheel state
    const attachedWheels = this.getAttachedWheels();
    const totalWheels = 4;

    // If no wheels, car can't move
    if (attachedWheels.length === 0) {
      this.velocity.multiplyScalar(0.9); // Quick deceleration
      return;
    }

    // Calculate effective friction based on missing wheels
    const wheelRatio = attachedWheels.length / totalWheels;
    const effectiveFriction = this.calculateEffectiveFriction(wheelRatio);

    // Apply friction
    const frictionForce = this.velocity.clone().multiplyScalar(-effectiveFriction);
    this.acceleration.add(frictionForce);

    // Update velocity
    this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime));

    // Clamp to max speed (reduced by missing wheels and speed multiplier)
    const effectiveMaxSpeed = this.maxSpeed * Math.pow(wheelRatio, 0.5) * this.speedMultiplier;
    if (this.velocity.length() > effectiveMaxSpeed) {
      this.velocity.setLength(effectiveMaxSpeed);
    }

    // Update position
    this.group.position.add(this.velocity.clone().multiplyScalar(deltaTime));

    // Rotate wheels based on velocity
    const speed = this.velocity.length();
    attachedWheels.forEach(wheel => {
      wheel.rotate(deltaTime, speed);
    });

    // Apply drag/tilt based on missing wheels
    this.applyDamageEffects(attachedWheels);

    // Reset acceleration for next frame
    this.acceleration.set(0, 0, 0);
  }

  private calculateEffectiveFriction(wheelRatio: number): number {
    // Mix between rolling friction and ground friction based on wheels remaining
    const rollingComponent = this.rollingFrictionCoefficient * wheelRatio;
    const groundComponent = this.groundFrictionCoefficient * (1 - wheelRatio);
    return rollingComponent + groundComponent;
  }

  private applyDamageEffects(attachedWheels: Wheel[]): void {
    // Reset chassis rotation first
    this.chassis.rotation.x = 0;
    this.chassis.rotation.z = 0;

    if (attachedWheels.length === 4) {
      // All wheels attached, no tilt
      return;
    }

    // Calculate which corner is missing wheels and tilt accordingly
    const frontLeft = this.wheels.get(WheelPosition.FRONT_LEFT)?.isAttached;
    const frontRight = this.wheels.get(WheelPosition.FRONT_RIGHT)?.isAttached;
    const rearLeft = this.wheels.get(WheelPosition.REAR_LEFT)?.isAttached;
    const rearRight = this.wheels.get(WheelPosition.REAR_RIGHT)?.isAttached;

    const tiltAmount = 0.15; // Radians

    // Tilt left/right based on side wheels
    const leftWheels = (frontLeft ? 1 : 0) + (rearLeft ? 1 : 0);
    const rightWheels = (frontRight ? 1 : 0) + (rearRight ? 1 : 0);
    const sideBalance = rightWheels - leftWheels;
    this.chassis.rotation.z = (sideBalance / 2) * tiltAmount;

    // Tilt front/back based on front/rear wheels
    const frontWheels = (frontLeft ? 1 : 0) + (frontRight ? 1 : 0);
    const rearWheels = (rearLeft ? 1 : 0) + (rearRight ? 1 : 0);
    const frontBackBalance = rearWheels - frontWheels;
    this.chassis.rotation.x = (frontBackBalance / 2) * tiltAmount;

    // Lower the chassis if wheels are missing
    const missingWheels = 4 - attachedWheels.length;
    const heightDrop = (missingWheels / 4) * this.config.wheelRadius;
    this.chassis.position.y = this.config.chassisHeight / 2 + this.config.wheelRadius - heightDrop;
  }

  private getAttachedWheels(): Wheel[] {
    return Array.from(this.wheels.values()).filter(wheel => wheel.isAttached);
  }

  public damageWheel(position: WheelPosition, amount: number): void {
    const wheel = this.wheels.get(position);
    if (wheel) {
      wheel.takeDamage(amount);
    }
  }

  public damageRandomWheel(amount: number): void {
    const attachedWheels = this.getAttachedWheels();
    if (attachedWheels.length > 0) {
      const randomWheel = attachedWheels[Math.floor(Math.random() * attachedWheels.length)];
      randomWheel.takeDamage(amount);
    }
  }

  public applyForce(force: THREE.Vector3): void {
    this.acceleration.add(force);
  }

  public getVelocity(): THREE.Vector3 {
    return this.velocity.clone();
  }

  public setVelocity(velocity: THREE.Vector3): void {
    this.velocity.copy(velocity);
  }

  public getAttachedWheelCount(): number {
    return this.getAttachedWheels().length;
  }

  public getWheelHealthStatus(): Map<WheelPosition, number> {
    const status = new Map<WheelPosition, number>();
    this.wheels.forEach((wheel, position) => {
      status.set(position, wheel.getHealthPercent());
    });
    return status;
  }

  public setSpeedMultiplier(multiplier: number): void {
    this.speedMultiplier = multiplier;
  }

  public getSpeedMultiplier(): number {
    return this.speedMultiplier;
  }
}
