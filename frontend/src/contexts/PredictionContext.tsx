import React, { createContext, useState, useContext, ReactNode } from 'react';
import { 
  PlayerPredictionRequest, 
  MatchPredictionRequest, 
  PredictionResponse 
} from '../types/models';
import usePredict from '../hooks/usePredict';

interface PredictionContextType {
  prediction: PredictionResponse | null;
  isLoading: boolean;
  error: string | null;
  compareList: PredictionResponse[];
  predictPlayer: (request: PlayerPredictionRequest) => Promise<void>;
  predictMatch: (request: MatchPredictionRequest) => Promise<any>;
  clearPrediction: () => void;
  addToCompare: (prediction: PredictionResponse) => void;
  removeFromCompare: (playerName: string) => void;
  clearCompareList: () => void;
}

const PredictionContext = createContext<PredictionContextType | undefined>(undefined);

interface PredictionProviderProps {
  children: ReactNode;
}

export const PredictionProvider: React.FC<PredictionProviderProps> = ({ children }) => {
  const { 
    prediction, 
    isLoading, 
    error, 
    predictPlayer, 
    predictMatch, 
    clearPrediction 
  } = usePredict();
  
  // Lista de predicciones para comparar
  const [compareList, setCompareList] = useState<PredictionResponse[]>([]);
  
  // Añadir predicción a lista de comparación
  const addToCompare = (predictionToAdd: PredictionResponse) => {
    // Verificar si ya existe esa predicción en la lista
    const exists = compareList.some(p => p.player_name === predictionToAdd.player_name);
    
    if (!exists) {
      setCompareList(prevList => [...prevList, predictionToAdd]);
    }
  };
  
  // Eliminar predicción de la lista de comparación
  const removeFromCompare = (playerName: string) => {
    setCompareList(prevList => prevList.filter(p => p.player_name !== playerName));
  };
  
  // Limpiar lista de comparación
  const clearCompareList = () => {
    setCompareList([]);
  };
  
  const value = {
    prediction,
    isLoading,
    error,
    compareList,
    predictPlayer,
    predictMatch,
    clearPrediction,
    addToCompare,
    removeFromCompare,
    clearCompareList
  };
  
  return (
    <PredictionContext.Provider value={value}>
      {children}
    </PredictionContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const usePredictionContext = (): PredictionContextType => {
  const context = useContext(PredictionContext);
  
  if (context === undefined) {
    throw new Error('usePredictionContext debe ser usado dentro de un PredictionProvider');
  }
  
  return context;
};

export default PredictionContext;