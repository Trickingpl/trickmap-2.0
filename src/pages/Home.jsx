import { lazy, Suspense, useState, useMemo, useCallback } from 'react';
import GatheringCard from '../components/GatheringCard';
import FilterPanel from '../components/FilterPanel';
import HoverTooltip from '../components/HoverTooltip';
import './Home.css';

// Lazy load Globe — it pulls in Three.js (~1.5MB), load it after initial paint
const Globe = lazy(() => import('../components/Globe'));

function GlobeLoader() {
  return (
    <div className="globe-loader">
      <div className="globe-loader-spinner" />
      <p>Loading globe...</p>
    </div>
  );
}

export default function Home({ gatherings }) {
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ country: '', status: 'all' });
  const [search, setSearch] = useState('');
  const [tooltip, setTooltip] = useState({ gathering: null, position: null });

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

      <Suspense fallback={<GlobeLoader />}>
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

      <div className="home-stats">
        <span className="home-stats-num">{gatherings.length}</span> gatherings
        <span className="home-stats-sep" />
        <span className="home-stats-num">{countryCount}</span> countries
      </div>
    </div>
  );
}
