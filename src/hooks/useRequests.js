import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'trickmap_requests';

function loadRequests() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useRequests() {
  const [requests, setRequests] = useState(loadRequests);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    } catch { /* silent */ }
  }, [requests]);

  const addRequest = useCallback((request) => {
    setRequests(prev => [...prev, {
      ...request,
      id: crypto.randomUUID(),
      submittedAt: new Date().toISOString(),
      status: 'pending',
    }]);
  }, []);

  const dismissRequest = useCallback((id) => {
    setRequests(prev => prev.filter(r => r.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setRequests([]);
  }, []);

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return { requests, addRequest, dismissRequest, clearAll, pendingCount };
}
