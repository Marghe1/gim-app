// Types defined here to avoid import issues
export type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  notes?: string;
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
  return JSON.parse(data);
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

// Pre-built workout templates from PT sessions
const workoutTemplates: WorkoutTemplate[] = [
  {
    id: 'template-a1',
    name: 'Session A1 - Lower Body Focus',
    description: 'PT session focusing on lower body strength with warm-up and accessory work',
    isTemplate: true,
    category: 'PT Sessions',
    exercises: [
      { id: 't1-1', exerciseId: '21', exerciseName: 'Cable Pallof Rotation', targetSets: 2, targetReps: 10, restSeconds: 30 },
      { id: 't1-2', exerciseId: '23', exerciseName: 'Ankle Pumps', targetSets: 2, targetReps: 15, restSeconds: 30 },
      { id: 't1-3', exerciseId: '24', exerciseName: 'Heel Drops', targetSets: 2, targetReps: 12, restSeconds: 30 },
      { id: 't1-4', exerciseId: '25', exerciseName: 'Pike Lifts', targetSets: 2, targetReps: 10, restSeconds: 30 },
      { id: 't1-5', exerciseId: '26', exerciseName: 'Kettlebell Pullthrough', targetSets: 3, targetReps: 12, restSeconds: 45 },
      { id: 't1-6', exerciseId: '27', exerciseName: 'Hollow Body Hold', targetSets: 3, targetReps: 30, restSeconds: 45 },
      { id: 't1-7', exerciseId: '12', exerciseName: 'Leg Press', targetSets: 4, targetReps: 10, restSeconds: 90 },
      { id: 't1-8', exerciseId: '28', exerciseName: 'Romanian Deadlift', targetSets: 3, targetReps: 10, restSeconds: 90 },
      { id: 't1-9', exerciseId: '29', exerciseName: 'Bulgarian Split Squat', targetSets: 3, targetReps: 10, restSeconds: 60 },
      { id: 't1-10', exerciseId: '30', exerciseName: 'Hip Thrust', targetSets: 3, targetReps: 12, restSeconds: 60 },
      { id: 't1-11', exerciseId: '31', exerciseName: 'Elevated Plank Row', targetSets: 3, targetReps: 10, restSeconds: 45 },
      { id: 't1-12', exerciseId: '32', exerciseName: 'Stair Climber', targetSets: 1, targetReps: 10, restSeconds: 0 },
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'template-a2',
    name: 'Session A2 - Full Body Circuit',
    description: 'Dynamic full body workout with mobility warm-up, plyometrics, and power exercises',
    isTemplate: true,
    category: 'PT Sessions',
    exercises: [
      { id: 't2-1', exerciseId: '33', exerciseName: 'Hip Mobility', targetSets: 2, targetReps: 10, restSeconds: 30 },
      { id: 't2-2', exerciseId: '34', exerciseName: 'Cat Cow', targetSets: 2, targetReps: 10, restSeconds: 30 },
      { id: 't2-3', exerciseId: '35', exerciseName: 'Prone Scorpion', targetSets: 2, targetReps: 8, restSeconds: 30 },
      { id: 't2-4', exerciseId: '36', exerciseName: 'Thoracic Rotations', targetSets: 2, targetReps: 10, restSeconds: 30 },
      { id: 't2-5', exerciseId: '37', exerciseName: 'Walking Lunge with Rotation', targetSets: 2, targetReps: 10, restSeconds: 45 },
      { id: 't2-6', exerciseId: '38', exerciseName: 'Copenhagen Plank', targetSets: 2, targetReps: 10, restSeconds: 45 },
      { id: 't2-7', exerciseId: '39', exerciseName: 'Overhead March', targetSets: 2, targetReps: 12, restSeconds: 45 },
      { id: 't2-8', exerciseId: '40', exerciseName: 'Drop Jump', targetSets: 3, targetReps: 5, restSeconds: 60 },
      { id: 't2-9', exerciseId: '41', exerciseName: 'Counter Movement Jump', targetSets: 3, targetReps: 5, restSeconds: 60 },
      { id: 't2-10', exerciseId: '42', exerciseName: 'Ball Slams', targetSets: 3, targetReps: 10, restSeconds: 45 },
      { id: 't2-11', exerciseId: '43', exerciseName: 'Med Ball Throws', targetSets: 3, targetReps: 8, restSeconds: 45 },
      { id: 't2-12', exerciseId: '44', exerciseName: 'Wall Ball Shots', targetSets: 3, targetReps: 10, restSeconds: 45 },
      { id: 't2-13', exerciseId: '19', exerciseName: 'Push-ups', targetSets: 3, targetReps: 12, restSeconds: 60 },
      { id: 't2-14', exerciseId: '45', exerciseName: 'Suspended Row', targetSets: 3, targetReps: 10, restSeconds: 60 },
      { id: 't2-15', exerciseId: '26', exerciseName: 'Kettlebell Pullthrough', targetSets: 3, targetReps: 12, restSeconds: 45 },
      { id: 't2-16', exerciseId: '11', exerciseName: 'Russian Twist', targetSets: 3, targetReps: 20, restSeconds: 45 },
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'template-1',
    name: 'Session 1 - Lower Pull / Upper Push',
    description: 'Strength session combining deadlifts with bench press and accessory work',
    isTemplate: true,
    category: 'PT Sessions',
    exercises: [
      { id: 't3-1', exerciseId: '22', exerciseName: 'Cable Pallof Press', targetSets: 2, targetReps: 10, restSeconds: 30 },
      { id: 't3-2', exerciseId: '46', exerciseName: 'Glute Bridge', targetSets: 2, targetReps: 15, restSeconds: 30 },
      { id: 't3-3', exerciseId: '47', exerciseName: 'Side Plank', targetSets: 2, targetReps: 30, restSeconds: 30 },
      { id: 't3-4', exerciseId: '2', exerciseName: 'Deadlift', targetSets: 4, targetReps: 6, restSeconds: 120 },
      { id: 't3-5', exerciseId: '57', exerciseName: 'Flat Bench Press', targetSets: 4, targetReps: 8, restSeconds: 90 },
      { id: 't3-6', exerciseId: '28', exerciseName: 'Romanian Deadlift', targetSets: 3, targetReps: 10, restSeconds: 90 },
      { id: 't3-7', exerciseId: '48', exerciseName: 'Shoulder Press', targetSets: 3, targetReps: 10, restSeconds: 60 },
      { id: 't3-8', exerciseId: '16', exerciseName: 'Leg Curl', targetSets: 3, targetReps: 12, restSeconds: 60 },
      { id: 't3-9', exerciseId: '49', exerciseName: 'Incline Walk', targetSets: 1, targetReps: 15, restSeconds: 0 },
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'template-2',
    name: 'Session 2 - Lower Push / Upper Pull',
    description: 'Strength session combining squats with rows and accessory work',
    isTemplate: true,
    category: 'PT Sessions',
    exercises: [
      { id: 't4-1', exerciseId: '50', exerciseName: 'Kettlebell Windmill', targetSets: 2, targetReps: 8, restSeconds: 30 },
      { id: 't4-2', exerciseId: '51', exerciseName: 'Curl Up', targetSets: 2, targetReps: 10, restSeconds: 30 },
      { id: 't4-3', exerciseId: '52', exerciseName: 'Reverse Lunge', targetSets: 2, targetReps: 10, restSeconds: 30 },
      { id: 't4-4', exerciseId: '53', exerciseName: 'Seated Row', targetSets: 2, targetReps: 12, restSeconds: 45 },
      { id: 't4-5', exerciseId: '54', exerciseName: 'Back Squat', targetSets: 4, targetReps: 6, restSeconds: 120 },
      { id: 't4-6', exerciseId: '55', exerciseName: 'Bent-Over Row', targetSets: 4, targetReps: 8, restSeconds: 90 },
      { id: 't4-7', exerciseId: '56', exerciseName: 'Lateral Step Down', targetSets: 3, targetReps: 10, restSeconds: 60 },
      { id: 't4-8', exerciseId: '13', exerciseName: 'Lat Pulldown', targetSets: 3, targetReps: 10, restSeconds: 60 },
      { id: 't4-9', exerciseId: '17', exerciseName: 'Leg Extension', targetSets: 3, targetReps: 12, restSeconds: 60 },
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

export function getWorkoutTemplates(): WorkoutTemplate[] {
  return workoutTemplates;
}
