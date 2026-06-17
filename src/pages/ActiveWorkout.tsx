import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Play, Pause, RotateCcw, Check, Minus, Plus, Clock, SkipForward, Trash2, MessageSquare, Youtube } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import type { Workout, WorkoutLog, ExerciseLog, SetLog, ExerciseGroup } from '../utils/storage';
import {
  getWorkouts,
  saveWorkoutLog,
  getExercises,
  getExerciseGroups,
  getExerciseVideoUrl,
  getLastWeightForExercise,
  getLastNoteForExercise,
  getExercisePersonalBest,
  getLastSameWorkoutPerformance,
  getProgressionSuggestions,
  formatCount,
  formatDuration,
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
  // Navigation is by group (a circuit, or a single standalone exercise)
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
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

  // Skipped exercises (by index into workout.exercises)
  const [skippedExercises, setSkippedExercises] = useState<Set<number>>(new Set());

  // Effort rating modal (rated per group)
  const [showEffortModal, setShowEffortModal] = useState(false);
  const [pendingEffortGroupIndex, setPendingEffortGroupIndex] = useState<number | null>(null);

  // Workout complete modal
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [suggestions, setSuggestions] = useState<ProgressionSuggestion[]>([]);

  // Overall workout note (saved at the end of the session)
  const [workoutNote, setWorkoutNote] = useState('');
  const [finishedLog, setFinishedLog] = useState<WorkoutLog | null>(null);

  // Note modal (per exercise)
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteExerciseIndex, setNoteExerciseIndex] = useState<number | null>(null);
  const [currentNoteText, setCurrentNoteText] = useState('');
  const [previousNotes, setPreviousNotes] = useState<{ [exerciseId: string]: string | null }>({});

  // Last performance for each exercise from the previous workout of the same type
  const [lastPerformance, setLastPerformance] = useState<{ [exerciseId: string]: ExerciseLog | null }>({});

  // Exercise ids that are time-based (seconds instead of reps)
  const [timedExercises, setTimedExercises] = useState<Set<string>>(new Set());

  // Optional per-exercise video overrides (exerciseId -> specific YouTube URL)
  const [videoOverrides, setVideoOverrides] = useState<{ [id: string]: string | undefined }>({});

  // Personal-best records (snapshot taken before this workout). Mutated in-place
  // as new records are hit so later sets compare against the running best.
  const personalBests = useRef<{ [exerciseId: string]: { maxWeight: number; maxReps: number } }>({});
  const [recordMessage, setRecordMessage] = useState<string | null>(null);
  const recordTimeoutRef = useRef<number | null>(null);

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
      setTimedExercises(new Set(allExercises.filter(e => e.isTimed).map(e => e.id)));
      setVideoOverrides(Object.fromEntries(allExercises.map(e => [e.id, e.videoUrl])));

      // Load previous notes for all exercises
      const notes: { [exerciseId: string]: string | null } = {};
      found.exercises.forEach(ex => {
        notes[ex.exerciseId] = getLastNoteForExercise(ex.exerciseId);
      });
      setPreviousNotes(notes);

      // Snapshot personal bests before the workout starts
      const bests: { [exerciseId: string]: { maxWeight: number; maxReps: number } } = {};
      found.exercises.forEach(ex => {
        bests[ex.exerciseId] = getExercisePersonalBest(ex.exerciseId);
      });
      personalBests.current = bests;

      // Load last performance from the previous workout of the same type
      const perf: { [exerciseId: string]: ExerciseLog | null } = {};
      found.exercises.forEach(ex => {
        perf[ex.exerciseId] = getLastSameWorkoutPerformance(found.id, ex.exerciseId);
      });
      setLastPerformance(perf);

      // Initialize exercise logs with smart weight/reps pre-fill
      const logs: ExerciseLog[] = found.exercises.map(ex => {
        const lastPerf = perf[ex.exerciseId];

        // Get default weight from exercise library
        const exerciseData = allExercises.find(e => e.id === ex.exerciseId);
        const defaultWeight = exerciseData?.defaultWeight ?? 0;

        // Fallback weight: last weight used anywhere, otherwise the default
        const lastWeight = getLastWeightForExercise(ex.exerciseId);
        const fallbackWeight = lastWeight !== null ? lastWeight : defaultWeight;

        return {
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          sets: Array.from({ length: ex.targetSets }, (_, i) => {
            // Prefer the matching set from last same-type workout
            const prev = lastPerf?.sets[i];
            return {
              setNumber: i + 1,
              reps: prev?.reps ?? ex.targetReps,
              weight: prev?.weight ?? fallbackWeight,
              completed: false,
            };
          }),
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

  // Group the exercises into circuits / standalone exercises
  const groups: ExerciseGroup[] = useMemo(
    () => (workout ? getExerciseGroups(workout.exercises) : []),
    [workout]
  );

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

  const currentGroup = groups[currentGroupIndex];
  const isCircuit = (currentGroup?.items.length ?? 0) > 1;

  // Number of rounds in a group = the most sets any of its exercises has
  function roundCountFor(group: ExerciseGroup): number {
    return group.items.reduce((max, item) => {
      const len = exerciseLogs[item.index]?.sets.length ?? 0;
      return Math.max(max, len);
    }, 0);
  }

  // Whether every non-skipped exercise in a group has all its sets completed
  function isGroupComplete(group: ExerciseGroup): boolean {
    const active = group.items.filter(it => !skippedExercises.has(it.index));
    if (active.length === 0) return true;
    return active.every(it => exerciseLogs[it.index]?.sets.every(s => s.completed));
  }

  function openVideo(exerciseId: string, exerciseName: string) {
    window.open(
      getExerciseVideoUrl({ name: exerciseName, videoUrl: videoOverrides[exerciseId] }),
      '_blank',
      'noopener'
    );
  }

  // Navigation with animation
  function goToGroup(index: number) {
    if (index < 0 || index >= groups.length || isAnimating) return;

    const direction = index > currentGroupIndex ? 'left' : 'right';
    setSlideDirection(direction);
    setIsAnimating(true);

    setTimeout(() => {
      setCurrentGroupIndex(index);
      setSlideDirection(null);
      setTimeout(() => setIsAnimating(false), 50);
    }, 200);
  }

  function goNext() {
    if (currentGroupIndex < groups.length - 1) {
      goToGroup(currentGroupIndex + 1);
    }
  }

  function goPrevious() {
    if (currentGroupIndex > 0) {
      goToGroup(currentGroupIndex - 1);
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

  function updateSet(exIndex: number, setIndex: number, field: 'weight' | 'reps', value: number) {
    const newLogs = [...exerciseLogs];
    newLogs[exIndex].sets[setIndex][field] = value;
    setExerciseLogs(newLogs);
  }

  function adjustWeight(exIndex: number, setIndex: number, delta: number) {
    const newLogs = [...exerciseLogs];
    const current = newLogs[exIndex].sets[setIndex].weight;
    newLogs[exIndex].sets[setIndex].weight = Math.max(0, current + delta);
    setExerciseLogs(newLogs);
  }

  function adjustReps(exIndex: number, setIndex: number, delta: number) {
    const newLogs = [...exerciseLogs];
    const current = newLogs[exIndex].sets[setIndex].reps;
    newLogs[exIndex].sets[setIndex].reps = Math.max(0, current + delta);
    setExerciseLogs(newLogs);
  }

  function showRecord(message: string) {
    setRecordMessage(message);
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    if (recordTimeoutRef.current) clearTimeout(recordTimeoutRef.current);
    recordTimeoutRef.current = window.setTimeout(() => setRecordMessage(null), 4000);
  }

  function toggleSetComplete(exIndex: number, setIndex: number) {
    const newLogs = [...exerciseLogs];
    const set = newLogs[exIndex].sets[setIndex];
    set.completed = !set.completed;
    setExerciseLogs(newLogs);

    const exercise = workout!.exercises[exIndex];

    // Celebrate a new personal record when completing a set
    if (set.completed && exercise) {
      const pb = personalBests.current[exercise.exerciseId];
      if (pb) {
        if (set.weight > 0 && pb.maxWeight > 0 && set.weight > pb.maxWeight) {
          const delta = set.weight - pb.maxWeight;
          const deltaStr = delta % 1 === 0 ? `${delta}` : delta.toFixed(1);
          showRecord(`🏆 New record! +${deltaStr} kg`);
          pb.maxWeight = set.weight;
        } else if (set.weight === 0 && pb.maxReps > 0 && set.reps > pb.maxReps) {
          const delta = set.reps - pb.maxReps;
          const isTimed = timedExercises.has(exercise.exerciseId);
          showRecord(`🏆 New record! +${formatCount(delta, isTimed)}`);
          pb.maxReps = set.reps;
        }
      }
    }

    // Start rest timer when completing a set
    if (set.completed && exercise) {
      setTimerTarget(exercise.restSeconds);
      setTimerSeconds(exercise.restSeconds);
      setTimerRunning(true);

      // If the whole circuit/exercise is now done, ask for an effort rating once
      const group = groups[currentGroupIndex];
      if (group) {
        const active = group.items.filter(it => !skippedExercises.has(it.index));
        const allComplete = active.every(it => newLogs[it.index]?.sets.every(s => s.completed));
        const alreadyRated = active.some(it => newLogs[it.index]?.effortRating !== undefined);
        if (allComplete && active.length > 0 && !alreadyRated) {
          setPendingEffortGroupIndex(currentGroupIndex);
          setShowEffortModal(true);
        }
      }
    }
  }

  // Add a round to a circuit (one extra set to every exercise in the group)
  function addRound(group: ExerciseGroup) {
    const newLogs = [...exerciseLogs];
    group.items.forEach(item => {
      if (skippedExercises.has(item.index)) return;
      const sets = newLogs[item.index].sets;
      const lastSet = sets[sets.length - 1];
      const newSet: SetLog = {
        setNumber: sets.length + 1,
        reps: lastSet?.reps || item.exercise.targetReps || 10,
        weight: lastSet?.weight || 0,
        completed: false,
      };
      sets.push(newSet);
    });
    setExerciseLogs(newLogs);
  }

  function removeSet(exIndex: number, setIndex: number) {
    const newLogs = [...exerciseLogs];
    if (newLogs[exIndex].sets.length <= 1) return;

    newLogs[exIndex].sets.splice(setIndex, 1);
    // Renumber sets
    newLogs[exIndex].sets.forEach((set, idx) => {
      set.setNumber = idx + 1;
    });
    setExerciseLogs(newLogs);
  }

  function skipExercise(exIndex: number) {
    const newSkipped = new Set(skippedExercises);
    newSkipped.add(exIndex);
    setSkippedExercises(newSkipped);
  }

  function unskipExercise(exIndex: number) {
    const newSkipped = new Set(skippedExercises);
    newSkipped.delete(exIndex);
    setSkippedExercises(newSkipped);
  }

  function setEffortRating(rating: number) {
    if (pendingEffortGroupIndex === null) return;

    const group = groups[pendingEffortGroupIndex];
    const newLogs = [...exerciseLogs];
    group.items.forEach(item => {
      if (skippedExercises.has(item.index)) return;
      newLogs[item.index].effortRating = rating;
    });
    setExerciseLogs(newLogs);

    setShowEffortModal(false);
    setPendingEffortGroupIndex(null);

    // Auto-advance to next group
    if (currentGroupIndex < groups.length - 1) {
      setTimeout(() => goNext(), 100);
    }
  }

  function skipEffortRating() {
    setShowEffortModal(false);
    setPendingEffortGroupIndex(null);

    if (currentGroupIndex < groups.length - 1) {
      setTimeout(() => goNext(), 100);
    }
  }

  function openNoteModal(exIndex: number) {
    setNoteExerciseIndex(exIndex);
    setCurrentNoteText(exerciseLogs[exIndex]?.note || '');
    setShowNoteModal(true);
  }

  function saveNote() {
    if (noteExerciseIndex === null) return;
    const newLogs = [...exerciseLogs];
    newLogs[noteExerciseIndex].note = currentNoteText.trim() || undefined;
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

  // Check if workout can be finished (all non-skipped exercises have all sets complete)
  const canFinish = exerciseLogs.every((ex, idx) =>
    skippedExercises.has(idx) || ex.sets.every(s => s.completed)
  );

  // Animation styles
  const getSlideStyle = () => {
    if (!slideDirection) return {};
    return {
      transform: slideDirection === 'left' ? 'translateX(-100%)' : 'translateX(100%)',
      opacity: 0,
    };
  };

  // Render a single editable set row for an exercise within a round
  function renderSetRow(exIndex: number, setIndex: number, leftLabel: string) {
    const log = exerciseLogs[exIndex];
    const set = log?.sets[setIndex];
    if (!set) return null;
    const exercise = workout!.exercises[exIndex];
    const isTimed = timedExercises.has(exercise.exerciseId);
    const prev = lastPerformance[exercise.exerciseId]?.sets[setIndex];

    return (
      <div
        key={`${exIndex}-${setIndex}`}
        style={{
          display: 'grid',
          gridTemplateColumns: isTimed ? '44px 1fr 44px 32px' : '44px 1fr 1fr 44px 32px',
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
          fontSize: 13,
          color: set.completed ? '#22c55e' : '#6b7280',
          textAlign: 'center',
        }}>
          {leftLabel}
        </div>

        {/* Weight input */}
        {!isTimed && (
          <div>
            <label style={{ fontSize: 10, color: '#6b7280', display: 'block', marginBottom: 2 }}>KG</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <button
                className="btn btn-ghost"
                style={{ padding: 2, minWidth: 24, fontSize: 12 }}
                onClick={() => adjustWeight(exIndex, setIndex, -2.5)}
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
                onChange={e => updateSet(exIndex, setIndex, 'weight', Number(e.target.value))}
                placeholder="0"
              />
              <button
                className="btn btn-ghost"
                style={{ padding: 2, minWidth: 24, fontSize: 12 }}
                onClick={() => adjustWeight(exIndex, setIndex, 2.5)}
              >
                <Plus size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Reps / time input */}
        <div>
          <label style={{ fontSize: 10, color: '#6b7280', display: 'block', marginBottom: 2 }}>{isTimed ? 'SEC' : 'REPS'}</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <button
              className="btn btn-ghost"
              style={{ padding: 2, minWidth: 24, fontSize: 12 }}
              onClick={() => adjustReps(exIndex, setIndex, -1)}
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
              onChange={e => updateSet(exIndex, setIndex, 'reps', Number(e.target.value))}
            />
            <button
              className="btn btn-ghost"
              style={{ padding: 2, minWidth: 24, fontSize: 12 }}
              onClick={() => adjustReps(exIndex, setIndex, 1)}
            >
              <Plus size={12} />
            </button>
          </div>
        </div>

        {/* Complete button */}
        <button
          className={`btn ${set.completed ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: 6, height: 40, width: 44, marginTop: 14, borderRadius: 10 }}
          onClick={() => toggleSetComplete(exIndex, setIndex)}
        >
          <Check size={18} />
        </button>

        {/* Delete set button */}
        <button
          className="btn btn-ghost"
          style={{ padding: 4, marginTop: 14, opacity: 0.5 }}
          onClick={() => removeSet(exIndex, setIndex)}
          disabled={log.sets.length <= 1}
        >
          <Trash2 size={14} />
        </button>

        {/* Last time hint */}
        {prev && (
          <div style={{ gridColumn: '1 / -1', fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
            Last time: {prev.weight > 0 ? `${prev.weight} kg × ${prev.reps} reps` : formatCount(prev.reps, isTimed)}
          </div>
        )}
      </div>
    );
  }

  const rounds = currentGroup ? roundCountFor(currentGroup) : 0;
  const noteExercise = noteExerciseIndex !== null ? workout.exercises[noteExerciseIndex] : null;

  return (
    <div className="page" style={{ paddingBottom: 100, overflow: 'hidden' }}>
      {/* New record toast */}
      {recordMessage && (
        <div
          onClick={() => setRecordMessage(null)}
          style={{
            position: 'fixed',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
            color: 'white',
            padding: '12px 22px',
            borderRadius: 999,
            fontWeight: 700,
            fontSize: 15,
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            zIndex: 1000,
            whiteSpace: 'nowrap',
          }}
        >
          {recordMessage}
        </div>
      )}

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
            {formatDuration(elapsedTime)}
          </div>
        </div>
        <div style={{ width: 40 }} />
      </div>

      {/* Group dots navigation */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {groups.map((group, index) => {
          const complete = isGroupComplete(group);
          const partial = group.items.some(it => exerciseLogs[it.index]?.sets.some(s => s.completed));
          const allSkipped = group.items.every(it => skippedExercises.has(it.index));

          return (
            <button
              key={group.key}
              onClick={() => goToGroup(index)}
              style={{
                minWidth: 16,
                height: 16,
                padding: group.items.length > 1 ? '0 4px' : 0,
                borderRadius: 8,
                border: index === currentGroupIndex ? '2px solid #6366f1' : 'none',
                cursor: 'pointer',
                background: allSkipped ? '#9ca3af' : complete ? '#22c55e' : partial ? '#f59e0b' : '#e5e7eb',
                transition: 'all 0.2s',
                transform: index === currentGroupIndex ? 'scale(1.15)' : 'scale(1)',
                fontSize: 9,
                fontWeight: 700,
                color: 'white',
                lineHeight: '14px',
              }}
            >
              {group.items.length > 1 ? group.label : ''}
            </button>
          );
        })}
      </div>

      {/* Swipeable group container */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transition: 'transform 0.2s ease-out, opacity 0.2s ease-out',
          ...getSlideStyle(),
        }}
      >
        {/* Group header */}
        <div style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          color: 'white',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 4 }}>
            {isCircuit ? 'Circuit' : 'Exercise'} {currentGroupIndex + 1} of {groups.length}
          </div>

          {isCircuit ? (
            <>
              <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
                Circuit {currentGroup.label}
              </div>
              <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 12 }}>
                {rounds} {rounds === 1 ? 'round' : 'rounds'} · do one set of each, then repeat
              </div>
              {/* Exercise list inside the circuit */}
              <div style={{ display: 'grid', gap: 6, textAlign: 'left' }}>
                {currentGroup.items.map(item => {
                  const skipped = skippedExercises.has(item.index);
                  const log = exerciseLogs[item.index];
                  return (
                    <div
                      key={item.exercise.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 10px',
                        background: 'rgba(255,255,255,0.15)',
                        borderRadius: 8,
                        opacity: skipped ? 0.5 : 1,
                      }}
                    >
                      <span style={{ fontWeight: 700, fontSize: 13, minWidth: 24 }}>{item.subLabel}</span>
                      <span style={{ flex: 1, fontSize: 14, textDecoration: skipped ? 'line-through' : 'none' }}>
                        {item.exercise.exerciseName}
                        <span style={{ opacity: 0.7, marginLeft: 6, fontSize: 12 }}>
                          × {timedExercises.has(item.exercise.exerciseId)
                            ? formatCount(item.exercise.targetReps, true)
                            : `${item.exercise.targetReps}`}
                        </span>
                      </span>
                      <button
                        onClick={() => openVideo(item.exercise.exerciseId, item.exercise.exerciseName)}
                        title="How to"
                        style={{
                          background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8,
                          padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center',
                        }}
                      >
                        <Youtube size={15} style={{ color: 'white' }} />
                      </button>
                      <button
                        onClick={() => openNoteModal(item.index)}
                        style={{
                          background: log?.note ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)',
                          border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer',
                          display: 'flex', alignItems: 'center',
                        }}
                      >
                        <MessageSquare size={15} style={{ color: 'white' }} />
                      </button>
                      <button
                        onClick={() => skipped ? unskipExercise(item.index) : skipExercise(item.index)}
                        style={{
                          background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8,
                          padding: '6px 8px', cursor: 'pointer', color: 'white', fontSize: 11, fontWeight: 600,
                        }}
                      >
                        {skipped ? 'Undo' : 'Skip'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              {(() => {
                const item = currentGroup.items[0];
                const skipped = skippedExercises.has(item.index);
                const log = exerciseLogs[item.index];
                const isTimed = timedExercises.has(item.exercise.exerciseId);
                return (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                      <button
                        onClick={() => openVideo(item.exercise.exerciseId, item.exercise.exerciseName)}
                        title="How to"
                        style={{
                          background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10,
                          padding: 10, cursor: 'pointer', display: 'flex', alignItems: 'center',
                        }}
                      >
                        <Youtube size={18} style={{ color: 'white' }} />
                      </button>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                      {item.exercise.exerciseName}
                      {skipped && ' (Skipped)'}
                    </div>
                    <div style={{ fontSize: 14, opacity: 0.9 }}>
                      Target: {item.exercise.targetSets} × {isTimed ? formatCount(item.exercise.targetReps, true) : `${item.exercise.targetReps} reps`}
                    </div>
                    {log?.note && (
                      <div
                        onClick={() => openNoteModal(item.index)}
                        style={{
                          marginTop: 12, padding: 10, background: 'rgba(255,255,255,0.2)',
                          borderRadius: 8, fontSize: 13, textAlign: 'left', cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.8, marginBottom: 4 }}>
                          <MessageSquare size={13} style={{ color: 'white' }} />
                          <span>Your note (tap to edit)</span>
                        </div>
                        <div style={{ fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>{log.note}</div>
                      </div>
                    )}
                    {previousNotes[item.exercise.exerciseId] && !log?.note && (
                      <div style={{
                        marginTop: 12, padding: 8, background: 'rgba(255,255,255,0.15)',
                        borderRadius: 8, fontSize: 12, textAlign: 'left',
                      }}>
                        <div style={{ opacity: 0.7, marginBottom: 2 }}>Last note:</div>
                        <div style={{ fontStyle: 'italic' }}>"{previousNotes[item.exercise.exerciseId]}"</div>
                      </div>
                    )}
                    <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'center' }}>
                      {!log?.note && (
                        <button
                          className="btn btn-sm"
                          onClick={() => openNoteModal(item.index)}
                          style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
                        >
                          <MessageSquare size={16} /> Note
                        </button>
                      )}
                      {skipped ? (
                        <button
                          className="btn btn-sm"
                          onClick={() => unskipExercise(item.index)}
                          style={{ background: 'white', color: '#6366f1' }}
                        >
                          Restore Exercise
                        </button>
                      ) : (
                        <button
                          className="btn btn-sm"
                          onClick={() => skipExercise(item.index)}
                          style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
                        >
                          <SkipForward size={16} /> Skip
                        </button>
                      )}
                    </div>
                  </>
                );
              })()}
            </>
          )}
        </div>

        {/* Rounds */}
        <div style={{ marginBottom: 16 }}>
          {Array.from({ length: rounds }, (_, r) => {
            // Exercises in this group that have a set for this round and aren't skipped
            const rowItems = currentGroup.items.filter(
              it => !skippedExercises.has(it.index) && exerciseLogs[it.index]?.sets[r]
            );
            if (rowItems.length === 0) return null;

            return (
              <div key={r} style={{ marginBottom: 14 }}>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: '#6b7280',
                  marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
                }}>
                  {isCircuit ? `Round ${r + 1}` : `Set ${r + 1}`}
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {rowItems.map(it =>
                    renderSetRow(it.index, r, isCircuit ? it.subLabel : `${r + 1}`)
                  )}
                </div>
              </div>
            );
          })}

          <button
            className="btn btn-secondary btn-sm btn-block"
            onClick={() => addRound(currentGroup)}
            style={{ marginTop: 4 }}
          >
            <Plus size={16} /> {isCircuit ? 'Add Round' : 'Add Set'}
          </button>
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
          style={{ padding: 16, fontSize: 16, fontWeight: 600 }}
        >
          Finish Workout
        </button>
      )}

      {/* Swipe hint */}
      <div style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 12 }}>
        Swipe left/right to change {isCircuit ? 'circuit' : 'exercise'}
      </div>

      {/* Effort Rating Modal */}
      {showEffortModal && pendingEffortGroupIndex !== null && (
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
                {groups[pendingEffortGroupIndex]?.items.length > 1
                  ? `How was Circuit ${groups[pendingEffortGroupIndex].label}?`
                  : `How was ${groups[pendingEffortGroupIndex]?.items[0]?.exercise.exerciseName}?`}
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
                Duration: {formatDuration(finishedLog?.duration ?? elapsedTime)} • {exerciseLogs.length - skippedExercises.size} exercises
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
      {showNoteModal && noteExercise && (
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
                Note for {noteExercise.exerciseName}
              </h2>
              <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
                Leave a note for your future self
              </p>
            </div>

            {/* Show previous note if exists */}
            {previousNotes[noteExercise.exerciseId] && (
              <div style={{
                padding: 10,
                background: '#f3f4f6',
                borderRadius: 8,
                marginBottom: 12,
                fontSize: 13,
              }}>
                <div style={{ color: '#6b7280', marginBottom: 4 }}>Previous note:</div>
                <div style={{ fontStyle: 'italic' }}>
                  "{previousNotes[noteExercise.exerciseId]}"
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
