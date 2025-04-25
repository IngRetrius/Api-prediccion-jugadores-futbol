import React, { useState, useEffect } from 'react';
import { getPlayerHistory } from '../../api/playersApi';
import { formatPlayerName, formatNumber } from '../../utils/formatters';
import { PlayerHistory } from '../../types/models';
import Card from '../common/Card';
import Loading from '../common/Loading';

interface PlayerStatsProps {
  playerName: string;
}

interface Stats {
  totalMatches: number;
  totalGoals: number;
  goalsPerMatch: number;
  homeGoals: number;
  awayGoals: number;
  matchesWithGoal: number;
  matchesWithoutGoal: number;
  goalPercentage: number;
  highestStreak: number;
  currentStreak: number;
  averageMinutes: number;
  shotsOnTarget: number;
  shotAccuracy: number;
  conversionRate: number;
}

const PlayerStats: React.FC<PlayerStatsProps> = ({ playerName }) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchAndCalculateStats = async () => {
      try {
        setLoading(true);
        // Obtener todo el historial disponible (límite alto)
        const response = await getPlayerHistory(playerName, 100);
        
        if (response.history.length === 0) {
          setStats(null);
          return;
        }
        
        const history = response.history;
        
        // Calcular estadísticas
        const stats = calculateStats(history);
        setStats(stats);
        setError(null);
      } catch (err) {
        setError('Error al cargar las estadísticas del jugador');
        console.error('Error fetching player stats:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (playerName) {
      fetchAndCalculateStats();
    }
  }, [playerName]);
  
  const calculateStats = (history: PlayerHistory[]): Stats => {
    const totalMatches = history.length;
    const totalGoals = history.reduce((sum, match) => sum + match.goles, 0);
    
    const homeMatches = history.filter(match => match.es_local);
    const homeGoals = homeMatches.reduce((sum, match) => sum + match.goles, 0);
    
    const awayMatches = history.filter(match => !match.es_local);
    const awayGoals = awayMatches.reduce((sum, match) => sum + match.goles, 0);
    
    const matchesWithGoal = history.filter(match => match.goles > 0).length;
    const matchesWithoutGoal = history.filter(match => match.goles === 0).length;
    
    // Calcular racha máxima de partidos con gol
    let currentStreak = 0;
    let maxStreak = 0;
    
    // Ordenar historial por fecha (más reciente primero)
    const sortedHistory = [...history].sort((a, b) => 
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
    
    // Calcular racha actual
    for (let i = 0; i < sortedHistory.length; i++) {
      if (sortedHistory[i].goles > 0) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    // Calcular racha máxima
    let tempStreak = 0;
    for (let i = 0; i < history.length; i++) {
      if (history[i].goles > 0) {
        tempStreak++;
        maxStreak = Math.max(maxStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
    
    // Minutos, tiros y precisión
    const validMinutesMatches = history.filter(match => match.minutos !== undefined && match.minutos !== null);
    const averageMinutes = validMinutesMatches.length > 0
      ? validMinutesMatches.reduce((sum, match) => sum + (match.minutos || 0), 0) / validMinutesMatches.length
      : 0;
    
    const validShotsMatches = history.filter(match => 
      match.tiros_a_puerta !== undefined && match.tiros_a_puerta !== null &&
      match.tiros_totales !== undefined && match.tiros_totales !== null
    );
    
    const totalShotsOnTarget = validShotsMatches.reduce((sum, match) => sum + (match.tiros_a_puerta || 0), 0);
    const totalShots = validShotsMatches.reduce((sum, match) => sum + (match.tiros_totales || 0), 0);
    
    const shotAccuracy = totalShots > 0 ? totalShotsOnTarget / totalShots : 0;
    const conversionRate = totalShotsOnTarget > 0 ? totalGoals / totalShotsOnTarget : 0;
    
    return {
      totalMatches,
      totalGoals,
      goalsPerMatch: totalMatches > 0 ? totalGoals / totalMatches : 0,
      homeGoals,
      awayGoals,
      matchesWithGoal,
      matchesWithoutGoal,
      goalPercentage: totalMatches > 0 ? (matchesWithGoal / totalMatches) * 100 : 0,
      highestStreak: maxStreak,
      currentStreak,
      averageMinutes,
      shotsOnTarget: totalShotsOnTarget,
      shotAccuracy,
      conversionRate
    };
  };
  
  if (loading) {
    return <Loading text="Cargando estadísticas..." />;
  }
  
  if (error) {
    return (
      <Card>
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-blue-600 hover:text-blue-800"
          >
            Reintentar
          </button>
        </div>
      </Card>
    );
  }
  
  if (!stats) {
    return (
      <Card title="Estadísticas del jugador">
        <p className="text-center text-gray-500">No hay datos estadísticos disponibles para este jugador.</p>
      </Card>
    );
  }
  
  return (
    <Card 
      title={`Estadísticas de ${formatPlayerName(playerName)}`}
      subtitle={`Basado en ${stats.totalMatches} partidos`}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Goles */}
        <div className="bg-blue-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-blue-700">Goles totales</h4>
          <p className="text-2xl font-bold text-blue-900">{stats.totalGoals}</p>
          <p className="text-sm text-blue-700 mt-2">
            {formatNumber(stats.goalsPerMatch)} goles por partido
          </p>
        </div>
        
        {/* Local vs Visitante */}
        <div className="bg-green-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-green-700">Local vs Visitante</h4>
          <div className="flex justify-between mt-2">
            <div>
              <p className="text-sm text-green-700">Local</p>
              <p className="text-xl font-bold text-green-900">{stats.homeGoals}</p>
            </div>
            <div>
              <p className="text-sm text-green-700">Visitante</p>
              <p className="text-xl font-bold text-green-900">{stats.awayGoals}</p>
            </div>
          </div>
        </div>
        
        {/* Efectividad */}
        <div className="bg-purple-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-purple-700">Efectividad</h4>
          <p className="text-2xl font-bold text-purple-900">{formatNumber(stats.goalPercentage)}%</p>
          <p className="text-sm text-purple-700 mt-2">
            {stats.matchesWithGoal} partidos con gol / {stats.matchesWithoutGoal} sin gol
          </p>
        </div>
        
        {/* Rachas */}
        <div className="bg-yellow-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-yellow-700">Rachas de gol</h4>
          <div className="flex justify-between mt-2">
            <div>
              <p className="text-sm text-yellow-700">Máxima</p>
              <p className="text-xl font-bold text-yellow-900">{stats.highestStreak}</p>
            </div>
            <div>
              <p className="text-sm text-yellow-700">Actual</p>
              <p className="text-xl font-bold text-yellow-900">{stats.currentStreak}</p>
            </div>
          </div>
        </div>
        
        {/* Minutos */}
        <div className="bg-red-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-red-700">Minutos por partido</h4>
          <p className="text-2xl font-bold text-red-900">{formatNumber(stats.averageMinutes)}</p>
        </div>
        
        {/* Tiros */}
        <div className="bg-indigo-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-indigo-700">Precisión de tiro</h4>
          <p className="text-2xl font-bold text-indigo-900">{formatNumber(stats.shotAccuracy * 100)}%</p>
          <p className="text-sm text-indigo-700 mt-2">
            Tasa de conversión: {formatNumber(stats.conversionRate * 100)}%
          </p>
        </div>
      </div>
    </Card>
  );
};

export default PlayerStats;