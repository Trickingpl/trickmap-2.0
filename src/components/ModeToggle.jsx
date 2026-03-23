import { useTranslation } from 'react-i18next';
import './ModeToggle.css';

export default function ModeToggle({ mode, onChange }) {
  const { t } = useTranslation();

  return (
    <div className="mode-toggle">
      <button
        className={`mode-btn ${mode === 'events' ? 'mode-btn--events' : ''}`}
        onClick={() => onChange('events')}
      >
        {t('mode.events')}
      </button>
      <button
        className={`mode-btn ${mode === 'spots' ? 'mode-btn--spots' : ''}`}
        onClick={() => onChange('spots')}
      >
        {t('mode.trickspots')}
      </button>
    </div>
  );
}
