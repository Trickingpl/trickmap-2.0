import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function Admin({ gatherings, onAdd, onUpdate, onDelete, onReset, onExport }) {
  const navigate = useNavigate();
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
      setError(`Too many attempts. Try again in ${secs}s.`);
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
        setError(`Too many attempts. Locked for 60 seconds.`);
        setTimeout(() => setLocked(false), LOCKOUT_MS);
      } else {
        setError(`Incorrect password (${MAX_ATTEMPTS - attemptsRef.current} attempts remaining)`);
      }
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthed(false);
  };

  const openNew = () => {
    setForm({ ...emptyGathering, id: crypto.randomUUID() });
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
          <h2>TrickMap Admin</h2>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="off"
            autoFocus
            disabled={locked}
          />
          <button type="submit" disabled={locked}>Enter</button>
          {error && <p className="admin-error">{error}</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <button className="admin-back" onClick={() => navigate('/')}>
          &larr; Back to Globe
        </button>
        <h1>TrickMap Admin</h1>
        <div className="admin-actions">
          <button className="btn-primary" onClick={openNew}>+ Add New Gathering</button>
          <button className="btn-secondary" onClick={onExport}>Export JSON</button>
          <button className="btn-danger" onClick={onReset}>Reset to Original</button>
          <button className="btn-secondary" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Country</th>
              <th>City</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {gatherings.map(g => (
              <tr key={g.id}>
                <td>{g.name}</td>
                <td>{g.country}</td>
                <td>{g.city}</td>
                <td>{g.date}</td>
                <td>
                  <span className={`status-badge status-${g.dateStatus}`}>
                    {g.dateStatus}
                  </span>
                </td>
                <td>
                  <button className="btn-sm" onClick={() => openEdit(g)}>Edit</button>
                  {deleteConfirm === g.id ? (
                    <>
                      <button className="btn-sm btn-danger" onClick={() => handleDelete(g.id)}>Confirm</button>
                      <button className="btn-sm" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                    </>
                  ) : (
                    <button className="btn-sm btn-danger" onClick={() => setDeleteConfirm(g.id)}>Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing !== null && (
        <div className="admin-modal-overlay" onClick={() => setEditing(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h2>{editing === 'new' ? 'Add New Gathering' : 'Edit Gathering'}</h2>
            <div className="admin-form">
              {[
                ['name', 'Name', 'text', true],
                ['country', 'Country', 'text', true],
                ['countryCode', 'Country Code (2 letters)', 'text', true],
                ['city', 'City', 'text', true],
                ['lat', 'Latitude', 'number', true],
                ['lng', 'Longitude', 'number', true],
                ['date', 'Date (free text)', 'text', false],
                ['description', 'Description', 'textarea', false],
                ['instagram', 'Instagram URL (https://...)', 'url', false],
                ['igHandle', 'IG Handle', 'text', false],
                ['website', 'Website URL (https://...)', 'url', false],
              ].map(([key, label, type, required]) => (
                <div key={key} className="form-group">
                  <label>{label}{required ? ' *' : ''}</label>
                  {type === 'textarea' ? (
                    <textarea
                      value={form[key]}
                      onChange={e => updateField(key, e.target.value)}
                      maxLength={500}
                    />
                  ) : (
                    <input
                      type={type === 'url' ? 'text' : type}
                      value={form[key]}
                      onChange={e => updateField(key, e.target.value)}
                      required={required}
                      maxLength={type === 'url' ? 200 : 100}
                    />
                  )}
                  {formErrors[key] && <span className="form-error">{formErrors[key]}</span>}
                </div>
              ))}
              <div className="form-group">
                <label>Date Status *</label>
                <select value={form.dateStatus} onChange={e => updateField('dateStatus', e.target.value)}>
                  <option value="confirmed">Confirmed</option>
                  <option value="tbd">TBD</option>
                  <option value="past">Past</option>
                </select>
              </div>
              <div className="form-group">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={form.isUpcoming}
                    onChange={e => updateField('isUpcoming', e.target.checked)}
                  />
                  Is Upcoming
                </label>
              </div>
              <div className="form-actions">
                <button className="btn-primary" onClick={handleSave}>Save</button>
                <button className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
