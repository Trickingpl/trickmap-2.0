import { useState, useEffect, useCallback, useRef } from 'react';
import defaultGatherings from '../data/gatherings.json';
import { validateGathering, sanitizeGathering } from '../utils/security';

const STORAGE_KEY = 'trickmap_gatherings';

function loadFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return null;
    const valid = parsed.filter(validateGathering).map(sanitizeGathering);
    if (valid.length === 0) return null;
    return valid;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function useGatherings() {
  const [gatherings, setGatherings] = useState(() => {
    return loadFromStorage() || defaultGatherings;
  });

  // Debounced localStorage write
  const saveTimer = useRef(null);
  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(gatherings));
      } catch {
        // localStorage full or unavailable — silent fail
      }
    }, 300);
    return () => clearTimeout(saveTimer.current);
  }, [gatherings]);

  const addGathering = useCallback((gathering) => {
    setGatherings(prev => [...prev, gathering]);
  }, []);

  const updateGathering = useCallback((id, updated) => {
    setGatherings(prev => prev.map(g => g.id === id ? { ...g, ...updated } : g));
  }, []);

  const deleteGathering = useCallback((id) => {
    setGatherings(prev => prev.filter(g => g.id !== id));
  }, []);

  const resetToDefaults = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setGatherings(defaultGatherings);
  }, []);

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(gatherings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    a.href = url;
    a.download = 'gatherings.json';
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [gatherings]);

  return { gatherings, addGathering, updateGathering, deleteGathering, resetToDefaults, exportJSON };
}
