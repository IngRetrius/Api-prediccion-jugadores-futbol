// frontend/src/pages/TeamPage.tsx
import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Loading from '../components/common/Loading';
import TeamStatsFilters from '../components/teams/TeamStatsFilters';
import PlayersTable from '../components/teams/PlayersTable';
import TeamStats from '../components/teams/TeamStats';
import PlayerProfile from '../components/teams/PlayerProfile';
import useTeamStats from '../hooks/useTeamStats';
import { PlayerStats } from '../types/models';

const TeamPage: React.FC = () => {
  const { data, teams, tournaments, isLoading, error, fetchTeamStats } = useTeamStats();
  const [selectedTeam, setSelectedTeam] = useState<string | undefined>(undefined);
  const [selectedTournament, setSelectedTournament] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerStats | null>(null);
  
  // Aplicar filtros
  useEffect(() => {
    fetchTeamStats(selectedTeam, selectedTournament);
  }, [selectedTeam, selectedTournament]);
  
  // Filtrar datos según selecciones
  const filteredData = React.useMemo(() => {
    let filtered = [...data];
    
    if (selectedTeam) {
      filtered = filtered.filter(player => player.Team === selectedTeam);
    }
    
    if (selectedTournament) {
      filtered = filtered.filter(player => player.Torneo === selectedTournament);
    }
    
    // Filtrar por nombre de jugador
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(player => 
        player.Name.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [data, selectedTeam, selectedTournament, searchQuery]);
  
  // Limpiar filtros
  const handleClearFilters = () => {
    setSelectedTeam(undefined);
    setSelectedTournament(undefined);
    setSearchQuery('');
    fetchTeamStats();
  };
  
  // Manejar selección de jugador
  const handlePlayerSelect = (player: PlayerStats) => {
    setSelectedPlayer(player);
  };
  
  // Cerrar perfil de jugador
  const handleClosePlayerProfile = () => {
    setSelectedPlayer(null);
  };
  
  return (
    <Layout title="Estadísticas de Equipos">
      <div className="space-y-6">
        {/* Filtros */}
        <TeamStatsFilters
          teams={teams}
          tournaments={tournaments}
          selectedTeam={selectedTeam}
          selectedTournament={selectedTournament}
          searchQuery={searchQuery}
          onTeamChange={setSelectedTeam}
          onTournamentChange={setSelectedTournament}
          onSearchChange={setSearchQuery}
          onClearFilters={handleClearFilters}
        />
        
        {/* Estado de carga o error */}
        {isLoading && (
          <Card>
            <Loading text="Cargando estadísticas..." />
          </Card>
        )}
        
        {error && !isLoading && (
          <Card>
            <div className="text-center text-red-600 py-4">
              <p>{error}</p>
              <button 
                onClick={() => fetchTeamStats(selectedTeam, selectedTournament)} 
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                Reintentar
              </button>
            </div>
          </Card>
        )}
        
        {/* Perfil de jugador (si hay uno seleccionado) */}
        {selectedPlayer && (
          <PlayerProfile 
            player={selectedPlayer} 
            onClose={handleClosePlayerProfile} 
          />
        )}
        
        {/* Estadísticas de equipo (si hay uno seleccionado) */}
        {!isLoading && !error && selectedTeam && (
          <TeamStats 
            data={filteredData}
            team={selectedTeam}
          />
        )}
        
        {/* Tabla de jugadores */}
        {!isLoading && !error && filteredData.length > 0 && (
          <Card 
            title={selectedTeam 
              ? `Jugadores de ${selectedTeam}` 
              : "Todos los jugadores"
            }
            subtitle={`${filteredData.length} jugadores encontrados`}
          >
            <PlayersTable 
              data={filteredData}
              team={selectedTeam}
              onPlayerSelect={handlePlayerSelect}
            />
          </Card>
        )}
        
        {/* Sin datos */}
        {!isLoading && !error && filteredData.length === 0 && (
          <Card>
            <div className="text-center py-8 text-gray-500">
              No se encontraron jugadores con los filtros seleccionados
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default TeamPage;