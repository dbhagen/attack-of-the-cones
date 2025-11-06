import * as THREE from 'three';
import { DifficultyConfig } from './DifficultyManager';

export interface RoadSegment {
  mesh: THREE.Mesh;
  curve: THREE.CatmullRomCurve3;
  startZ: number;
  endZ: number;
  width: number;
  id: number;
}

export class RoadGenerator {
  private segmentLength = 20; // Length of each road segment
  private segments: RoadSegment[] = [];
  private nextSegmentId = 0;
  private lastSegmentEndPoint: THREE.Vector3;

  constructor() {
    // Start with a straight road at origin
    this.lastSegmentEndPoint = new THREE.Vector3(0, 0, 0);
  }

  public generateSegment(difficulty: DifficultyConfig): RoadSegment {
    const segmentId = this.nextSegmentId++;
    const startPoint = this.lastSegmentEndPoint.clone();

    // Generate control points for the spline based on difficulty
    const controlPoints = this.generateControlPoints(startPoint, difficulty);

    // Create spline curve
    const curve = new THREE.CatmullRomCurve3(controlPoints, false, 'catmullrom', 0.5);

    // Create road mesh along the curve
    const mesh = this.createRoadMesh(curve, difficulty.roadWidth);

    // Update last end point
    this.lastSegmentEndPoint = controlPoints[controlPoints.length - 1].clone();

    const segment: RoadSegment = {
      mesh,
      curve,
      startZ: startPoint.z,
      endZ: this.lastSegmentEndPoint.z,
      width: difficulty.roadWidth,
      id: segmentId,
    };

    this.segments.push(segment);
    return segment;
  }

  private generateControlPoints(
    startPoint: THREE.Vector3,
    difficulty: DifficultyConfig
  ): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];
    const numPoints = 5; // More points = smoother curves

    // Always start from the provided start point
    points.push(startPoint.clone());

    let currentX = startPoint.x;
    let currentZ = startPoint.z;

    for (let i = 1; i < numPoints; i++) {
      const progress = i / (numPoints - 1);

      // Determine if this segment should curve based on frequency
      const shouldCurve = Math.random() < difficulty.curveFrequency;

      if (shouldCurve && i < numPoints - 1) {
        // Add curve displacement
        const maxDisplacement = difficulty.curveIntensity * 3;
        const curveDirection = Math.random() < 0.5 ? -1 : 1;
        const displacement = curveDirection * maxDisplacement * Math.sin(progress * Math.PI);
        currentX += displacement;
      }

      // Move forward (negative Z = up the screen)
      currentZ -= this.segmentLength / (numPoints - 1);

      // Keep X within reasonable bounds (don't go too far off-screen)
      currentX = Math.max(-4, Math.min(4, currentX));

      points.push(new THREE.Vector3(currentX, 0, currentZ));
    }

    return points;
  }

  private createRoadMesh(curve: THREE.CatmullRomCurve3, width: number): THREE.Mesh {
    // Get points along the curve
    const points = curve.getPoints(50);

    // Create geometry by extruding a shape along the curve
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, 0);
    shape.lineTo(width / 2, 0);

    // Use TubeGeometry for a road that follows the curve
    // Alternative approach: Create a ribbon geometry manually
    const roadGeometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];

    // Create road surface as a ribbon along the curve
    for (let i = 0; i < points.length; i++) {
      const point = points[i];

      // Calculate tangent for orientation
      const tangent = curve.getTangent(i / (points.length - 1));

      // Calculate perpendicular vector (normal to the curve)
      const perpendicular = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      // Create two vertices (left and right edge of road)
      const leftPoint = point.clone().add(perpendicular.clone().multiplyScalar(width / 2));
      const rightPoint = point.clone().add(perpendicular.clone().multiplyScalar(-width / 2));

      vertices.push(leftPoint.x, leftPoint.y, leftPoint.z);
      vertices.push(rightPoint.x, rightPoint.y, rightPoint.z);

      // UVs for texturing
      const v = i / (points.length - 1);
      uvs.push(0, v);
      uvs.push(1, v);

      // Create triangles (except for last point)
      if (i < points.length - 1) {
        const baseIndex = i * 2;
        // First triangle
        indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
        // Second triangle
        indices.push(baseIndex + 1, baseIndex + 3, baseIndex + 2);
      }
    }

    roadGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    roadGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    roadGeometry.setIndex(indices);
    roadGeometry.computeVertexNormals();

    // Road material
    const material = new THREE.MeshStandardMaterial({
      color: 0x333333,
      flatShading: true,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(roadGeometry, material);
    return mesh;
  }

  public removeSegment(segment: RoadSegment): void {
    const index = this.segments.indexOf(segment);
    if (index > -1) {
      this.segments.splice(index, 1);
    }
  }

  public getActiveSegments(): RoadSegment[] {
    return this.segments;
  }

  public reset(): void {
    this.segments = [];
    this.nextSegmentId = 0;
    this.lastSegmentEndPoint = new THREE.Vector3(0, 0, 0);
  }
}
