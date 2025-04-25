import { useState } from 'react';
import { PlayerPredictionRequest, MatchPredictionRequest, PredictionResponse } from '../types/models';
import { predictPlayerGoals, predictMatch } from '../api/predictionsApi';
import { ApiError } from '../types/api';

interface UsePredictReturn {
  prediction: PredictionResponse | null;
  isLoading: boolean;
  error: string | null;
  predictPlayer: (request: PlayerPredictionRequest) => Promise<void>;
  predictMatch: (request: MatchPredictionRequest) => Promise<any>;
  clearPrediction: () => void;
}

/**
 * Hook personalizado para gestionar predicciones
 */
export const usePredict = (): UsePredictReturn => {
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Realizar predicción para un jugador
   */
  const predictPlayerFn = async (request: PlayerPredictionRequest) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Hacer la petición de predicción
      const result = await predictPlayerGoals(request);
      
      // Verificar si hay error en la respuesta
      if (!result.prediction && result.metadata?.error) {
        setError(result.metadata.error);
      } else {
        setError(null);
      }
      
      setPrediction(result);
    } catch (err) {
      console.error('Error en predicción:', err);
      const errorMessage = (err as ApiError)?.detail || 'Error al realizar la predicción';
      setError(errorMessage);
      setPrediction(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Realizar predicción para un partido
   */
  const predictMatchFn = async (request: MatchPredictionRequest) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Hacer la petición de predicción de partido
      const result = await predictMatch(request);
      
      // Verificar si hay mensaje de error en la respuesta
      if (result.message && !result.predictions) {
        setError(result.message);
        return null;
      }
      
      return result;
    } catch (err) {
      console.error('Error en predicción de partido:', err);
      const errorMessage = (err as ApiError)?.detail || 'Error al realizar la predicción del partido';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Limpiar predicción actual
   */
  const clearPrediction = () => {
    setPrediction(null);
    setError(null);
  };
  
  return {
    prediction,
    isLoading,
    error,
    predictPlayer: predictPlayerFn,
    predictMatch: predictMatchFn,
    clearPrediction
  };
};

export default usePredict;