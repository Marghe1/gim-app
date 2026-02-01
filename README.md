# GymTrack

A personal workout tracking app for circuit training.

## Features

- **Workout Templates** - Save your circuits and reuse them
- **PT Session Templates** - Pre-built workouts from personal trainer sessions
- **Quick Weight Setup** - Set default weights for all exercises with a simple slider
- **Smart Weight Tracking** - Auto-fills weights from your last workout
- **Effort Rating** - Rate each exercise (1-5) to track difficulty
- **Progression Suggestions** - Get recommendations to increase weights
- **Track Weights & Reps** - Log what you actually did
- **Rest Timer** - Countdown between sets with vibration alert
- **Progress Charts** - See your improvement over time per exercise
- **Swipe Navigation** - Swipe between exercises during workout
- **Works Offline** - Use without internet after first load
- **Installable** - Add to your phone like a regular app

## Getting Started

### Prerequisites

- Node.js (v18 or higher)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Install on Phone

1. Open the app in Chrome/Safari on your phone
2. Tap the browser menu
3. Select "Add to Home Screen"

## Quick Start Guide

1. **Set Up Your Weights** - Go to Exercises → Quick Weight Setup → drag slider to your strength level → Apply
2. **Import a Template** - Go to My Workouts → Browse Templates → pick a PT session → Use Template
3. **Start Working Out** - Tap "Start" on any workout → swipe between exercises → mark sets complete
4. **Rate Your Effort** - After completing all sets of an exercise, rate how hard it was (1-5)
5. **Check Suggestions** - At workout end, see recommendations to increase or maintain weights

## Development

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Tech Stack

- React + TypeScript
- Vite
- React Router
- Recharts (progress charts)
- PWA (Progressive Web App)

## Documentation

- [Features](docs/FEATURES.md) - Full feature list
- [Development Plan](docs/DEVELOPMENT-PLAN.md) - Module breakdown
- [Module 6 Plan](docs/MODULE-6-PLAN.md) - Smart weight tracking design


<3