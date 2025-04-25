import { apiPost, apiGet } from './index';
import { 
  PlayerPredictionRequest, 
  MatchPredictionRequest, 
  PredictionResponse 
} from '../types/models';
import { SystemStatus } from '../types/api';

// Realizar predicción para un jugador
export const predictPlayerGoals = async (request: PlayerPredictionRequest): Promise<PredictionResponse> => {
  return await apiPost<PredictionResponse>('/predict/player', request);
};

// Realizar predicción para un partido
export const predictMatch = async (request: MatchPredictionRequest): Promise<any> => {
  return await apiPost<any>('/predict/match', request);
};

// Obtener el estado del sistema
export const getSystemStatus = async (): Promise<SystemStatus> => {
  return await apiGet<SystemStatus>('/status');
};