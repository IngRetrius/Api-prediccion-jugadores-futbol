import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Importar páginas
import HomePage from './pages/HomePage';
import PredictionPage from './pages/PredictionPage';
import PlayerAnalysisPage from './pages/PlayerAnalysisPage';
import ComparisonPage from './pages/ComparisonPage';
import AboutPage from './pages/AboutPage';
import PlayerList from './components/players/PlayerList';
import TeamPage from './pages/TeamPage';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/predict" element={<PredictionPage />} />
      <Route path="/players" element={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <PlayerList />
        </div>
      } />
      <Route path="/players/:playerName" element={<PlayerAnalysisPage />} />
      <Route path="/compare" element={<ComparisonPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/teams" element={<TeamPage />} />
      {/* Redirección para rutas no encontradas */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;