import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import { getSystemStatus } from '../api/predictionsApi';
import { SystemStatus } from '../types/api';
import { getAvailablePlayers } from '../api/playersApi';
import { formatPlayerName } from '../utils/formatters';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface QuickStat {
  label: string;
  value: number | string;
  change?: string;
  color: string;
}

interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  link: string;
}

const HomePage: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [players, setPlayers] = useState<string[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const navigate = useNavigate();
  
  // Estadísticas actualizadas con datos de validación
  const quickStats: QuickStat[] = [
    { label: 'Predicciones Totales', value: '300', change: '', color: 'blue' },
    { label: 'Precisión Total', value: '50.00%', change: '87/174', color: 'green' },
    { label: 'Partidos Jugados', value: '174', change: '58%', color: 'purple' },
    { label: 'Error Promedio', value: '0.58', change: 'Goles', color: 'indigo' }
  ];
  
  // Datos para la gráfica de comparación total de goles
  const goalsComparisonData = [
    {
      player: 'Carlos Bacca',
      golesReales: 3,
      lstm: 12,
      sarimax: 3,
      poisson: 0
    },
    {
      player: 'Dayro Moreno',
      golesReales: 7,
      lstm: 20,
      sarimax: 9,
      poisson: 18
    },
    {
      player: 'Hugo Rodallega',
      golesReales: 9,
      lstm: 3,
      sarimax: 1,
      poisson: 2
    },
    {
      player: 'Leonardo Castro',
      golesReales: 6,
      lstm: 7,
      sarimax: 9,
      poisson: 6
    },
    {
      player: 'Marco Perez',
      golesReales: 0,
      lstm: 0,
      sarimax: 4,
      poisson: 0
    }
  ];
  
  // Características mejoradas
  const features: Feature[] = [
    {
      title: 'Predicción Avanzada',
      description: 'Combina tres modelos de aprendizaje automático: LSTM, SARIMAX y Poisson para ofrecer predicciones precisas.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: 'bg-blue-500',
      link: '/predict'
    },
    {
      title: 'Análisis Estadístico',
      description: 'Visualiza estadísticas detalladas de rendimiento de jugadores y compara diferentes modelos de predicción.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'bg-green-500',
      link: '/players'
    },
    {
      title: 'Personalización',
      description: 'Ajusta parámetros específicos como minutos jugados, tiros a puerta y selecciona qué modelos utilizar.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      ),
      color: 'bg-purple-500',
      link: '/validation'
    }
  ];
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [status, playersList] = await Promise.all([
          getSystemStatus(),
          getAvailablePlayers()
        ]);
        setSystemStatus(status);
        setPlayers(playersList.map(p => p.name));
        setError(null);
      } catch (err) {
        console.error('Error al obtener datos:', err);
        setError('No se pudo conectar con el servidor. Por favor, inténtelo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Manejar búsqueda de jugadores
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = players.filter(player => 
        player.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPlayers(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredPlayers([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, players]);
  
  const handlePlayerSelect = (playerName: string) => {
    navigate(`/players/${playerName}`);
    setSearchQuery('');
    setShowSuggestions(false);
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredPlayers.length > 0) {
      handlePlayerSelect(filteredPlayers[0]);
    }
  };
  
  return (
    <Layout title="Inicio - Predicción de Goles">
      <div className="space-y-8">
        {/* Hero Section Mejorada */}
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white rounded-xl overflow-hidden shadow-2xl">
          {/* Patrón de fondo */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="soccer-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="10" cy="10" r="3" fill="white" />
                  <path d="M5,5 L15,15 M15,5 L5,15" stroke="white" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#soccer-pattern)" />
            </svg>
          </div>
          
          <div className="relative px-6 py-16 md:px-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in">
              Sistema de Predicción de Goles para Fútbol Colombiano
            </h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto text-blue-100">
              Utiliza modelos de aprendizaje automático para predecir el rendimiento 
              goleador de los jugadores en la liga colombiana.
            </p>
            
            {/* Búsqueda rápida */}
            <form onSubmit={handleSearch} className="max-w-md mx-auto mb-8 relative">
              <input 
                type="text" 
                placeholder="Buscar jugador..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 rounded-lg text-gray-900 placeholder-gray-500 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-blue-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              
              {/* Sugerencias de búsqueda */}
              {showSuggestions && filteredPlayers.length > 0 && (
                <div className="absolute w-full mt-2 bg-white rounded-lg shadow-xl z-10 max-h-64 overflow-y-auto">
                  {filteredPlayers.slice(0, 5).map((player) => (
                    <button
                      key={player}
                      onClick={() => handlePlayerSelect(player)}
                      className="w-full text-left px-4 py-2 text-gray-800 hover:bg-blue-50 border-b border-gray-100 last:border-0"
                    >
                      {formatPlayerName(player)}
                    </button>
                  ))}
                </div>
              )}
            </form>
            
            {/* Botones de acción rápida */}
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/predict" className="group">
                <div className="bg-white/10 backdrop-blur-sm text-white p-6 rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-300 transform group-hover:scale-105">
                  <svg className="w-12 h-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold block">Realizar Predicción</span>
                </div>
              </Link>
              <Link to="/players" className="group">
                <div className="bg-white/10 backdrop-blur-sm text-white p-6 rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-300 transform group-hover:scale-105">
                  <svg className="w-12 h-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="font-semibold block">Ver Jugadores</span>
                </div>
              </Link>
              <Link to="/validation" className="group">
                <div className="bg-white/10 backdrop-blur-sm text-white p-6 rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-300 transform group-hover:scale-105">
                  <svg className="w-12 h-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="font-semibold block">Validación</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Predicción Sugerida para Apostar */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-semibold text-green-900">💰 Predicción Sugerida - Alta Confianza</h2>
              <span className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-full">EN VIVO</span>
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <img src="/api/placeholder/60/60" alt="Once Caldas" className="w-16 h-16 rounded-full mb-2" />
                  <p className="font-semibold text-gray-900">Once Caldas</p>
                </div>
                <div className="text-2xl font-bold text-gray-600">vs</div>
                <div className="text-center">
                  <img src="/api/placeholder/60/60" alt="Deportivo Cali" className="w-16 h-16 rounded-full mb-2" />
                  <p className="font-semibold text-gray-900">Deportivo Cali</p>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                <p className="text-sm text-gray-600 mb-1">Jornada 20</p>
                <p className="text-xs text-gray-500">Categoría Primera A</p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-amber-200 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-amber-800">DM</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Dayro Moreno</h4>
                    <p className="text-sm text-gray-600">Once Caldas</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">1 gol</p>
                  <p className="text-xs text-gray-500">Predicción unánime</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-blue-50 p-2 rounded text-center">
                  <p className="text-xs text-blue-600 font-medium">LSTM</p>
                  <p className="text-sm font-bold text-blue-900">100%</p>
                </div>
                <div className="bg-green-50 p-2 rounded text-center">
                  <p className="text-xs text-green-600 font-medium">SARIMAX</p>
                  <p className="text-sm font-bold text-green-900">94.8%</p>
                </div>
                <div className="bg-amber-50 p-2 rounded text-center">
                  <p className="text-xs text-amber-600 font-medium">POISSON</p>
                  <p className="text-sm font-bold text-amber-900">95.1%</p>
                </div>
              </div>
              
              <div className="border-t border-gray-100 pt-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Confianza promedio:</span> 96.6%
                  </p>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Alta probabilidad
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-sm text-green-700 bg-green-50 p-3 rounded-md">
              <p className="font-medium mb-1">💡 Recomendación:</p>
              <p>Los tres modelos predicen 1 gol con alta confianza. Dayro Moreno tiene un excelente registro contra Deportivo Cali en casa.</p>
            </div>
          </div>
        </Card>
        
        {/* Estadísticas rápidas actualizadas con datos de validación */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-600 mb-2">{stat.label}</h3>
                <div className="flex items-baseline justify-between">
                  <p className={`text-3xl font-bold ${
                    stat.color === 'blue' ? 'text-blue-600' :
                    stat.color === 'green' ? 'text-green-600' :
                    stat.color === 'purple' ? 'text-purple-600' :
                    'text-indigo-600'
                  }`}>{stat.value}</p>
                  {stat.change && (
                    <span className={`text-sm font-medium ${
                      stat.change.startsWith('+') ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {stat.change}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        {/* Jugador destacado actualizado - Dayro Moreno */}
        <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-amber-900 mb-4">⭐ Jugador Destacado de la Semana</h2>
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-amber-200 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-3xl font-bold text-amber-800">DM</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">Dayro Moreno</h3>
                <p className="text-gray-600">Once Caldas</p>
                <div className="mt-2 flex items-center space-x-4">
                  <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">
                    Mejor predicción SARIMAX
                  </span>
                  <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                    9 goles predichos / Actual 7 goles
                  </span>
                </div>
              </div>
              <Link to="/players/Dayro_Moreno">
                <Button variant="primary">Ver perfil</Button>
              </Link>
            </div>
          </div>
        </Card>
        
        {/* Nueva gráfica de comparación de goles totales */}
        <Card title="Comparación de Goles Totales - Temporada 2025">
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={goalsComparisonData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="player" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="golesReales" fill="#ef4444" name="Goles Reales" />
                <Bar dataKey="lstm" fill="#3b82f6" name="LSTM" />
                <Bar dataKey="sarimax" fill="#10b981" name="SARIMAX" />
                <Bar dataKey="poisson" fill="#f59e0b" name="POISSON" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-sm text-gray-500 text-center">
            Comparación de goles totales predichos vs. reales por jugador en la temporada 2025
          </div>
        </Card>
        
        {/* Características mejoradas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Link key={index} to={feature.link} className="group">
              <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0">
                <div className="p-6 text-center">
                  <div className={`h-16 w-16 ${feature.color} text-white rounded-2xl mx-auto flex items-center justify-center mb-4 transform transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  <span className="text-blue-600 font-medium group-hover:text-blue-700">
                    Explorar →
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
        
        {/* Estado del sistema mejorado */}
        <Card 
          title="Estado del Sistema" 
          headerAction={
            systemStatus && (
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                systemStatus.status === 'online' 
                  ? 'bg-green-100 text-green-800' 
                  : systemStatus.status === 'warning' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {systemStatus.status === 'online' ? '● En línea' : 
                 systemStatus.status === 'warning' ? '● Advertencia' : '● Error'}
              </span>
            )
          }
        >
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
            <div className="space-y-6">
              {/* Información principal */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">Jugadores disponibles</p>
                      <p className="text-2xl font-bold text-blue-900 mt-1">
                        {systemStatus.players_available}
                      </p>
                    </div>
                    <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700">Registros históricos</p>
                      <p className="text-2xl font-bold text-green-900 mt-1">
                        {systemStatus.historical_data_rows}
                      </p>
                    </div>
                    <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700">Última actualización</p>
                      <p className="text-lg font-bold text-purple-900 mt-1">
                        {new Date(systemStatus.timestamp).toLocaleString('es-CO', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: 'short'
                        })}
                      </p>
                    </div>
                    <svg className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Disponibilidad de modelos */}
              {systemStatus.models_availability && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Disponibilidad de Modelos</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {Object.entries(systemStatus.models_availability).map(([model, availability]) => {
                      const isAvailable = availability.includes('3/3');
                      return (
                        <div 
                          key={model} 
                          className={`p-4 rounded-lg border-2 ${
                            isAvailable 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-yellow-50 border-yellow-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{model.toUpperCase()}</p>
                              <p className="text-sm text-gray-600">{availability}</p>
                            </div>
                            <div className={`h-3 w-3 rounded-full ${
                              isAvailable ? 'bg-green-500' : 'bg-yellow-500'
                            }`}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {systemStatus.message && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">{systemStatus.message}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">
              No se pudo obtener información del estado del sistema.
            </p>
          )}
        </Card>
        
        {/* Footer inspiracional */}
        <div className="text-center py-8">
          <p className="text-gray-600 italic">
            "Los goles son el arte más fino del fútbol."
          </p>
          <p className="text-gray-500 text-sm mt-2">- Gabriel Batistuta</p>
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;