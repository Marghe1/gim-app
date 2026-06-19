import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { useT } from '../i18n/context';
import { feedbackStrings } from '../i18n/strings/feedback';
import { getWorkoutLogs } from '../utils/storage';
import { isFeedbackPromptDismissed, setFeedbackPromptDismissed } from '../utils/uiFlags';
import StarRating from './StarRating';
import { openFeedbackEmail } from './FeedbackCard';

// Only nudge once the app has clearly been used a few times.
const MIN_COMPLETED_WORKOUTS = 3;

function completedCount(): number {
  try {
    return getWorkoutLogs().filter((l) => l.completed).length;
  } catch {
    return 0;
  }
}

/**
 * A gentle, one-time banner inviting the user to rate / send feedback after
 * they've completed a few workouts. Dismissing it (either button) hides it for
 * good. Tapping "Rate it" opens a small star-rating modal.
 */
export default function FeedbackPrompt() {
  const t = useT(feedbackStrings);
  const [visible, setVisible] = useState(
    () => !isFeedbackPromptDismissed() && completedCount() >= MIN_COMPLETED_WORKOUTS
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [rating, setRating] = useState(0);

  if (!visible) return null;

  function dismissForever() {
    setFeedbackPromptDismissed();
    setVisible(false);
  }

  function send() {
    setFeedbackPromptDismissed();
    openFeedbackEmail(t, rating);
    setVisible(false);
  }

  if (modalOpen) {
    return (
      <div className="modal-overlay" onClick={dismissForever}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">{t('modalTitle')}</h2>
            <button className="btn btn-ghost" onClick={dismissForever} aria-label={t('close')}>
              <X size={20} />
            </button>
          </div>

          <div style={{ margin: '8px 0 20px' }}>
            <StarRating value={rating} onChange={setRating} size={40} />
          </div>

          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={dismissForever}>
              {t('promptDismiss')}
            </button>
            <button className="btn btn-primary" onClick={send}>
              {t('sendFeedback')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="update-prompt" role="dialog">
      <span>
        <strong>{t('promptTitle')}</strong> {t('promptBody')}
      </span>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          onClick={dismissForever}
          style={{ background: 'transparent', color: 'white', opacity: 0.8 }}
        >
          {t('promptDismiss')}
        </button>
        <button onClick={() => setModalOpen(true)}>
          <Star size={16} /> {t('promptRate')}
        </button>
      </div>
    </div>
  );
}
