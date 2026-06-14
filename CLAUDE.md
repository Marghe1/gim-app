# About Me

I am Margherita, a non-programmer with little experience in computers. I'm not clueless but my background is in geospatial technologies, not development.

I need you to help me develop personal projects taking care of my requirements and helping me reaching my goals without involve me in the implementation unless necessary. If you want me to make choices, explain to me in an easy to understand way.

---

# Project: GymApp

A personal workout tracking app for circuit training, similar to WoDup but for personal use only.

## Tech Stack
- React + TypeScript
- Vite (build tool)
- React Router (navigation)
- Recharts (progress charts)
- Lucide React (icons)
- PWA (installable, works offline)

## User Preferences
- Weight units: Kilograms (kg)
- Timer alerts: Vibration only (no sound)

## Development Plan
The app is being built in 5 modules (see `docs/DEVELOPMENT-PLAN.md`):

1. **Module 1**: App shell + Exercise library
2. **Module 2**: Workout Builder (create circuit templates)
3. **Module 3**: Workout Tracker + Timer
4. **Module 4**: History + Progress charts
5. **Module 5**: PWA setup + polish

## Key Files
- `docs/FEATURES.md` - Full feature list
- `docs/DEVELOPMENT-PLAN.md` - Detailed module breakdown
- `docs/ROADMAP.md` - Upcoming features and ideas
- `src/utils/storage.ts` - Data models (types) + localStorage functions

## Commands
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Data Storage
All data is stored in browser localStorage (no backend, no accounts). Keys keep
the `gymtrack_` prefix on purpose (the app was renamed to GymApp later) so
existing user data is not lost — do NOT rename them without a migration:
- `gymtrack_workouts` - Saved workout templates
- `gymtrack_workout_logs` - Completed workout logs
- `gymtrack_exercises` - Exercise library
