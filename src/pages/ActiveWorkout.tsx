import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X, Play, Pause, RotateCcw, Check, Minus, Plus, Clock } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import type { Workout, WorkoutLog, ExerciseLog } from '../utils/storage';
import {
  getWorkouts,
  getWorkoutLogs,
  saveWorkoutLog,
  getExercises,
  getLastWeightForExercise,
  getProgressionSuggestions,
  type ProgressionSuggestion,
} from '../utils/storage';

const EFFORT_OPTIONS = [
  { value: 1, emoji: '😴', label: 'Very Easy' },
  { value: 2, emoji: '😊', label: 'Easy' },
  { value: 3, emoji: '😐', label: 'Moderate' },
  { value: 4, emoji: '😓', label: 'Hard' },
  { value: 5, emoji: '🔥', label: 'Maximum' },
];

export default function ActiveWorkout() {
  const { workoutId } = useParams();
  const navigate = useNavigate();

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerTarget, setTimerTarget] = useState(60);
  const timerRef = useRef<number | null>(null);

  // Previous workout data for comparison
  const [previousLogs, setPreviousLogs] = useState<ExerciseLog[]>([]);

  // Effort rating modal
  const [showEffortModal, setShowEffortModal] = useState(false);
  const [pendingEffortExerciseIndex, setPendingEffortExerciseIndex] = useState<number | null>(null);

  // Workout complete modal
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [suggestions, setSuggestions] = useState<ProgressionSuggestion[]>([]);

  // Elapsed time counter
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  useEffect(() => {
    const workouts = getWorkouts();
    const found = workouts.find(w => w.id === workoutId);
    if (found) {
      setWorkout(found);

      // Get exercise library for default weights
      const allExercises = getExercises();

      // Initialize exercise logs with smart weight pre-fill
      const logs: ExerciseLog[] = found.exercises.map(ex => {
        // Try to get last used weight, then default weight, then 0
        const lastWeight = getLastWeightForExercise(ex.exerciseId);
        const exerciseData = allExercises.find(e => e.id === ex.exerciseId);
        const defaultWeight = exerciseData?.defaultWeight || 0;
        const prefillWeight = lastWeight ?? defaultWeight;

        return {
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          sets: Array.from({ length: ex.targetSets }, (_, i) => ({
            setNumber: i + 1,
            reps: ex.targetReps,
            weight: prefillWeight,
            completed: false,
          })),
        };
      });
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

  function adjustWeight(setIndex: number, delta: number) {
    const newLogs = [...exerciseLogs];
    const currentWeight = newLogs[currentExerciseIndex].sets[setIndex].weight;
    newLogs[currentExerciseIndex].sets[setIndex].weight = Math.max(0, currentWeight + delta);
    setExerciseLogs(newLogs);
  }

  function adjustReps(setIndex: number, delta: number) {
    const newLogs = [...exerciseLogs];
    const currentReps = newLogs[currentExerciseIndex].sets[setIndex].reps;
    newLogs[currentExerciseIndex].sets[setIndex].reps = Math.max(0, currentReps + delta);
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

      // Check if all sets for this exercise are now complete
      const allSetsComplete = newLogs[currentExerciseIndex].sets.every(s => s.completed);
      if (allSetsComplete && newLogs[currentExerciseIndex].effortRating === undefined) {
        // Show effort rating modal
        setPendingEffortExerciseIndex(currentExerciseIndex);
        setShowEffortModal(true);
      }
    }
  }

  function setEffortRating(rating: number) {
    if (pendingEffortExerciseIndex === null) return;

    const newLogs = [...exerciseLogs];
    newLogs[pendingEffortExerciseIndex].effortRating = rating;
    setExerciseLogs(newLogs);

    setShowEffortModal(false);
    setPendingEffortExerciseIndex(null);

    // Auto-advance to next exercise if available
    if (currentExerciseIndex < workout!.exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
  }

  function skipEffortRating() {
    setShowEffortModal(false);
    setPendingEffortExerciseIndex(null);

    // Auto-advance to next exercise if available
    if (currentExerciseIndex < workout!.exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
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

  function adjustTimer(delta: number) {
    const newTime = Math.max(0, timerSeconds + delta);
    setTimerSeconds(newTime);
    setTimerTarget(newTime);
  }

  function finishWorkout() {
    if (!workout) return;
    const duration = Math.floor((Date.now() - startTime) / 1000);

    // Generate suggestions based on effort ratings
    const progressionSuggestions = getProgressionSuggestions(exerciseLogs);
    setSuggestions(progressionSuggestions);

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

    setShowCompleteModal(true);
  }

  function goToHistory() {
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

  // Format elapsed time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        padding: '8px 0',
      }}>
        <button className="btn btn-ghost" onClick={cancelWorkout}>
          <X size={24} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{workout.name}</div>
          <div style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Clock size={14} />
            {formatTime(elapsedTime)}
          </div>
        </div>
        <div style={{ width: 40 }} />
      </div>

      {/* Exercise navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        background: '#f3f4f6',
        borderRadius: 12,
        padding: 12,
      }}>
        <button
          className="btn btn-ghost"
          onClick={() => setCurrentExerciseIndex(i => i - 1)}
          disabled={currentExerciseIndex === 0}
          style={{ padding: 8 }}
        >
          <ChevronLeft size={28} />
        </button>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{currentExercise?.exerciseName}</div>
          <div style={{ fontSize: 13, color: '#6b7280' }}>
            Exercise {currentExerciseIndex + 1} of {workout.exercises.length}
          </div>
        </div>
        <button
          className="btn btn-ghost"
          onClick={() => setCurrentExerciseIndex(i => i + 1)}
          disabled={currentExerciseIndex === workout.exercises.length - 1}
          style={{ padding: 8 }}
        >
          <ChevronRight size={28} />
        </button>
      </div>

      {/* Target info & previous performance */}
      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 13, color: '#6b7280' }}>Target: </span>
            <strong>{currentExercise?.targetSets} × {currentExercise?.targetReps}</strong>
          </div>
          {previousLog && previousLog.sets[0] && (
            <div style={{ fontSize: 13, color: '#6b7280' }}>
              Last: {previousLog.sets[0].weight}kg × {previousLog.sets[0].reps}
            </div>
          )}
        </div>
      </div>

      {/* Sets */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontWeight: 600 }}>Sets</span>
          <span style={{ color: '#6b7280', fontSize: 14 }}>{completedSets}/{totalSets} done</span>
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          {currentLog?.sets.map((set, index) => (
            <div
              key={index}
              style={{
                display: 'grid',
                gridTemplateColumns: '36px 1fr 1fr 48px',
                gap: 8,
                alignItems: 'center',
                padding: 12,
                background: set.completed ? '#dcfce7' : 'white',
                border: `2px solid ${set.completed ? '#22c55e' : '#e5e7eb'}`,
                borderRadius: 12,
              }}
            >
              <div style={{
                fontWeight: 700,
                fontSize: 16,
                color: set.completed ? '#22c55e' : '#6b7280',
                textAlign: 'center',
              }}>
                {set.setNumber}
              </div>

              {/* Weight input with +/- */}
              <div>
                <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 4 }}>KG</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: 4, minWidth: 28 }}
                    onClick={() => adjustWeight(index, -2.5)}
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    style={{
                      width: '100%',
                      padding: '8px 4px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 16,
                      fontWeight: 600,
                      textAlign: 'center',
                    }}
                    value={set.weight || ''}
                    onChange={e => updateSet(index, 'weight', Number(e.target.value))}
                    placeholder="0"
                  />
                  <button
                    className="btn btn-ghost"
                    style={{ padding: 4, minWidth: 28 }}
                    onClick={() => adjustWeight(index, 2.5)}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Reps input with +/- */}
              <div>
                <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 4 }}>REPS</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: 4, minWidth: 28 }}
                    onClick={() => adjustReps(index, -1)}
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    style={{
                      width: '100%',
                      padding: '8px 4px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 16,
                      fontWeight: 600,
                      textAlign: 'center',
                    }}
                    value={set.reps}
                    onChange={e => updateSet(index, 'reps', Number(e.target.value))}
                  />
                  <button
                    className="btn btn-ghost"
                    style={{ padding: 4, minWidth: 28 }}
                    onClick={() => adjustReps(index, 1)}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Complete button */}
              <button
                className={`btn ${set.completed ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  padding: 8,
                  height: 48,
                  width: 48,
                  marginTop: 16,
                  borderRadius: 12,
                }}
                onClick={() => toggleSetComplete(index)}
              >
                <Check size={20} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Exercise dots navigation */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
        {workout.exercises.map((_, index) => {
          const exLog = exerciseLogs[index];
          const isComplete = exLog?.sets.every(s => s.completed);
          const isPartial = exLog?.sets.some(s => s.completed);
          const hasRating = exLog?.effortRating !== undefined;
          return (
            <button
              key={index}
              onClick={() => setCurrentExerciseIndex(index)}
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                border: hasRating ? '2px solid #f59e0b' : 'none',
                cursor: 'pointer',
                background: isComplete ? '#22c55e' : isPartial ? '#f59e0b' : index === currentExerciseIndex ? '#6366f1' : '#d1d5db',
              }}
            />
          );
        })}
      </div>

      {/* Rest Timer */}
      <div style={{
        background: timerRunning ? '#6366f1' : '#f3f4f6',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        color: timerRunning ? 'white' : '#374151',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>REST TIMER</div>
          <div style={{ fontSize: 48, fontWeight: 700, fontFamily: 'monospace' }}>
            {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => adjustTimer(-15)}
            style={{ background: timerRunning ? 'rgba(255,255,255,0.2)' : undefined }}
          >
            -15s
          </button>
          {!timerRunning ? (
            <button className="btn btn-secondary btn-sm" onClick={startTimer}>
              <Play size={16} /> Start
            </button>
          ) : (
            <button className="btn btn-secondary btn-sm" onClick={pauseTimer} style={{ background: 'rgba(255,255,255,0.2)' }}>
              <Pause size={16} /> Pause
            </button>
          )}
          <button
            className="btn btn-secondary btn-sm"
            onClick={resetTimer}
            style={{ background: timerRunning ? 'rgba(255,255,255,0.2)' : undefined }}
          >
            <RotateCcw size={16} />
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => adjustTimer(15)}
            style={{ background: timerRunning ? 'rgba(255,255,255,0.2)' : undefined }}
          >
            +15s
          </button>
        </div>
      </div>

      {/* Finish button */}
      <button
        className="btn btn-primary btn-block"
        onClick={finishWorkout}
        disabled={!allExercisesComplete}
        style={{
          opacity: allExercisesComplete ? 1 : 0.5,
          padding: 16,
          fontSize: 16,
          fontWeight: 600,
        }}
      >
        {allExercisesComplete ? 'Finish Workout' : 'Complete all sets to finish'}
      </button>

      {/* Effort Rating Modal */}
      {showEffortModal && pendingEffortExerciseIndex !== null && (
        <div
          className="modal-overlay"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={skipEffortRating}
        >
          <div
            className="modal"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: 340 }}
          >
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
                How was {exerciseLogs[pendingEffortExerciseIndex]?.exerciseName}?
              </h2>
              <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
                Rate your effort level
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
              {EFFORT_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => setEffortRating(option.value)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: 12,
                    border: '2px solid #e5e7eb',
                    borderRadius: 12,
                    background: 'white',
                    cursor: 'pointer',
                    minWidth: 56,
                  }}
                >
                  <span style={{ fontSize: 28 }}>{option.emoji}</span>
                  <span style={{ fontSize: 10, color: '#6b7280', marginTop: 4 }}>{option.value}</span>
                </button>
              ))}
            </div>

            <button
              className="btn btn-ghost btn-block"
              onClick={skipEffortRating}
              style={{ color: '#6b7280' }}
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Workout Complete Modal */}
      {showCompleteModal && (
        <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Workout Complete!</h2>
              <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
                Duration: {formatTime(elapsedTime)} • {exerciseLogs.length} exercises
              </p>
            </div>

            {suggestions.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#6b7280', marginBottom: 12 }}>
                  SUGGESTIONS FOR NEXT TIME
                </h3>
                <div style={{ display: 'grid', gap: 8 }}>
                  {suggestions.map((s, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        background: s.reason === 'increase' ? '#f0fdf4' : s.reason === 'decrease' ? '#fef2f2' : '#f3f4f6',
                        border: `1px solid ${s.reason === 'increase' ? '#bbf7d0' : s.reason === 'decrease' ? '#fecaca' : '#e5e7eb'}`,
                      }}
                    >
                      <div style={{ fontWeight: 500, marginBottom: 2 }}>
                        {s.reason === 'increase' && '↑ '}
                        {s.reason === 'decrease' && '↓ '}
                        {s.reason === 'maintain' && '✓ '}
                        {s.exerciseName}
                      </div>
                      <div style={{ fontSize: 13, color: '#6b7280' }}>
                        {s.message}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button className="btn btn-primary btn-block" onClick={goToHistory}>
              View in History
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
