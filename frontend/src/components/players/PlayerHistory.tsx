import React, { useState, useEffect, useRef } from 'react';
import { getPlayerHistory } from '../../api/playersApi';
import { formatDisplayDate } from '../../utils/dateUtils';
import { PlayerHistory as PlayerHistoryType } from '../../types/models';
import Card from '../common/Card';
import Loading from '../common/Loading';

interface PlayerHistoryProps {
  playerName: string;
  limit?: number;
}

const PlayerHistory: React.FC<PlayerHistoryProps> = ({ playerName, limit = 10 }) => {
  const [history, setHistory] = useState<PlayerHistoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortController = useRef<AbortController | null>(null);
  
  useEffect(() => {
    // Función para obtener el historial
    const fetchHistory = async () => {
      // Cancelar la solicitud anterior si existe
      if (abortController.current) {
        abortController.current.abort();
      }
      
      // Crear nuevo controlador para esta solicitud
      abortController.current = new AbortController();
      
      try {
        setLoading(true);
        const response = await getPlayerHistory(
          playerName, 
          limit, 
          abortController.current.signal
        );
        setHistory(response.history);
        setError(null);
      } catch (err: any) {
        // Solo establecer error si no es por cancelación
        if (err.name !== 'AbortError') {
          setError('Error al cargar el historial del jugador');
          console.error('Error fetching player history:', err);
        }
      } finally {
        setLoading(false);
      }
    };
    
    // Solo ejecutar si hay un nombre de jugador
    if (playerName) {
      fetchHistory();
    }
    
    // Función de limpieza para cancelar cualquier solicitud pendiente
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [playerName, limit]);
  
  if (loading) {
    return <Loading text="Cargando historial..." />;
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
  
  if (history.length === 0) {
    return (
      <Card title="Historial de partidos">
        <p className="text-center text-gray-500">No hay datos históricos disponibles para este jugador.</p>
      </Card>
    );
  }
  
  // Calcular estadísticas
  const totalGoals = history.reduce((sum, match) => sum + match.goles, 0);
  const averageGoals = totalGoals / history.length;
  
  return (
    <Card 
      title="Historial de partidos" 
      subtitle={`Últimos ${history.length} partidos`}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Oponente
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Condición
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Goles
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Minutos
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tiros
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {history.map((match, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {match.fecha ? formatDisplayDate(match.fecha) : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {match.oponente}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {match.es_local ? 'Local' : 'Visitante'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className={match.goles > 0 ? 'font-bold text-green-600' : ''}>
                    {match.goles}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {match.minutos ?? 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {match.tiros_a_puerta ?? 0}/{match.tiros_totales ?? 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-blue-700">Total Goles</h4>
          <p className="text-2xl font-bold text-blue-900">{totalGoals}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-green-700">Promedio por partido</h4>
          <p className="text-2xl font-bold text-green-900">{averageGoals.toFixed(2)}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-purple-700">Partidos sin gol</h4>
          <p className="text-2xl font-bold text-purple-900">
            {history.filter(match => match.goles === 0).length}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default PlayerHistory;