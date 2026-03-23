import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useGatherings } from './hooks/useGatherings';
import Home from './pages/Home';
import Admin from './pages/Admin';

export default function App() {
  const { gatherings, addGathering, updateGathering, deleteGathering, resetToDefaults, exportJSON } = useGatherings();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home gatherings={gatherings} />} />
        <Route
          path="/admin"
          element={
            <Admin
              gatherings={gatherings}
              onAdd={addGathering}
              onUpdate={updateGathering}
              onDelete={deleteGathering}
              onReset={resetToDefaults}
              onExport={exportJSON}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
