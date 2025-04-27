import { apiGet } from './index';
import { TeamStatsResponse } from '../hooks/useTeamStats'; // Actualizar la importación

// Obtener estadísticas de equipos
export const getTeamStats = async (
  team?: string,
  tournament?: string,
  signal?: AbortSignal
): Promise<TeamStatsResponse> => {
  let url = '/team-stats';
  const params = [];
  
  if (team) {
    params.push(`team=${encodeURIComponent(team)}`);
  }
  
  if (tournament) {
    params.push(`tournament=${encodeURIComponent(tournament)}`);
  }
  
  if (params.length > 0) {
    url += `?${params.join('&')}`;
  }
  
  return await apiGet<TeamStatsResponse>(url, { signal });
};