import { apiGet } from './index';
import { Player, PlayerHistoryResponse, ModelMetricsResponse } from '../types/models';

// Obtener lista de jugadores disponibles
export const getAvailablePlayers = async (): Promise<Player[]> => {
  const response = await apiGet<string[]>('/jugadores');
  return response.map(name => ({
    name,
    displayName: name.replace(/_/g, ' ')
  }));
};

// Obtener historial de un jugador
export const getPlayerHistory = async (playerName: string, limit: number = 10): Promise<PlayerHistoryResponse> => {
  return await apiGet<PlayerHistoryResponse>(`/player/${playerName}/history?limit=${limit}`);
};

// Obtener métricas de modelos para un jugador
export const getPlayerModelMetrics = async (playerName: string): Promise<ModelMetricsResponse> => {
  return await apiGet<ModelMetricsResponse>(`/metrics/${playerName}`);
};