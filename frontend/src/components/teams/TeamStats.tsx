import React, { useMemo } from 'react';
import { PlayerStats } from '../../types/models';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '../common/Card';

interface TeamStatsProps {
  data: PlayerStats[];
  team?: string;
}

const TeamStats: React.FC<TeamStatsProps> = ({ data, team }) => {
  // Calcular estadísticas del equipo
  const teamStats = useMemo(() => {
    // Si no hay datos o equipo seleccionado, devolver objeto vacío
    if (!data.length || !team) return null;
    
    const teamPlayers = data.filter(player => player.Team === team);
    
    // Si no hay jugadores del equipo, devolver objeto vacío
    if (!teamPlayers.length) return null;
    
    // Calcular totales
    const totalGoals = teamPlayers.reduce((sum, player) => sum + player.Goals, 0);
    const totalAssists = teamPlayers.reduce((sum, player) => sum + player.Assists, 0);
    const totalDribbles = teamPlayers.reduce((sum, player) => sum + player["Succ. dribbles"], 0);
    const totalShots = teamPlayers.reduce((sum, player) => sum + player["Total shots"], 0);
    const totalTackles = teamPlayers.reduce((sum, player) => sum + player.Tackles, 0);
    const totalInterceptions = teamPlayers.reduce((sum, player) => sum + player.Interceptions, 0);
    const totalKeyPasses = teamPlayers.reduce((sum, player) => sum + player["Key passes"], 0);
    
    // Calcular promedios
    const avgPassAccuracy = teamPlayers.reduce((sum, player) => sum + player["Accurate passes %"], 0) / teamPlayers.length;
    
    // Encontrar jugadores destacados
    const topScorer = [...teamPlayers].sort((a, b) => b.Goals - a.Goals)[0];
    const topAssister = [...teamPlayers].sort((a, b) => b.Assists - a.Assists)[0];
    
    // Datos para gráfico
    const chartData = [
      { name: 'Goles', value: totalGoals },
      { name: 'Asistencias', value: totalAssists },
      { name: 'Regates', value: totalDribbles },
      { name: 'Entradas', value: totalTackles },
      { name: 'Intercepciones', value: totalInterceptions },
      { name: 'Pases clave', value: totalKeyPasses },
    ];
    
    return {
      totalGoals,
      totalAssists,
      totalDribbles,
      totalShots,
      totalTackles,
      totalInterceptions,
      totalKeyPasses,
      avgPassAccuracy,
      topScorer,
      topAssister,
      chartData,
      playerCount: teamPlayers.length
    };
  }, [data, team]);
  
  if (!teamStats) {
    return (
      <Card title="Estadísticas de Equipo">
        <div className="text-center text-gray-500 py-8">
          Seleccione un equipo para ver sus estadísticas
        </div>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card title={`Estadísticas de ${team}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-blue-700">Goles</h4>
            <p className="text-2xl font-bold text-blue-900">{teamStats.totalGoals}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-green-700">Asistencias</h4>
            <p className="text-2xl font-bold text-green-900">{teamStats.totalAssists}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-yellow-700">Precisión de pases</h4>
            <p className="text-2xl font-bold text-yellow-900">{teamStats.avgPassAccuracy.toFixed(1)}%</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-purple-700">Jugadores</h4>
            <p className="text-2xl font-bold text-purple-900">{teamStats.playerCount}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Jugadores destacados</h3>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Máximo goleador</h4>
                    <p className="text-lg font-bold text-gray-900">{teamStats.topScorer.Name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{teamStats.topScorer.Goals}</p>
                    <p className="text-xs text-gray-500">goles</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Máximo asistente</h4>
                    <p className="text-lg font-bold text-gray-900">{teamStats.topAssister.Name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">{teamStats.topAssister.Assists}</p>
                    <p className="text-xs text-gray-500">asistencias</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Estadísticas generales</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={teamStats.chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TeamStats;