import { useState, useEffect, useMemo } from 'react';
import { ValidationComparison } from '../types/models';
import { fetchValidationData } from '../api/validationApi';
import { ApiError } from '../types/api';

interface UseValidationDataReturn {
  validationData: ValidationComparison[];
  filteredData: ValidationComparison[];
  isLoading: boolean;
  error: string | null;
  filters: {
    player: string;
    model: string;
    dateRange: number[];
  };
  uniquePlayers: string[];
  uniqueModels: string[];
  uniqueDates: number[];
  filterByPlayer: (playerName: string) => void;
  filterByModel: (modelType: string) => void;
  filterByDateRange: (range: number[]) => void;
  resetFilters: () => void;
  summary: {
    totalPredictions: number;
    playedMatches: number;
    accuratePredictions: number;
    accuracy: number;
    meanAbsoluteError: number;
    modelStats: Record<string, {
      total: number;
      played: number;
      accurate: number;
      accuracy: number;
    }>;
  };
}

export const useValidationData = (): UseValidationDataReturn => {
  const [validationData, setValidationData] = useState<ValidationComparison[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    player: '',
    model: '',
    dateRange: [0, 100] // Rango de fechas por defecto
  });

  // Cargar datos al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchValidationData();
        setValidationData(data);
        setError(null);
      } catch (err) {
        console.error('Error loading validation data:', err);
        const errorMessage = (err as ApiError)?.detail || 'Error al cargar datos de validación';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Extraer valores únicos para filtros
  const uniquePlayers = useMemo(() => {
    const players = [...new Set(validationData.map(item => item.prediction.Jugador))];
    return players.sort();
  }, [validationData]);

  const uniqueModels = useMemo(() => {
    const models = [...new Set(validationData.map(item => item.prediction.ModelType))];
    return models.sort();
  }, [validationData]);

  const uniqueDates = useMemo(() => {
    const dates = [...new Set(validationData.map(item => item.prediction.Fecha_Numero))];
    return dates.sort((a, b) => a - b);
  }, [validationData]);

  // Aplicar filtros
  const filteredData = useMemo(() => {
    let result = [...validationData];
    
    if (filters.player) {
      result = result.filter(item => item.prediction.Jugador === filters.player);
    }
    
    if (filters.model) {
      result = result.filter(item => item.prediction.ModelType === filters.model);
    }
    
    if (filters.dateRange && filters.dateRange.length === 2) {
      result = result.filter(item => 
        item.prediction.Fecha_Numero >= filters.dateRange[0] && 
        item.prediction.Fecha_Numero <= filters.dateRange[1]
      );
    }
    
    return result;
  }, [validationData, filters]);

  // Calcular estadísticas de resumen
  const summary = useMemo(() => {
    const totalPredictions = filteredData.length;
    const playedMatches = filteredData.filter(item => item.didPlay).length;
    const accuratePredictions = filteredData.filter(item => item.isAccurate).length;
    
    const accuracy = playedMatches > 0 
      ? (accuratePredictions / playedMatches) * 100 
      : 0;
    
    const meanAbsoluteError = playedMatches > 0
      ? filteredData.filter(item => item.didPlay)
          .reduce((sum, item) => sum + Math.abs(item.difference), 0) / playedMatches
      : 0;
    
    // Calcular estadísticas por modelo
    const modelStats = filteredData.reduce((acc, item) => {
      const model = item.prediction.ModelType;
      if (!acc[model]) {
        acc[model] = { total: 0, played: 0, accurate: 0, accuracy: 0 };
      }
      
      acc[model].total += 1;
      
      if (item.didPlay) {
        acc[model].played += 1;
        if (item.isAccurate) {
          acc[model].accurate += 1;
        }
      }
      
      // Calcular precisión por modelo
      acc[model].accuracy = acc[model].played > 0 
        ? (acc[model].accurate / acc[model].played) * 100 
        : 0;
      
      return acc;
    }, {} as Record<string, { 
      total: number, 
      played: number, 
      accurate: number,
      accuracy: number
    }>);
    
    return {
      totalPredictions,
      playedMatches,
      accuratePredictions,
      accuracy,
      meanAbsoluteError,
      modelStats
    };
  }, [filteredData]);

  // Funciones para manejar filtros
  const filterByPlayer = (playerName: string) => {
    setFilters(prev => ({ ...prev, player: playerName }));
  };

  const filterByModel = (modelType: string) => {
    setFilters(prev => ({ ...prev, model: modelType }));
  };

  const filterByDateRange = (range: number[]) => {
    setFilters(prev => ({ ...prev, dateRange: range }));
  };

  const resetFilters = () => {
    setFilters({ 
      player: '', 
      model: '', 
      dateRange: uniqueDates.length > 0 
        ? [uniqueDates[0], uniqueDates[uniqueDates.length - 1]] 
        : [0, 100] 
    });
  };

  return {
    validationData,
    filteredData,
    isLoading,
    error,
    filters,
    uniquePlayers,
    uniqueModels,
    uniqueDates,
    filterByPlayer,
    filterByModel,
    filterByDateRange,
    resetFilters,
    summary
  };
};

export default useValidationData;