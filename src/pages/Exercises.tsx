import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Pencil, Trash2, X, ChevronRight, Sliders, Check } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import type { Exercise } from '../utils/storage';
import { getExercises, saveExercise, deleteExercise } from '../utils/storage';

const MUSCLE_GROUPS = ['All', 'Legs', 'Back', 'Chest', 'Shoulders', 'Arms', 'Core', 'Full Body', 'Warm-up', 'Glutes', 'Cardio', 'Plyometrics'];

// Weight multipliers by muscle group (base weight at level 5)
// These represent typical weights for each muscle group
const MUSCLE_GROUP_MULTIPLIERS: { [key: string]: number } = {
  'Legs': 40,        // Squats, leg press - heavier
  'Back': 35,        // Deadlifts, rows - heavy
  'Chest': 30,       // Bench press - medium-heavy
  'Glutes': 30,      // Hip thrusts - medium-heavy
  'Shoulders': 15,   // Shoulder press - medium
  'Arms': 10,        // Curls, triceps - lighter
  'Full Body': 20,   // Kettlebell swings - medium
  'Core': 0,         // Bodyweight exercises
  'Warm-up': 0,      // Bodyweight/mobility
  'Cardio': 0,       // No weight
  'Plyometrics': 0,  // Bodyweight jumps
};

// Calculate weight for an exercise based on strength level (1-10)
function calculateWeight(muscleGroup: string, level: number): number {
  const baseWeight = MUSCLE_GROUP_MULTIPLIERS[muscleGroup] || 0;
  if (baseWeight === 0) return 0;

  // Level 1 = 20% of base, Level 10 = 200% of base
  // Level 5 = 100% (the base weight)
  const multiplier = 0.2 + (level - 1) * 0.2;
  const weight = Math.round(baseWeight * multiplier * 2) / 2; // Round to nearest 0.5
  return weight;
}

export default function Exercises() {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [formName, setFormName] = useState('');
  const [formMuscleGroup, setFormMuscleGroup] = useState('Legs');
  const [formNotes, setFormNotes] = useState('');
  const [formVideoUrl, setFormVideoUrl] = useState('');

  // Quick setup mode
  const [showQuickSetup, setShowQuickSetup] = useState(false);
  const [strengthLevel, setStrengthLevel] = useState(5);
  const [previewWeights, setPreviewWeights] = useState<{ [id: string]: number }>({});

  useEffect(() => {
    loadExercises();
  }, []);

  // Update preview weights when strength level changes
  useEffect(() => {
    const weights: { [id: string]: number } = {};
    exercises.forEach(ex => {
      weights[ex.id] = calculateWeight(ex.muscleGroup, strengthLevel);
    });
    setPreviewWeights(weights);
  }, [strengthLevel, exercises]);

  function loadExercises() {
    setExercises(getExercises());
  }

  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || ex.muscleGroup === filter;
    return matchesSearch && matchesFilter;
  });

  function openAddModal() {
    setEditingExercise(null);
    setFormName('');
    setFormMuscleGroup('Legs');
    setFormNotes('');
    setFormVideoUrl('');
    setShowModal(true);
  }

  function openEditModal(exercise: Exercise) {
    setEditingExercise(exercise);
    setFormName(exercise.name);
    setFormMuscleGroup(exercise.muscleGroup);
    setFormNotes(exercise.notes || '');
    setFormVideoUrl(exercise.videoUrl || '');
    setShowModal(true);
  }

  function handleSave() {
    if (!formName.trim()) return;

    const exercise: Exercise = {
      ...(editingExercise ?? {}),
      id: editingExercise?.id || uuid(),
      name: formName.trim(),
      muscleGroup: formMuscleGroup,
      notes: formNotes.trim() || undefined,
      videoUrl: formVideoUrl.trim() || undefined,
    };

    saveExercise(exercise);
    loadExercises();
    setShowModal(false);
  }

  function handleDelete(id: string) {
    if (confirm('Delete this exercise?')) {
      deleteExercise(id);
      loadExercises();
    }
  }

  function applyQuickSetup() {
    // Save all exercises with the calculated weights
    exercises.forEach(ex => {
      const weight = previewWeights[ex.id];
      if (weight > 0 || ex.defaultWeight) {
        const updated: Exercise = {
          ...ex,
          defaultWeight: weight > 0 ? weight : undefined,
        };
        saveExercise(updated);
      }
    });
    loadExercises();
    setShowQuickSetup(false);
  }

  // Get level label
  const getLevelLabel = (level: number): string => {
    if (level <= 2) return 'Beginner';
    if (level <= 4) return 'Novice';
    if (level <= 6) return 'Intermediate';
    if (level <= 8) return 'Advanced';
    return 'Expert';
  };

  // Count exercises that will get weights
  const exercisesWithWeights = Object.values(previewWeights).filter(w => w > 0).length;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Exercises</h1>
        <p className="page-subtitle">Manage your exercise library</p>
      </div>

      {/* Quick Setup Panel */}
      {showQuickSetup ? (
        <div style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          borderRadius: 16,
          padding: 20,
          marginBottom: 20,
          color: 'white',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Quick Weight Setup</h3>
            <button
              className="btn btn-ghost"
              onClick={() => setShowQuickSetup(false)}
              style={{ color: 'white', padding: 4 }}
            >
              <X size={20} />
            </button>
          </div>

          <p style={{ fontSize: 14, opacity: 0.9, marginBottom: 20 }}>
            Drag the slider to set starting weights for all exercises based on your strength level.
          </p>

          {/* Strength Level Display */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 48, fontWeight: 700 }}>{strengthLevel}</div>
            <div style={{ fontSize: 16, opacity: 0.9 }}>{getLevelLabel(strengthLevel)}</div>
          </div>

          {/* Slider */}
          <div style={{ marginBottom: 20 }}>
            <input
              type="range"
              min="1"
              max="10"
              value={strengthLevel}
              onChange={e => setStrengthLevel(Number(e.target.value))}
              style={{
                width: '100%',
                height: 8,
                borderRadius: 4,
                appearance: 'none',
                background: 'rgba(255,255,255,0.3)',
                cursor: 'pointer',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.7, marginTop: 8 }}>
              <span>1 - Beginner</span>
              <span>10 - Expert</span>
            </div>
          </div>

          {/* Preview Summary */}
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 12,
            padding: 12,
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 14, marginBottom: 8 }}>Preview:</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: 13 }}>
              <div>Legs: <strong>{calculateWeight('Legs', strengthLevel)}kg</strong></div>
              <div>Back: <strong>{calculateWeight('Back', strengthLevel)}kg</strong></div>
              <div>Chest: <strong>{calculateWeight('Chest', strengthLevel)}kg</strong></div>
              <div>Shoulders: <strong>{calculateWeight('Shoulders', strengthLevel)}kg</strong></div>
              <div>Arms: <strong>{calculateWeight('Arms', strengthLevel)}kg</strong></div>
              <div>Full Body: <strong>{calculateWeight('Full Body', strengthLevel)}kg</strong></div>
            </div>
          </div>

          <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 16 }}>
            {exercisesWithWeights} exercises will be updated. Core, warm-up, and cardio stay at 0kg.
          </p>

          <button
            className="btn btn-block"
            onClick={applyQuickSetup}
            style={{
              background: 'white',
              color: '#6366f1',
              fontWeight: 600,
              padding: 14,
            }}
          >
            <Check size={18} />
            Apply Weights to All Exercises
          </button>
        </div>
      ) : (
        <button
          className="btn btn-secondary btn-block"
          onClick={() => setShowQuickSetup(true)}
          style={{ marginBottom: 16 }}
        >
          <Sliders size={18} />
          Quick Weight Setup
        </button>
      )}

      <div className="search-box">
        <Search />
        <input
          type="text"
          placeholder="Search exercises..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="filter-tabs">
        {MUSCLE_GROUPS.map(group => (
          <button
            key={group}
            className={`filter-tab ${filter === group ? 'active' : ''}`}
            onClick={() => setFilter(group)}
          >
            {group}
          </button>
        ))}
      </div>

      <button className="btn btn-primary btn-block" onClick={openAddModal} style={{ marginBottom: 16 }}>
        <Plus size={20} />
        Add Exercise
      </button>

      <div className="list">
        {filteredExercises.map(exercise => {
          const previewWeight = showQuickSetup ? (previewWeights[exercise.id] ?? 0) : 0;
          const currentWeight = exercise.defaultWeight;
          const willChange = showQuickSetup && previewWeight !== currentWeight && (previewWeight > 0 || currentWeight);

          return (
            <div
              key={exercise.id}
              className="list-item"
              style={{
                cursor: 'pointer',
                background: willChange ? '#fef3c7' : undefined,
                transition: 'background 0.2s',
              }}
              onClick={() => !showQuickSetup && navigate(`/exercise/${exercise.id}`)}
            >
              <div className="list-item-content">
                <div className="list-item-title">{exercise.name}</div>
                <div className="list-item-subtitle">
                  {exercise.muscleGroup}
                  {showQuickSetup ? (
                    // Show preview weight in quick setup mode
                    previewWeight > 0 ? (
                      <span style={{ marginLeft: 8 }}>
                        {currentWeight ? (
                          <>
                            <span style={{ textDecoration: 'line-through', opacity: 0.5 }}>{currentWeight}kg</span>
                            {' → '}
                            <strong style={{ color: '#d97706' }}>{previewWeight}kg</strong>
                          </>
                        ) : (
                          <strong style={{ color: '#059669' }}>+ {previewWeight}kg</strong>
                        )}
                      </span>
                    ) : currentWeight ? (
                      <span style={{ marginLeft: 8, opacity: 0.5 }}>{currentWeight}kg (no change)</span>
                    ) : null
                  ) : (
                    // Normal mode - show current weight
                    currentWeight && <span> • {currentWeight}kg</span>
                  )}
                </div>
              </div>
              {!showQuickSetup && (
                <div className="list-item-actions">
                  <button
                    className="btn btn-ghost"
                    onClick={(e) => { e.stopPropagation(); openEditModal(exercise); }}
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={(e) => { e.stopPropagation(); handleDelete(exercise.id); }}
                  >
                    <Trash2 size={18} />
                  </button>
                  <ChevronRight size={18} style={{ color: '#9ca3af' }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredExercises.length === 0 && (
        <div className="empty-state">
          <p>No exercises found. Add your first exercise!</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingExercise ? 'Edit Exercise' : 'Add Exercise'}
              </h2>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Exercise Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Squat"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Muscle Group</label>
              <select
                className="form-select"
                value={formMuscleGroup}
                onChange={e => setFormMuscleGroup(e.target.value)}
              >
                {MUSCLE_GROUPS.filter(g => g !== 'All').map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Any notes about this exercise..."
                value={formNotes}
                onChange={e => setFormNotes(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Video URL (optional)</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://youtube.com/..."
                value={formVideoUrl}
                onChange={e => setFormVideoUrl(e.target.value)}
              />
              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                Leave empty to auto-search YouTube by exercise name
              </p>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>
                {editingExercise ? 'Save Changes' : 'Add Exercise'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
