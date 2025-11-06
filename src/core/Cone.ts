import * as THREE from 'three';

export class Cone {
  public mesh: THREE.Mesh;
  public position: THREE.Vector3;
  public isHit: boolean = false;
  public wasNearMiss: boolean = false;
  private radius: number;
  private height: number;

  constructor(position: THREE.Vector3, radius: number = 0.5, height: number = 0.8) {
    this.radius = radius;
    this.height = height;

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

    // Rotate to stand upright
    this.mesh.rotation.x = 0;
  }

  public getRadius(): number {
    return this.radius;
  }

  public getHeight(): number {
    return this.height;
  }

  public markAsHit(): void {
    this.isHit = true;
    // Change color to indicate hit
    const material = this.mesh.material as THREE.MeshStandardMaterial;
    material.color.setHex(0x666666); // Grey when hit
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
  }

  public dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
