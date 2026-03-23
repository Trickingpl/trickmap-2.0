import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import ReactGlobe from 'react-globe.gl';
import { feature } from 'topojson-client';
import { STATUS_COLORS, DEFAULT_STATUS_COLOR } from '../constants/status';

const COUNTRIES_TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json';

// Module-level cache so remounting doesn't re-fetch
let countriesCache = null;

// Hoisted constant-returning callbacks — stable references, no re-render churn
const polygonCapColor = () => 'rgba(12, 18, 35, 0.9)';
const polygonSideColor = () => 'rgba(8, 12, 25, 0.7)';
const polygonStrokeColor = () => 'rgba(60, 100, 180, 0.45)';
const labelColorFn = () => 'rgba(140, 160, 210, 0.5)';

export default function Globe({ gatherings, onSelect, focusCountry, onHover }) {
  const globeRef = useRef();
  const [countries, setCountries] = useState(() => countriesCache || []);
  const [windowSize, setWindowSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  // Stable refs for callbacks used inside imperative marker elements
  const onSelectRef = useRef(onSelect);
  const onHoverRef = useRef(onHover);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);
  useEffect(() => { onHoverRef.current = onHover; }, [onHover]);

  // Load country polygons (with cache + abort)
  useEffect(() => {
    if (countriesCache) {
      setCountries(countriesCache);
      return;
    }
    const controller = new AbortController();
    fetch(COUNTRIES_TOPO_URL, { signal: controller.signal })
      .then(r => r.json())
      .then(topoData => {
        const feat = feature(topoData, topoData.objects.countries);
        countriesCache = feat.features;
        setCountries(feat.features);
      })
      .catch(err => {
        if (err.name !== 'AbortError') console.error('Failed to load countries:', err);
      });
    return () => controller.abort();
  }, []);

  // Debounced window resize
  useEffect(() => {
    let timeout;
    const handleResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setWindowSize({ w: window.innerWidth, h: window.innerHeight });
      }, 150);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeout);
    };
  }, []);

  // Auto-rotate on load
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;
    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.3;
    globe.controls().enableZoom = true;
    globe.pointOfView({ altitude: 2.2 });
  }, []);

  // Stop auto-rotate on interaction
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;
    const controls = globe.controls();
    const stop = () => { controls.autoRotate = false; };
    const el = globe.renderer().domElement;
    el.addEventListener('mousedown', stop);
    el.addEventListener('wheel', stop);
    return () => {
      el.removeEventListener('mousedown', stop);
      el.removeEventListener('wheel', stop);
    };
  }, []);

  // Focus on country
  useEffect(() => {
    if (!focusCountry || !globeRef.current) return;
    const countryPins = gatherings.filter(g => g.country === focusCountry);
    if (countryPins.length === 0) return;
    const avgLat = countryPins.reduce((s, g) => s + g.lat, 0) / countryPins.length;
    const avgLng = countryPins.reduce((s, g) => s + g.lng, 0) / countryPins.length;
    globeRef.current.pointOfView({ lat: avgLat, lng: avgLng, altitude: 1.5 }, 1000);
  }, [focusCountry, gatherings]);

  // Country labels — only countries that have gatherings
  const countryLabels = useMemo(() => {
    const countryMap = {};
    gatherings.forEach(g => {
      if (!countryMap[g.country]) {
        countryMap[g.country] = { lats: [], lngs: [], name: g.country };
      }
      countryMap[g.country].lats.push(g.lat);
      countryMap[g.country].lngs.push(g.lng);
    });
    return Object.values(countryMap).map(c => ({
      lat: c.lats.reduce((a, b) => a + b, 0) / c.lats.length,
      lng: c.lngs.reduce((a, b) => a + b, 0) / c.lngs.length,
      label: c.name,
    }));
  }, [gatherings]);

  // Marker element builder — NO dependency on hovered state.
  // Hover styling is applied imperatively via DOM manipulation.
  const markerElement = useCallback((d) => {
    const color = STATUS_COLORS[d.dateStatus] || DEFAULT_STATUS_COLOR;

    const el = document.createElement('div');
    el.style.cssText = `
      width: 22px; height: 22px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; pointer-events: auto;
    `;

    const dot = document.createElement('div');
    dot.style.cssText = `
      width: 10px; height: 10px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 35%, ${color}, ${color}88);
      box-shadow: 0 0 6px ${color}, 0 0 12px ${color}55;
      border: 1.5px solid rgba(255,255,255,0.15);
      transition: all 0.15s ease;
    `;
    el.appendChild(dot);

    // Imperative hover styling — no state changes, no re-renders
    el.addEventListener('mouseenter', () => {
      el.style.width = '28px';
      el.style.height = '28px';
      dot.style.width = '14px';
      dot.style.height = '14px';
      dot.style.boxShadow = `0 0 14px ${color}, 0 0 28px ${color}55`;
      dot.style.borderColor = 'rgba(255,255,255,0.5)';
      onHoverRef.current(d, el);
    });

    el.addEventListener('mouseleave', () => {
      el.style.width = '22px';
      el.style.height = '22px';
      dot.style.width = '10px';
      dot.style.height = '10px';
      dot.style.boxShadow = `0 0 6px ${color}, 0 0 12px ${color}55`;
      dot.style.borderColor = 'rgba(255,255,255,0.15)';
      onHoverRef.current(null, null);
    });

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      onSelectRef.current(d);
    });

    return el;
  }, []); // Stable — no deps that change. Uses refs for callbacks.

  return (
    <ReactGlobe
      ref={globeRef}
      globeImageUrl="https://unpkg.com/three-globe/example/img/earth-dark.jpg"
      backgroundImageUrl="https://unpkg.com/three-globe/example/img/night-sky.png"

      polygonsData={countries}
      polygonCapColor={polygonCapColor}
      polygonSideColor={polygonSideColor}
      polygonStrokeColor={polygonStrokeColor}
      polygonAltitude={0.005}

      htmlElementsData={gatherings}
      htmlLat="lat"
      htmlLng="lng"
      htmlElement={markerElement}
      htmlAltitude={0.018}

      labelsData={countryLabels}
      labelLat="lat"
      labelLng="lng"
      labelText="label"
      labelSize={0.5}
      labelColor={labelColorFn}
      labelDotRadius={0}
      labelAltitude={0.008}
      labelResolution={2}

      onGlobeClick={() => onSelectRef.current(null)}
      atmosphereColor="#0a1e3d"
      atmosphereAltitude={0.15}
      width={windowSize.w}
      height={windowSize.h}
    />
  );
}
