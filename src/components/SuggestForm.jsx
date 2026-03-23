import { useState } from 'react';
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
          <h3>Submitted!</h3>
          <p>Your suggestion will be reviewed by the admin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="suggest-overlay" onClick={onClose}>
      <div className="suggest-modal" onClick={e => e.stopPropagation()}>
        <div className="suggest-header">
          <h3>Suggest an Event</h3>
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
              New Event
            </button>
            <button
              type="button"
              className={`suggest-type-btn ${form.type === 'update' ? 'suggest-type-btn--active' : ''}`}
              onClick={() => update('type', 'update')}
            >
              Update Existing
            </button>
          </div>

          {form.type === 'update' && (
            <div className="suggest-field">
              <label>Which event?</label>
              <select
                value={form.existingEventId}
                onChange={e => {
                  const g = gatherings.find(g => g.id === e.target.value);
                  update('existingEventId', e.target.value);
                  update('existingEvent', g ? g.name : '');
                }}
                required
              >
                <option value="">Select an event...</option>
                {gatherings.map(g => (
                  <option key={g.id} value={g.id}>{g.name} — {g.country}</option>
                ))}
              </select>
            </div>
          )}

          {form.type === 'new' && (
            <>
              <div className="suggest-field">
                <label>Event Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => update('name', e.target.value)}
                  placeholder="e.g. Berlin Tricking Gathering"
                  required
                  maxLength={100}
                />
              </div>

              <div className="suggest-row">
                <div className="suggest-field">
                  <label>Country *</label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={e => update('country', e.target.value)}
                    placeholder="e.g. Germany"
                    required
                    maxLength={50}
                  />
                </div>
                <div className="suggest-field">
                  <label>City *</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={e => update('city', e.target.value)}
                    placeholder="e.g. Berlin"
                    required
                    maxLength={50}
                  />
                </div>
              </div>
            </>
          )}

          <div className="suggest-row">
            <div className="suggest-field">
              <label>Start Date {form.type === 'update' ? '*' : ''}</label>
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
              <label>End Date</label>
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
              <label>Instagram</label>
              <input
                type="text"
                value={form.instagram}
                onChange={e => update('instagram', e.target.value)}
                placeholder="e.g. @berlintricking"
                maxLength={100}
              />
            </div>
          )}

          <div className="suggest-field">
            <label>Additional info</label>
            <textarea
              value={form.description}
              onChange={e => update('description', e.target.value)}
              placeholder={form.type === 'update' ? 'What changed? Any details...' : 'Brief description of the event...'}
              maxLength={300}
              rows={3}
            />
          </div>

          <div className="suggest-field">
            <label>Your name (optional)</label>
            <input
              type="text"
              value={form.submitterName}
              onChange={e => update('submitterName', e.target.value)}
              placeholder="So we know who suggested it"
              maxLength={50}
            />
          </div>

          <button type="submit" className="suggest-submit">Submit Suggestion</button>
        </form>
      </div>
    </div>
  );
}
