import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, X, GripVertical, Play, Pencil, ChevronDown, ChevronRight, BookOpen, Copy, Link2, Link2Off } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import type { Workout, WorkoutExercise, Exercise, WorkoutTemplate } from '../utils/storage';
import { getWorkouts, saveWorkout, deleteWorkout, getExercises, getWorkoutTemplates, getTimedExerciseIds, getExerciseGroups, formatCount } from '../utils/storage';
import PageHero from '../components/PageHero';
import { useT, useLang } from '../i18n/context';
import { workoutsStrings } from '../i18n/strings/workouts';
import { translateExercise, translateCategory, translateTemplateName, translateTemplateDesc } from '../i18n/data';

export default function Workouts() {
  const navigate = useNavigate();
  const t = useT(workoutsStrings);
  const { lang } = useLang();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);

  // Template library state
  const [showTemplates, setShowTemplates] = useState(false);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);

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
  const [timedIds] = useState<Set<string>>(() => getTimedExerciseIds());

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    setWorkouts(getWorkouts());
    setExercises(getExercises());
    setTemplates(getWorkoutTemplates());
  }

  function openNewForm() {
    setEditingWorkout(null);
    setFormName('');
    setFormDescription('');
    setFormExercises([]);
    setShowTemplates(false);
    setExpandedTemplate(null);
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
    if (confirm(t('confirmDeleteWorkout'))) {
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

  // Whether an exercise is in the same circuit as the one above it
  function isLinkedToAbove(index: number): boolean {
    if (index === 0) return false;
    const g = formExercises[index].group;
    return !!g && g === formExercises[index - 1].group;
  }

  // Join an exercise into a circuit with the exercise above it
  function linkWithAbove(index: number) {
    if (index === 0) return;
    const newExercises = [...formExercises];
    const prev = newExercises[index - 1];
    let groupKey = prev.group;
    if (!groupKey) {
      groupKey = prev.id; // start a new circuit keyed by the first exercise's id
      newExercises[index - 1] = { ...prev, group: groupKey };
    }
    newExercises[index] = { ...newExercises[index], group: groupKey };
    setFormExercises(newExercises);
  }

  // Split an exercise out of its circuit (back to standing on its own)
  function unlinkFromAbove(index: number) {
    const newExercises = [...formExercises];
    newExercises[index] = { ...newExercises[index], group: undefined };
    setFormExercises(newExercises);
  }

  // Load a template into the New Workout form so it can be reviewed, tweaked
  // and saved (rather than saved straight away). Fresh ids keep it independent
  // from the original template.
  function useTemplate(template: WorkoutTemplate) {
    setFormName(template.name);
    setFormDescription(template.description || '');
    setFormExercises(template.exercises.map(ex => ({ ...ex, id: uuid() })));
    setShowTemplates(false);
    setExpandedTemplate(null);
  }

  // Add or refresh every PT session in one tap. Sessions already imported are
  // updated in place (matched by name) so existing workouts pick up the circuit
  // grouping without creating duplicates and without breaking history links.
  function importAllTemplates() {
    if (!confirm(t('confirmImportAll', { n: templates.length }))) {
      return;
    }
    const existing = getWorkouts();
    templates.forEach(template => {
      const matches = existing.filter(w => w.name === template.name);
      const targets = matches.length > 0 ? matches : [null];
      targets.forEach(match => {
        const workout: Workout = {
          id: match?.id || uuid(),
          name: template.name,
          description: template.description,
          exercises: template.exercises.map(ex => ({ ...ex, id: uuid() })),
          createdAt: match?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        saveWorkout(workout);
      });
    });
    loadData();
    setShowTemplates(false);
    setExpandedTemplate(null);
    setShowForm(false);
    alert(t('importDone', { n: templates.length }));
  }

  function toggleTemplateExpand(templateId: string) {
    setExpandedTemplate(expandedTemplate === templateId ? null : templateId);
  }

  // Main list view
  if (!showForm) {
    const totalExercises = workouts.reduce((sum, w) => sum + w.exercises.length, 0);
    return (
      <div className="home">
        <PageHero
          eyebrow={t('heroEyebrow')}
          title={t('heroTitle')}
          stats={[
            { value: workouts.length, label: workouts.length === 1 ? t('statSavedTemplate') : t('statSavedTemplates') },
            { value: totalExercises, label: t('statExercisesTotal') },
          ]}
        />

        <main className="home-sheet">
        <button className="btn btn-primary btn-block" onClick={openNewForm} style={{ marginBottom: 16 }}>
          <Plus size={20} />
          {t('createWorkout')}
        </button>

        {workouts.length === 0 ? (
          <div className="empty-state">
            <p style={{ marginBottom: 16 }}>{t('emptyNoWorkouts')}</p>
            {templates.length > 0 && (
              <button className="btn btn-primary btn-block" onClick={importAllTemplates}>
                <Copy size={18} />
                {t('addAllTemplates', { n: templates.length })}
              </button>
            )}
          </div>
        ) : (
          <div className="list">
            {workouts.map(workout => (
              <div key={workout.id} className="list-item">
                <div className="list-item-content">
                  <div className="list-item-title">{workout.name}</div>
                  <div className="list-item-subtitle">
                    {workout.exercises.length !== 1
                      ? t('exerciseCountPlural', { n: workout.exercises.length })
                      : t('exerciseCount', { n: workout.exercises.length })}
                  </div>
                </div>
                <div className="list-item-actions" style={{ gap: 8 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate(`/workout/${workout.id}`)}
                  >
                    <Play size={16} /> {t('start')}
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
        </main>
      </div>
    );
  }

  // Form view
  // Circuit labels (A, B1, B2, ...) for the exercises being edited
  const formGroups = getExerciseGroups(formExercises);
  const subLabelByIndex: Record<number, string> = {};
  formGroups.forEach(g => g.items.forEach(it => { subLabelByIndex[it.index] = it.subLabel; }));

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">{editingWorkout ? t('editWorkout') : t('newWorkout')}</h1>
          <p className="page-subtitle">{t('builderSubtitle')}</p>
        </div>
        <button className="btn btn-ghost" onClick={() => setShowForm(false)}>
          <X size={24} />
        </button>
      </div>

      {/* Start from a template (only when creating a new workout) */}
      {!editingWorkout && (
        <div style={{ marginBottom: 24 }}>
          <button
            className="btn btn-secondary btn-block"
            onClick={() => setShowTemplates(!showTemplates)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: showTemplates ? 12 : 0,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={18} />
              {t('startFromTemplate', { n: templates.length })}
            </span>
            {showTemplates ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>

          {showTemplates && (
            <>
              <button
                className="btn btn-primary btn-block btn-sm"
                onClick={importAllTemplates}
                style={{ marginBottom: 12 }}
              >
                <Copy size={16} />
                {t('importAllSessions', { n: templates.length })}
              </button>
              <div className="list" style={{ background: 'var(--color-surface)', borderRadius: 8 }}>
                {templates.map(template => (
                <div key={template.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <div
                    className="list-item"
                    style={{ cursor: 'pointer' }}
                    onClick={() => toggleTemplateExpand(template.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {expandedTemplate === template.id ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                      <div className="list-item-content">
                        <div className="list-item-title">{translateTemplateName(lang, template.name)}</div>
                        <div className="list-item-subtitle">
                          {t('templateSummary', { n: template.exercises.length, category: translateCategory(lang, template.category) })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {expandedTemplate === template.id && (
                    <div style={{ padding: '0 16px 16px 16px' }}>
                      {template.description && (
                        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                          {translateTemplateDesc(lang, template.description)}
                        </p>
                      )}
                      <div style={{
                        background: 'var(--color-background)',
                        borderRadius: 6,
                        padding: 12,
                        marginBottom: 12,
                      }}>
                        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--color-text-secondary)' }}>
                          {t('exercisesHeading')}
                        </div>
                        {(() => {
                          const subLabels: Record<number, string> = {};
                          getExerciseGroups(template.exercises).forEach(g =>
                            g.items.forEach(it => { subLabels[it.index] = it.subLabel; })
                          );
                          return template.exercises.map((ex, idx) => (
                            <div
                              key={ex.id}
                              style={{
                                fontSize: 13,
                                padding: '6px 0',
                                display: 'flex',
                                gap: 8,
                                borderBottom: idx < template.exercises.length - 1 ? '1px solid var(--color-border)' : 'none',
                              }}
                            >
                              <span style={{ fontWeight: 700, color: 'var(--color-primary, #16C79A)', minWidth: 24 }}>
                                {subLabels[idx]}
                              </span>
                              <span style={{ flex: 1 }}>
                                <span style={{ fontWeight: 500 }}>{translateExercise(lang, ex.exerciseName)}</span>
                                <span style={{ color: 'var(--color-text-secondary)', marginLeft: 8 }}>
                                  {ex.targetSets} × {timedIds.has(ex.exerciseId) ? formatCount(ex.targetReps, true, lang) : ex.targetReps}
                                </span>
                              </span>
                            </div>
                          ));
                        })()}
                      </div>
                      <button
                        className="btn btn-primary btn-block btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          useTemplate(template);
                        }}
                      >
                        <Copy size={16} />
                        {t('useThisTemplate')}
                      </button>
                    </div>
                  )}
                </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="form-group">
        <label className="form-label">{t('workoutName')}</label>
        <input
          type="text"
          className="form-input"
          placeholder={t('workoutNamePlaceholder')}
          value={formName}
          onChange={e => setFormName(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">{t('descriptionOptional')}</label>
        <input
          type="text"
          className="form-input"
          placeholder={t('descriptionPlaceholder')}
          value={formDescription}
          onChange={e => setFormDescription(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <label className="form-label" style={{ margin: 0 }}>{t('exercises')}</label>
          <button className="btn btn-secondary btn-sm" onClick={openAddExerciseModal}>
            <Plus size={16} />
            {t('add')}
          </button>
        </div>

        {formExercises.length === 0 ? (
          <div className="empty-state" style={{ padding: 20 }}>
            <p>{t('emptyNoExercises')}</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
              {t('circuitHint')}
            </p>
            <div className="list">
              {formExercises.map((ex, index) => {
                const linked = isLinkedToAbove(index);
                return (
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
                      <span style={{
                        fontWeight: 700,
                        fontSize: 13,
                        color: 'var(--color-primary, #16C79A)',
                        minWidth: 26,
                        textAlign: 'center',
                      }}>
                        {subLabelByIndex[index]}
                      </span>
                      <div className="list-item-content">
                        <div className="list-item-title">{translateExercise(lang, ex.exerciseName)}</div>
                        <div className="list-item-subtitle">
                          {ex.targetSets} {t('setsLabel')} x {timedIds.has(ex.exerciseId) ? formatCount(ex.targetReps, true, lang) : `${ex.targetReps} ${t('repsLabel')}`} • {ex.restSeconds}s {t('restLabel')}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {index > 0 && (
                        <button
                          className="btn btn-ghost"
                          title={linked ? t('splitFromCircuit') : t('linkIntoCircuit')}
                          onClick={() => linked ? unlinkFromAbove(index) : linkWithAbove(index)}
                          style={{ color: linked ? 'var(--color-primary, #16C79A)' : undefined }}
                        >
                          {linked ? <Link2Off size={18} /> : <Link2 size={18} />}
                        </button>
                      )}
                      <button className="btn btn-ghost" onClick={() => removeExercise(ex.id)}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>
          {t('cancel')}
        </button>
        <button
          className="btn btn-primary"
          style={{ flex: 1 }}
          onClick={handleSaveWorkout}
          disabled={!formName.trim() || formExercises.length === 0}
        >
          {editingWorkout ? t('saveChanges') : t('createWorkout')}
        </button>
      </div>

      {/* Add Exercise Modal */}
      {showAddExercise && (
        <div className="modal-overlay" onClick={() => setShowAddExercise(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{t('addExercise')}</h2>
              <button className="btn btn-ghost" onClick={() => setShowAddExercise(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">{t('exercise')}</label>
              <select
                className="form-select"
                value={selectedExerciseId}
                onChange={e => setSelectedExerciseId(e.target.value)}
              >
                {exercises.map(ex => (
                  <option key={ex.id} value={ex.id}>{translateExercise(lang, ex.name)}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">{t('sets')}</label>
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
                <label className="form-label">{timedIds.has(selectedExerciseId) ? t('seconds') : t('reps')}</label>
                <input
                  type="number"
                  className="form-input"
                  value={targetReps}
                  onChange={e => setTargetReps(Number(e.target.value))}
                  min={1}
                  max={timedIds.has(selectedExerciseId) ? 600 : 100}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('restBetweenSets')}</label>
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
                {t('cancel')}
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAddExercise}>
                {t('addExercise')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
