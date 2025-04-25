import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAvailablePlayers } from '../../api/playersApi';
import { formatPlayerName } from '../../utils/formatters';
import Card from '../common/Card';
import Loading from '../common/Loading';

const PlayerList: React.FC = () => {
  const [players, setPlayers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        const response = await getAvailablePlayers();
        setPlayers(response.map(player => player.name));
        setError(null);
      } catch (err) {
        setError('Error al cargar la lista de jugadores');
        console.error('Error fetching players:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlayers();
  }, []);
  
  // Filtrar jugadores según término de búsqueda
  const filteredPlayers = players.filter(player => 
    formatPlayerName(player).toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Ordenar alfabéticamente
  const sortedPlayers = [...filteredPlayers].sort((a, b) => 
    formatPlayerName(a).localeCompare(formatPlayerName(b))
  );
  
  if (loading) {
    return <Loading text="Cargando jugadores..." />;
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
  
  return (
    <Card title="Jugadores disponibles">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar jugador..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>
      
      {sortedPlayers.length === 0 ? (
        <p className="text-center text-gray-500">
          {searchTerm 
            ? 'No se encontraron jugadores que coincidan con la búsqueda.' 
            : 'No hay jugadores disponibles.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedPlayers.map((player) => (
            <Link
              key={player}
              to={`/players/${player}`}
              className="block p-4 border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center">
                <div className="h-8 w-8 bg-blue-600 text-white rounded-full flex items-center justify-center mr-3">
                  {formatPlayerName(player).charAt(0)}
                </div>
                <span className="font-medium text-gray-800">
                  {formatPlayerName(player)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-500 text-right">
        Total: {sortedPlayers.length} jugadores
      </div>
    </Card>
  );
};

export default PlayerList;