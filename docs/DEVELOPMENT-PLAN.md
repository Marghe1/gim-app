# Development Plan - 5 Modules

Each module is one prompt you'll ask me. After each one, you'll have something working to test.

---

## Module 1: App Shell & Exercise Library
**What you'll get:** A working app you can open in your browser with navigation and exercise management.

**Features:**
- Basic app layout with bottom navigation (Home, Workouts, History, Progress)
- Home screen with welcome message
- Exercise library screen where you can:
  - See all pre-loaded exercises
  - Add your own custom exercises
  - Edit or delete exercises
- Clean, mobile-friendly design

**To test:** Open `http://localhost:5173` in your browser, navigate between screens, add a custom exercise.

---

## Module 2: Workout Builder
**What you'll get:** Ability to create and save your circuit templates.

**Features:**
- "My Workouts" screen showing your saved templates
- Create new workout template:
  - Give it a name (e.g., "Monday Upper Body")
  - Add exercises from your library
  - Set target sets, reps, and rest time for each
  - Reorder exercises by dragging
- Edit existing templates
- Delete templates you don't need

**To test:** Create a circuit template with 4-5 exercises, save it, edit it, see it in your list.

---

## Module 3: Workout Tracker & Timer
**What you'll get:** The core feature - actually doing and logging your workout.

**Features:**
- "Start Workout" button on home screen
- Pick a template or start empty workout
- During workout:
  - See current exercise with target sets/reps
  - Log actual weight (kg) and reps for each set
  - Mark sets as completed
  - Rest timer with countdown and vibration alert
  - See previous performance ("Last time: 40kg x 12")
  - Navigate between exercises
- Finish and save the workout

**To test:** Start a workout from a template, log your sets with weights, use the rest timer, complete and save.

---

## Module 4: History & Progress Charts
**What you'll get:** See your past workouts and track improvement over time.

**Features:**
- History screen:
  - List of all completed workouts by date
  - Tap to see full details (exercises, weights, reps)
  - Delete old records
- Progress screen:
  - Chart showing weight progression per exercise
  - Personal records (best weight, most reps)
  - Weekly/monthly workout count

**To test:** After doing a few workouts, check history for details, view progress charts.

---

## Module 5: PWA & Final Polish
**What you'll get:** Installable app that works offline, ready for daily use.

**Features:**
- Install to home screen (like a real app)
- Works without internet after first load
- App icon and splash screen
- Data backup/restore option (export to file)
- Final design polish and bug fixes

**To test:** Install on your phone, turn off WiFi, use the app offline.

---

## Summary Table

| Module | Main Feature | You Can Test |
|--------|--------------|--------------|
| 1 | App shell + Exercises | Browse & add exercises |
| 2 | Workout Builder | Create circuit templates |
| 3 | Tracker + Timer | Do a real workout |
| 4 | History + Progress | See your improvement |
| 5 | PWA + Polish | Install on phone |

---

## How to Request Each Module

When you're ready, just tell me:

- **"Build Module 1"** - I'll create the app shell and exercise library
- **"Build Module 2"** - I'll add the workout builder
- etc.

After each module, I'll tell you how to run and test it.
