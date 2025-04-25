import { apiPost, apiGet } from './index';
import { 
  PlayerPredictionRequest, 
  MatchPredictionRequest, 
  PredictionResponse 
} from '../types/models';
import { SystemStatus } from '../types/api';

// Realizar predicción para un jugador
export const predictPlayerGoals = async (request: PlayerPredictionRequest): Promise<PredictionResponse> => {
  // Asegurar que is_home es booleano y formatear la fecha correctamente
  const formattedRequest = {
    ...request,
    is_home: Boolean(request.is_home)
  };
  
  // Si hay fecha, asegúrate de que tenga el formato correcto
  if (formattedRequest.date && typeof formattedRequest.date === 'string') {
    // Tomar solo YYYY-MM-DD si es string con formato ISO
    if (formattedRequest.date.includes('T')) {
      formattedRequest.date = formattedRequest.date.split('T')[0];
    }
  }
  
  // Añadir model_selection si está definido
  if (request.model_selection) {
    formattedRequest.model_selection = request.model_selection;
  }
  
  // Empaquetar en la estructura que espera el backend
  const payload = {
    request: formattedRequest
  };
  
  console.log('Enviando payload:', payload); // Para depuración
  
  return await apiPost<PredictionResponse>('/predict/player', payload);
};

// Realizar predicción para un partido
export const predictMatch = async (request: MatchPredictionRequest): Promise<any> => {
  // Formato similar para asegurar consistencia
  const formattedRequest = {
    ...request
  };
  
  // Si hay fecha, asegúrate de que tenga el formato correcto
  if (formattedRequest.date && typeof formattedRequest.date === 'string') {
    // Tomar solo YYYY-MM-DD si es string con formato ISO
    if (formattedRequest.date.includes('T')) {
      formattedRequest.date = formattedRequest.date.split('T')[0];
    }
  }
  
  // Mantener la misma estructura para consistencia
  const payload = {
    request: formattedRequest
  };
  
  return await apiPost<any>('/predict/match', payload);
};

// Obtener el estado del sistema
export const getSystemStatus = async (): Promise<SystemStatus> => {
  return await apiGet<SystemStatus>('/status');
};