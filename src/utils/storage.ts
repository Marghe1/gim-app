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
