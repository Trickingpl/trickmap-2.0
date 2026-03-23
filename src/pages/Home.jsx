import { lazy, Suspense, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import GatheringCard from '../components/GatheringCard';
import FilterPanel from '../components/FilterPanel';
import HoverTooltip from '../components/HoverTooltip';
import SuggestForm from '../components/SuggestForm';
import LanguageSelector from '../components/LanguageSelector';
import './Home.css';

const Globe = lazy(() => import('../components/Globe'));

function GlobeLoader({ text }) {
  return (
    <div className="globe-loader">
      <div className="globe-loader-spinner" />
      <p>{text}</p>
    </div>
  );
}

export default function Home({ gatherings, onSuggest }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ country: '', status: 'all' });
  const [search, setSearch] = useState('');
  const [tooltip, setTooltip] = useState({ gathering: null, position: null });
  const [showSuggest, setShowSuggest] = useState(false);

  const filtered = useMemo(() => {
    return gatherings.filter(g => {
      if (filters.country && g.country !== filters.country) return false;
      if (filters.status === 'upcoming' && g.dateStatus !== 'confirmed') return false;
      if (search) {
        const q = search.toLowerCase();
        if (!g.name.toLowerCase().includes(q) && !g.city.toLowerCase().includes(q) && !g.country.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [gatherings, filters, search]);

  const handleHover = useCallback((gathering, el) => {
    if (!gathering || !el) {
      setTooltip({ gathering: null, position: null });
      return;
    }
    const rect = el.getBoundingClientRect();
    setTooltip({
      gathering,
      position: { x: rect.left + rect.width / 2, y: rect.top },
    });
  }, []);

  const countryCount = useMemo(() => new Set(gatherings.map(g => g.country)).size, [gatherings]);

  return (
    <div className="home">
      <div className="vignette" />

      <div className="branding">
        <span className="branding-mark">TRICK</span>
        <span className="branding-accent">MAP</span>
      </div>

      <Suspense fallback={<GlobeLoader text={t('home.loadingGlobe')} />}>
        <Globe
          gatherings={filtered}
          onSelect={setSelected}
          focusCountry={filters.country}
          onHover={handleHover}
        />
      </Suspense>

      <FilterPanel
        gatherings={gatherings}
        filteredCount={filtered.length}
        onFilter={setFilters}
        onSearch={setSearch}
      />

      <HoverTooltip gathering={tooltip.gathering} position={tooltip.position} />

      {selected && (
        <GatheringCard gathering={selected} onClose={() => setSelected(null)} />
      )}

      <button className="suggest-btn" onClick={() => setShowSuggest(true)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        {t('home.suggestEvent')}
      </button>

      {showSuggest && (
        <SuggestForm
          gatherings={gatherings}
          onSubmit={onSuggest}
          onClose={() => setShowSuggest(false)}
        />
      )}

      <LanguageSelector />

      <div className="home-stats">
        <span className="home-stats-num">{gatherings.length}</span> {t('home.gatherings')}
        <span className="home-stats-sep" />
        <span className="home-stats-num">{countryCount}</span> {t('home.countries')}
      </div>
    </div>
  );
}
