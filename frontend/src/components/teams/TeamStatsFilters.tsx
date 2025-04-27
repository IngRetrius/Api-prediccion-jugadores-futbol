// frontend/src/components/teams/TeamStatsFilters.tsx
import React from 'react';
import Select from '../common/Select';
import Input from '../common/Input';

interface TeamStatsFiltersProps {
  teams: string[];
  tournaments: string[];
  selectedTeam: string | undefined;
  selectedTournament: string | undefined;
  searchQuery: string;
  onTeamChange: (team: string) => void;
  onTournamentChange: (tournament: string) => void;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
}

const TeamStatsFilters: React.FC<TeamStatsFiltersProps> = ({
  teams,
  tournaments,
  selectedTeam,
  selectedTournament,
  searchQuery,
  onTeamChange,
  onTournamentChange,
  onSearchChange,
  onClearFilters,
}) => {
  return (
    <div className="bg-white shadow rounded-lg p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Select
            label="Torneo"
            options={tournaments.map(t => ({ value: t, label: t }))}
            value={selectedTournament || ''}
            onChange={onTournamentChange}
            placeholder="Seleccione un torneo"
          />
        </div>
        <div>
          <Select
            label="Equipo"
            options={teams.map(t => ({ value: t, label: t }))}
            value={selectedTeam || ''}
            onChange={onTeamChange}
            placeholder="Seleccione un equipo"
          />
        </div>
        <div>
          <Input
            label="Buscar jugador"
            placeholder="Nombre del jugador..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            startIcon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            }
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={onClearFilters}
            className="py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none w-full"
          >
            Limpiar filtros
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamStatsFilters;