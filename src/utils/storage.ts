// Types defined here to avoid import issues
export type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  notes?: string;
  defaultWeight?: number;      // Starting weight in kg
  weightIncrement?: number;    // How much to increase (default 2.5kg)
};

export type WorkoutExercise = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  targetSets: number;
  targetReps: number;
  restSeconds: number;
};

export type Workout = {
  id: string;
  name: string;
  description?: string;
  exercises: WorkoutExercise[];
  createdAt: string;
  updatedAt: string;
};

export type SetLog = {
  setNumber: number;
  reps: number;
  weight: number;
  completed: boolean;
};

export type ExerciseLog = {
  exerciseId: string;
  exerciseName: string;
  sets: SetLog[];
  effortRating?: number;       // 1-5 rating of perceived effort
  note?: string;               // Personal note for this exercise in this workout
};

export type WorkoutLog = {
  id: string;
  workoutId: string;
  workoutName: string;
  date: string;
  duration: number;
  exercises: ExerciseLog[];
  notes?: string;
  completed: boolean;
};

const WORKOUTS_KEY = 'gymtrack_workouts';
const WORKOUT_LOGS_KEY = 'gymtrack_workout_logs';
const EXERCISES_KEY = 'gymtrack_exercises';

const defaultExercises: Exercise[] = [
  // Original exercises
  { id: '1', name: 'Squat', muscleGroup: 'Legs' },
  { id: '2', name: 'Deadlift', muscleGroup: 'Back' },
  { id: '3', name: 'Bench Press', muscleGroup: 'Chest' },
  { id: '4', name: 'Overhead Press', muscleGroup: 'Shoulders' },
  { id: '5', name: 'Barbell Row', muscleGroup: 'Back' },
  { id: '6', name: 'Pull-ups', muscleGroup: 'Back' },
  { id: '7', name: 'Lunges', muscleGroup: 'Legs' },
  { id: '8', name: 'Dumbbell Curl', muscleGroup: 'Arms' },
  { id: '9', name: 'Tricep Dips', muscleGroup: 'Arms' },
  { id: '10', name: 'Plank', muscleGroup: 'Core' },
  { id: '11', name: 'Russian Twist', muscleGroup: 'Core' },
  { id: '12', name: 'Leg Press', muscleGroup: 'Legs' },
  { id: '13', name: 'Lat Pulldown', muscleGroup: 'Back' },
  { id: '14', name: 'Chest Fly', muscleGroup: 'Chest' },
  { id: '15', name: 'Shoulder Lateral Raise', muscleGroup: 'Shoulders' },
  { id: '16', name: 'Leg Curl', muscleGroup: 'Legs' },
  { id: '17', name: 'Leg Extension', muscleGroup: 'Legs' },
  { id: '18', name: 'Cable Row', muscleGroup: 'Back' },
  { id: '19', name: 'Push-ups', muscleGroup: 'Chest' },
  { id: '20', name: 'Kettlebell Swing', muscleGroup: 'Full Body' },
  // PT Session exercises
  { id: '21', name: 'Cable Pallof Rotation', muscleGroup: 'Core' },
  { id: '22', name: 'Cable Pallof Press', muscleGroup: 'Core' },
  { id: '23', name: 'Ankle Pumps', muscleGroup: 'Warm-up' },
  { id: '24', name: 'Heel Drops', muscleGroup: 'Warm-up' },
  { id: '25', name: 'Pike Lifts', muscleGroup: 'Core' },
  { id: '26', name: 'Kettlebell Pullthrough', muscleGroup: 'Glutes' },
  { id: '27', name: 'Hollow Body Hold', muscleGroup: 'Core' },
  { id: '28', name: 'Romanian Deadlift', muscleGroup: 'Legs' },
  { id: '29', name: 'Bulgarian Split Squat', muscleGroup: 'Legs' },
  { id: '30', name: 'Hip Thrust', muscleGroup: 'Glutes' },
  { id: '31', name: 'Elevated Plank Row', muscleGroup: 'Back' },
  { id: '32', name: 'Stair Climber', muscleGroup: 'Cardio' },
  { id: '33', name: 'Hip Mobility', muscleGroup: 'Warm-up' },
  { id: '34', name: 'Cat Cow', muscleGroup: 'Warm-up' },
  { id: '35', name: 'Prone Scorpion', muscleGroup: 'Warm-up' },
  { id: '36', name: 'Thoracic Rotations', muscleGroup: 'Warm-up' },
  { id: '37', name: 'Walking Lunge with Rotation', muscleGroup: 'Legs' },
  { id: '38', name: 'Copenhagen Plank', muscleGroup: 'Core' },
  { id: '39', name: 'Overhead March', muscleGroup: 'Core' },
  { id: '40', name: 'Drop Jump', muscleGroup: 'Plyometrics' },
  { id: '41', name: 'Counter Movement Jump', muscleGroup: 'Plyometrics' },
  { id: '42', name: 'Ball Slams', muscleGroup: 'Full Body' },
  { id: '43', name: 'Med Ball Throws', muscleGroup: 'Full Body' },
  { id: '44', name: 'Wall Ball Shots', muscleGroup: 'Full Body' },
  { id: '45', name: 'Suspended Row', muscleGroup: 'Back' },
  { id: '46', name: 'Glute Bridge', muscleGroup: 'Glutes' },
  { id: '47', name: 'Side Plank', muscleGroup: 'Core' },
  { id: '48', name: 'Shoulder Press', muscleGroup: 'Shoulders' },
  { id: '49', name: 'Incline Walk', muscleGroup: 'Cardio' },
  { id: '50', name: 'Kettlebell Windmill', muscleGroup: 'Core' },
  { id: '51', name: 'Curl Up', muscleGroup: 'Core' },
  { id: '52', name: 'Reverse Lunge', muscleGroup: 'Legs' },
  { id: '53', name: 'Seated Row', muscleGroup: 'Back' },
  { id: '54', name: 'Back Squat', muscleGroup: 'Legs' },
  { id: '55', name: 'Bent-Over Row', muscleGroup: 'Back' },
  { id: '56', name: 'Lateral Step Down', muscleGroup: 'Legs' },
  { id: '57', name: 'Flat Bench Press', muscleGroup: 'Chest' },
  // Additional exercises from PT screenshots
  { id: '58', name: 'Single Leg Glute Bridge', muscleGroup: 'Glutes' },
  { id: '59', name: 'Forward to Side Plank', muscleGroup: 'Core' },
  { id: '60', name: 'Unilateral Cable Lat Pulldown', muscleGroup: 'Back' },
  { id: '61', name: 'Elevated Push-Up', muscleGroup: 'Chest' },
  { id: '62', name: 'Single Leg Hip Thrust', muscleGroup: 'Glutes' },
  { id: '63', name: 'Eccentric Heel Drop', muscleGroup: 'Warm-up' },
  { id: '64', name: 'Chest Ball Slam', muscleGroup: 'Full Body' },
  // B & C session exercises
  { id: '65', name: 'Straight Leg Bridge on Swiss Ball', muscleGroup: 'Glutes' },
  { id: '66', name: 'Single Leg Glute Bridge Hold', muscleGroup: 'Glutes' },
  { id: '67', name: 'Single Leg Balance with Kettlebell Round the World', muscleGroup: 'Core' },
  { id: '68', name: 'Dumbbell Single Leg Romanian Deadlift', muscleGroup: 'Legs' },
  { id: '69', name: 'Split Squat Hold with Kettlebell Pass Around', muscleGroup: 'Legs' },
  { id: '70', name: 'Single Leg Drop Jump with Stabilisation', muscleGroup: 'Plyometrics' },
  { id: '71', name: 'Box Step-Up', muscleGroup: 'Legs' },
  { id: '72', name: 'Pullover Crunch to Wall Throw', muscleGroup: 'Core' },
  { id: '73', name: "Landmine Meadow's Row to Power Press", muscleGroup: 'Full Body' },
  { id: '74', name: 'Farmers Walk', muscleGroup: 'Full Body' },
  { id: '75', name: 'Forward Plank on Swiss Ball', muscleGroup: 'Core' },
  { id: '76', name: 'Side Plank Clamshell', muscleGroup: 'Core' },
  { id: '77', name: 'Arch Body Hold', muscleGroup: 'Core' },
  { id: '78', name: 'Pogo Hop', muscleGroup: 'Plyometrics' },
  { id: '79', name: 'Drop Jump to Counter Movement Jump with Stabilisation', muscleGroup: 'Plyometrics' },
  { id: '80', name: 'Glute Bridge March', muscleGroup: 'Glutes' },
  { id: '81', name: 'Single Leg Balance on Upturned Bosu', muscleGroup: 'Core' },
  { id: '82', name: 'Single Leg Step Down', muscleGroup: 'Legs' },
  { id: '83', name: 'Deficit Bulgarian Split Squat', muscleGroup: 'Legs' },
];

export function getWorkouts(): Workout[] {
  const data = localStorage.getItem(WORKOUTS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveWorkout(workout: Workout): void {
  const workouts = getWorkouts();
  const existingIndex = workouts.findIndex(w => w.id === workout.id);
  if (existingIndex >= 0) {
    workouts[existingIndex] = workout;
  } else {
    workouts.push(workout);
  }
  localStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));
}

export function deleteWorkout(id: string): void {
  const workouts = getWorkouts().filter(w => w.id !== id);
  localStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));
}

export function getWorkoutLogs(): WorkoutLog[] {
  const data = localStorage.getItem(WORKOUT_LOGS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveWorkoutLog(log: WorkoutLog): void {
  const logs = getWorkoutLogs();
  const existingIndex = logs.findIndex(l => l.id === log.id);
  if (existingIndex >= 0) {
    logs[existingIndex] = log;
  } else {
    logs.push(log);
  }
  localStorage.setItem(WORKOUT_LOGS_KEY, JSON.stringify(logs));
}

export function deleteWorkoutLog(id: string): void {
  const logs = getWorkoutLogs().filter(l => l.id !== id);
  localStorage.setItem(WORKOUT_LOGS_KEY, JSON.stringify(logs));
}

export function getExercises(): Exercise[] {
  const data = localStorage.getItem(EXERCISES_KEY);
  if (!data) {
    localStorage.setItem(EXERCISES_KEY, JSON.stringify(defaultExercises));
    return defaultExercises;
  }

  // Parse stored exercises
  const storedExercises: Exercise[] = JSON.parse(data);

  // Check if any default exercises are missing and add them
  // This handles the case where new exercises were added after the user first loaded the app
  const storedIds = new Set(storedExercises.map(e => e.id));
  const missingExercises = defaultExercises.filter(e => !storedIds.has(e.id));

  if (missingExercises.length > 0) {
    const mergedExercises = [...storedExercises, ...missingExercises];
    localStorage.setItem(EXERCISES_KEY, JSON.stringify(mergedExercises));
    return mergedExercises;
  }

  return storedExercises;
}

export function saveExercise(exercise: Exercise): void {
  const exercises = getExercises();
  const existingIndex = exercises.findIndex(e => e.id === exercise.id);
  if (existingIndex >= 0) {
    exercises[existingIndex] = exercise;
  } else {
    exercises.push(exercise);
  }
  localStorage.setItem(EXERCISES_KEY, JSON.stringify(exercises));
}

export function deleteExercise(id: string): void {
  const exercises = getExercises().filter(e => e.id !== id);
  localStorage.setItem(EXERCISES_KEY, JSON.stringify(exercises));
}

// Workout Template type (extends Workout with template-specific fields)
export type WorkoutTemplate = Workout & {
  isTemplate: true;
  category: string;
};

// Pre-built workout templates from PT sessions (based on WoDup screenshots)
const workoutTemplates: WorkoutTemplate[] = [
  {
    id: 'template-a1',
    name: 'A1 - Lower Body & Core',
    description: 'PT session with leg press, deadlifts, split squats and core work',
    isTemplate: true,
    category: 'PT Sessions',
    exercises: [
      { id: 't1-1', exerciseId: '21', exerciseName: 'Cable Pallof Rotation', targetSets: 2, targetReps: 12, restSeconds: 30 },
      { id: 't1-2', exerciseId: '23', exerciseName: 'Ankle Pumps', targetSets: 1, targetReps: 20, restSeconds: 20 },
      { id: 't1-3', exerciseId: '63', exerciseName: 'Eccentric Heel Drop', targetSets: 1, targetReps: 10, restSeconds: 20 },
      { id: 't1-4', exerciseId: '25', exerciseName: 'Pike Lifts', targetSets: 1, targetReps: 10, restSeconds: 30 },
      { id: 't1-5', exerciseId: '26', exerciseName: 'Kettlebell Pullthrough', targetSets: 3, targetReps: 20, restSeconds: 45 },
      { id: 't1-6', exerciseId: '27', exerciseName: 'Hollow Body Hold', targetSets: 3, targetReps: 20, restSeconds: 45 },
      { id: 't1-7', exerciseId: '12', exerciseName: 'Leg Press', targetSets: 5, targetReps: 8, restSeconds: 90 },
      { id: 't1-8', exerciseId: '28', exerciseName: 'Romanian Deadlift', targetSets: 5, targetReps: 8, restSeconds: 90 },
      { id: 't1-9', exerciseId: '29', exerciseName: 'Bulgarian Split Squat', targetSets: 3, targetReps: 8, restSeconds: 60 },
      { id: 't1-10', exerciseId: '62', exerciseName: 'Single Leg Hip Thrust', targetSets: 3, targetReps: 12, restSeconds: 60 },
      { id: 't1-11', exerciseId: '31', exerciseName: 'Elevated Plank Row', targetSets: 3, targetReps: 10, restSeconds: 45 },
      { id: 't1-12', exerciseId: '32', exerciseName: 'Stair Climber', targetSets: 1, targetReps: 10, restSeconds: 0 },
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'template-a2',
    name: 'A2 - Mobility & Power',
    description: 'Dynamic workout with mobility warm-up, plyometrics, ball slams and bodyweight exercises',
    isTemplate: true,
    category: 'PT Sessions',
    exercises: [
      { id: 't2-1', exerciseId: '33', exerciseName: 'Hip Mobility', targetSets: 1, targetReps: 16, restSeconds: 20 },
      { id: 't2-2', exerciseId: '34', exerciseName: 'Cat Cow', targetSets: 1, targetReps: 8, restSeconds: 20 },
      { id: 't2-3', exerciseId: '35', exerciseName: 'Prone Scorpion', targetSets: 1, targetReps: 8, restSeconds: 20 },
      { id: 't2-4', exerciseId: '36', exerciseName: 'Thoracic Rotations', targetSets: 1, targetReps: 8, restSeconds: 30 },
      { id: 't2-5', exerciseId: '37', exerciseName: 'Walking Lunge with Rotation', targetSets: 2, targetReps: 12, restSeconds: 45 },
      { id: 't2-6', exerciseId: '38', exerciseName: 'Copenhagen Plank', targetSets: 2, targetReps: 30, restSeconds: 45 },
      { id: 't2-7', exerciseId: '39', exerciseName: 'Overhead March', targetSets: 2, targetReps: 20, restSeconds: 45 },
      { id: 't2-8', exerciseId: '40', exerciseName: 'Drop Jump', targetSets: 2, targetReps: 8, restSeconds: 60 },
      { id: 't2-9', exerciseId: '41', exerciseName: 'Counter Movement Jump', targetSets: 2, targetReps: 8, restSeconds: 60 },
      { id: 't2-10', exerciseId: '64', exerciseName: 'Chest Ball Slam', targetSets: 3, targetReps: 10, restSeconds: 30 },
      { id: 't2-11', exerciseId: '43', exerciseName: 'Med Ball Throws', targetSets: 3, targetReps: 20, restSeconds: 30 },
      { id: 't2-12', exerciseId: '42', exerciseName: 'Ball Slams', targetSets: 3, targetReps: 10, restSeconds: 30 },
      { id: 't2-13', exerciseId: '44', exerciseName: 'Wall Ball Shots', targetSets: 3, targetReps: 10, restSeconds: 45 },
      { id: 't2-14', exerciseId: '61', exerciseName: 'Elevated Push-Up', targetSets: 3, targetReps: 8, restSeconds: 60 },
      { id: 't2-15', exerciseId: '45', exerciseName: 'Suspended Row', targetSets: 3, targetReps: 10, restSeconds: 60 },
      { id: 't2-16', exerciseId: '26', exerciseName: 'Kettlebell Pullthrough', targetSets: 3, targetReps: 15, restSeconds: 45 },
      { id: 't2-17', exerciseId: '11', exerciseName: 'Russian Twist', targetSets: 3, targetReps: 20, restSeconds: 45 },
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'template-1',
    name: 'Session 1 - Lower Pull / Upper Push',
    description: 'Deadlifts, bench press, Romanian deadlift, shoulder press and leg curls',
    isTemplate: true,
    category: 'PT Sessions',
    exercises: [
      { id: 't3-1', exerciseId: '22', exerciseName: 'Cable Pallof Press', targetSets: 3, targetReps: 10, restSeconds: 30 },
      { id: 't3-2', exerciseId: '58', exerciseName: 'Single Leg Glute Bridge', targetSets: 3, targetReps: 12, restSeconds: 30 },
      { id: 't3-3', exerciseId: '59', exerciseName: 'Forward to Side Plank', targetSets: 3, targetReps: 18, restSeconds: 30 },
      { id: 't3-4', exerciseId: '2', exerciseName: 'Deadlift', targetSets: 5, targetReps: 6, restSeconds: 120 },
      { id: 't3-5', exerciseId: '57', exerciseName: 'Flat Bench Press', targetSets: 3, targetReps: 12, restSeconds: 90 },
      { id: 't3-6', exerciseId: '28', exerciseName: 'Romanian Deadlift', targetSets: 3, targetReps: 8, restSeconds: 90 },
      { id: 't3-7', exerciseId: '48', exerciseName: 'Shoulder Press', targetSets: 3, targetReps: 12, restSeconds: 60 },
      { id: 't3-8', exerciseId: '16', exerciseName: 'Leg Curl', targetSets: 3, targetReps: 12, restSeconds: 60 },
      { id: 't3-9', exerciseId: '49', exerciseName: 'Incline Walk', targetSets: 1, targetReps: 10, restSeconds: 0 },
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'template-2',
    name: 'Session 2 - Lower Push / Upper Pull',
    description: 'Back squats, rows, lateral step downs, lat pulldowns and leg extensions',
    isTemplate: true,
    category: 'PT Sessions',
    exercises: [
      { id: 't4-1', exerciseId: '50', exerciseName: 'Kettlebell Windmill', targetSets: 3, targetReps: 8, restSeconds: 30 },
      { id: 't4-2', exerciseId: '51', exerciseName: 'Curl Up', targetSets: 3, targetReps: 5, restSeconds: 30 },
      { id: 't4-3', exerciseId: '52', exerciseName: 'Reverse Lunge', targetSets: 3, targetReps: 8, restSeconds: 30 },
      { id: 't4-4', exerciseId: '53', exerciseName: 'Seated Row', targetSets: 3, targetReps: 10, restSeconds: 45 },
      { id: 't4-5', exerciseId: '54', exerciseName: 'Back Squat', targetSets: 5, targetReps: 6, restSeconds: 120 },
      { id: 't4-6', exerciseId: '55', exerciseName: 'Bent-Over Row', targetSets: 3, targetReps: 10, restSeconds: 90 },
      { id: 't4-7', exerciseId: '56', exerciseName: 'Lateral Step Down', targetSets: 3, targetReps: 10, restSeconds: 60 },
      { id: 't4-8', exerciseId: '60', exerciseName: 'Unilateral Cable Lat Pulldown', targetSets: 3, targetReps: 10, restSeconds: 60 },
      { id: 't4-9', exerciseId: '17', exerciseName: 'Leg Extension', targetSets: 3, targetReps: 12, restSeconds: 60 },
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'template-b1',
    name: 'Session B1 - Lower Power & Unilateral',
    description: 'PT session: activation, plyometrics, and single-leg lower body strength',
    isTemplate: true,
    category: 'PT Sessions',
    exercises: [
      { id: 'b1-1', exerciseId: '23', exerciseName: 'Ankle Pumps', targetSets: 1, targetReps: 20, restSeconds: 30 },
      { id: 'b1-2', exerciseId: '24', exerciseName: 'Heel Drops', targetSets: 1, targetReps: 10, restSeconds: 30 },
      { id: 'b1-3', exerciseId: '25', exerciseName: 'Pike Lifts', targetSets: 1, targetReps: 10, restSeconds: 30 },
      { id: 'b1-4', exerciseId: '65', exerciseName: 'Straight Leg Bridge on Swiss Ball', targetSets: 3, targetReps: 20, restSeconds: 30 },
      { id: 'b1-5', exerciseId: '66', exerciseName: 'Single Leg Glute Bridge Hold', targetSets: 3, targetReps: 40, restSeconds: 30 },
      { id: 'b1-6', exerciseId: '67', exerciseName: 'Single Leg Balance with Kettlebell Round the World', targetSets: 3, targetReps: 20, restSeconds: 30 },
      { id: 'b1-7', exerciseId: '40', exerciseName: 'Drop Jump', targetSets: 3, targetReps: 8, restSeconds: 60 },
      { id: 'b1-8', exerciseId: '68', exerciseName: 'Dumbbell Single Leg Romanian Deadlift', targetSets: 3, targetReps: 10, restSeconds: 60 },
      { id: 'b1-9', exerciseId: '57', exerciseName: 'Flat Bench Press', targetSets: 3, targetReps: 10, restSeconds: 60 },
      { id: 'b1-10', exerciseId: '29', exerciseName: 'Bulgarian Split Squat', targetSets: 3, targetReps: 8, restSeconds: 60 },
      { id: 'b1-11', exerciseId: '31', exerciseName: 'Elevated Plank Row', targetSets: 3, targetReps: 10, restSeconds: 60 },
      { id: 'b1-12', exerciseId: '32', exerciseName: 'Stair Climber', targetSets: 1, targetReps: 10, restSeconds: 0 },
    ],
    createdAt: '2026-06-14T00:00:00.000Z',
    updatedAt: '2026-06-14T00:00:00.000Z',
  },
  {
    id: 'template-b2',
    name: 'Session B2 - Full Body Strength & Power',
    description: 'PT session: mobility warm-up, power exercises, and full body strength circuits',
    isTemplate: true,
    category: 'PT Sessions',
    exercises: [
      { id: 'b2-1', exerciseId: '33', exerciseName: 'Hip Mobility', targetSets: 1, targetReps: 16, restSeconds: 30 },
      { id: 'b2-2', exerciseId: '34', exerciseName: 'Cat Cow', targetSets: 1, targetReps: 8, restSeconds: 30 },
      { id: 'b2-3', exerciseId: '35', exerciseName: 'Prone Scorpion', targetSets: 1, targetReps: 8, restSeconds: 30 },
      { id: 'b2-4', exerciseId: '36', exerciseName: 'Thoracic Rotations', targetSets: 1, targetReps: 8, restSeconds: 30 },
      { id: 'b2-5', exerciseId: '26', exerciseName: 'Kettlebell Pullthrough', targetSets: 3, targetReps: 20, restSeconds: 0 },
      { id: 'b2-6', exerciseId: '47', exerciseName: 'Side Plank', targetSets: 3, targetReps: 50, restSeconds: 0 },
      { id: 'b2-7', exerciseId: '69', exerciseName: 'Split Squat Hold with Kettlebell Pass Around', targetSets: 3, targetReps: 20, restSeconds: 30 },
      { id: 'b2-8', exerciseId: '70', exerciseName: 'Single Leg Drop Jump with Stabilisation', targetSets: 3, targetReps: 8, restSeconds: 60 },
      { id: 'b2-9', exerciseId: '71', exerciseName: 'Box Step-Up', targetSets: 3, targetReps: 8, restSeconds: 30 },
      { id: 'b2-10', exerciseId: '72', exerciseName: 'Pullover Crunch to Wall Throw', targetSets: 3, targetReps: 8, restSeconds: 60 },
      { id: 'b2-11', exerciseId: '62', exerciseName: 'Single Leg Hip Thrust', targetSets: 3, targetReps: 10, restSeconds: 30 },
      { id: 'b2-12', exerciseId: '73', exerciseName: "Landmine Meadow's Row to Power Press", targetSets: 3, targetReps: 8, restSeconds: 60 },
      { id: 'b2-13', exerciseId: '74', exerciseName: 'Farmers Walk', targetSets: 3, targetReps: 50, restSeconds: 60 },
    ],
    createdAt: '2026-06-14T00:00:00.000Z',
    updatedAt: '2026-06-14T00:00:00.000Z',
  },
  {
    id: 'template-c1',
    name: 'Session C1 - Lower Strength & Core',
    description: 'PT session: core stability, plyometrics, and heavy lower body strength',
    isTemplate: true,
    category: 'PT Sessions',
    exercises: [
      { id: 'c1-1', exerciseId: '75', exerciseName: 'Forward Plank on Swiss Ball', targetSets: 3, targetReps: 60, restSeconds: 30 },
      { id: 'c1-2', exerciseId: '76', exerciseName: 'Side Plank Clamshell', targetSets: 3, targetReps: 12, restSeconds: 30 },
      { id: 'c1-3', exerciseId: '77', exerciseName: 'Arch Body Hold', targetSets: 3, targetReps: 50, restSeconds: 30 },
      { id: 'c1-4', exerciseId: '78', exerciseName: 'Pogo Hop', targetSets: 3, targetReps: 12, restSeconds: 45 },
      { id: 'c1-5', exerciseId: '79', exerciseName: 'Drop Jump to Counter Movement Jump with Stabilisation', targetSets: 3, targetReps: 8, restSeconds: 60 },
      { id: 'c1-6', exerciseId: '12', exerciseName: 'Leg Press', targetSets: 5, targetReps: 8, restSeconds: 90 },
      { id: 'c1-7', exerciseId: '28', exerciseName: 'Romanian Deadlift', targetSets: 4, targetReps: 10, restSeconds: 90 },
      { id: 'c1-8', exerciseId: '19', exerciseName: 'Push-ups', targetSets: 3, targetReps: 8, restSeconds: 60 },
      { id: 'c1-9', exerciseId: '13', exerciseName: 'Lat Pulldown', targetSets: 5, targetReps: 8, restSeconds: 60 },
      { id: 'c1-10', exerciseId: '32', exerciseName: 'Stair Climber', targetSets: 1, targetReps: 10, restSeconds: 0 },
    ],
    createdAt: '2026-06-14T00:00:00.000Z',
    updatedAt: '2026-06-14T00:00:00.000Z',
  },
  {
    id: 'template-c2',
    name: 'Session C2 - Unilateral Lower & Upper',
    description: 'PT session: core, single-leg balance and strength, plus upper body pull and press',
    isTemplate: true,
    category: 'PT Sessions',
    exercises: [
      { id: 'c2-1', exerciseId: '27', exerciseName: 'Hollow Body Hold', targetSets: 3, targetReps: 40, restSeconds: 30 },
      { id: 'c2-2', exerciseId: '38', exerciseName: 'Copenhagen Plank', targetSets: 3, targetReps: 40, restSeconds: 30 },
      { id: 'c2-3', exerciseId: '80', exerciseName: 'Glute Bridge March', targetSets: 3, targetReps: 20, restSeconds: 30 },
      { id: 'c2-4', exerciseId: '81', exerciseName: 'Single Leg Balance on Upturned Bosu', targetSets: 2, targetReps: 60, restSeconds: 30 },
      { id: 'c2-5', exerciseId: '82', exerciseName: 'Single Leg Step Down', targetSets: 2, targetReps: 12, restSeconds: 30 },
      { id: 'c2-6', exerciseId: '68', exerciseName: 'Dumbbell Single Leg Romanian Deadlift', targetSets: 3, targetReps: 8, restSeconds: 60 },
      { id: 'c2-7', exerciseId: '83', exerciseName: 'Deficit Bulgarian Split Squat', targetSets: 3, targetReps: 8, restSeconds: 60 },
      { id: 'c2-8', exerciseId: '62', exerciseName: 'Single Leg Hip Thrust', targetSets: 3, targetReps: 12, restSeconds: 45 },
      { id: 'c2-9', exerciseId: '53', exerciseName: 'Seated Row', targetSets: 3, targetReps: 10, restSeconds: 60 },
      { id: 'c2-10', exerciseId: '48', exerciseName: 'Shoulder Press', targetSets: 3, targetReps: 12, restSeconds: 60 },
    ],
    createdAt: '2026-06-14T00:00:00.000Z',
    updatedAt: '2026-06-14T00:00:00.000Z',
  },
];

export function getWorkoutTemplates(): WorkoutTemplate[] {
  return workoutTemplates;
}

// Get the last used weight for a specific exercise
export function getLastWeightForExercise(exerciseId: string): number | null {
  const logs = getWorkoutLogs();
  // Sort by date, newest first
  logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  for (const log of logs) {
    if (!log.completed) continue;
    const exerciseLog = log.exercises.find(e => e.exerciseId === exerciseId);
    if (exerciseLog) {
      // Get the max weight used in any completed set
      const completedSets = exerciseLog.sets.filter(s => s.completed && s.weight > 0);
      if (completedSets.length > 0) {
        return Math.max(...completedSets.map(s => s.weight));
      }
    }
  }
  return null;
}

// Get this exercise's performance from the most recent completed workout of the
// same type (same workout template). Used to suggest weights/reps/time.
export function getLastSameWorkoutPerformance(workoutId: string, exerciseId: string): ExerciseLog | null {
  const logs = getWorkoutLogs();
  // Sort by date, newest first
  logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  for (const log of logs) {
    if (!log.completed) continue;
    if (log.workoutId !== workoutId) continue;
    const exerciseLog = log.exercises.find(e => e.exerciseId === exerciseId);
    if (exerciseLog) return exerciseLog;
  }
  return null;
}

// Get the personal best (max weight and max reps) for an exercise across all
// completed workouts. Used to detect new records during a workout.
export function getExercisePersonalBest(exerciseId: string): { maxWeight: number; maxReps: number } {
  const logs = getWorkoutLogs();
  let maxWeight = 0;
  let maxReps = 0;

  for (const log of logs) {
    if (!log.completed) continue;
    const exerciseLog = log.exercises.find(e => e.exerciseId === exerciseId);
    if (!exerciseLog) continue;
    for (const set of exerciseLog.sets) {
      if (!set.completed) continue;
      if (set.weight > maxWeight) maxWeight = set.weight;
      if (set.reps > maxReps) maxReps = set.reps;
    }
  }

  return { maxWeight, maxReps };
}

// Get the last note for a specific exercise
export function getLastNoteForExercise(exerciseId: string): string | null {
  const logs = getWorkoutLogs();
  // Sort by date, newest first
  logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  for (const log of logs) {
    if (!log.completed) continue;
    const exerciseLog = log.exercises.find(e => e.exerciseId === exerciseId);
    if (exerciseLog && exerciseLog.note) {
      return exerciseLog.note;
    }
  }
  return null;
}

// Get exercise history for charts and analysis
export type ExerciseHistoryEntry = {
  date: string;
  weight: number;
  reps: number;
  effortRating?: number;
};

export function getExerciseHistory(exerciseId: string): ExerciseHistoryEntry[] {
  const logs = getWorkoutLogs();
  const history: ExerciseHistoryEntry[] = [];

  // Sort by date, oldest first for charts
  logs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  for (const log of logs) {
    if (!log.completed) continue;
    const exerciseLog = log.exercises.find(e => e.exerciseId === exerciseId);
    if (exerciseLog) {
      const completedSets = exerciseLog.sets.filter(s => s.completed && s.weight > 0);
      if (completedSets.length > 0) {
        const maxWeight = Math.max(...completedSets.map(s => s.weight));
        const maxReps = Math.max(...completedSets.map(s => s.reps));
        history.push({
          date: log.date,
          weight: maxWeight,
          reps: maxReps,
          effortRating: exerciseLog.effortRating,
        });
      }
    }
  }
  return history;
}

// Get average effort rating for an exercise (last N sessions)
export function getAverageEffort(exerciseId: string, lastN: number = 3): number | null {
  const history = getExerciseHistory(exerciseId);
  const withRatings = history.filter(h => h.effortRating !== undefined);

  if (withRatings.length === 0) return null;

  const recent = withRatings.slice(-lastN);
  const sum = recent.reduce((acc, h) => acc + (h.effortRating || 0), 0);
  return sum / recent.length;
}

// Weight progression suggestion based on effort ratings
export type ProgressionSuggestion = {
  exerciseId: string;
  exerciseName: string;
  currentWeight: number;
  suggestedWeight: number;
  reason: 'increase' | 'maintain' | 'decrease';
  message: string;
};

export function getProgressionSuggestions(exerciseLogs: ExerciseLog[]): ProgressionSuggestion[] {
  const suggestions: ProgressionSuggestion[] = [];
  const exercises = getExercises();

  for (const log of exerciseLogs) {
    const exercise = exercises.find(e => e.id === log.exerciseId);
    const increment = exercise?.weightIncrement || 2.5;
    const avgEffort = getAverageEffort(log.exerciseId, 3);

    // Get the weight used in this workout
    const completedSets = log.sets.filter(s => s.completed && s.weight > 0);
    if (completedSets.length === 0) continue;

    const currentWeight = Math.max(...completedSets.map(s => s.weight));

    // Need at least some effort data
    if (avgEffort === null && log.effortRating === undefined) continue;

    const effort = avgEffort !== null ? avgEffort : (log.effortRating || 3);

    if (effort <= 2.5) {
      // Easy - suggest increase
      suggestions.push({
        exerciseId: log.exerciseId,
        exerciseName: log.exerciseName,
        currentWeight,
        suggestedWeight: currentWeight + increment,
        reason: 'increase',
        message: `Try ${currentWeight + increment}kg next time (+${increment}kg)`,
      });
    } else if (effort >= 4.5) {
      // Very hard - suggest decrease or maintain
      suggestions.push({
        exerciseId: log.exerciseId,
        exerciseName: log.exerciseName,
        currentWeight,
        suggestedWeight: currentWeight,
        reason: 'decrease',
        message: `Keep at ${currentWeight}kg or reduce if needed`,
      });
    } else {
      // Moderate - maintain
      suggestions.push({
        exerciseId: log.exerciseId,
        exerciseName: log.exerciseName,
        currentWeight,
        suggestedWeight: currentWeight,
        reason: 'maintain',
        message: `Good challenge level at ${currentWeight}kg`,
      });
    }
  }

  return suggestions;
}
