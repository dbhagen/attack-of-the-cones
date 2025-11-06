# Cone Attack - Product Specification

## Overview

**Cone Attack** is a web-based vertical scroller game featuring voxel-style 3D graphics with flat shading. Players control a vehicle navigating through increasingly challenging obstacle courses, avoiding construction cones, pedestrians, sidewalks, and other hazards. The game emphasizes skillful driving with a dynamic damage system that progressively destroys the player's vehicle. Built with modern web technologies, it runs seamlessly on desktop browsers and mobile devices.

## Platform & Technical Stack

### Target Platforms
- **Desktop browsers** (Chrome, Firefox, Safari, Edge)
- **Mobile browsers** (iOS Safari, Chrome Mobile)
- Responsive design for all screen sizes

### Technology Stack
- **TypeScript** - Type-safe development
- **Three.js** - 3D rendering engine for WebGL
- **Voxel rendering** - Custom voxel engine or voxel.js integration
- **Flat shading** - THREE.FlatShading for consistent voxel aesthetic
- **Bundler** - Vite or Webpack for development and production builds

### Build & Deployment
- **Vite** or **Webpack** for bundling and optimization
- **CI/CD** (GitHub Actions, GitLab CI) for automated deployment
- **Static hosting** (Vercel, Netlify, Cloudflare Pages, or AWS S3/CloudFront)
- Automated build pipeline for production releases
- Asset optimization (texture compression, code splitting)

## Core Gameplay

### Game Type
Vertical scroller (top-down perspective) inspired by classic games like Space Invaders, but with a driving twist.

### Control Scheme

#### Touch Controls (Mobile)
- **Tap and hold** on the lower portion of the screen to drive forward
- Vehicle automatically steers based on tap position (horizontal placement)
- Release to slow down/brake
- Simple, one-handed gameplay

#### Keyboard Controls (Desktop)
- **Arrow keys** or **WASD** for movement
  - Up/W: Accelerate forward
  - Down/S: Brake/slow down
  - Left/A: Steer left
  - Right/D: Steer right
- Smooth analog-style steering with keyboard input
- Optional mouse control support for future enhancement

### Objective
Navigate through each level, avoiding obstacles while maximizing distance traveled and near-miss bonuses. Survive as long as possible before your vehicle becomes undrivable.

## Vehicle System

### Starting Vehicles
- Car (sedan-style)
- Van (larger, possibly different handling characteristics)

### Future Expansion
- Multiple unlockable vehicle models
- Potential vehicle attributes:
  - Durability (health pool)
  - Speed
  - Maneuverability
  - Size (affects hitbox and difficulty)

### Visual Design
- Fully voxel-based 3D models
- Flat shading for clean, consistent art style
- Modular voxel destruction (individual voxels break off on impact)

## Damage System

### Voxel-Based Destruction
- Vehicle is composed of individual voxels
- Collisions with obstacles destroy voxels progressively
- Visual feedback shows increasing damage
- Different collision points affect different parts of the vehicle

### Failure Condition
- Vehicle becomes undrivable when:
  - Damage threshold is reached
  - Vehicle stops moving for a **configurable duration** (set in config file)
  - Critical voxels are destroyed (engine, wheels, etc.)

### Configuration
- Damage per obstacle type (cones vs. walls vs. pedestrians)
- Time threshold before level ends
- Durability multipliers per vehicle type

## Obstacles & Hazards

### Initial Obstacle Types
1. **Construction Cones** - Small, moderate damage
2. **Sidewalks/Curbs** - Solid barriers, high damage
3. **Pedestrians** - Moving obstacles, moderate damage
4. **Barriers** - Roadblocks, high damage
5. **Other Vehicles** - Parked or slow-moving, high damage

### Future Obstacles
- Traffic lights
- Fire hydrants
- Street signs
- Potholes
- Oil slicks (affect handling)

### Obstacle Behavior
- Static obstacles (cones, barriers)
- Dynamic obstacles (pedestrians with simple AI pathfinding)
- Procedurally placed or hand-designed patterns per level

## Level Design

### Level Structure
- Each level is a procedurally generated or pre-designed stretch of road
- Increasing difficulty through:
  - More frequent obstacles
  - Faster scrolling speed
  - Narrower passages
  - More dynamic/moving obstacles

### Progression
- Level-based progression (1, 2, 3, etc.)
- Potentially infinite mode for endless play
- Each level has distinct visual themes (city, suburbs, highway, etc.)

## Scoring System

### Score Components

#### Distance Points
- Base points per unit traveled
- Encourages forward progress and survival

#### Time Bonus
- Bonus multiplier for completing sections quickly
- Encourages aggressive driving

#### Near Miss Bonus
- **High-value bonus** for close calls with obstacles
- Detection zone around obstacles (within X units but no collision)
- Encourages skillful, risky driving
- Multiplier increases with consecutive near misses

### Score Tallying
- Level ends when vehicle stops for configured duration
- Final score displayed with breakdown:
  - Distance: X points
  - Time bonus: X points
  - Near misses: X points (Y near misses)
  - Total: Z points

### Leaderboards
- Local high scores per level
- Global leaderboards (future consideration)
- Per-vehicle leaderboards

## Art Style

### Visual Aesthetic
- **Voxel art** - chunky, low-poly 3D style
- **Flat shading** - no gradients, solid colors per face
- Bright, saturated color palette
- Clean, readable silhouettes for obstacles

### Camera
- Top-down or slightly angled perspective
- Fixed camera scrolling vertically
- Player vehicle stays in lower third of screen

### Environment
- Simple voxel roads and environments
- Parallax background layers (buildings, trees)
- Consistent flat-shaded aesthetic throughout

## Configuration System

### Config File (JSON/YAML)
Configuration file should expose key gameplay parameters:

```yaml
gameplay:
  stop_duration_threshold: 2.0  # seconds before level ends
  scroll_speed_base: 5.0
  scroll_speed_increment: 0.5  # per level

damage:
  cone: 5
  pedestrian: 10
  sidewalk: 15
  barrier: 20

scoring:
  distance_multiplier: 1.0
  time_bonus_multiplier: 2.0
  near_miss_bonus: 50
  near_miss_distance: 2.0  # units for near miss detection
  near_miss_combo_multiplier: 1.5

vehicles:
  car:
    max_health: 100
    speed: 1.0
  van:
    max_health: 150
    speed: 0.85
```

### Hot-Reloading
- Config changes should not require recompile
- Easy tuning for game balance
- A/B testing capability

## User Interface

### Main Menu
- Play button
- Vehicle selection
- Settings
- Leaderboard
- Credits

### In-Game HUD
- Score counter (live updating)
- Health/damage indicator
- Current distance
- Near miss indicator/combo counter

### End Screen
- Score breakdown
- Best score comparison
- Replay button
- Return to menu

## Audio (Future Consideration)

### Sound Effects
- Engine sounds (responsive to speed)
- Collision sounds (varied by obstacle type)
- Near miss "whoosh" sound
- Voxel destruction sounds

### Music
- Upbeat, driving background music
- Adaptive music that intensifies with speed/danger

## Technical Requirements

### Performance Targets
- 60 FPS on modern desktop browsers
- 30 FPS minimum on mobile browsers
- Efficient voxel rendering (instancing, batching, geometry merging)
- Lazy loading and asset streaming for faster initial load
- Progressive Web App (PWA) support for offline play

### Web-Specific Considerations

#### Three.js Implementation
- **InstancedMesh** for efficient voxel rendering (thousands of cubes)
- **BufferGeometry** for optimized mesh data
- **FlatShading** material for voxel aesthetic
- Custom shaders for additional effects if needed
- Physics engine integration (Cannon.js, Rapier, or custom AABB collision)

#### Voxel System
- Chunk-based voxel rendering for performance
- Dynamic voxel destruction (remove individual cubes on collision)
- Voxel pooling/reuse to minimize garbage collection
- Optional: Use MagicaVoxel (.vox) format for asset pipeline

#### Responsive Design
- Responsive canvas sizing
- Touch event handling with pointer events API
- Keyboard event handling
- Device detection for control scheme switching
- Viewport scaling for different screen sizes

#### Browser Compatibility
- WebGL 2.0 support (fallback to WebGL 1.0)
- Modern ES6+ with TypeScript compilation
- Polyfills for older browser support
- Tested on latest 2 versions of major browsers

### Build Pipeline

#### Development Setup
- **Vite** for fast HMR (Hot Module Replacement)
- TypeScript strict mode enabled
- ESLint and Prettier for code quality
- Local development server with HTTPS for mobile testing

#### Production Build
- Minification and tree-shaking
- Asset optimization (texture compression, sprite sheets)
- Code splitting for faster initial load
- Service worker for PWA caching
- Source maps for debugging

#### CI/CD Pipeline
- Automated builds on commit (GitHub Actions/GitLab CI)
- Automated testing (unit tests with Jest/Vitest)
- Preview deployments for PRs
- Production deployment to static hosting
- Version bumping and changelog generation
- Performance budgets enforcement

## Development Phases

### Phase 1: Core Prototype
- [ ] TypeScript + Vite project setup
- [ ] Three.js basic scene with camera and renderer
- [ ] Basic vehicle movement (keyboard + touch)
- [ ] Vertical scrolling camera
- [ ] Simple AABB collision detection
- [ ] Voxel car model with flat shading
- [ ] Basic cone obstacles

### Phase 2: Damage & Scoring
- [ ] Voxel destruction system (remove cubes on collision)
- [ ] Stop detection and level end
- [ ] Distance and time scoring
- [ ] Near miss detection and bonus
- [ ] HUD display (score, health, distance)

### Phase 3: Content & Polish
- [ ] Multiple obstacle types (pedestrians, barriers, sidewalks)
- [ ] Vehicle selection system (car and van)
- [ ] Level progression and difficulty scaling
- [ ] UI/UX implementation (menus, end screen)
- [ ] Config file system (JSON with hot-reload)
- [ ] Audio system (Web Audio API)

### Phase 4: Cross-Platform Optimization
- [ ] Mobile browser testing and optimization
- [ ] Touch controls refinement
- [ ] Responsive UI for different screen sizes
- [ ] Performance profiling and optimization
- [ ] WebGL batching and instancing optimization
- [ ] Asset loading optimization

### Phase 5: Build & Release
- [ ] PWA setup (manifest, service worker, icons)
- [ ] Production build configuration
- [ ] CI/CD pipeline setup (GitHub Actions)
- [ ] Static hosting deployment (Vercel/Netlify)
- [ ] Analytics integration
- [ ] SEO optimization (meta tags, OpenGraph)
- [ ] Beta testing period
- [ ] Launch

## Future Features & Expansion

### Post-Launch Content
- Additional vehicles (trucks, sports cars, motorcycles)
- New obstacle types and environments
- Power-ups (shields, temporary invincibility, boost)
- Daily challenges
- Seasonal events

### Monetization (Optional)
- Vehicle unlocks (one-time web payments or ad-rewarded)
- Cosmetic skins (colors, decals, effects)
- Premium subscription (ad-free, exclusive vehicles)
- Optional donations/tip jar (Ko-fi, Patreon integration)
- Sponsored content or brand partnerships

### Social Features
- Share high scores
- Replay system
- Challenge friends

## Success Metrics

### KPIs to Track
- Daily Active Users (DAU)
- Average session length
- Level completion rates
- Retention (D1, D7, D30)
- Near miss bonus usage (indicates skill engagement)
- Vehicle selection distribution

## Risks & Mitigation

### Technical Risks
- **Voxel rendering performance on mobile browsers**: Mitigate with WebGL instancing, geometry batching, and aggressive culling
- **Browser compatibility issues**: Comprehensive testing, WebGL fallbacks, feature detection
- **Asset loading times**: Implement progressive loading, texture compression, CDN usage
- **Mobile touch event conflicts**: Use Pointer Events API for unified input handling
- **Memory constraints on mobile**: Aggressive object pooling, voxel chunk management, garbage collection optimization

### Design Risks
- **Controls too simple/boring**: Add depth through near miss system and vehicle variety
- **Keyboard controls feeling awkward**: Tune acceleration/steering curves, add optional mouse steering
- **Damage system too punishing**: Tune with config file, playtest extensively
- **Difficulty curve too steep**: Gradual progression, config-driven balancing

## Conclusion

Cone Attack is a skill-based vertical scroller that combines nostalgic arcade gameplay with modern web technologies and a distinctive voxel art style. The progressive damage system and risk/reward near miss mechanics create engaging moment-to-moment gameplay, while the vehicle variety and level progression provide long-term goals. Built with TypeScript and Three.js, the game leverages WebGL for high-performance 3D voxel rendering across desktop and mobile browsers. The responsive control scheme adapts seamlessly between keyboard input for desktop players and intuitive touch controls for mobile users. With modern build tools and static hosting, the game can be rapidly developed, iterated upon, and deployed globally with instant updates and zero installation friction for players.
