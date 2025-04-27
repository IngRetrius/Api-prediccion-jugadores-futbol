// frontend/src/hooks/useTeamStats.ts
import { useState, useEffect } from 'react';
import { getTeamStats } from '../api/teamsStatsApi';
import { PlayerStats } from '../types/models';
import { ApiError } from '../types/api';

// Definimos la interfaz TeamStatsResponse y la exportamos para que se pueda usar en otros lugares
export interface TeamStatsResponse {
  data: PlayerStats[];
  teams: string[];
  tournaments: string[];
  total_records: number;
}

interface UseTeamStatsReturn {
  data: PlayerStats[];
  teams: string[];
  tournaments: string[];
  isLoading: boolean;
  error: string | null;
  fetchTeamStats: (team?: string, tournament?: string) => Promise<void>;
}

export const useTeamStats = (): UseTeamStatsReturn => {
  const [data, setData] = useState<PlayerStats[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [tournaments, setTournaments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentRequest, setCurrentRequest] = useState<AbortController | null>(null);
  
  const fetchTeamStats = async (team?: string, tournament?: string) => {
    // Cancelar solicitud anterior si existe
    if (currentRequest) {
      currentRequest.abort();
    }
    
    // Crear controlador para esta nueva solicitud
    const abortController = new AbortController();
    setCurrentRequest(abortController);
    
    try {
      setIsLoading(true);
      // Especificamos explícitamente que getTeamStats devuelve TeamStatsResponse
      const result: TeamStatsResponse = await getTeamStats(team, tournament, abortController.signal);
      setData(result.data);
      setTeams(result.teams);
      setTournaments(result.tournaments);
      setError(null);
    } catch (err) {
      // Solo establecer error si no fue una cancelación
      if ((err as any)?.name !== 'AbortError') {
        console.error('Error obteniendo estadísticas:', err);
        const errorMessage = (err as ApiError)?.detail || 'Error al cargar las estadísticas de equipos';
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
      setCurrentRequest(null);
    }
  };
  
  // Cargar datos iniciales al montar el componente
  useEffect(() => {
    fetchTeamStats();
    
    // Limpieza cuando el componente se desmonta
    return () => {
      if (currentRequest) {
        currentRequest.abort();
      }
    };
  }, []);
  
  return {
    data,
    teams,
    tournaments,
    isLoading,
    error,
    fetchTeamStats
  };
};

export default useTeamStats;