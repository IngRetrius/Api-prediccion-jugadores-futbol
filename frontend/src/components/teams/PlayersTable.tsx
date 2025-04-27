import React, { useState } from 'react';
import { PlayerStats } from '../../types/models';

interface PlayersTableProps {
  data: PlayerStats[];
  team?: string;
  onPlayerSelect?: (player: PlayerStats) => void;
}

const PlayersTable: React.FC<PlayersTableProps> = ({
  data,
  team,
  onPlayerSelect,
}) => {
  const [sortField, setSortField] = useState<keyof PlayerStats>('Goals');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Manejar clic en cabecera para ordenar
  const handleSort = (field: keyof PlayerStats) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // Ordenar datos
  const sortedData = [...data].sort((a, b) => {
    if (a[sortField] === b[sortField]) return 0;
    
    const aValue = a[sortField] === null ? -Infinity : a[sortField];
    const bValue = b[sortField] === null ? -Infinity : b[sortField];
    
    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : 1;
    } else {
      return aValue > bValue ? -1 : 1;
    }
  });
  
  // Función para renderizar cabecera de columna
  const renderColumnHeader = (title: string, field: keyof PlayerStats) => (
    <th 
      scope="col" 
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center">
        <span>{title}</span>
        {sortField === field && (
          <span className="ml-1">
            {sortDirection === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );

  return (
    <div className="overflow-x-auto shadow rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {renderColumnHeader("Jugador", "Name")}
            {team ? null : renderColumnHeader("Equipo", "Team")}
            {renderColumnHeader("Torneo", "Torneo")}
            {renderColumnHeader("Goles", "Goals")}
            {renderColumnHeader("Asistencias", "Assists")}
            {renderColumnHeader("Regates exitosos", "Succ. dribbles")}
            {renderColumnHeader("% Precisión pases", "Accurate passes %")}
            {renderColumnHeader("Tiros totales", "Total shots")}
            {renderColumnHeader("% Conversión gol", "Goal conversion %")}
            {renderColumnHeader("Pases clave", "Key passes")}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedData.map((player, index) => (
            <tr 
              key={`${player.Name}-${player.Team}-${player.Torneo}-${index}`}
              className="hover:bg-blue-50 cursor-pointer"
              onClick={() => onPlayerSelect && onPlayerSelect(player)}
            >
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                {player.Name}
              </td>
              {team ? null : (
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {player.Team}
                </td>
              )}
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {player.Torneo}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                <span className={player.Goals > 0 ? 'text-blue-600' : 'text-gray-500'}>
                  {player.Goals}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {player.Assists}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {player["Succ. dribbles"]}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {player["Accurate passes %"]}%
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {player["Total shots"]}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {player["Goal conversion %"]}%
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {player["Key passes"]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PlayersTable;