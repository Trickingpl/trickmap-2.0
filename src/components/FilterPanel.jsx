import { useState, useMemo } from 'react';
import { STATUS_LEGEND } from '../constants/status';
import './FilterPanel.css';

export default function FilterPanel({ gatherings, onFilter, filteredCount, onSearch }) {
  const [open, setOpen] = useState(false);
  const [country, setCountry] = useState('');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');

  const countries = useMemo(() => {
    const set = new Set(gatherings.map(g => g.country));
    return [...set].sort();
  }, [gatherings]);

  const handleCountryChange = (val) => {
    setCountry(val);
    onFilter({ country: val, status });
  };

  const handleStatusChange = (val) => {
    setStatus(val);
    onFilter({ country, status: val });
  };

  const handleSearch = (val) => {
    setSearch(val);
    onSearch(val);
  };

  const clearFilters = () => {
    setCountry('');
    setStatus('all');
    setSearch('');
    onFilter({ country: '', status: 'all' });
    onSearch('');
  };

  return (
    <>
      <button className="filter-toggle" onClick={() => setOpen(!open)} aria-label="Toggle filters">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="8" y1="12" x2="20" y2="12" />
          <line x1="12" y1="18" x2="20" y2="18" />
        </svg>
      </button>

      <div className={`filter-panel ${open ? 'filter-panel--open' : ''}`}>
        <button className="filter-close" onClick={() => setOpen(false)} aria-label="Close filters">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Search */}
        <div className="filter-search-wrap">
          <svg className="filter-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="filter-search"
            type="text"
            placeholder="Search gatherings..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>

        <div className="filter-divider" />

        {/* Country */}
        <label className="filter-label">Country</label>
        <select
          className="filter-select"
          value={country}
          onChange={e => handleCountryChange(e.target.value)}
        >
          <option value="">All Countries</option>
          {countries.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Status */}
        <label className="filter-label">Status</label>
        <div className="filter-status-btns">
          {[
            ['all', 'All'],
            ['upcoming', 'Upcoming'],
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

        {/* Legend */}
        <label className="filter-label">Legend</label>
        <div className="filter-legend">
          {STATUS_LEGEND.map(({ color, label }) => (
            <div key={label} className="filter-legend-item">
              <span className="filter-legend-dot" style={{
                background: color,
                boxShadow: `0 0 6px ${color}`,
              }} />
              <span className="filter-legend-text">{label}</span>
            </div>
          ))}
        </div>

        <div className="filter-divider" />

        <button className="filter-clear" onClick={clearFilters}>Clear All</button>

        <p className="filter-count">{filteredCount} gatherings</p>
      </div>
    </>
  );
}
