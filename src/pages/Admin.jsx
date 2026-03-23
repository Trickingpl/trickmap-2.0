import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { sha256, sanitizeUrl } from '../utils/security';
import './Admin.css';

// SHA-256 hash of the admin password — not the password itself
const ADMIN_PASSWORD_HASH = '7c5079ec1a61e2e65f05921dbb8354d28e89c927ebdc20fedba8a9f780791579';

const SESSION_KEY = 'trickmap_admin_session';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60000; // 1 minute lockout

const emptyGathering = {
  id: '', name: '', country: '', countryCode: '', city: '',
  lat: 0, lng: 0, date: 'TBD', dateStatus: 'tbd', description: '',
  instagram: '', igHandle: '', website: '', isUpcoming: true,
};

const emptySpot = {
  id: '', name: '', country: '', countryCode: '', city: '',
  lat: 0, lng: 0, type: 'gym', hours: '', contact: '', description: '',
  instagram: '', igHandle: '', website: '',
};

export default function Admin({ gatherings, onAddGathering, onUpdateGathering, onDeleteGathering, onResetGatherings, onExportGatherings, spots = [], onAddSpot, onUpdateSpot, onDeleteSpot, onResetSpots, onExportSpots, requests = [], onDismissRequest, onClearRequests, pendingCount = 0 }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [authed, setAuthed] = useState(() => {
    return sessionStorage.getItem(SESSION_KEY) === 'true';
  });

  // Enable scrolling on admin page (body has overflow:hidden for globe)
  useEffect(() => {
    document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = ''; };
  }, []);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [adminMode, setAdminMode] = useState('events'); // 'events' | 'spots'
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyGathering);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // Rate limiting
  const attemptsRef = useRef(0);
  const lockoutUntilRef = useRef(0);
  const [locked, setLocked] = useState(false);

  // Auto-logout after 30 min inactivity (debounced to avoid thrashing)
  const activityTimer = useRef(null);
  const debounceTimer = useRef(null);
  useEffect(() => {
    if (!authed) return;
    const scheduleLogout = () => {
      clearTimeout(activityTimer.current);
      activityTimer.current = setTimeout(() => {
        sessionStorage.removeItem(SESSION_KEY);
        setAuthed(false);
      }, 30 * 60 * 1000);
    };
    const onActivity = () => {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(scheduleLogout, 5000);
    };
    scheduleLogout();
    window.addEventListener('mousemove', onActivity);
    window.addEventListener('keydown', onActivity);
    return () => {
      clearTimeout(activityTimer.current);
      clearTimeout(debounceTimer.current);
      window.removeEventListener('mousemove', onActivity);
      window.removeEventListener('keydown', onActivity);
    };
  }, [authed]);

  const handleLogin = async (e) => {
    e.preventDefault();

    // Check lockout
    if (Date.now() < lockoutUntilRef.current) {
      const secs = Math.ceil((lockoutUntilRef.current - Date.now()) / 1000);
      setError(t('admin.tooManyAttempts', { secs }));
      return;
    }

    const hash = await sha256(password);
    if (hash === ADMIN_PASSWORD_HASH) {
      setAuthed(true);
      setError('');
      setPassword('');
      attemptsRef.current = 0;
      sessionStorage.setItem(SESSION_KEY, 'true');
    } else {
      attemptsRef.current += 1;
      if (attemptsRef.current >= MAX_ATTEMPTS) {
        lockoutUntilRef.current = Date.now() + LOCKOUT_MS;
        setLocked(true);
        setError(t('admin.lockedOut'));
        setTimeout(() => setLocked(false), LOCKOUT_MS);
      } else {
        setError(t('admin.incorrectPassword', { remaining: MAX_ATTEMPTS - attemptsRef.current }));
      }
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthed(false);
  };

  // Derive current data/callbacks based on mode
  const isEvents = adminMode === 'events';
  const currentData = isEvents ? gatherings : spots;
  const onAdd = isEvents ? onAddGathering : onAddSpot;
  const onUpdate = isEvents ? onUpdateGathering : onUpdateSpot;
  const onDelete = isEvents ? onDeleteGathering : onDeleteSpot;
  const onReset = isEvents ? onResetGatherings : onResetSpots;
  const onExport = isEvents ? onExportGatherings : onExportSpots;

  const openNew = () => {
    const template = isEvents ? emptyGathering : emptySpot;
    setForm({ ...template, id: crypto.randomUUID() });
    setFormErrors({});
    setEditing('new');
  };

  const openEdit = (g) => {
    setForm({ ...g, website: g.website || '' });
    setFormErrors({});
    setEditing(g);
  };

  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Required';
    if (!form.country.trim()) errors.country = 'Required';
    if (!form.countryCode.trim() || form.countryCode.trim().length !== 2) errors.countryCode = 'Must be 2 letters';
    if (!form.city.trim()) errors.city = 'Required';

    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);
    if (isNaN(lat) || lat < -90 || lat > 90) errors.lat = 'Must be -90 to 90';
    if (isNaN(lng) || lng < -180 || lng > 180) errors.lng = 'Must be -180 to 180';

    if (form.instagram && !sanitizeUrl(form.instagram)) errors.instagram = 'Must be a valid https:// URL';
    if (form.website && !sanitizeUrl(form.website)) errors.website = 'Must be a valid https:// URL';

    if (form.description && form.description.length > 500) errors.description = 'Max 500 characters';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    const data = {
      ...form,
      name: form.name.trim(),
      country: form.country.trim(),
      countryCode: form.countryCode.trim().toUpperCase(),
      city: form.city.trim(),
      lat: parseFloat(form.lat),
      lng: parseFloat(form.lng),
      instagram: sanitizeUrl(form.instagram) || '',
      website: sanitizeUrl(form.website) || null,
    };
    if (editing === 'new') {
      onAdd(data);
    } else {
      onUpdate(data.id, data);
    }
    setEditing(null);
  };

  const handleDelete = (id) => {
    onDelete(id);
    setDeleteConfirm(null);
  };

  const updateField = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (formErrors[key]) setFormErrors(prev => ({ ...prev, [key]: undefined }));
  };

  if (!authed) {
    return (
      <div className="admin-login">
        <form onSubmit={handleLogin} className="admin-login-form">
          <h2>{t('admin.title')}</h2>
          <input
            type="password"
            placeholder={t('admin.enterPassword')}
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="off"
            autoFocus
            disabled={locked}
          />
          <button type="submit" disabled={locked}>{t('admin.enter')}</button>
          {error && <p className="admin-error">{error}</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <button className="admin-back" onClick={() => navigate('/')}>
          &larr; {t('admin.backToGlobe')}
        </button>
        <h1>{t('admin.title')}</h1>
        <div className="admin-actions">
          <button className="btn-primary" onClick={openNew}>{t('admin.addNew')}</button>
          <button className="btn-secondary" onClick={onExport}>{t('admin.exportJSON')}</button>
          <button className="btn-danger" onClick={onReset}>{t('admin.resetToOriginal')}</button>
          <button className="btn-secondary" onClick={handleLogout}>{t('admin.logout')}</button>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="admin-mode-toggle">
        <button
          className={`admin-mode-btn ${isEvents ? 'admin-mode-btn--events' : ''}`}
          onClick={() => setAdminMode('events')}
        >
          {t('mode.events')} ({gatherings.length})
        </button>
        <button
          className={`admin-mode-btn ${!isEvents ? 'admin-mode-btn--spots' : ''}`}
          onClick={() => setAdminMode('spots')}
        >
          {t('mode.trickspots')} ({spots.length})
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t('admin.name')}</th>
              <th>{t('admin.country')}</th>
              <th>{t('admin.city')}</th>
              <th>{isEvents ? t('admin.date') : t('spots.spotType')}</th>
              <th>{isEvents ? t('admin.status') : t('spots.hours')}</th>
              <th>{t('admin.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map(g => (
              <tr key={g.id}>
                <td>{g.name}</td>
                <td>{g.country}</td>
                <td>{g.city}</td>
                <td>{isEvents ? g.date : (g.type || '—')}</td>
                <td>
                  {isEvents ? (
                    <span className={`status-badge status-${g.dateStatus}`}>
                      {g.dateStatus}
                    </span>
                  ) : (
                    <span className="status-badge status-spot">{g.hours || '—'}</span>
                  )}
                </td>
                <td>
                  <button className="btn-sm" onClick={() => openEdit(g)}>{t('admin.edit')}</button>
                  {deleteConfirm === g.id ? (
                    <>
                      <button className="btn-sm btn-danger" onClick={() => handleDelete(g.id)}>{t('admin.confirm')}</button>
                      <button className="btn-sm" onClick={() => setDeleteConfirm(null)}>{t('admin.cancel')}</button>
                    </>
                  ) : (
                    <button className="btn-sm btn-danger" onClick={() => setDeleteConfirm(g.id)}>{t('admin.delete')}</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Community Requests */}
      {requests.length > 0 && (
        <div className="admin-requests">
          <div className="admin-requests-header">
            <h2>
              {t('admin.communityRequests')}
              {pendingCount > 0 && <span className="admin-requests-badge">{pendingCount}</span>}
            </h2>
            <button className="btn-secondary" onClick={onClearRequests}>{t('admin.clearAll')}</button>
          </div>
          <div className="admin-requests-list">
            {requests.map(r => (
              <div key={r.id} className="admin-request-card">
                <div className="admin-request-type">
                  {r.type === 'new' ? t('admin.newEventLabel') : t('admin.updateRequest')}
                </div>
                <div className="admin-request-body">
                  {r.type === 'new' ? (
                    <>
                      <strong>{r.name}</strong>
                      <span className="admin-request-meta">{r.city}, {r.country}</span>
                    </>
                  ) : (
                    <strong>{r.existingEvent}</strong>
                  )}
                  {r.date && <span className="admin-request-date">{t('admin.suggestedDate', { date: r.date })}</span>}
                  {r.instagram && <span className="admin-request-meta">IG: {r.instagram}</span>}
                  {r.description && <p className="admin-request-desc">{r.description}</p>}
                  <span className="admin-request-footer">
                    {r.submitterName && `By ${r.submitterName} · `}
                    {new Date(r.submittedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="admin-request-actions">
                  {r.type === 'update' && r.date && r.existingEventId && (
                    <button className="btn-sm btn-approve" onClick={() => {
                      onUpdate(r.existingEventId, { date: r.date, dateStatus: 'confirmed' });
                      onDismissRequest(r.id);
                    }}>{t('admin.approve')}</button>
                  )}
                  <button className="btn-sm btn-danger" onClick={() => onDismissRequest(r.id)}>{t('admin.dismiss')}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {editing !== null && (
        <div className="admin-modal-overlay" onClick={() => setEditing(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h2>{editing === 'new' ? (isEvents ? t('admin.addNewGathering') : t('spots.suggestLocation')) : t('admin.editGathering')}</h2>
            <div className="admin-form">
              {(isEvents ? [
                ['name', t('admin.name'), 'text', true],
                ['country', t('admin.country'), 'text', true],
                ['countryCode', t('admin.countryCode'), 'text', true],
                ['city', t('admin.city'), 'text', true],
                ['lat', t('admin.latitude'), 'number', true],
                ['lng', t('admin.longitude'), 'number', true],
                ['date', t('admin.dateFreeText'), 'text', false],
                ['description', t('admin.description'), 'textarea', false],
                ['instagram', t('admin.instagramUrl'), 'url', false],
                ['igHandle', t('admin.igHandle'), 'text', false],
                ['website', t('admin.websiteUrl'), 'url', false],
              ] : [
                ['name', t('admin.name'), 'text', true],
                ['country', t('admin.country'), 'text', true],
                ['countryCode', t('admin.countryCode'), 'text', true],
                ['city', t('admin.city'), 'text', true],
                ['lat', t('admin.latitude'), 'number', true],
                ['lng', t('admin.longitude'), 'number', true],
                ['hours', t('spots.hours'), 'text', false],
                ['contact', t('spots.contact'), 'text', false],
                ['description', t('admin.description'), 'textarea', false],
                ['instagram', t('admin.instagramUrl'), 'url', false],
                ['igHandle', t('admin.igHandle'), 'text', false],
                ['website', t('admin.websiteUrl'), 'url', false],
              ]).map(([key, label, type, required]) => (
                <div key={key} className="form-group">
                  <label>{label}{required ? ' *' : ''}</label>
                  {type === 'textarea' ? (
                    <textarea
                      value={form[key] || ''}
                      onChange={e => updateField(key, e.target.value)}
                      maxLength={500}
                    />
                  ) : (
                    <input
                      type={type === 'url' ? 'text' : type}
                      value={form[key] || ''}
                      onChange={e => updateField(key, e.target.value)}
                      required={required}
                      maxLength={type === 'url' ? 200 : 100}
                    />
                  )}
                  {formErrors[key] && <span className="form-error">{formErrors[key]}</span>}
                </div>
              ))}
              {isEvents ? (
                <>
                  <div className="form-group">
                    <label>{t('admin.dateStatus')} *</label>
                    <select value={form.dateStatus} onChange={e => updateField('dateStatus', e.target.value)}>
                      <option value="confirmed">{t('status.confirmed')}</option>
                      <option value="tbd">{t('status.tbd')}</option>
                      <option value="past">{t('status.past')}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={form.isUpcoming}
                        onChange={e => updateField('isUpcoming', e.target.checked)}
                      />
                      {t('admin.isUpcoming')}
                    </label>
                  </div>
                </>
              ) : (
                <div className="form-group">
                  <label>{t('spots.spotType')} *</label>
                  <select value={form.type || 'gym'} onChange={e => updateField('type', e.target.value)}>
                    <option value="gym">{t('spots.type_gym')}</option>
                    <option value="park">{t('spots.type_park')}</option>
                    <option value="beach">{t('spots.type_beach')}</option>
                    <option value="other">{t('spots.type_other')}</option>
                  </select>
                </div>
              )}
              <div className="form-actions">
                <button className="btn-primary" onClick={handleSave}>{t('admin.save')}</button>
                <button className="btn-secondary" onClick={() => setEditing(null)}>{t('admin.cancel')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
