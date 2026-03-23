import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './SuggestForm.css';

const INITIAL = {
  type: 'new', // 'new' or 'update'
  name: '',
  country: '',
  city: '',
  dateStart: '',
  dateEnd: '',
  instagram: '',
  description: '',
  existingEvent: '',
  existingEventId: '',
  submitterName: '',
};

function formatDateRange(start, end) {
  if (!start) return 'TBD';
  const opts = { month: 'long', day: 'numeric', year: 'numeric' };
  const s = new Date(start + 'T00:00:00');
  if (!end || end === start) return s.toLocaleDateString('en-US', opts);
  const e = new Date(end + 'T00:00:00');
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${s.toLocaleDateString('en-US', { month: 'long' })} ${s.getDate()}–${e.getDate()}, ${s.getFullYear()}`;
  }
  return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', opts)}`;
}

export default function SuggestForm({ gatherings, onSubmit, onClose }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(INITIAL);
  const [submitted, setSubmitted] = useState(false);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const formatted = {
      ...form,
      date: formatDateRange(form.dateStart, form.dateEnd),
    };
    onSubmit(formatted);
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
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00e676" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          <h3>{t('suggest.title')}</h3>
          <button className="suggest-close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Type selector */}
          <div className="suggest-type-btns">
            <button
              type="button"
              className={`suggest-type-btn ${form.type === 'new' ? 'suggest-type-btn--active' : ''}`}
              onClick={() => update('type', 'new')}
            >
              {t('suggest.newEvent')}
            </button>
            <button
              type="button"
              className={`suggest-type-btn ${form.type === 'update' ? 'suggest-type-btn--active' : ''}`}
              onClick={() => update('type', 'update')}
            >
              {t('suggest.updateExisting')}
            </button>
          </div>

          {form.type === 'update' && (
            <div className="suggest-field">
              <label>{t('suggest.whichEvent')}</label>
              <select
                value={form.existingEventId}
                onChange={e => {
                  const g = gatherings.find(g => g.id === e.target.value);
                  update('existingEventId', e.target.value);
                  update('existingEvent', g ? g.name : '');
                }}
                required
              >
                <option value="">{t('suggest.selectEvent')}</option>
                {gatherings.map(g => (
                  <option key={g.id} value={g.id}>{g.name} — {g.country}</option>
                ))}
              </select>
            </div>
          )}

          {form.type === 'new' && (
            <>
              <div className="suggest-field">
                <label>{t('suggest.eventName')} *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => update('name', e.target.value)}
                  placeholder={t('suggest.placeholderName')}
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
            </>
          )}

          <div className="suggest-row">
            <div className="suggest-field">
              <label>{t('suggest.startDate')} {form.type === 'update' ? '*' : ''}</label>
              <input
                type="date"
                value={form.dateStart}
                onChange={e => {
                  update('dateStart', e.target.value);
                  if (!form.dateEnd || form.dateEnd < e.target.value) update('dateEnd', e.target.value);
                }}
                required={form.type === 'update'}
              />
            </div>
            <div className="suggest-field">
              <label>{t('suggest.endDate')}</label>
              <input
                type="date"
                value={form.dateEnd}
                onChange={e => update('dateEnd', e.target.value)}
                min={form.dateStart}
              />
            </div>
          </div>
          {form.dateStart && (
            <p className="suggest-date-preview">
              {formatDateRange(form.dateStart, form.dateEnd)}
            </p>
          )}

          {form.type === 'new' && (
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
          )}

          <div className="suggest-field">
            <label>{t('suggest.additionalInfo')}</label>
            <textarea
              value={form.description}
              onChange={e => update('description', e.target.value)}
              placeholder={form.type === 'update' ? t('suggest.placeholderDescUpdate') : t('suggest.placeholderDescNew')}
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

          <button type="submit" className="suggest-submit">{t('suggest.submitSuggestion')}</button>
        </form>
      </div>
    </div>
  );
}
