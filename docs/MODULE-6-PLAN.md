# Module 6: Smart Weight Tracking & Workout UI Redesign

**STATUS: PLANNING**

---

## Overview

This module adds intelligent weight management and a redesigned workout experience based on industry-standard fitness apps (Strong, Hevy, JEFIT, Fitbod).

### Goals
1. Remember and suggest weights automatically
2. Track effort/difficulty to inform progression
3. Visualize weight history per exercise
4. Redesign the active workout screen for better UX
5. Smart algorithm to suggest weight increases

---

## Feature 1: Exercise Settings & Default Weights

### What it does
Each exercise can have a **default starting weight** configured. When you add an exercise to a workout, it pre-fills with this weight instead of 0.

### User Flow
1. Go to **Exercises** page
2. Tap on an exercise → Opens **Exercise Detail** page (NEW)
3. See:
   - Exercise name & muscle group
   - **Default weight** setting (editable)
   - **Weight history graph**
   - **Average effort rating**
   - Recent performance stats

### Data Model Changes

```typescript
// Extend Exercise type
type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  notes?: string;
  defaultWeight?: number;      // NEW: Starting weight in kg
  weightIncrement?: number;    // NEW: How much to increase (default 2.5kg)
};
```

### New Page: ExerciseDetail.tsx
- Route: `/exercise/:exerciseId`
- Shows exercise info + stats + graph
- Edit default weight and increment

---

## Feature 2: Remember Last Used Weight

### What it does
When starting a workout, each exercise pre-fills with:
1. The **last weight used** for that exercise (from most recent workout)
2. Falls back to **default weight** if no history
3. Falls back to **0** if nothing configured

### Implementation
- On workout start, query `WorkoutLog` history for each exercise
- Find most recent completed set for that exercise
- Pre-fill the weight field

### Already Partially Exists
The current `ActiveWorkout.tsx` already shows "Last time: Xkg × Y reps" but doesn't pre-fill. We'll extend this to actually populate the input fields.

---

## Feature 3: Effort Rating System (RPE)

### What it does
After completing each exercise (or each set), rate the **perceived effort** from 0-5:

| Rating | Meaning | Description |
|--------|---------|-------------|
| 0 | Skipped | Didn't do this exercise |
| 1 | Very Easy | Could do many more reps |
| 2 | Easy | Could do 4+ more reps |
| 3 | Moderate | Could do 2-3 more reps |
| 4 | Hard | Could do 1 more rep |
| 5 | Maximum | Couldn't do another rep |

### Industry Standard: RPE (Rate of Perceived Exertion)
This is based on the RPE scale used in strength training, simplified to 0-5 for ease of use.

### Data Model Changes

```typescript
// Add to SetLog
type SetLog = {
  setNumber: number;
  reps: number;
  weight: number;
  completed: boolean;
  effort?: number;             // NEW: 0-5 rating
};

// Or track at exercise level
type ExerciseLog = {
  exerciseId: string;
  exerciseName: string;
  sets: SetLog[];
  effortRating?: number;       // NEW: Overall effort for this exercise
};
```

### UI Design
After marking the last set of an exercise complete, show a quick rating prompt:
```
┌─────────────────────────────────┐
│  How hard was this exercise?    │
│                                 │
│  😴  😊  😐  😓  😤  🔥         │
│   1   2   3   4   5   MAX       │
│                                 │
│        [ Skip Rating ]          │
└─────────────────────────────────┘
```

Or inline with star/circle selectors (like Strong app).

---

## Feature 4: Weight History Graph per Exercise

### What it does
On the **Exercise Detail** page, show a line chart of weight progression over time.

### Data Source
- Query all `WorkoutLog` entries
- Filter for this exercise
- Extract max weight per session
- Plot date vs weight

### Chart Display
```
Weight Progress - Squat
┌────────────────────────────────┐
│ 60kg ─────────────────●        │
│ 55kg ─────────●───────         │
│ 50kg ────●────                 │
│ 45kg ●───                      │
│      Jan  Feb  Mar  Apr        │
└────────────────────────────────┘
Average Effort: ★★★☆☆ (3.2/5)
Sessions: 12 | Best: 60kg × 8
```

### Implementation
Reuse existing `recharts` library already in the project.

---

## Feature 5: Smart Weight Progression Algorithm

### What it does
At the end of a workout, analyze performance and suggest weight increases for next time.

### Algorithm Logic

```
For each exercise in completed workout:
  1. Get effort ratings from last 2-3 sessions
  2. Calculate average effort

  IF average_effort <= 2.5 (Easy to Moderate):
    → Suggest: "Increase {exercise} by {increment}kg next time"

  IF average_effort >= 4.5 (Very Hard):
    → Suggest: "Consider reducing {exercise} or doing fewer reps"

  IF weight_increased AND effort_stayed_same:
    → Suggest: "Great progress! Keep this weight for now"
```

### Progressive Overload Rules
1. **Consistent easy ratings (1-2)** → Increase weight
2. **Consistent moderate (3)** → Keep weight, focus on form
3. **Consistent hard (4-5)** → Don't increase yet
4. **Mixed ratings** → Keep weight, need more data

### Suggestion UI (End of Workout)

```
┌─────────────────────────────────────┐
│  Workout Complete!                  │
│  Duration: 45min | 6 exercises      │
│                                     │
│  ─── Suggestions for Next Time ───  │
│                                     │
│  ↑ Squat: Try 62.5kg (+2.5kg)      │
│    Last 3 sessions rated "Easy"     │
│                                     │
│  ✓ Bench Press: Keep at 50kg       │
│    Good challenge level             │
│                                     │
│  ↓ Deadlift: Consider 55kg (-5kg)  │
│    Rated "Maximum" last 2 times     │
│                                     │
│  [ Save & Continue ]                │
└─────────────────────────────────────┘
```

### User Control
- Suggestions are **recommendations only**
- User can dismiss or apply them
- "Apply suggestion" updates the exercise's default weight

---

## Feature 6: Redesigned Active Workout Screen

### Industry Research

**Strong App (most popular)**
- Full-screen focus on current exercise
- Large weight/rep inputs
- Swipe between exercises
- Rest timer as overlay
- Quick +/- buttons for weight

**Hevy App**
- Card-based exercise view
- All sets visible at once
- Inline editing
- Previous performance shown inline

**JEFIT**
- Step-by-step guided mode
- Video/image for each exercise
- Voice countdown for rest

### Proposed New Design

#### Layout Structure
```
┌─────────────────────────────────────┐
│ ← Cancel     Session A1      45:23  │  ← Header with workout name & elapsed time
├─────────────────────────────────────┤
│                                     │
│         ROMANIAN DEADLIFT           │  ← Large exercise name
│         Back • Exercise 3/12        │  ← Muscle group + position
│                                     │
│  ┌─────────────────────────────────┐│
│  │  Last time: 40kg × 10 reps      ││  ← Previous performance
│  │  Suggested: 42.5kg              ││  ← Smart suggestion
│  └─────────────────────────────────┘│
│                                     │
│  ┌─ SET 1 ─────────────────────────┐│
│  │   [ 40 ] kg    [ 10 ] reps   ✓  ││  ← Larger inputs
│  └─────────────────────────────────┘│
│  ┌─ SET 2 ─────────────────────────┐│
│  │   [ 40 ] kg    [ 10 ] reps   ○  ││
│  └─────────────────────────────────┘│
│  ┌─ SET 3 ─────────────────────────┐│
│  │   [ 40 ] kg    [ 10 ] reps   ○  ││
│  └─────────────────────────────────┘│
│                                     │
│  ● ● ● ○ ○ ○ ○ ○ ○ ○ ○ ○           │  ← Exercise progress dots
│                                     │
│  ┌─────────────────────────────────┐│
│  │     REST TIMER: 0:45            ││  ← Prominent rest timer
│  │     [ -15s ]  [ Skip ]  [ +15s ]││
│  └─────────────────────────────────┘│
│                                     │
│  [ ← Previous ]    [ Next → ]       │  ← Navigation buttons
│                                     │
├─────────────────────────────────────┤
│         [ Finish Workout ]          │  ← Always visible
└─────────────────────────────────────┘
```

#### Key Improvements

1. **Larger Input Fields**
   - Bigger touch targets for weight/reps
   - Quick +/- buttons (±2.5kg for weight, ±1 for reps)

2. **Smarter Pre-fill**
   - Auto-fill from last workout
   - Show suggested weight if algorithm has recommendation

3. **Better Rest Timer**
   - More prominent placement
   - Quick adjust buttons (±15 seconds)
   - "Skip" to end early
   - Auto-start when set completed

4. **Exercise Navigation**
   - Swipe gestures (left/right) to change exercise
   - Progress dots show completion status
   - Tap dots to jump to specific exercise

5. **Effort Rating Integration**
   - After last set of exercise, prompt for rating
   - Small emoji selector (non-intrusive)

6. **Workout Summary**
   - Pull-down to see all exercises overview
   - Quickly jump to any exercise

---

## Implementation Plan

### Phase 1: Data Model & Storage
1. Extend `Exercise` type with `defaultWeight`, `weightIncrement`
2. Extend `SetLog` or `ExerciseLog` with `effort` rating
3. Add storage functions for exercise settings
4. Ensure backward compatibility with existing data

### Phase 2: Exercise Detail Page
1. Create new route `/exercise/:id`
2. Build Exercise Detail page with:
   - Edit default weight
   - Weight history chart
   - Stats display
3. Update Exercises list to navigate to detail page

### Phase 3: Smart Weight Pre-fill
1. Modify `ActiveWorkout` to query last workout
2. Pre-fill weight inputs from history
3. Fall back to default weight, then 0

### Phase 4: Effort Rating System
1. Add rating prompt after completing exercise
2. Save ratings to workout log
3. Display average ratings on Exercise Detail

### Phase 5: Weight Progression Algorithm
1. Create analysis function for effort history
2. Generate suggestions based on patterns
3. Show suggestions on workout completion screen
4. Allow "Apply" to update default weights

### Phase 6: Workout UI Redesign
1. Redesign ActiveWorkout layout
2. Larger inputs with +/- buttons
3. Improved rest timer placement
4. Swipe navigation
5. Exercise overview pull-down

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/utils/storage.ts` | Modify | Extend types, add effort tracking |
| `src/pages/ExerciseDetail.tsx` | Create | New exercise detail/settings page |
| `src/pages/Exercises.tsx` | Modify | Navigate to detail instead of edit modal |
| `src/pages/ActiveWorkout.tsx` | Modify | Complete redesign |
| `src/components/EffortRating.tsx` | Create | Reusable rating component |
| `src/components/WorkoutSummary.tsx` | Create | End-of-workout suggestions |
| `src/utils/progression.ts` | Create | Weight progression algorithm |
| `src/App.tsx` | Modify | Add new route |

---

## Success Criteria

1. **Weights Pre-fill** - When starting a workout, weights are already filled in
2. **Effort Tracking** - Can rate each exercise 0-5
3. **Progress Visible** - Exercise detail shows weight graph
4. **Smart Suggestions** - End of workout shows progression recommendations
5. **Better UX** - Workout screen is easier to use with larger inputs
6. **No Data Loss** - Existing workout history remains intact

---

## Open Questions

1. **Effort per set or per exercise?**
   - Per exercise is simpler (one rating)
   - Per set is more detailed but more taps
   - **Recommendation:** Per exercise (after last set)

2. **When to show suggestions?**
   - End of workout (current plan)
   - Or at start of next workout?
   - **Recommendation:** Both - show at end, remind at start

3. **Weight increments**
   - Fixed 2.5kg for all?
   - Or configurable per exercise?
   - **Recommendation:** Default 2.5kg, configurable per exercise

---

## Timeline Estimate

Not providing specific time estimates, but the work is ordered by dependency:

1. Data model changes (foundation)
2. Exercise Detail page (standalone)
3. Smart pre-fill (uses data model)
4. Effort rating (uses data model)
5. Progression algorithm (uses effort data)
6. UI redesign (can be done in parallel with 4-5)

Each phase can be deployed independently.
