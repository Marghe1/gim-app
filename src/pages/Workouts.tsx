import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, X, GripVertical, Play, Pencil } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import type { Workout, WorkoutExercise, Exercise } from '../utils/storage';
import { getWorkouts, saveWorkout, deleteWorkout, getExercises } from '../utils/storage';

export default function Workouts() {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formExercises, setFormExercises] = useState<WorkoutExercise[]>([]);

  // Add exercise modal
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [targetSets, setTargetSets] = useState(3);
  const [targetReps, setTargetReps] = useState(12);
  const [restSeconds, setRestSeconds] = useState(60);

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    setWorkouts(getWorkouts());
    setExercises(getExercises());
  }

  function openNewForm() {
    setEditingWorkout(null);
    setFormName('');
    setFormDescription('');
    setFormExercises([]);
    setShowForm(true);
  }

  function openEditForm(workout: Workout) {
    setEditingWorkout(workout);
    setFormName(workout.name);
    setFormDescription(workout.description || '');
    setFormExercises([...workout.exercises]);
    setShowForm(true);
  }

  function handleSaveWorkout() {
    if (!formName.trim() || formExercises.length === 0) return;

    const workout: Workout = {
      id: editingWorkout?.id || uuid(),
      name: formName.trim(),
      description: formDescription.trim() || undefined,
      exercises: formExercises,
      createdAt: editingWorkout?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveWorkout(workout);
    loadData();
    setShowForm(false);
  }

  function handleDeleteWorkout(id: string) {
    if (confirm('Delete this workout template?')) {
      deleteWorkout(id);
      loadData();
    }
  }

  function openAddExerciseModal() {
    setSelectedExerciseId(exercises[0]?.id || '');
    setTargetSets(3);
    setTargetReps(12);
    setRestSeconds(60);
    setShowAddExercise(true);
  }

  function handleAddExercise() {
    const exercise = exercises.find(e => e.id === selectedExerciseId);
    if (!exercise) return;

    const workoutExercise: WorkoutExercise = {
      id: uuid(),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      targetSets,
      targetReps,
      restSeconds,
    };

    setFormExercises([...formExercises, workoutExercise]);
    setShowAddExercise(false);
  }

  function removeExercise(id: string) {
    setFormExercises(formExercises.filter(e => e.id !== id));
  }

  function moveExercise(index: number, direction: 'up' | 'down') {
    const newExercises = [...formExercises];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newExercises.length) return;
    [newExercises[index], newExercises[newIndex]] = [newExercises[newIndex], newExercises[index]];
    setFormExercises(newExercises);
  }

  // Main list view
  if (!showForm) {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">My Workouts</h1>
          <p className="page-subtitle">Create and manage workout templates</p>
        </div>

        <button className="btn btn-primary btn-block" onClick={openNewForm} style={{ marginBottom: 16 }}>
          <Plus size={20} />
          Create Workout
        </button>

        {workouts.length === 0 ? (
          <div className="empty-state">
            <p>No workout templates yet. Create your first one!</p>
          </div>
        ) : (
          <div className="list">
            {workouts.map(workout => (
              <div key={workout.id} className="list-item">
                <div className="list-item-content">
                  <div className="list-item-title">{workout.name}</div>
                  <div className="list-item-subtitle">
                    {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="list-item-actions" style={{ gap: 8 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate(`/workout/${workout.id}`)}
                  >
                    <Play size={16} /> Start
                  </button>
                  <button className="btn btn-ghost" onClick={() => openEditForm(workout)}>
                    <Pencil size={18} />
                  </button>
                  <button className="btn btn-ghost" onClick={() => handleDeleteWorkout(workout.id)}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Form view
  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">{editingWorkout ? 'Edit Workout' : 'New Workout'}</h1>
          <p className="page-subtitle">Build your circuit template</p>
        </div>
        <button className="btn btn-ghost" onClick={() => setShowForm(false)}>
          <X size={24} />
        </button>
      </div>

      <div className="form-group">
        <label className="form-label">Workout Name</label>
        <input
          type="text"
          className="form-input"
          placeholder="e.g., Monday Upper Body"
          value={formName}
          onChange={e => setFormName(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Description (optional)</label>
        <input
          type="text"
          className="form-input"
          placeholder="e.g., Focus on chest and shoulders"
          value={formDescription}
          onChange={e => setFormDescription(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <label className="form-label" style={{ margin: 0 }}>Exercises</label>
          <button className="btn btn-secondary btn-sm" onClick={openAddExerciseModal}>
            <Plus size={16} />
            Add
          </button>
        </div>

        {formExercises.length === 0 ? (
          <div className="empty-state" style={{ padding: 20 }}>
            <p>No exercises yet. Add exercises to your workout.</p>
          </div>
        ) : (
          <div className="list">
            {formExercises.map((ex, index) => (
              <div key={ex.id} className="list-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: 2 }}
                      onClick={() => moveExercise(index, 'up')}
                      disabled={index === 0}
                    >
                      <GripVertical size={14} />
                    </button>
                  </div>
                  <div className="list-item-content">
                    <div className="list-item-title">{ex.exerciseName}</div>
                    <div className="list-item-subtitle">
                      {ex.targetSets} sets x {ex.targetReps} reps • {ex.restSeconds}s rest
                    </div>
                  </div>
                </div>
                <button className="btn btn-ghost" onClick={() => removeExercise(ex.id)}>
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>
          Cancel
        </button>
        <button
          className="btn btn-primary"
          style={{ flex: 1 }}
          onClick={handleSaveWorkout}
          disabled={!formName.trim() || formExercises.length === 0}
        >
          {editingWorkout ? 'Save Changes' : 'Create Workout'}
        </button>
      </div>

      {/* Add Exercise Modal */}
      {showAddExercise && (
        <div className="modal-overlay" onClick={() => setShowAddExercise(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Exercise</h2>
              <button className="btn btn-ghost" onClick={() => setShowAddExercise(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Exercise</label>
              <select
                className="form-select"
                value={selectedExerciseId}
                onChange={e => setSelectedExerciseId(e.target.value)}
              >
                {exercises.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Sets</label>
                <input
                  type="number"
                  className="form-input"
                  value={targetSets}
                  onChange={e => setTargetSets(Number(e.target.value))}
                  min={1}
                  max={10}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Reps</label>
                <input
                  type="number"
                  className="form-input"
                  value={targetReps}
                  onChange={e => setTargetReps(Number(e.target.value))}
                  min={1}
                  max={100}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Rest between sets (seconds)</label>
              <input
                type="number"
                className="form-input"
                value={restSeconds}
                onChange={e => setRestSeconds(Number(e.target.value))}
                min={0}
                max={300}
                step={15}
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddExercise(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAddExercise}>
                Add Exercise
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
