import { useState, useEffect, useCallback, useRef } from 'react';
import defaultSpots from '../data/trickspots.json';

const STORAGE_KEY = 'trickmap_trickspots';

function loadFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return null;
    return parsed.length > 0 ? parsed : null;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function useTrickspots() {
  const [spots, setSpots] = useState(() => {
    return loadFromStorage() || defaultSpots;
  });

  const saveTimer = useRef(null);
  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(spots));
      } catch { /* silent */ }
    }, 300);
    return () => clearTimeout(saveTimer.current);
  }, [spots]);

  const addSpot = useCallback((spot) => {
    setSpots(prev => [...prev, spot]);
  }, []);

  const updateSpot = useCallback((id, updated) => {
    setSpots(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
  }, []);

  const deleteSpot = useCallback((id) => {
    setSpots(prev => prev.filter(s => s.id !== id));
  }, []);

  const resetToDefaults = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSpots(defaultSpots);
  }, []);

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(spots, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    a.href = url;
    a.download = 'trickspots.json';
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [spots]);

  return { spots, addSpot, updateSpot, deleteSpot, resetToDefaults, exportJSON };
}
