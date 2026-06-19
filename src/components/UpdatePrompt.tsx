import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw } from 'lucide-react';
import { useT } from '../i18n/context';
import { updatePromptStrings } from '../i18n/strings/updatePrompt';

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  const t = useT(updatePromptStrings);

  if (!needRefresh) return null;

  return (
    <div className="update-prompt" role="alert">
      <span>{t('newVersion')}</span>
      <button onClick={() => updateServiceWorker(true)}>
        <RefreshCw size={16} />
        {t('tapToUpdate')}
      </button>
    </div>
  );
}
