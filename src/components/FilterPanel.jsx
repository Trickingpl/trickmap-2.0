import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { STATUS_LEGEND, SPOT_COLOR } from '../constants/status';
import './FilterPanel.css';

export default function FilterPanel({ gatherings, onFilter, filteredCount, onSearch, mode = 'events' }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [country, setCountry] = useState('');
  const [status, setStatus] = useState('all');
  const [spotType, setSpotType] = useState('');
  const [search, setSearch] = useState('');

  const isEvents = mode === 'events';

  const countries = useMemo(() => {
    const set = new Set(gatherings.map(g => g.country));
    return [...set].sort();
  }, [gatherings]);

  const handleCountryChange = (val) => {
    setCountry(val);
    onFilter({ country: val, status, spotType });
  };

  const handleStatusChange = (val) => {
    setStatus(val);
    onFilter({ country, status: val, spotType });
  };

  const handleSpotTypeChange = (val) => {
    setSpotType(val);
    onFilter({ country, status, spotType: val });
  };

  const handleSearch = (val) => {
    setSearch(val);
    onSearch(val);
  };

  const clearFilters = () => {
    setCountry('');
    setStatus('all');
    setSpotType('');
    setSearch('');
    onFilter({ country: '', status: 'all', spotType: '' });
    onSearch('');
  };

  return (
    <>
      <button className="filter-toggle" onClick={() => setOpen(!open)} aria-label={t('filters.title')}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="8" y1="12" x2="20" y2="12" />
          <line x1="12" y1="18" x2="20" y2="18" />
        </svg>
      </button>

      <div className={`filter-panel ${open ? 'filter-panel--open' : ''}`}>
        <div className="filter-header">
          <span className="filter-title">{t('filters.title')}</span>
          <button className="filter-close" onClick={() => setOpen(false)} aria-label={t('filters.title')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="filter-search-wrap">
          <svg className="filter-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="filter-search"
            type="text"
            placeholder={t('filters.searchPlaceholder')}
            value={search}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>

        <div className="filter-divider" />

        <label className="filter-label">{t('filters.country')}</label>
        <select
          className="filter-select"
          value={country}
          onChange={e => handleCountryChange(e.target.value)}
        >
          <option value="">{t('filters.allCountries')}</option>
          {countries.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {isEvents ? (
          <>
            <label className="filter-label">{t('filters.status')}</label>
            <div className="filter-status-btns">
              {[
                ['all', t('filters.all')],
                ['upcoming', t('filters.upcoming')],
              ].map(([val, label]) => (
                <button
                  key={val}
                  className={`filter-status-btn ${status === val ? 'filter-status-btn--active' : ''}`}
                  onClick={() => handleStatusChange(val)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="filter-divider" />

            <label className="filter-label">{t('filters.legend')}</label>
            <div className="filter-legend">
              {STATUS_LEGEND.map(({ color, key: statusKey }) => (
                <div key={statusKey} className="filter-legend-item">
                  <span className="filter-legend-dot" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                  <span className="filter-legend-text">{t(`status.${statusKey}`)}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <label className="filter-label">{t('spots.spotType')}</label>
            <div className="filter-status-btns">
              {[
                ['', t('filters.all')],
                ['gym', t('spots.type_gym')],
                ['park', t('spots.type_park')],
                ['beach', t('spots.type_beach')],
              ].map(([val, label]) => (
                <button
                  key={val}
                  className={`filter-status-btn ${spotType === val ? 'filter-status-btn--spots' : ''}`}
                  onClick={() => handleSpotTypeChange(val)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="filter-divider" />

            <label className="filter-label">{t('filters.legend')}</label>
            <div className="filter-legend">
              <div className="filter-legend-item">
                <span className="filter-legend-dot" style={{ background: SPOT_COLOR, boxShadow: `0 0 6px ${SPOT_COLOR}` }} />
                <span className="filter-legend-text">{t('spots.trickspot')}</span>
              </div>
            </div>
          </>
        )}

        <div className="filter-divider" />

        <button className="filter-clear" onClick={clearFilters}>{t('filters.clearAll')}</button>

        <p className="filter-count">{t('filters.gatheringsCount', { count: filteredCount })}</p>
      </div>
    </>
  );
}
