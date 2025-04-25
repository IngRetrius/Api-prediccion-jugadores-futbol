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
  
  // Crear el objeto con la estructura correcta que espera el backend
  const payload = {
    request: formattedRequest
    // model_selection es opcional, no lo incluimos a menos que sea necesario
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
  
  return await apiPost<any>('/predict/match', formattedRequest);
};

// Obtener el estado del sistema
export const getSystemStatus = async (): Promise<SystemStatus> => {
  return await apiGet<SystemStatus>('/status');
};