import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './SuggestForm.css'; // reuse same styles

const INITIAL = {
  type: 'spot',
  name: '',
  country: '',
  city: '',
  spotType: 'gym',
  hours: '',
  contact: '',
  instagram: '',
  description: '',
  submitterName: '',
};

export default function SuggestSpotForm({ onSubmit, onClose }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(INITIAL);
  const [submitted, setSubmitted] = useState(false);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2000);
  };

  if (submitted) {
    return (
      <div className="suggest-overlay" onClick={onClose}>
        <div className="suggest-modal suggest-success" onClick={e => e.stopPropagation()}>
          <div className="suggest-success-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#b388ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3>{t('suggest.submitted')}</h3>
          <p>{t('suggest.reviewMessage')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="suggest-overlay" onClick={onClose}>
      <div className="suggest-modal" onClick={e => e.stopPropagation()}>
        <div className="suggest-header">
          <h3>{t('spots.suggestLocation')}</h3>
          <button className="suggest-close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="suggest-field">
            <label>{t('spots.spotName')} *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => update('name', e.target.value)}
              placeholder={t('spots.placeholderName')}
              required
              maxLength={100}
            />
          </div>

          <div className="suggest-row">
            <div className="suggest-field">
              <label>{t('suggest.country')} *</label>
              <input
                type="text"
                value={form.country}
                onChange={e => update('country', e.target.value)}
                placeholder={t('suggest.placeholderCountry')}
                required
                maxLength={50}
              />
            </div>
            <div className="suggest-field">
              <label>{t('suggest.city')} *</label>
              <input
                type="text"
                value={form.city}
                onChange={e => update('city', e.target.value)}
                placeholder={t('suggest.placeholderCity')}
                required
                maxLength={50}
              />
            </div>
          </div>

          <div className="suggest-field">
            <label>{t('spots.spotType')}</label>
            <select value={form.spotType} onChange={e => update('spotType', e.target.value)}>
              <option value="gym">{t('spots.type_gym')}</option>
              <option value="park">{t('spots.type_park')}</option>
              <option value="beach">{t('spots.type_beach')}</option>
              <option value="other">{t('spots.type_other')}</option>
            </select>
          </div>

          <div className="suggest-field">
            <label>{t('spots.hours')}</label>
            <input
              type="text"
              value={form.hours}
              onChange={e => update('hours', e.target.value)}
              placeholder={t('spots.placeholderHours')}
              maxLength={100}
            />
          </div>

          <div className="suggest-field">
            <label>{t('spots.contact')}</label>
            <input
              type="text"
              value={form.contact}
              onChange={e => update('contact', e.target.value)}
              placeholder={t('spots.placeholderContact')}
              maxLength={100}
            />
          </div>

          <div className="suggest-field">
            <label>{t('suggest.instagram')}</label>
            <input
              type="text"
              value={form.instagram}
              onChange={e => update('instagram', e.target.value)}
              placeholder={t('suggest.placeholderIG')}
              maxLength={100}
            />
          </div>

          <div className="suggest-field">
            <label>{t('suggest.additionalInfo')}</label>
            <textarea
              value={form.description}
              onChange={e => update('description', e.target.value)}
              placeholder={t('suggest.placeholderDescNew')}
              maxLength={300}
              rows={3}
            />
          </div>

          <div className="suggest-field">
            <label>{t('suggest.yourName')}</label>
            <input
              type="text"
              value={form.submitterName}
              onChange={e => update('submitterName', e.target.value)}
              placeholder={t('suggest.placeholderSubmitter')}
              maxLength={50}
            />
          </div>

          <button type="submit" className="suggest-submit" style={{ background: 'rgba(179,136,255,0.15)', borderColor: 'rgba(179,136,255,0.25)', color: '#b388ff' }}>
            {t('suggest.submitSuggestion')}
          </button>
        </form>
      </div>
    </div>
  );
}
