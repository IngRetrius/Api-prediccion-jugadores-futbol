import React from 'react';
import { PlayerStats } from '../../types/models';
import Card from '../common/Card';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

interface PlayerProfileProps {
  player: PlayerStats | null;
  onClose: () => void;
}

const PlayerProfile: React.FC<PlayerProfileProps> = ({ player, onClose }) => {
  if (!player) return null;
  
  // Preparar datos para el gráfico de radar
  const radarData = [
    { subject: 'Goles', A: player.Goals, fullMark: 10 },
    { subject: 'Asistencias', A: player.Assists, fullMark: 10 },
    { subject: 'Regates', A: player["Succ. dribbles"], fullMark: 10 },
    { subject: 'Entradas', A: player.Tackles, fullMark: 10 },
    { subject: 'Pases clave', A: player["Key passes"], fullMark: 10 },
    { subject: 'Precisión pases', A: player["Accurate passes %"] / 10, fullMark: 10 }
  ];
  
  return (
    <Card 
      title={`Perfil de ${player.Name}`}
      subtitle={`${player.Team} - ${player.Torneo}`}
      headerAction={
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Estadísticas ofensivas</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-blue-700">Goles</h4>
                <p className="text-2xl font-bold text-blue-900">{player.Goals}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-green-700">Asistencias</h4>
                <p className="text-2xl font-bold text-green-900">{player.Assists}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-yellow-700">Oportunidades creadas</h4>
                <p className="text-2xl font-bold text-yellow-900">{player["Big chances created"]}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-purple-700">Regates exitosos</h4>
                <p className="text-2xl font-bold text-purple-900">{player["Succ. dribbles"]}</p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-700">Tiros totales</span>
                <span className="text-sm font-medium">{player["Total shots"]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-700">Conversión de gol</span>
                <span className="text-sm font-medium">{player["Goal conversion %"]}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-700">Oportunidades claras perdidas</span>
                <span className="text-sm font-medium">{player["Big chances missed"]}</span>
              </div>
            </div>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6">Estadísticas defensivas</h3>
          <div className="bg-gray-50 p-4 rounded-md space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-700">Entradas</span>
              <span className="text-sm font-medium">{player.Tackles}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-700">Intercepciones</span>
              <span className="text-sm font-medium">{player.Interceptions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-700">Despejes</span>
              <span className="text-sm font-medium">{player.Clearances}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-700">Errores que llevaron a gol</span>
              <span className="text-sm font-medium">{player["Errors leading to goal"]}</span>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Gráfico de habilidades</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 10]} />
                <Radar name={player.Name} dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6">Estadísticas de pases</h3>
          <div className="bg-gray-50 p-4 rounded-md space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-700">Precisión de pases</span>
              <span className="text-sm font-medium">{player["Accurate passes %"]}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-700">Pases precisos</span>
              <span className="text-sm font-medium">{player["Accurate passes"]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-700">Pases clave</span>
              <span className="text-sm font-medium">{player["Key passes"]}</span>
            </div>
          </div>
          
          {/* Para jugadores que son porteros */}
          {player.Saves > 0 && (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6">Estadísticas de portero</h3>
              <div className="bg-gray-50 p-4 rounded-md space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700">Paradas</span>
                  <span className="text-sm font-medium">{player.Saves}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700">Portería a cero</span>
                  <span className="text-sm font-medium">{player["Clean sheet"]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700">Penaltis parados</span>
                  <span className="text-sm font-medium">{player["Penalties saved"]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700">Paradas dentro del área</span>
                  <span className="text-sm font-medium">{player["Saves from inside box"]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700">Salidas</span>
                  <span className="text-sm font-medium">{player["Runs out"]}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PlayerProfile;