import { useState } from 'react';
import { Send } from 'lucide-react';
import { useT } from '../i18n/context';
import { feedbackStrings } from '../i18n/strings/feedback';
import { buildFeedbackMailto } from '../utils/appLinks';
import StarRating from './StarRating';

type TFn = (key: string, vars?: Record<string, string | number>) => string;

/**
 * Build the feedback mailto from the chosen rating and open the user's mail
 * app. Shared by the About card and the gentle prompt so both behave the same.
 */
export function openFeedbackEmail(t: TFn, rating: number) {
  const url = buildFeedbackMailto({
    rating: rating > 0 ? rating : undefined,
    subject: rating > 0 ? t('subjectRated', { rating }) : t('subject'),
    bodyIntro: t('bodyIntro'),
    bodyRatingLabel: t('bodyRating'),
    deviceLine: t('deviceFooter', { version: __BUILD_TIME__ }),
  });
  window.location.href = url;
}

export default function FeedbackCard() {
  const t = useT(feedbackStrings);
  const [rating, setRating] = useState(0);

  return (
    <div className="card" style={{ width: '100%', maxWidth: 360, marginTop: 16, textAlign: 'left' }}>
      <div className="card-header">
        <div className="card-title">{t('cardTitle')}</div>
      </div>
      <div className="card-subtitle" style={{ marginBottom: 16 }}>
        {t('cardSubtitle')}
      </div>

      <p style={{ fontSize: 13, color: 'var(--gray-500)', textAlign: 'center', marginBottom: 8 }}>
        {t('rateOptional')}
      </p>
      <div style={{ marginBottom: 16 }}>
        <StarRating value={rating} onChange={setRating} />
      </div>

      <button className="btn btn-primary btn-block" onClick={() => openFeedbackEmail(t, rating)}>
        <Send size={18} /> {t('sendFeedback')}
      </button>
    </div>
  );
}
