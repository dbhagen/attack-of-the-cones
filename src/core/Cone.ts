import * as THREE from 'three';
import { generateCommitMessage } from '../utils/commitMessageGenerator';

export class Cone {
  public mesh: THREE.Mesh;
  public position: THREE.Vector3;
  public isHit: boolean = false;
  public wasNearMiss: boolean = false;
  public labelElement: HTMLElement | null = null;
  public commitMessage: string;
  private radius: number;
  private height: number;

  // Animation properties
  private velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private angularVelocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private isFlying: boolean = false;
  private shakeTime: number = 0;
  private shakeIntensity: number = 0;
  private originalPosition: THREE.Vector3 = new THREE.Vector3();
  private timeSinceHit: number = 0; // Elapsed time since hit

  constructor(position: THREE.Vector3, radius: number = 0.5, height: number = 0.8) {
    this.radius = radius;
    this.height = height;

    // Generate random commit message
    this.commitMessage = generateCommitMessage();

    // Create cone geometry (traffic cone style - orange with white stripe)
    const geometry = new THREE.ConeGeometry(radius, height, 8);

    // Create materials for the cone
    const orangeMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      flatShading: true,
      roughness: 0.7,
    });

    this.mesh = new THREE.Mesh(geometry, orangeMaterial);

    // Position the cone
    this.mesh.position.copy(position);
    this.mesh.position.y = height / 2; // Place on ground

    // Store the actual position for collision detection (matching mesh position)
    this.position = this.mesh.position.clone();
    this.originalPosition.copy(this.mesh.position);

    // Rotate to stand upright
    this.mesh.rotation.x = 0;

    // Create HTML label
    this.createLabel();
  }

  public update(deltaTime: number): void {
    // Track time since hit
    if (this.isHit) {
      this.timeSinceHit += deltaTime;
    }

    // Update flying animation
    if (this.isFlying) {
      // Apply gravity
      this.velocity.y -= 9.8 * deltaTime;

      // Update position
      this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime));
      this.position.copy(this.mesh.position);

      // Update rotation
      this.mesh.rotation.x += this.angularVelocity.x * deltaTime;
      this.mesh.rotation.y += this.angularVelocity.y * deltaTime;
      this.mesh.rotation.z += this.angularVelocity.z * deltaTime;
    }

    // Update shake animation
    if (this.shakeTime > 0) {
      this.shakeTime -= deltaTime;

      // Apply random shake offset
      const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      const shakeZ = (Math.random() - 0.5) * this.shakeIntensity;

      this.mesh.position.x = this.originalPosition.x + shakeX;
      this.mesh.position.z = this.originalPosition.z + shakeZ;
      this.position.copy(this.mesh.position);

      // Reduce shake intensity over time
      this.shakeIntensity *= 0.95;

      // Stop shaking when time is up
      if (this.shakeTime <= 0) {
        this.mesh.position.copy(this.originalPosition);
        this.position.copy(this.mesh.position);
        this.shakeIntensity = 0;
      }
    }
  }

  private createLabel(): void {
    this.labelElement = document.createElement('div');
    this.labelElement.className = 'cone-label';
    this.labelElement.textContent = this.commitMessage;

    // Add to DOM
    const labelsContainer = document.getElementById('cone-labels');
    if (labelsContainer) {
      labelsContainer.appendChild(this.labelElement);
    }
  }

  public getRadius(): number {
    return this.radius;
  }

  public getHeight(): number {
    return this.height;
  }

  public markAsHit(impactVelocity?: THREE.Vector3): void {
    this.isHit = true;
    // Change color to indicate hit
    const material = this.mesh.material as THREE.MeshStandardMaterial;
    material.color.setHex(0x666666); // Grey when hit

    // Start flying animation
    this.startFlying(impactVelocity);
  }

  private startFlying(impactVelocity?: THREE.Vector3): void {
    this.isFlying = true;

    // If we have impact velocity, fly in that direction
    if (impactVelocity) {
      // Use the impact direction (mainly Z) and add upward component
      this.velocity.set(
        (Math.random() - 0.5) * 4,           // Random sideways
        5 + Math.random() * 3,                // Upward
        impactVelocity.z * 0.8 + (Math.random() - 0.5) * 2  // Mostly in impact direction
      );
    } else {
      // Fallback: random velocity
      this.velocity.set(
        (Math.random() - 0.5) * 8,
        5 + Math.random() * 3,
        (Math.random() - 0.5) * 4
      );
    }

    // Random spin
    this.angularVelocity.set(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10
    );
  }

  private startShaking(): void {
    this.shakeTime = 0.3; // Shake for 0.3 seconds
    this.shakeIntensity = 0.1; // Shake intensity
    this.originalPosition.copy(this.mesh.position);
  }

  public markAsNearMiss(): void {
    this.wasNearMiss = true;
    // Flash white briefly
    const material = this.mesh.material as THREE.MeshStandardMaterial;
    const originalColor = material.color.clone();
    material.color.setHex(0xffffff);

    setTimeout(() => {
      material.color.copy(originalColor);
    }, 100);

    // Start shaking animation
    this.startShaking();
  }

  public shouldRemove(): boolean {
    // Remove cone after 3 seconds if it was hit
    return this.isHit && this.timeSinceHit > 3.0;
  }

  public dispose(): void {
    // Remove label from DOM FIRST
    if (this.labelElement) {
      if (this.labelElement.parentNode) {
        this.labelElement.parentNode.removeChild(this.labelElement);
      }
      this.labelElement = null;
    }

    // Then dispose of 3D resources
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
