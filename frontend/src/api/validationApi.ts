import { apiGet } from './index';
import { 
  PredictionValidation, 
  ActualResult, 
  ValidationComparison,
  ValidationDataResponse
} from '../types/models';

export const fetchValidationData = async (): Promise<ValidationComparison[]> => {
  try {
    const response = await apiGet<ValidationDataResponse>('/validation-data');
    
    // Procesar y combinar los datos
    const comparisons: ValidationComparison[] = response.predictions.map(prediction => {
      // Buscar el resultado real correspondiente
      const actual = response.actual_results.find(
        result => 
          result.Jugador === prediction.Jugador && 
          result.Fecha_Numero === prediction.Fecha_Numero
      );
      
      const didPlay = !!actual;
      const isAccurate = didPlay ? actual.Goles === prediction.Prediccion_Entero : false;
      const difference = didPlay ? actual.Goles - prediction.Prediccion_Decimal : 0;
      
      return {
        prediction,
        actual,
        didPlay,
        isAccurate,
        difference
      };
    });
    
    return comparisons;
  } catch (error) {
    console.error('Error fetching validation data:', error);
    throw error;
  }
};