import * as THREE from 'three';
import { Car } from './Car';
import { WheelPosition } from './Wheel';
import { RoadGenerator, RoadSegment } from './RoadGenerator';
import { DifficultyManager } from './DifficultyManager';
import { ObstacleManager, GameMode } from './ObstacleManager';

export class Game {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private animationFrameId: number = 0;

  // Game entities
  private car: Car | null = null;
  private roadGenerator: RoadGenerator;
  private difficultyManager: DifficultyManager;
  private obstacleManager: ObstacleManager;

  // Game state
  private gameMode: GameMode = 'normal';
  private coneScore: number = 0;
  private nearMissBonus: number = 0;
  private conesHitCount: number = 0;
  private conesMissedCount: number = 0;

  // World boundaries
  private leftWall: THREE.Mesh | null = null;
  private rightWall: THREE.Mesh | null = null;
  private backWall: THREE.Mesh | null = null;
  private frontWall: THREE.Mesh | null = null;

  // Background plane
  private backgroundPlane: THREE.Mesh | null = null;

  // Input handling
  private keys: Set<string> = new Set();

  // Camera follow settings
  private cameraFollowLag = 0.08; // Smoothing factor for Z-axis (0-1, lower = more lag)
  private maxCameraAngle = 10 * (Math.PI / 180); // Maximum 10 degree tilt towards car
  private levelWidth = 8; // Width of the playable level
  private levelLength = 50; // Length of the level (for forward boundaries)
  private cameraHeight = 20;
  private cameraTiltOffset = 3.5;
  private cameraLookAheadDistance = 9; // Look ahead of car to show car at bottom 20% of screen

  // Game state tracking
  private distanceTraveled = 0;
  private gameTime = 0;

  // Debug info
  private fpsElement: HTMLElement | null;
  private drawCallsElement: HTMLElement | null;
  private trianglesElement: HTMLElement | null;

  // HUD elements
  private speedElement: HTMLElement | null;
  private distanceElement: HTMLElement | null;
  private timeElement: HTMLElement | null;
  private scoreElement: HTMLElement | null;
  private conesHitElement: HTMLElement | null;
  private conesMissedElement: HTMLElement | null;
  private nearMissMessageElement: HTMLElement | null;
  private coneHitMessageElement: HTMLElement | null;

  // Menu elements
  private startMenuElement: HTMLElement | null;
  private startNormalButton: HTMLElement | null;
  private startDanielButton: HTMLElement | null;
  private backButton: HTMLElement | null;
  private hudOverlay: HTMLElement | null;
  private gameTitleElement: HTMLElement | null;

  // Game state
  private isPlaying: boolean = false;

  constructor() {
    // Initialize Three.js scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x8a8a8a); // Light grey background

    // Get app container for sizing
    const app = document.getElementById('app');
    const width = app?.clientWidth || window.innerWidth;
    const height = app?.clientHeight || window.innerHeight;

    // Setup camera - nearly top-down view with 10-degree tilt
    this.camera = new THREE.PerspectiveCamera(
      60,
      width / height,
      0.1,
      1000
    );
    // Position camera high up with slight forward tilt (10 degrees from vertical)
    // tan(10°) ≈ 0.176, so for height 20, Z offset is 20 * 0.176 ≈ 3.5
    this.camera.position.set(0, this.cameraHeight, this.cameraTiltOffset);
    this.camera.lookAt(0, 0, 0);

    // Setup renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    if (app) {
      app.appendChild(this.renderer.domElement);
    }

    // Clock for delta time
    this.clock = new THREE.Clock();

    // Initialize road generation
    this.roadGenerator = new RoadGenerator();
    this.difficultyManager = new DifficultyManager();
    this.obstacleManager = new ObstacleManager();

    // Get debug elements
    this.fpsElement = document.getElementById('fps');
    this.drawCallsElement = document.getElementById('draw-calls');
    this.trianglesElement = document.getElementById('triangles');

    // Get HUD elements
    this.speedElement = document.getElementById('hud-speed');
    this.distanceElement = document.getElementById('hud-distance');
    this.timeElement = document.getElementById('hud-time');
    this.scoreElement = document.getElementById('hud-score');
    this.conesHitElement = document.getElementById('hud-cones-hit');
    this.conesMissedElement = document.getElementById('hud-cones-missed');
    this.nearMissMessageElement = document.getElementById('near-miss-message');
    this.coneHitMessageElement = document.getElementById('cone-hit-message');
    this.hudOverlay = document.getElementById('hud-overlay');

    // Get menu elements
    this.startMenuElement = document.getElementById('start-menu');
    this.startNormalButton = document.getElementById('start-normal');
    this.startDanielButton = document.getElementById('start-daniel');
    this.backButton = document.getElementById('back-button');
    this.gameTitleElement = document.getElementById('game-title');

    // Setup menu button handlers
    if (this.startNormalButton) {
      this.startNormalButton.addEventListener('click', () => {
        this.startGame('normal');
      });
    }
    if (this.startDanielButton) {
      this.startDanielButton.addEventListener('click', () => {
        this.startGame('daniel');
      });
    }
    if (this.backButton) {
      this.backButton.addEventListener('click', () => {
        this.returnToMenu();
      });
    }

    // Setup scene
    this.setupScene();

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());

    // Setup keyboard controls
    this.setupInputHandlers();

    console.log('🎮 Attack of Cones initialized!');
  }

  private setupInputHandlers(): void {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
  }

  private setupScene(): void {
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    this.scene.add(directionalLight);

    // Create the player's car
    this.car = new Car({
      wheelRadius: 0.3,
      wheelWidth: 0.2,
      wheelHealth: 100,
      chassisWidth: 1.2,
      chassisLength: 2.0,
      chassisHeight: 0.8,
    });
    this.scene.add(this.car.group);

    // Add background plane (lighter grey to contrast with dark road)
    const bgGeometry = new THREE.PlaneGeometry(100, 200);
    const bgMaterial = new THREE.MeshStandardMaterial({
      color: 0x6b6b6b, // Medium grey for off-road area
      flatShading: true,
    });
    this.backgroundPlane = new THREE.Mesh(bgGeometry, bgMaterial);
    this.backgroundPlane.rotation.x = -Math.PI / 2;
    this.backgroundPlane.position.y = -0.01; // Slightly below road
    this.scene.add(this.backgroundPlane);

    // Generate initial road segments
    this.spawnInitialRoadSegments();

    // Create world boundaries
    this.createWorldBoundaries();
  }

  private createWorldBoundaries(): void {
    const wallHeight = 2;
    const wallThickness = 0.5;
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      flatShading: true,
      roughness: 0.8,
    });

    // Left wall (invisible but still used for collision detection)
    const leftWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, this.levelLength);
    this.leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    this.leftWall.position.set(-this.levelWidth / 2, wallHeight / 2, 0);
    this.leftWall.userData.isWall = true;
    this.leftWall.visible = false; // Hide from view
    this.scene.add(this.leftWall);

    // Right wall (invisible but still used for collision detection)
    const rightWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, this.levelLength);
    this.rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
    this.rightWall.position.set(this.levelWidth / 2, wallHeight / 2, 0);
    this.rightWall.userData.isWall = true;
    this.rightWall.visible = false; // Hide from view
    this.scene.add(this.rightWall);

    // Back wall (invisible but still used for collision detection)
    const backWallGeometry = new THREE.BoxGeometry(this.levelWidth, wallHeight, wallThickness);
    this.backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
    this.backWall.position.set(0, wallHeight / 2, this.levelLength / 2);
    this.backWall.userData.isWall = true;
    this.backWall.visible = false; // Hide from view
    this.scene.add(this.backWall);

    // Front wall (invisible but still used for collision detection)
    const frontWallGeometry = new THREE.BoxGeometry(this.levelWidth, wallHeight, wallThickness);
    this.frontWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
    this.frontWall.position.set(0, wallHeight / 2, -this.levelLength / 2);
    this.frontWall.userData.isWall = true;
    this.frontWall.visible = false; // Hide from view
    this.scene.add(this.frontWall);
  }

  private onWindowResize(): void {
    const app = document.getElementById('app');
    const width = app?.clientWidth || window.innerWidth;
    const height = app?.clientHeight || window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private update(deltaTime: number): void {
    // Only update game state if playing
    if (!this.isPlaying) {
      return;
    }

    // Update car physics
    if (this.car) {
      // Handle keyboard input
      this.handleInput(deltaTime);

      const oldPosition = this.car.group.position.clone();
      this.car.update(deltaTime);
      const newPosition = this.car.group.position.clone();

      // Calculate distance traveled this frame
      const distanceTraveled = oldPosition.distanceTo(newPosition);

      // Update game state
      this.distanceTraveled += distanceTraveled;
      this.gameTime += deltaTime;

      // Update difficulty manager
      this.difficultyManager.update(deltaTime, distanceTraveled);

      // Manage road segments
      this.manageRoadSegments();

      // Check if car is on road and adjust speed
      this.checkOnRoad();

      // Check for collisions with world boundaries
      this.checkWorldCollisions();

      // Check for cone collisions and near misses
      this.checkConeCollisions();

      // Update world boundaries to follow car
      this.updateWorldBoundaries();

      // Update camera to follow car
      this.updateCameraFollow(deltaTime);
    }
  }

  private checkConeCollisions(): void {
    if (!this.car) return;

    const carPos = this.car.group.position;
    const carRadius = 0.8; // Approximate car collision radius

    const collision = this.obstacleManager.checkCollisions(carPos, carRadius);

    // Handle cone hit
    if (collision.coneHit) {
      this.conesHitCount++;
      if (this.gameMode === 'daniel') {
        this.coneScore += 3; // Points for hitting cone in Daniel mode (less than near miss)
      } else {
        this.coneScore -= 10; // Penalty for hitting cone in Normal mode
      }
      this.showConeHitMessage();
    }

    // Handle near miss
    if (collision.nearMiss) {
      this.nearMissBonus += 5; // Bonus points for near miss in either mode
      this.showNearMissMessage();
    }
  }

  private showNearMissMessage(): void {
    if (!this.nearMissMessageElement) return;

    // Show the message
    this.nearMissMessageElement.classList.add('show');

    // Hide after 1 second
    setTimeout(() => {
      this.nearMissMessageElement?.classList.remove('show');
    }, 1000);
  }

  private showConeHitMessage(): void {
    if (!this.coneHitMessageElement) return;

    // Hide near miss message if it's showing (hit overrides near miss)
    if (this.nearMissMessageElement) {
      this.nearMissMessageElement.classList.remove('show');
    }

    // Set points text and color based on mode
    const pointsElement = this.coneHitMessageElement.querySelector('.points');
    if (pointsElement) {
      if (this.gameMode === 'daniel') {
        pointsElement.textContent = '+3 points';
        this.coneHitMessageElement.classList.remove('normal-mode');
        this.coneHitMessageElement.classList.add('daniel-mode');
      } else {
        pointsElement.textContent = '-10 points';
        this.coneHitMessageElement.classList.remove('daniel-mode');
        this.coneHitMessageElement.classList.add('normal-mode');
      }
    }

    // Show the hit message
    this.coneHitMessageElement.classList.add('show');

    // Hide after 1 second
    setTimeout(() => {
      this.coneHitMessageElement?.classList.remove('show');
    }, 1000);
  }

  private updateWorldBoundaries(): void {
    if (!this.car) return;

    const carZ = this.car.group.position.z;

    // Update background plane to follow car
    if (this.backgroundPlane) {
      this.backgroundPlane.position.z = carZ;
    }

    // Update side walls to follow car's Z position
    if (this.leftWall) {
      this.leftWall.position.z = carZ;
    }
    if (this.rightWall) {
      this.rightWall.position.z = carZ;
    }

    // Update front wall (ahead of car)
    if (this.frontWall) {
      this.frontWall.position.z = carZ - this.levelLength / 2;
    }

    // Update back wall (behind car)
    if (this.backWall) {
      this.backWall.position.z = carZ + this.levelLength / 2;
    }
  }

  private handleInput(deltaTime: number): void {
    if (!this.car) return;

    const accelerationForce = 8.0; // Increased to overcome higher friction
    const arcadeSpeed = 5.0; // Arcade-style left/right speed (units per second)
    const force = new THREE.Vector3(0, 0, 0);

    // Forward/backward with momentum (physics-based)
    // Up arrow = accelerate toward top of screen (negative Z)
    if (this.keys.has('w') || this.keys.has('arrowup')) {
      force.z -= accelerationForce;
    }
    // Down arrow = brake/reverse toward bottom of screen (positive Z)
    if (this.keys.has('s') || this.keys.has('arrowdown')) {
      force.z += accelerationForce;
    }

    // Apply forward/backward force
    if (force.lengthSq() > 0) {
      this.car.applyForce(force);
    }

    // Arcade-style left/right movement (instant, no momentum)
    // Movement amount scales with forward speed
    const carPos = this.car.group.position;
    const currentSpeed = Math.abs(this.car.getVelocity().z); // Forward speed
    const speedRatio = Math.min(currentSpeed / 10, 1.0); // Normalize to 0-1 (10 is typical top speed)
    const moveDistance = arcadeSpeed * deltaTime * speedRatio;

    if (this.keys.has('a') || this.keys.has('arrowleft')) {
      carPos.x -= moveDistance;
    }
    if (this.keys.has('d') || this.keys.has('arrowright')) {
      carPos.x += moveDistance;
    }

    // Zero out any horizontal velocity since we're using arcade controls
    const vel = this.car.getVelocity();
    vel.x = 0;
    this.car.setVelocity(vel);
  }

  private checkOnRoad(): void {
    if (!this.car) return;

    const carPos = this.car.group.position;
    const segments = this.roadGenerator.getActiveSegments();

    // Check if car is on any road segment
    let isOnRoad = false;

    for (const segment of segments) {
      // Check if car's Z position is within this segment's range
      if (carPos.z >= Math.min(segment.startZ, segment.endZ) &&
          carPos.z <= Math.max(segment.startZ, segment.endZ)) {

        // Get the closest point on the curve at this Z position
        // Simple approximation: find the curve point closest to car's Z
        const curvePoints = segment.curve.getPoints(50);
        let closestPoint: THREE.Vector3 | null = null;
        let minZDist = Infinity;

        for (const point of curvePoints) {
          const zDist = Math.abs(point.z - carPos.z);
          if (zDist < minZDist) {
            minZDist = zDist;
            closestPoint = point;
          }
        }

        if (closestPoint) {
          // Get current difficulty to know road width
          const difficulty = this.difficultyManager.getCurrentDifficulty();
          const roadWidth = difficulty.roadWidth;

          // Check if car is within road width horizontally
          const xDistance = Math.abs(carPos.x - closestPoint.x);
          if (xDistance < roadWidth / 2) {
            isOnRoad = true;
            break;
          }
        }
      }
    }

    // Adjust speed multiplier based on road status
    if (isOnRoad) {
      this.car.setSpeedMultiplier(1.5); // 50% faster on road
    } else {
      this.car.setSpeedMultiplier(0.5); // 50% slower off road
    }
  }

  private checkWorldCollisions(): void {
    if (!this.car) return;

    const carPos = this.car.group.position;
    const vel = this.car.getVelocity();
    const carHalfWidth = 0.6; // Half of car width for collision detection
    let velocityChanged = false;

    // Left wall collision (walls are always at fixed X positions)
    if (carPos.x - carHalfWidth < -this.levelWidth / 2) {
      carPos.x = -this.levelWidth / 2 + carHalfWidth;
      vel.x = Math.max(0, vel.x);
      velocityChanged = true;
    }

    // Right wall collision
    if (carPos.x + carHalfWidth > this.levelWidth / 2) {
      carPos.x = this.levelWidth / 2 - carHalfWidth;
      vel.x = Math.min(0, vel.x);
      velocityChanged = true;
    }

    // No front/back wall collisions in endless runner mode

    // Update velocity if we hit a wall
    if (velocityChanged) {
      this.car.setVelocity(vel);
    }
  }

  private updateCameraFollow(deltaTime: number): void {
    if (!this.car) return;

    const carPos = this.car.group.position;

    // Z-axis (forward/backward) - follow with lag based on velocity
    const targetZ = carPos.z + this.cameraTiltOffset;
    const currentZ = this.camera.position.z;
    const newZ = currentZ + (targetZ - currentZ) * this.cameraFollowLag;
    this.camera.position.z = newZ;

    // Keep camera X position centered
    this.camera.position.x = 0;

    // Calculate look-at point with strict 10-degree maximum angle
    const carOffsetX = carPos.x;

    // Calculate what X offset would create exactly maxCameraAngle degrees
    // tan(angle) = opposite/adjacent = lookAtX / cameraHeight
    // So: lookAtX = tan(angle) * cameraHeight
    const maxLookAtX = Math.tan(this.maxCameraAngle) * this.cameraHeight;

    // Apply minimal influence - only 10% of car's offset, capped at max angle
    const targetLookAtX = carOffsetX * 0.1; // Only 10% influence
    const lookAtX = Math.max(-maxLookAtX, Math.min(maxLookAtX, targetLookAtX));

    // Update camera look-at with constrained angle, looking ahead to show car at bottom 20%
    this.camera.lookAt(lookAtX, 0, carPos.z - this.cameraLookAheadDistance);
  }

  private spawnInitialRoadSegments(): void {
    // Spawn several segments ahead of the car
    const difficulty = this.difficultyManager.getCurrentDifficulty();
    console.log('Spawning initial road segments...');
    for (let i = 0; i < 5; i++) {
      const segment = this.roadGenerator.generateSegment(difficulty);
      this.scene.add(segment.mesh);
      // Generate cones for initial segments
      console.log('Initial segment', i, 'at Z:', segment.startZ, 'to', segment.endZ);
      this.obstacleManager.generateConesForSegment(segment, difficulty.curveIntensity, this.scene);
    }
    console.log('Initial cones generated:', this.obstacleManager.getCones().length);
  }

  private manageRoadSegments(): void {
    if (!this.car) return;

    const carZ = this.car.group.position.z;
    const segments = this.roadGenerator.getActiveSegments();
    const difficulty = this.difficultyManager.getCurrentDifficulty();

    // Remove segments that are behind the car (positive Z, bottom of screen)
    const segmentsToRemove = segments.filter(segment => segment.startZ > carZ + 30);
    segmentsToRemove.forEach(segment => {
      this.scene.remove(segment.mesh);
      this.roadGenerator.removeSegment(segment);
    });

    // Remove cones that are behind the car
    this.obstacleManager.removeConesBehind(carZ, this.scene);

    // Add new segments ahead of the car if needed (negative Z, top of screen)
    // Keep 5 segments ahead of the car (100 units ahead)
    const activeSegments = this.roadGenerator.getActiveSegments();

    if (activeSegments.length === 0) {
      // No segments, generate initial ones
      const newSegment = this.roadGenerator.generateSegment(difficulty);
      this.scene.add(newSegment.mesh);
      // Generate cones for the new segment
      this.obstacleManager.generateConesForSegment(newSegment, difficulty.curveIntensity, this.scene);
      return;
    }

    const furthestSegment = activeSegments.reduce((furthest, segment) => {
      return segment.endZ < furthest.endZ ? segment : furthest;
    }, activeSegments[0]);

    // Generate new segments if the furthest one is not far enough ahead
    if (furthestSegment.endZ > carZ - 100) {
      const newSegment = this.roadGenerator.generateSegment(difficulty);
      this.scene.add(newSegment.mesh);
      // Generate cones for the new segment
      console.log('Generating cones for segment at Z:', newSegment.startZ, 'to', newSegment.endZ, 'difficulty:', difficulty.curveIntensity);
      this.obstacleManager.generateConesForSegment(newSegment, difficulty.curveIntensity, this.scene);
      console.log('Total cones now:', this.obstacleManager.getCones().length);
    }
  }

  private updateConeLabels(): void {
    const cones = this.obstacleManager.getCones();
    const app = document.getElementById('app');
    const width = app?.clientWidth || window.innerWidth;
    const height = app?.clientHeight || window.innerHeight;

    for (const cone of cones) {
      if (!cone.labelElement) continue;

      // Get 3D position above cone
      const labelPosition = cone.mesh.position.clone();
      labelPosition.y += cone.getHeight() + 0.5; // Position above cone

      // Project to 2D screen coordinates
      const vector = labelPosition.clone();
      vector.project(this.camera);

      // Convert to screen coordinates
      const x = (vector.x * 0.5 + 0.5) * width;
      const y = (-(vector.y * 0.5) + 0.5) * height;

      // Hide label if cone is behind camera or too far
      if (vector.z > 1 || vector.z < -1) {
        cone.labelElement.style.display = 'none';
      } else {
        cone.labelElement.style.display = 'block';
        cone.labelElement.style.left = `${x}px`;
        cone.labelElement.style.top = `${y}px`;
      }
    }
  }

  private render(): void {
    this.renderer.render(this.scene, this.camera);

    // Update cone labels
    this.updateConeLabels();

    // Update debug info
    if (this.fpsElement) {
      const fps = Math.round(1 / this.clock.getDelta());
      this.fpsElement.textContent = fps.toString();
    }
    if (this.drawCallsElement) {
      this.drawCallsElement.textContent = this.renderer.info.render.calls.toString();
    }
    if (this.trianglesElement) {
      this.trianglesElement.textContent = this.renderer.info.render.triangles.toString();
    }

    // Update HUD
    if (this.car) {
      // Speed is based only on forward velocity (Z axis), not horizontal movement
      const velocity = this.car.getVelocity();
      const speed = Math.abs(velocity.z);

      // Calculate total score based on mode
      let totalScore = this.coneScore + this.nearMissBonus;

      // Calculate cones missed (cones behind the car that were not hit)
      this.conesMissedCount = this.obstacleManager.getCones().filter(
        cone => !cone.isHit && cone.position.z > this.car!.group.position.z
      ).length;

      // In normal mode, add points for avoided cones
      if (this.gameMode === 'normal') {
        totalScore += this.conesMissedCount * 10; // 10 points per avoided cone
      }

      if (this.speedElement) {
        this.speedElement.textContent = speed.toFixed(1);
      }
      if (this.distanceElement) {
        this.distanceElement.textContent = this.distanceTraveled.toFixed(1);
      }
      if (this.timeElement) {
        this.timeElement.textContent = this.gameTime.toFixed(1);
      }
      if (this.conesHitElement) {
        this.conesHitElement.textContent = this.conesHitCount.toString();
      }
      if (this.conesMissedElement) {
        this.conesMissedElement.textContent = this.conesMissedCount.toString();
      }
      if (this.scoreElement) {
        this.scoreElement.textContent = totalScore.toString();
      }
    }
  }

  private gameLoop = (): void => {
    this.animationFrameId = requestAnimationFrame(this.gameLoop);

    const deltaTime = this.clock.getDelta();

    this.update(deltaTime);
    this.render();
  };

  private startGame(mode: GameMode): void {
    // Set game mode
    this.gameMode = mode;

    // Reset game state
    this.resetGame();

    // Hide menu, show HUD, back button, and game title
    if (this.startMenuElement) {
      this.startMenuElement.classList.add('hidden');
    }
    if (this.hudOverlay) {
      this.hudOverlay.classList.remove('hidden');
    }
    if (this.backButton) {
      this.backButton.classList.remove('hidden');
    }
    if (this.gameTitleElement) {
      this.gameTitleElement.classList.remove('hidden');
    }

    // Set playing state
    this.isPlaying = true;

    // Start game loop if not already running
    if (!this.animationFrameId) {
      this.start();
    }
  }

  private returnToMenu(): void {
    // Set not playing
    this.isPlaying = false;

    // Reset game state
    this.resetGame();

    // Show menu, hide HUD, back button, and game title
    if (this.startMenuElement) {
      this.startMenuElement.classList.remove('hidden');
    }
    if (this.hudOverlay) {
      this.hudOverlay.classList.add('hidden');
    }
    if (this.backButton) {
      this.backButton.classList.add('hidden');
    }
    if (this.gameTitleElement) {
      this.gameTitleElement.classList.add('hidden');
    }
  }

  private resetGame(): void {
    // Reset game state variables
    this.coneScore = 0;
    this.nearMissBonus = 0;
    this.conesHitCount = 0;
    this.conesMissedCount = 0;
    this.distanceTraveled = 0;
    this.gameTime = 0;

    // Reset car position and velocity
    if (this.car) {
      this.car.group.position.set(0, 0, 0);
      this.car.setVelocity(new THREE.Vector3(0, 0, 0));
    }

    // Clear and reset road segments
    const segments = this.roadGenerator.getActiveSegments();
    segments.forEach(segment => {
      this.scene.remove(segment.mesh);
    });
    this.roadGenerator.reset();

    // Clear and reset obstacles
    const cones = this.obstacleManager.getCones();
    cones.forEach(cone => {
      this.scene.remove(cone.mesh);
      cone.dispose();
    });
    this.obstacleManager.reset();

    // Reset difficulty
    this.difficultyManager.reset();

    // Regenerate initial road segments
    this.spawnInitialRoadSegments();

    // Reset camera position
    if (this.car) {
      const carZ = this.car.group.position.z;
      this.camera.position.z = carZ + this.cameraTiltOffset;
      this.camera.lookAt(0, 0, carZ - this.cameraLookAheadDistance);
    }
  }

  public start(): void {
    console.log('🚀 Starting game loop...');
    this.clock.start();
    this.gameLoop();
  }

  public stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}
