import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Play, Pause, RotateCcw, Check, Minus, Plus, Clock, SkipForward, Trash2, MessageSquare } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import type { Workout, WorkoutLog, ExerciseLog, SetLog } from '../utils/storage';
import {
  getWorkouts,
  saveWorkoutLog,
  getExercises,
  getLastWeightForExercise,
  getLastNoteForExercise,
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

  // Swipe state
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);

  // Skipped exercises
  const [skippedExercises, setSkippedExercises] = useState<Set<number>>(new Set());

  // Effort rating modal
  const [showEffortModal, setShowEffortModal] = useState(false);
  const [pendingEffortExerciseIndex, setPendingEffortExerciseIndex] = useState<number | null>(null);

  // Workout complete modal
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [suggestions, setSuggestions] = useState<ProgressionSuggestion[]>([]);

  // Overall workout note (saved at the end of the session)
  const [workoutNote, setWorkoutNote] = useState('');
  const [finishedLog, setFinishedLog] = useState<WorkoutLog | null>(null);

  // Note modal
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [currentNoteText, setCurrentNoteText] = useState('');
  const [previousNotes, setPreviousNotes] = useState<{ [exerciseId: string]: string | null }>({});

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

      // Load previous notes for all exercises
      const notes: { [exerciseId: string]: string | null } = {};
      found.exercises.forEach(ex => {
        notes[ex.exerciseId] = getLastNoteForExercise(ex.exerciseId);
      });
      setPreviousNotes(notes);

      // Initialize exercise logs with smart weight pre-fill
      const logs: ExerciseLog[] = found.exercises.map(ex => {
        // Try to get last used weight
        const lastWeight = getLastWeightForExercise(ex.exerciseId);

        // Get default weight from exercise library
        const exerciseData = allExercises.find(e => e.id === ex.exerciseId);
        const defaultWeight = exerciseData?.defaultWeight ?? 0;

        // Use last weight if available, otherwise default weight
        const prefillWeight = lastWeight !== null ? lastWeight : defaultWeight;

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
    }
  }, [workoutId]);

  // Timer effect
  useEffect(() => {
    if (timerRunning && timerSeconds > 0) {
      timerRef.current = window.setTimeout(() => {
        setTimerSeconds(s => s - 1);
      }, 1000);
    } else if (timerRunning && timerSeconds === 0) {
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
  const isCurrentSkipped = skippedExercises.has(currentExerciseIndex);

  // Navigation with animation
  function goToExercise(index: number) {
    if (index < 0 || index >= workout!.exercises.length || isAnimating) return;

    const direction = index > currentExerciseIndex ? 'left' : 'right';
    setSlideDirection(direction);
    setIsAnimating(true);

    setTimeout(() => {
      setCurrentExerciseIndex(index);
      setSlideDirection(null);
      setTimeout(() => setIsAnimating(false), 50);
    }, 200);
  }

  function goNext() {
    if (currentExerciseIndex < workout!.exercises.length - 1) {
      goToExercise(currentExerciseIndex + 1);
    }
  }

  function goPrevious() {
    if (currentExerciseIndex > 0) {
      goToExercise(currentExerciseIndex - 1);
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    // Don't start swipe if touching interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('textarea')) {
      isSwiping.current = false;
      return;
    }
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
    isSwiping.current = true;
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!isSwiping.current) return;
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  }

  function handleTouchEnd() {
    if (!isSwiping.current) return;

    const diffX = touchStartX.current - touchEndX.current;
    const diffY = touchStartY.current - touchEndY.current;
    const threshold = 80; // Increased threshold for more deliberate swipes

    // Only trigger swipe if:
    // 1. Horizontal movement exceeds threshold
    // 2. Horizontal movement is greater than vertical (it's a horizontal swipe, not scroll)
    if (Math.abs(diffX) > threshold && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
      if (diffX > 0) {
        goNext();
      } else {
        goPrevious();
      }
    }
    isSwiping.current = false;
  }

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
        setPendingEffortExerciseIndex(currentExerciseIndex);
        setShowEffortModal(true);
      }
    }
  }

  function addSet() {
    const newLogs = [...exerciseLogs];
    const currentSets = newLogs[currentExerciseIndex].sets;
    const lastSet = currentSets[currentSets.length - 1];

    const newSet: SetLog = {
      setNumber: currentSets.length + 1,
      reps: lastSet?.reps || currentExercise?.targetReps || 10,
      weight: lastSet?.weight || 0,
      completed: false,
    };

    newLogs[currentExerciseIndex].sets.push(newSet);
    setExerciseLogs(newLogs);
  }

  function removeSet(setIndex: number) {
    const newLogs = [...exerciseLogs];
    if (newLogs[currentExerciseIndex].sets.length <= 1) return;

    newLogs[currentExerciseIndex].sets.splice(setIndex, 1);
    // Renumber sets
    newLogs[currentExerciseIndex].sets.forEach((set, idx) => {
      set.setNumber = idx + 1;
    });
    setExerciseLogs(newLogs);
  }

  function skipExercise() {
    const newSkipped = new Set(skippedExercises);
    newSkipped.add(currentExerciseIndex);
    setSkippedExercises(newSkipped);

    // Auto-advance to next exercise
    if (currentExerciseIndex < workout!.exercises.length - 1) {
      goNext();
    }
  }

  function unskipExercise() {
    const newSkipped = new Set(skippedExercises);
    newSkipped.delete(currentExerciseIndex);
    setSkippedExercises(newSkipped);
  }

  function setEffortRating(rating: number) {
    if (pendingEffortExerciseIndex === null) return;

    const newLogs = [...exerciseLogs];
    newLogs[pendingEffortExerciseIndex].effortRating = rating;
    setExerciseLogs(newLogs);

    setShowEffortModal(false);
    setPendingEffortExerciseIndex(null);

    // Auto-advance to next exercise
    if (currentExerciseIndex < workout!.exercises.length - 1) {
      setTimeout(() => goNext(), 100);
    }
  }

  function skipEffortRating() {
    setShowEffortModal(false);
    setPendingEffortExerciseIndex(null);

    if (currentExerciseIndex < workout!.exercises.length - 1) {
      setTimeout(() => goNext(), 100);
    }
  }

  function openNoteModal() {
    const existingNote = exerciseLogs[currentExerciseIndex]?.note || '';
    setCurrentNoteText(existingNote);
    setShowNoteModal(true);
  }

  function saveNote() {
    const newLogs = [...exerciseLogs];
    newLogs[currentExerciseIndex].note = currentNoteText.trim() || undefined;
    setExerciseLogs(newLogs);
    setShowNoteModal(false);
  }

  function clearNote() {
    setCurrentNoteText('');
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

    // Filter out skipped exercises from logs
    const completedLogs = exerciseLogs.filter((_, idx) => !skippedExercises.has(idx));

    const progressionSuggestions = getProgressionSuggestions(completedLogs);
    setSuggestions(progressionSuggestions);

    const log: WorkoutLog = {
      id: uuid(),
      workoutId: workout.id,
      workoutName: workout.name,
      date: new Date().toISOString(),
      duration,
      exercises: completedLogs,
      notes: workoutNote.trim() || undefined,
      completed: true,
    };
    saveWorkoutLog(log);
    setFinishedLog(log);

    setShowCompleteModal(true);
  }

  // Keep the saved log in sync while the user types the overall note in the
  // completion modal (localStorage upsert handled by saveWorkoutLog).
  function updateWorkoutNote(text: string) {
    setWorkoutNote(text);
    if (finishedLog) {
      const updated: WorkoutLog = { ...finishedLog, notes: text.trim() || undefined };
      setFinishedLog(updated);
      saveWorkoutLog(updated);
    }
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

  // Check if workout can be finished (all non-skipped exercises have all sets complete)
  const canFinish = exerciseLogs.every((ex, idx) =>
    skippedExercises.has(idx) || ex.sets.every(s => s.completed)
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Animation styles
  const getSlideStyle = () => {
    if (!slideDirection) return {};
    return {
      transform: slideDirection === 'left' ? 'translateX(-100%)' : 'translateX(100%)',
      opacity: 0,
    };
  };

  return (
    <div className="page" style={{ paddingBottom: 100, overflow: 'hidden' }}>
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

      {/* Exercise dots navigation */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
        {workout.exercises.map((_, index) => {
          const exLog = exerciseLogs[index];
          const isSkipped = skippedExercises.has(index);
          const isComplete = exLog?.sets.every(s => s.completed);
          const isPartial = exLog?.sets.some(s => s.completed);
          const hasRating = exLog?.effortRating !== undefined;

          return (
            <button
              key={index}
              onClick={() => goToExercise(index)}
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                border: hasRating ? '2px solid #f59e0b' : index === currentExerciseIndex ? '2px solid #6366f1' : 'none',
                cursor: 'pointer',
                background: isSkipped ? '#9ca3af' : isComplete ? '#22c55e' : isPartial ? '#f59e0b' : '#e5e7eb',
                transition: 'all 0.2s',
                transform: index === currentExerciseIndex ? 'scale(1.2)' : 'scale(1)',
              }}
            />
          );
        })}
      </div>

      {/* Swipeable exercise container */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transition: 'transform 0.2s ease-out, opacity 0.2s ease-out',
          ...getSlideStyle(),
        }}
      >
        {/* Exercise header */}
        <div style={{
          background: isCurrentSkipped ? '#f3f4f6' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          color: isCurrentSkipped ? '#6b7280' : 'white',
          textAlign: 'center',
          position: 'relative',
        }}>
          {/* Note button - top right */}
          {!isCurrentSkipped && (
            <button
              onClick={openNoteModal}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: currentLog?.note ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
                border: 'none',
                borderRadius: 8,
                padding: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <MessageSquare size={18} style={{ color: 'white' }} />
            </button>
          )}

          <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 4 }}>
            Exercise {currentExerciseIndex + 1} of {workout.exercises.length}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            {currentExercise?.exerciseName}
            {isCurrentSkipped && ' (Skipped)'}
          </div>
          <div style={{ fontSize: 14, opacity: 0.9 }}>
            Target: {currentExercise?.targetSets} × {currentExercise?.targetReps} reps
          </div>

          {/* Current note for this exercise (tap to edit) */}
          {!isCurrentSkipped && currentLog?.note && (
            <div
              onClick={openNoteModal}
              style={{
                marginTop: 12,
                padding: 10,
                background: 'rgba(255,255,255,0.2)',
                borderRadius: 8,
                fontSize: 13,
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.8, marginBottom: 4 }}>
                <MessageSquare size={13} style={{ color: 'white' }} />
                <span>Your note (tap to edit)</span>
              </div>
              <div style={{ fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                {currentLog.note}
              </div>
            </div>
          )}

          {/* Previous note hint */}
          {!isCurrentSkipped && previousNotes[currentExercise?.exerciseId] && !currentLog?.note && (
            <div style={{
              marginTop: 12,
              padding: 8,
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 8,
              fontSize: 12,
              textAlign: 'left',
            }}>
              <div style={{ opacity: 0.7, marginBottom: 2 }}>Last note:</div>
              <div style={{ fontStyle: 'italic' }}>
                "{previousNotes[currentExercise.exerciseId]}"
              </div>
            </div>
          )}

          {/* Skip/Unskip button */}
          <div style={{ marginTop: 12 }}>
            {isCurrentSkipped ? (
              <button
                className="btn btn-sm"
                onClick={unskipExercise}
                style={{ background: 'white', color: '#6366f1' }}
              >
                Restore Exercise
              </button>
            ) : (
              <button
                className="btn btn-sm"
                onClick={skipExercise}
                style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
              >
                <SkipForward size={16} />
                Skip Exercise
              </button>
            )}
          </div>
        </div>

        {/* Sets - only show if not skipped */}
        {!isCurrentSkipped && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontWeight: 600 }}>Sets ({completedSets}/{totalSets})</span>
              <button className="btn btn-secondary btn-sm" onClick={addSet}>
                <Plus size={16} /> Add Set
              </button>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              {currentLog?.sets.map((set, index) => (
                <div
                  key={index}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '32px 1fr 1fr 44px 32px',
                    gap: 6,
                    alignItems: 'center',
                    padding: 12,
                    background: set.completed ? '#dcfce7' : 'white',
                    border: `2px solid ${set.completed ? '#22c55e' : '#e5e7eb'}`,
                    borderRadius: 12,
                  }}
                >
                  <div style={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: set.completed ? '#22c55e' : '#6b7280',
                    textAlign: 'center',
                  }}>
                    {set.setNumber}
                  </div>

                  {/* Weight input */}
                  <div>
                    <label style={{ fontSize: 10, color: '#6b7280', display: 'block', marginBottom: 2 }}>KG</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: 2, minWidth: 24, fontSize: 12 }}
                        onClick={() => adjustWeight(index, -2.5)}
                      >
                        <Minus size={12} />
                      </button>
                      <input
                        type="number"
                        style={{
                          width: '100%',
                          padding: '6px 2px',
                          border: '1px solid #d1d5db',
                          borderRadius: 6,
                          fontSize: 14,
                          fontWeight: 600,
                          textAlign: 'center',
                        }}
                        value={set.weight || ''}
                        onChange={e => updateSet(index, 'weight', Number(e.target.value))}
                        placeholder="0"
                      />
                      <button
                        className="btn btn-ghost"
                        style={{ padding: 2, minWidth: 24, fontSize: 12 }}
                        onClick={() => adjustWeight(index, 2.5)}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Reps input */}
                  <div>
                    <label style={{ fontSize: 10, color: '#6b7280', display: 'block', marginBottom: 2 }}>REPS</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: 2, minWidth: 24, fontSize: 12 }}
                        onClick={() => adjustReps(index, -1)}
                      >
                        <Minus size={12} />
                      </button>
                      <input
                        type="number"
                        style={{
                          width: '100%',
                          padding: '6px 2px',
                          border: '1px solid #d1d5db',
                          borderRadius: 6,
                          fontSize: 14,
                          fontWeight: 600,
                          textAlign: 'center',
                        }}
                        value={set.reps}
                        onChange={e => updateSet(index, 'reps', Number(e.target.value))}
                      />
                      <button
                        className="btn btn-ghost"
                        style={{ padding: 2, minWidth: 24, fontSize: 12 }}
                        onClick={() => adjustReps(index, 1)}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Complete button */}
                  <button
                    className={`btn ${set.completed ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      padding: 6,
                      height: 40,
                      width: 44,
                      marginTop: 14,
                      borderRadius: 10,
                    }}
                    onClick={() => toggleSetComplete(index)}
                  >
                    <Check size={18} />
                  </button>

                  {/* Delete set button */}
                  <button
                    className="btn btn-ghost"
                    style={{ padding: 4, marginTop: 14, opacity: 0.5 }}
                    onClick={() => removeSet(index)}
                    disabled={currentLog.sets.length <= 1}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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
            <div style={{ fontSize: 42, fontWeight: 700, fontFamily: 'monospace' }}>
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
      </div>

      {/* Finish button - only show when ready */}
      {canFinish && (
        <button
          className="btn btn-primary btn-block"
          onClick={finishWorkout}
          style={{
            padding: 16,
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          Finish Workout
        </button>
      )}

      {/* Swipe hint */}
      <div style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 12 }}>
        Swipe left/right to change exercise
      </div>

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
                Duration: {formatTime(elapsedTime)} • {exerciseLogs.length - skippedExercises.size} exercises
                {skippedExercises.size > 0 && ` (${skippedExercises.size} skipped)`}
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

            {/* Overall workout note */}
            <div style={{ marginBottom: 20, textAlign: 'left' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>
                NOTE FOR THIS WORKOUT
              </h3>
              <textarea
                value={workoutNote}
                onChange={e => updateWorkoutNote(e.target.value)}
                placeholder="e.g., 'Felt tired today', 'Great session', 'Cut it short'"
                style={{
                  width: '100%',
                  padding: 12,
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: 14,
                  minHeight: 70,
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <button className="btn btn-primary btn-block" onClick={goToHistory}>
              View in History
            </button>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div
          className="modal-overlay"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowNoteModal(false)}
        >
          <div
            className="modal"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: 360 }}
          >
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
                Note for {currentLog?.exerciseName}
              </h2>
              <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
                Leave a note for your future self
              </p>
            </div>

            {/* Show previous note if exists */}
            {previousNotes[currentExercise?.exerciseId] && (
              <div style={{
                padding: 10,
                background: '#f3f4f6',
                borderRadius: 8,
                marginBottom: 12,
                fontSize: 13,
              }}>
                <div style={{ color: '#6b7280', marginBottom: 4 }}>Previous note:</div>
                <div style={{ fontStyle: 'italic' }}>
                  "{previousNotes[currentExercise.exerciseId]}"
                </div>
              </div>
            )}

            <textarea
              value={currentNoteText}
              onChange={e => setCurrentNoteText(e.target.value)}
              placeholder="e.g., 'Felt strong today', 'Watch left knee', 'Try 5kg more next time'"
              style={{
                width: '100%',
                padding: 12,
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
                minHeight: 100,
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
              autoFocus
            />

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                className="btn btn-ghost"
                onClick={clearNote}
                style={{ flex: 0 }}
              >
                Clear
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowNoteModal(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={saveNote}
                style={{ flex: 1 }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
