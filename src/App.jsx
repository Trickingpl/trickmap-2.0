import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useGatherings } from './hooks/useGatherings';
import { useRequests } from './hooks/useRequests';
import Home from './pages/Home';

const Admin = lazy(() => import('./pages/Admin'));

export default function App() {
  const { gatherings, addGathering, updateGathering, deleteGathering, resetToDefaults, exportJSON } = useGatherings();
  const { requests, addRequest, dismissRequest, clearAll, pendingCount } = useRequests();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home gatherings={gatherings} onSuggest={addRequest} />} />
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
                requests={requests}
                onDismissRequest={dismissRequest}
                onClearRequests={clearAll}
                pendingCount={pendingCount}
              />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
