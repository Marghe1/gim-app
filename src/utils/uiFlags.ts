// Small one-off boolean flags kept in localStorage. Centralised here so the
// `gymtrack_` keys live in one place and every read/write tolerates storage
// being unavailable (private mode, etc.), matching the rest of the app.

const ONBOARDING_SEEN = 'gymtrack_onboarding_seen';
const FEEDBACK_PROMPT_DISMISSED = 'gymtrack_feedback_prompt_dismissed';
const INSTALL_PROMPT_DISMISSED = 'gymtrack_install_prompt_dismissed';

function getFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function setFlag(key: string): void {
  try {
    localStorage.setItem(key, '1');
  } catch {
    /* ignore persistence failures */
  }
}

function clearFlag(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export const hasSeenOnboarding = () => getFlag(ONBOARDING_SEEN);
export const setOnboardingSeen = () => setFlag(ONBOARDING_SEEN);
export const clearOnboardingSeen = () => clearFlag(ONBOARDING_SEEN);

export const isFeedbackPromptDismissed = () => getFlag(FEEDBACK_PROMPT_DISMISSED);
export const setFeedbackPromptDismissed = () => setFlag(FEEDBACK_PROMPT_DISMISSED);

export const isInstallPromptDismissed = () => getFlag(INSTALL_PROMPT_DISMISSED);
export const setInstallPromptDismissed = () => setFlag(INSTALL_PROMPT_DISMISSED);
