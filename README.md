# Attack of Cones 🚗🚧

A fun 3D vertical scroller game where you navigate through traffic cones while avoiding (or hitting) them!

## Game Modes

- **Normal Mode**: Avoid the cones! Get points for dodging them and near misses. Lose points for hitting cones.
- **Daniel Mode**: Hit the cones! Get points for hitting cones and near misses.

## Features

- Physics-based car movement with realistic deceleration
- Dynamic procedural road generation
- Random commit message labels on each cone
- Flying cone animations on impact
- Shake animations for near misses
- Speed-dependent steering
- Progressive difficulty

## Local Development

Install dependencies:
```bash
npm install
```

Run development server:
```bash
npm run dev
```

The game will open at http://localhost:3000

## Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Deploy to Vercel

### Option 1: Vercel CLI

1. Install Vercel CLI globally:
```bash
npm install -g vercel
```

2. Deploy from your project directory:
```bash
vercel
```

3. Follow the prompts to link your project

4. For production deployment:
```bash
vercel --prod
```

### Option 2: GitHub Integration

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Import your GitHub repository
5. Vercel will automatically detect the Vite framework and deploy

No additional configuration needed - Vercel will use the settings in `vercel.json`.

## Controls

- **W / Up Arrow**: Accelerate forward
- **S / Down Arrow**: Brake / Reverse
- **A / Left Arrow**: Move left (speed-dependent)
- **D / Right Arrow**: Move right (speed-dependent)

## Tech Stack

- TypeScript
- Three.js for 3D rendering
- Vite for build tooling
- Vercel for deployment
