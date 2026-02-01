import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Pencil, Trash2, X, ChevronRight } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import type { Exercise } from '../utils/storage';
import { getExercises, saveExercise, deleteExercise } from '../utils/storage';

const MUSCLE_GROUPS = ['All', 'Legs', 'Back', 'Chest', 'Shoulders', 'Arms', 'Core', 'Full Body', 'Warm-up', 'Glutes', 'Cardio', 'Plyometrics'];

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

  useEffect(() => {
    loadExercises();
  }, []);

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
    setShowModal(true);
  }

  function openEditModal(exercise: Exercise) {
    setEditingExercise(exercise);
    setFormName(exercise.name);
    setFormMuscleGroup(exercise.muscleGroup);
    setFormNotes(exercise.notes || '');
    setShowModal(true);
  }

  function handleSave() {
    if (!formName.trim()) return;

    const exercise: Exercise = {
      id: editingExercise?.id || uuid(),
      name: formName.trim(),
      muscleGroup: formMuscleGroup,
      notes: formNotes.trim() || undefined,
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

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Exercises</h1>
        <p className="page-subtitle">Manage your exercise library</p>
      </div>

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
        {filteredExercises.map(exercise => (
          <div
            key={exercise.id}
            className="list-item"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(`/exercise/${exercise.id}`)}
          >
            <div className="list-item-content">
              <div className="list-item-title">{exercise.name}</div>
              <div className="list-item-subtitle">
                {exercise.muscleGroup}
                {exercise.defaultWeight && ` • ${exercise.defaultWeight}kg`}
              </div>
            </div>
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
          </div>
        ))}
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
