import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import { getSystemStatus } from '../api/predictionsApi';
import { SystemStatus } from '../types/api';

const HomePage: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const status = await getSystemStatus();
        setSystemStatus(status);
        setError(null);
      } catch (err) {
        console.error('Error al obtener estado del sistema:', err);
        setError('No se pudo conectar con el servidor. Por favor, inténtelo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStatus();
  }, []);
  
  return (
    <Layout title="Inicio - Predicción de Goles">
      <div className="space-y-8">
        {/* Hero section */}
        <div className="bg-blue-600 text-white rounded-lg overflow-hidden shadow-lg">
          <div className="px-6 py-12 md:px-12 text-center">
            <h1 className="text-3xl font-bold mb-6">
              Sistema de Predicción de Goles para Fútbol Colombiano
            </h1>
            <p className="text-lg mb-8 max-w-3xl mx-auto">
              Utiliza modelos de aprendizaje automático para predecir el rendimiento 
              goleador de los jugadores en la liga colombiana.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link to="/predict">
                <Button variant="outline" size="lg" className="bg-white hover:bg-gray-100 border-white">
                  Realizar predicción
                </Button>
              </Link>
              <Link to="/players">
                <Button variant="outline" size="lg" className="bg-white hover:bg-gray-100 border-white">
                  Ver jugadores
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="text-center p-4">
              <div className="h-12 w-12 bg-blue-500 text-white rounded-full mx-auto flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Predicción Avanzada</h3>
              <p className="text-gray-600">
                Combina tres modelos de aprendizaje automático: LSTM, SARIMAX y Poisson
                para ofrecer predicciones precisas.
              </p>
            </div>
          </Card>
          
          <Card>
            <div className="text-center p-4">
              <div className="h-12 w-12 bg-green-500 text-white rounded-full mx-auto flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Análisis Estadístico</h3>
              <p className="text-gray-600">
                Visualiza estadísticas detalladas de rendimiento de jugadores
                y compara diferentes modelos de predicción.
              </p>
            </div>
          </Card>
          
          <Card>
            <div className="text-center p-4">
              <div className="h-12 w-12 bg-purple-500 text-white rounded-full mx-auto flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Personalización</h3>
              <p className="text-gray-600">
                Ajusta parámetros específicos como minutos jugados, tiros a puerta
                y selecciona qué modelos utilizar para la predicción.
              </p>
            </div>
          </Card>
        </div>
        
        {/* System Status */}
        <Card title="Estado del Sistema">
          {loading ? (
            <Loading text="Verificando estado del sistema..." />
          ) : error ? (
            <div className="text-center text-red-600 py-4">
              <p>{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-2 text-blue-600 hover:text-blue-800 underline"
              >
                Reintentar
              </button>
            </div>
          ) : systemStatus ? (
            <div className="space-y-4">
              <div className="flex items-center">
                <div className={`h-3 w-3 rounded-full mr-2 ${
                  systemStatus.status === 'online' ? 'bg-green-500' : 
                  systemStatus.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="font-medium">
                  Estado: {
                    systemStatus.status === 'online' ? 'En línea' : 
                    systemStatus.status === 'warning' ? 'Advertencia' : 'Error'
                  }
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Jugadores disponibles:</span> {systemStatus.players_available}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Registros históricos:</span> {systemStatus.historical_data_rows}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Actualizado:</span> {new Date(systemStatus.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              
              {systemStatus.models_availability && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Disponibilidad de modelos:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {Object.entries(systemStatus.models_availability).map(([model, availability]) => (
                      <div key={model} className="bg-gray-50 p-2 rounded">
                        <p className="text-sm">
                          <span className="font-medium">{model.toUpperCase()}: </span>
                          {availability}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {systemStatus.message && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <p className="text-yellow-700">{systemStatus.message}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">
              No se pudo obtener información del estado del sistema.
            </p>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default HomePage;