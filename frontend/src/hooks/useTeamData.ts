import { useState, useEffect } from 'react';
import { getAvailableTeams } from '../api/teamsApi';
import { Team } from '../types/models';
import { ApiError } from '../types/api';

interface UseTeamsReturn {
  teams: Team[];
  isLoadingTeams: boolean;
  teamsError: string | null;
  refreshTeams: () => Promise<void>;
}

/**
 * Hook para obtener lista de equipos
 */
export const useTeams = (): UseTeamsReturn => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchTeams = async () => {
    try {
      setIsLoading(true);
      const result = await getAvailableTeams();
      setTeams(result);
      setError(null);
    } catch (err) {
      console.error('Error obteniendo equipos:', err);
      const errorMessage = (err as ApiError)?.detail || 'Error al cargar la lista de equipos';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Cargar equipos al montar el componente
  useEffect(() => {
    fetchTeams();
  }, []);
  
  return {
    teams,
    isLoadingTeams: isLoading,
    teamsError: error,
    refreshTeams: fetchTeams
  };
};

/**
 * Hook para gestionar el equipo seleccionado y sus oponentes
 */
interface UseTeamSelectionReturn {
  selectedTeam: string;
  opponents: Team[];
  selectTeam: (teamName: string) => void;
  isLoading: boolean;
  error: string | null;
}

export const useTeamSelection = (): UseTeamSelectionReturn => {
  const { teams, isLoadingTeams, teamsError } = useTeams();
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  
  // Filtrar oponentes (todos los equipos excepto el seleccionado)
  const opponents = teams.filter(team => team.name !== selectedTeam);
  
  // Seleccionar un equipo
  const selectTeam = (teamName: string) => {
    setSelectedTeam(teamName);
  };
  
  return {
    selectedTeam,
    opponents,
    selectTeam,
    isLoading: isLoadingTeams,
    error: teamsError
  };
};

export default useTeams;