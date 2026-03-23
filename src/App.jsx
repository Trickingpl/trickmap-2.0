import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useGatherings } from './hooks/useGatherings';
import Home from './pages/Home';

// Lazy load admin — most users never visit /admin
const Admin = lazy(() => import('./pages/Admin'));

export default function App() {
  const { gatherings, addGathering, updateGathering, deleteGathering, resetToDefaults, exportJSON } = useGatherings();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home gatherings={gatherings} />} />
        <Route
          path="/admin"
          element={
            <Suspense fallback={<div style={{ background: '#0a0a0f', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}>Loading admin...</div>}>
              <Admin
                gatherings={gatherings}
                onAdd={addGathering}
                onUpdate={updateGathering}
                onDelete={deleteGathering}
                onReset={resetToDefaults}
                onExport={exportJSON}
              />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
