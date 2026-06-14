import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw } from 'lucide-react';

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="update-prompt" role="alert">
      <span>New version available</span>
      <button onClick={() => updateServiceWorker(true)}>
        <RefreshCw size={16} />
        Tap to update
      </button>
    </div>
  );
}
