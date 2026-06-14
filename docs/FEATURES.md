# GymApp - App Features

## What is this app?

A personal workout tracking app for your circuit training sessions. You can use it in your phone's browser and install it like a regular app. All your data stays on your device - no account needed, no subscription.

---

## Main Screens

### 1. Home / Dashboard
The first screen you see when opening the app.
- Quick summary of your recent workouts
- Button to start a new workout
- Access to your saved workout templates

### 2. My Workouts (Templates)
Where you create and manage your circuit routines.
- Create new workout templates (e.g., "Monday Upper Body", "Full Body Circuit")
- **Browse Templates** - Pre-built PT session workouts ready to import
- Each template contains a list of exercises with:
  - Exercise name (e.g., Squat, Bench Press)
  - Target sets (e.g., 3 sets)
  - Target reps (e.g., 12 reps)
  - Rest time between sets (e.g., 60 seconds)
- Edit or delete existing templates

### 3. Exercises
Manage your exercise library.
- **Quick Weight Setup** - Slider to set default weights for all exercises at once
  - Drag from 1 (Beginner) to 10 (Expert)
  - Weights auto-calculate by muscle group
  - Preview changes in real-time before applying
- Tap any exercise to see **Exercise Detail** page:
  - Weight history graph
  - Average effort rating
  - Set default weight and increment
  - Recent session history
- Add, edit, or delete custom exercises
- Filter by muscle group

### 4. Active Workout
Where you actually do your workout and log your progress.
- **Swipe Navigation** - Swipe left/right to change exercises
- **Tap dots** at top to jump to any exercise
- For each exercise, log:
  - Weight (kg) with +/- buttons
  - Reps with +/- buttons
  - Mark sets as completed
- **Add/Remove Sets** - Add extra sets or remove unwanted ones
- **Skip Exercise** - Skip exercises you want to skip today
- **Effort Rating** - After completing all sets, rate 1-5 how hard it was
- **Rest Timer** - Auto-starts when you complete a set
- **Smart Weight Pre-fill** - Weights auto-fill from last workout or default
- **Exercise Notes** - Leave a note on any exercise for your future self; it
  shows up the next time you do that exercise

### 5. Workout Complete
After finishing a workout:
- See duration and exercises completed
- **Progression Suggestions** based on your effort ratings:
  - ↑ "Try 42.5kg next time" (if rated easy)
  - ✓ "Good challenge level" (if moderate)
  - ↓ "Consider reducing" (if rated maximum)

### 6. History
View all your past workouts.
- List of completed workouts sorted by date
- Tap on any workout to see the details (exercises, weights, reps)
- Delete old records if needed

### 7. Progress
Charts showing your improvement over time.
- See how your weights have increased for each exercise
- Track total workouts per week/month
- View personal records (heaviest weight, most reps)

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Workout Templates** | Save your circuits so you don't have to recreate them |
| **PT Session Templates** | 4 pre-built workouts from personal trainer sessions |
| **Quick Weight Setup** | Set weights for all exercises with a single slider |
| **Smart Weight Pre-fill** | Auto-fills weights from your last workout |
| **Effort Rating** | Rate each exercise 1-5 to track difficulty |
| **Progression Suggestions** | Get recommendations to increase weights |
| **Swipe Between Exercises** | Navigate workouts with touch gestures |
| **Add/Remove Sets** | Adjust sets during workout |
| **Skip Exercises** | Skip exercises without losing the workout |
| **Exercise Notes** | Leave a note on an exercise for next time |
| **Rest Timer** | Automatic countdown with vibration alert |
| **Progress Charts** | Visual graphs per exercise |
| **Exercise Detail Page** | Weight history and stats per exercise |
| **Works Offline** | Use the app without internet |
| **Installable** | Add to your phone's home screen |
| **No Account Needed** | Data stored locally on your device |

---

## Exercise Library

The app comes with 77 exercises pre-loaded across these categories:

**Legs:** Squat, Back Squat, Lunges, Reverse Lunge, Leg Press, Leg Curl, Leg Extension, Romanian Deadlift, Bulgarian Split Squat, Walking Lunge with Rotation, Lateral Step Down

**Back:** Deadlift, Pull-ups, Barbell Row, Bent-Over Row, Lat Pulldown, Cable Row, Seated Row, Elevated Plank Row, Suspended Row

**Chest:** Bench Press, Flat Bench Press, Push-ups, Chest Fly

**Shoulders:** Overhead Press, Shoulder Press, Lateral Raise

**Arms:** Dumbbell Curl, Tricep Dips

**Core:** Plank, Side Plank, Russian Twist, Cable Pallof Press, Cable Pallof Rotation, Hollow Body Hold, Pike Lifts, Copenhagen Plank, Overhead March, Kettlebell Windmill, Curl Up

**Glutes:** Hip Thrust, Glute Bridge, Kettlebell Pullthrough

**Full Body:** Kettlebell Swing, Ball Slams, Med Ball Throws, Wall Ball Shots

**Plyometrics:** Drop Jump, Counter Movement Jump

**Warm-up:** Ankle Pumps, Heel Drops, Hip Mobility, Cat Cow, Prone Scorpion, Thoracic Rotations

**Cardio:** Stair Climber, Incline Walk

You can add custom exercises anytime.

---

## PT Session Templates

Eight pre-built workout templates from personal trainer sessions:

1. **Session A1 - Lower Body Focus** (12 exercises)
   - Warm-up, core work, leg press, Romanian deadlifts, Bulgarian splits, hip thrusts

2. **Session A2 - Full Body Circuit** (16 exercises)
   - Mobility warm-up, plyometrics, med ball work, push-ups, rows

3. **Session 1 - Lower Pull / Upper Push** (9 exercises)
   - Deadlifts, bench press, shoulder press, leg curls

4. **Session 2 - Lower Push / Upper Pull** (9 exercises)
   - Back squats, bent-over rows, lat pulldowns, leg extensions

5. **Session B1 - Lower Power & Unilateral** (12 exercises)
   - Activation, drop jumps, single-leg RDLs, Bulgarian splits, stair climber

6. **Session B2 - Full Body Strength & Power** (13 exercises)
   - Mobility, kettlebell circuits, box step-ups, landmine rows, farmers walk

7. **Session C1 - Lower Strength & Core** (10 exercises)
   - Swiss ball core, pogo hops, heavy leg press, barbell RDLs, lat pulldowns

8. **Session C2 - Unilateral Lower & Upper** (10 exercises)
   - Core holds, single-leg balance, deficit splits, seated rows, shoulder press

---

## Your Preferences

- **Weight units:** Kilograms (kg)
- **Timer alerts:** Vibration only (no sound)

---

## Technical Details

- **Type:** Progressive Web App (PWA)
- **Works on:** Any modern browser (Chrome, Safari, Firefox)
- **Install:** Add to home screen from browser menu
- **Data storage:** Local browser storage (stays on your device)
- **Internet:** Not required after first load
