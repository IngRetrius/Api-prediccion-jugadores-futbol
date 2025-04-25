import { apiGet } from './index';
import { Team } from '../types/models';

// Obtener lista de equipos disponibles
export const getAvailableTeams = async (): Promise<Team[]> => {
  const response = await apiGet<string[]>('/equipos');
  return response.map(name => ({
    name,
    displayName: name
  }));
};