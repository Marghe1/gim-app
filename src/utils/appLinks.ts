// Public app links and the helpers that build them. This file is deliberately
// free of any UI/i18n logic: the feedback/share helpers receive already-translated
// text so the components stay in charge of wording.

// ===========================================================================
// EDIT THESE TWO LINES BEFORE THE PUBLIC RELEASE
// ===========================================================================
// Where "Send feedback" emails go. A mailto: address is visible to anyone who
// opens the link, so consider a dedicated address rather than a personal one.
export const FEEDBACK_EMAIL = 'mbruscolini@protonmail.com';
// The public address people are sent to when they share the app.
export const APP_URL = 'https://the-gym-app.netlify.app';
// ===========================================================================

// Turn a 1–5 rating into a little star bar like ★★★★☆.
function starBar(rating: number): string {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return '★'.repeat(r) + '☆'.repeat(5 - r);
}

/**
 * Build a `mailto:` URL for feedback. The optional star rating is woven into
 * the email body. The subject and the labels are passed in already translated.
 */
export function buildFeedbackMailto(opts: {
  rating?: number;
  subject: string;
  bodyIntro: string;
  bodyRatingLabel: string;
  deviceLine: string;
}): string {
  const { rating, subject, bodyIntro, bodyRatingLabel, deviceLine } = opts;
  const lines: string[] = [];
  if (rating && rating > 0) {
    lines.push(`${bodyRatingLabel}: ${starBar(rating)} (${rating}/5)`);
    lines.push('');
  }
  lines.push(bodyIntro);
  lines.push('', '', '--', deviceLine);
  const body = lines.join('\n');
  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Share the app. Uses the native share sheet when available, otherwise copies
 * the link to the clipboard, otherwise reports failure so the caller can show
 * the link for manual copying. A user cancelling the native sheet is a silent
 * no-op (reported as 'failed' with no error to show).
 */
export async function shareApp(text: { title: string; message: string }): Promise<'shared' | 'copied' | 'failed'> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: text.title, text: text.message, url: APP_URL });
      return 'shared';
    } catch (e) {
      // User dismissed the share sheet — don't fall through to clipboard.
      if (e instanceof Error && e.name === 'AbortError') return 'failed';
      // Otherwise fall through and try the clipboard.
    }
  }
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(`${text.message} ${APP_URL}`);
      return 'copied';
    } catch {
      return 'failed';
    }
  }
  return 'failed';
}
