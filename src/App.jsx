import { lazy, Suspense, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useGatherings } from './hooks/useGatherings';
import { useTrickspots } from './hooks/useTrickspots';
import { useRequests } from './hooks/useRequests';
import Home from './pages/Home';

const Admin = lazy(() => import('./pages/Admin'));

export default function App() {
  const [mode, setMode] = useState('events');
  const events = useGatherings();
  const spots = useTrickspots();
  const reqs = useRequests();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <Home
            mode={mode}
            onModeChange={setMode}
            gatherings={events.gatherings}
            spots={spots.spots}
            onSuggest={reqs.addRequest}
          />
        } />
        <Route
          path="/admin"
          element={
            <Suspense fallback={<div style={{ background: '#0a0a0f', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}>Loading admin...</div>}>
              <Admin
                mode={mode}
                onModeChange={setMode}
                gatherings={events.gatherings}
                onAddGathering={events.addGathering}
                onUpdateGathering={events.updateGathering}
                onDeleteGathering={events.deleteGathering}
                onResetGatherings={events.resetToDefaults}
                onExportGatherings={events.exportJSON}
                spots={spots.spots}
                onAddSpot={spots.addSpot}
                onUpdateSpot={spots.updateSpot}
                onDeleteSpot={spots.deleteSpot}
                onResetSpots={spots.resetToDefaults}
                onExportSpots={spots.exportJSON}
                requests={reqs.requests}
                onDismissRequest={reqs.dismissRequest}
                onClearRequests={reqs.clearAll}
                pendingCount={reqs.pendingCount}
              />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
