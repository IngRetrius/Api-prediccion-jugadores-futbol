import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import PlayerHistory from '../components/players/PlayerHistory';
import PlayerStats from '../components/players/PlayerStats';
import ModelMetrics from '../components/predictions/ModelMetrics';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import { usePlayerData } from '../hooks/usePlayerData';
import { formatPlayerName } from '../utils/formatters';
import DayroVideo from '../assets/dayro_moreno.mp4';

const PlayerAnalysisPage: React.FC = () => {
  const { playerName } = useParams<{ playerName: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'history' | 'stats' | 'metrics'>('history');
  const [showVideo, setShowVideo] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (playerName === 'Dayro_Moreno') {
      setShowVideo(true);
    }
  }, [playerName]);
  
  // Usar hook para cargar datos del jugador
  const { 
    history, 
    metrics, 
    isLoading, 
    error, 
    loadPlayerData 
  } = usePlayerData();
  
  // Cargar datos cuando cambie el jugador seleccionado
  useEffect(() => {
    if (playerName) {
      loadPlayerData(playerName);
    }
  }, [playerName, loadPlayerData]);
  
  // Si no hay nombre de jugador, redirigir a la lista
  if (!playerName) {
    navigate('/players');
    return null;
  }
  
  // Renderizar cargando
  if (isLoading && !history && !metrics) {
    return (
      <Layout title={`Análisis de Jugador - ${formatPlayerName(playerName)}`}>
        <Loading fullPage text="Cargando datos del jugador..." />
      </Layout>
    );
  }
  
  // Renderizar error
  if (error && !history && !metrics) {
    return (
      <Layout title={`Análisis de Jugador - ${formatPlayerName(playerName)}`}>
        <Card>
          <div className="text-center text-red-600 py-8">
            <p>{error}</p>
            <button 
              onClick={() => loadPlayerData(playerName)} 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        </Card>
      </Layout>
    );
  }
  
  return (
    <Layout title={`Análisis de Jugador - ${formatPlayerName(playerName)}`}>
      <div className="space-y-6">
        {/* Cabecera del jugador */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="bg-blue-600 px-6 py-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <h1 className="text-xl font-bold text-white">
                {formatPlayerName(playerName)}
              </h1>
              <div className="mt-2 md:mt-0">
                <Button 
                  variant="outline" 
                  className="bg-white hover:bg-gray-100 text-blue-600"
                  onClick={() => navigate('/predict')}
                >
                  Predecir rendimiento
                </Button>
              </div>
            </div>
          </div>
          
          {/* Tabs de navegación */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('history')}
              >
                Historial
              </button>
              <button
                className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'stats'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('stats')}
              >
                Estadísticas
              </button>
              <button
                className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'metrics'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('metrics')}
              >
                Métricas de modelos
              </button>
            </nav>
          </div>
        </div>

        {playerName === 'Dayro_Moreno' && showVideo && (
          <div className="fixed bottom-4 right-4 z-50 w-64 h-auto rounded-lg overflow-hidden shadow-xl bg-black">
            <video 
              src={DayroVideo}
              className="w-full h-auto"
              controls
              onEnded={() => setShowVideo(false)}
              ref={videoRef}
            >
              Tu navegador no soporta la etiqueta de video.
            </video>
            <button 
              onClick={() => setShowVideo(false)}
              className="absolute top-2 right-2 bg-black bg-opacity-60 text-white rounded-full p-1 hover:bg-opacity-80 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {/* Contenido según el tab activo */}
        <div className="mt-6">
          {activeTab === 'history' && (
            <PlayerHistory 
              playerName={playerName} 
            />
          )}
          
          {activeTab === 'stats' && (
            <PlayerStats 
              playerName={playerName} 
            />
          )}
          
          {activeTab === 'metrics' && (
            <ModelMetrics 
              metrics={metrics}
              isLoading={isLoading}
              error={error}
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PlayerAnalysisPage;