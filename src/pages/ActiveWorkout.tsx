import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X, Play, Pause, RotateCcw, Check } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import type { Workout, WorkoutLog, ExerciseLog } from '../utils/storage';
import { getWorkouts, getWorkoutLogs, saveWorkoutLog } from '../utils/storage';

export default function ActiveWorkout() {
  const { workoutId } = useParams();
  const navigate = useNavigate();

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [startTime] = useState(Date.now());

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerTarget, setTimerTarget] = useState(60);
  const timerRef = useRef<number | null>(null);

  // Previous workout data for comparison
  const [previousLogs, setPreviousLogs] = useState<ExerciseLog[]>([]);

  useEffect(() => {
    const workouts = getWorkouts();
    const found = workouts.find(w => w.id === workoutId);
    if (found) {
      setWorkout(found);
      // Initialize exercise logs
      const logs: ExerciseLog[] = found.exercises.map(ex => ({
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        sets: Array.from({ length: ex.targetSets }, (_, i) => ({
          setNumber: i + 1,
          reps: ex.targetReps,
          weight: 0,
          completed: false,
        })),
      }));
      setExerciseLogs(logs);

      // Find previous workout for comparison
      const allLogs = getWorkoutLogs();
      const prevLog = allLogs
        .filter(l => l.workoutId === workoutId && l.completed)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      if (prevLog) {
        setPreviousLogs(prevLog.exercises);
      }
    }
  }, [workoutId]);

  // Timer effect
  useEffect(() => {
    if (timerRunning && timerSeconds > 0) {
      timerRef.current = window.setTimeout(() => {
        setTimerSeconds(s => s - 1);
      }, 1000);
    } else if (timerRunning && timerSeconds === 0) {
      // Timer finished - vibrate
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
      setTimerRunning(false);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timerRunning, timerSeconds]);

  if (!workout) {
    return (
      <div className="page">
        <div className="empty-state">
          <p>Workout not found</p>
          <button className="btn btn-primary" onClick={() => navigate('/workouts')}>
            Back to Workouts
          </button>
        </div>
      </div>
    );
  }

  const currentExercise = workout.exercises[currentExerciseIndex];
  const currentLog = exerciseLogs[currentExerciseIndex];
  const previousLog = previousLogs.find(p => p.exerciseId === currentExercise?.exerciseId);

  function updateSet(setIndex: number, field: 'weight' | 'reps', value: number) {
    const newLogs = [...exerciseLogs];
    newLogs[currentExerciseIndex].sets[setIndex][field] = value;
    setExerciseLogs(newLogs);
  }

  function toggleSetComplete(setIndex: number) {
    const newLogs = [...exerciseLogs];
    const set = newLogs[currentExerciseIndex].sets[setIndex];
    set.completed = !set.completed;
    setExerciseLogs(newLogs);

    // Start rest timer when completing a set
    if (set.completed && currentExercise) {
      setTimerTarget(currentExercise.restSeconds);
      setTimerSeconds(currentExercise.restSeconds);
      setTimerRunning(true);
    }
  }

  function startTimer() {
    setTimerSeconds(timerTarget);
    setTimerRunning(true);
  }

  function pauseTimer() {
    setTimerRunning(false);
  }

  function resetTimer() {
    setTimerRunning(false);
    setTimerSeconds(timerTarget);
  }

  function finishWorkout() {
    if (!workout) return;
    const duration = Math.floor((Date.now() - startTime) / 1000);
    const log: WorkoutLog = {
      id: uuid(),
      workoutId: workout.id,
      workoutName: workout.name,
      date: new Date().toISOString(),
      duration,
      exercises: exerciseLogs,
      completed: true,
    };
    saveWorkoutLog(log);
    navigate('/history');
  }

  function cancelWorkout() {
    if (confirm('Cancel this workout? Your progress will be lost.')) {
      navigate('/workouts');
    }
  }

  const completedSets = currentLog?.sets.filter(s => s.completed).length || 0;
  const totalSets = currentLog?.sets.length || 0;
  const allExercisesComplete = exerciseLogs.every(ex => ex.sets.every(s => s.completed));

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <button className="btn btn-ghost" onClick={cancelWorkout}>
          <X size={24} />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 600 }}>{workout.name}</h1>
        <div style={{ width: 40 }} />
      </div>

      {/* Exercise navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <button
          className="btn btn-ghost"
          onClick={() => setCurrentExerciseIndex(i => i - 1)}
          disabled={currentExerciseIndex === 0}
        >
          <ChevronLeft size={24} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 600 }}>{currentExercise?.exerciseName}</div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>
            Exercise {currentExerciseIndex + 1} of {workout.exercises.length}
          </div>
        </div>
        <button
          className="btn btn-ghost"
          onClick={() => setCurrentExerciseIndex(i => i + 1)}
          disabled={currentExerciseIndex === workout.exercises.length - 1}
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Target info */}
      <div style={{ background: '#f3f4f6', borderRadius: 8, padding: 12, marginBottom: 16, textAlign: 'center' }}>
        <span style={{ color: '#6b7280' }}>Target: </span>
        <strong>{currentExercise?.targetSets} sets × {currentExercise?.targetReps} reps</strong>
        {previousLog && previousLog.sets[0] && (
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
            Last time: {previousLog.sets[0].weight}kg × {previousLog.sets[0].reps} reps
          </div>
        )}
      </div>

      {/* Rest Timer */}
      <div style={{ background: timerRunning ? '#6366f1' : '#e5e7eb', borderRadius: 12, padding: 16, marginBottom: 20, color: timerRunning ? 'white' : '#374151' }}>
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 14, opacity: 0.8 }}>Rest Timer</div>
          <div style={{ fontSize: 48, fontWeight: 700, fontFamily: 'monospace' }}>
            {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          {!timerRunning ? (
            <button className="btn btn-secondary btn-sm" onClick={startTimer}>
              <Play size={16} /> Start
            </button>
          ) : (
            <button className="btn btn-secondary btn-sm" onClick={pauseTimer}>
              <Pause size={16} /> Pause
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={resetTimer}>
            <RotateCcw size={16} /> Reset
          </button>
        </div>
      </div>

      {/* Sets */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontWeight: 500 }}>Sets</span>
          <span style={{ color: '#6b7280' }}>{completedSets}/{totalSets} completed</span>
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          {currentLog?.sets.map((set, index) => (
            <div
              key={index}
              style={{
                display: 'grid',
                gridTemplateColumns: '40px 1fr 1fr 50px',
                gap: 8,
                alignItems: 'center',
                padding: 12,
                background: set.completed ? '#dcfce7' : 'white',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
              }}
            >
              <div style={{ fontWeight: 500, color: '#6b7280' }}>#{set.setNumber}</div>
              <div>
                <label style={{ fontSize: 12, color: '#6b7280' }}>Weight (kg)</label>
                <input
                  type="number"
                  className="form-input"
                  style={{ padding: 8 }}
                  value={set.weight || ''}
                  onChange={e => updateSet(index, 'weight', Number(e.target.value))}
                  placeholder="0"
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#6b7280' }}>Reps</label>
                <input
                  type="number"
                  className="form-input"
                  style={{ padding: 8 }}
                  value={set.reps}
                  onChange={e => updateSet(index, 'reps', Number(e.target.value))}
                />
              </div>
              <button
                className={`btn ${set.completed ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: 8, height: 40, marginTop: 16 }}
                onClick={() => toggleSetComplete(index)}
              >
                <Check size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Exercise dots navigation */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
        {workout.exercises.map((_, index) => {
          const exLog = exerciseLogs[index];
          const isComplete = exLog?.sets.every(s => s.completed);
          const isPartial = exLog?.sets.some(s => s.completed);
          return (
            <button
              key={index}
              onClick={() => setCurrentExerciseIndex(index)}
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                background: isComplete ? '#22c55e' : isPartial ? '#f59e0b' : index === currentExerciseIndex ? '#6366f1' : '#d1d5db',
              }}
            />
          );
        })}
      </div>

      {/* Finish button */}
      <button
        className="btn btn-primary btn-block"
        onClick={finishWorkout}
        disabled={!allExercisesComplete}
        style={{ opacity: allExercisesComplete ? 1 : 0.5 }}
      >
        {allExercisesComplete ? 'Finish Workout' : 'Complete all sets to finish'}
      </button>
    </div>
  );
}
