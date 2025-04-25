import { PredictionResponse } from '../types/models';

// Determinar si el ensemble o algún modelo específico está disponible
export const isPredictionAvailable = (prediction: PredictionResponse): boolean => {
  return prediction.prediction !== null;
};

// Obtener modelos disponibles de una predicción
export const getAvailableModels = (prediction: PredictionResponse): string[] => {
  return Object.entries(prediction.model_predictions)
    .filter(([_, modelData]) => modelData.disponible)
    .map(([modelName, _]) => modelName);
};

// Verificar si todos los modelos están disponibles
export const areAllModelsAvailable = (prediction: PredictionResponse): boolean => {
  const models = Object.values(prediction.model_predictions);
  return models.length > 0 && models.every(model => model.disponible);
};

// Encontrar el modelo con la predicción más alta
export const getHighestPredictionModel = (prediction: PredictionResponse): string => {
  let highestValue = -1;
  let highestModel = '';
  
  Object.entries(prediction.model_predictions).forEach(([model, data]) => {
    if (data.disponible && data.raw !== null && data.raw > highestValue) {
      highestValue = data.raw;
      highestModel = model;
    }
  });
  
  return highestModel;
};

// Encontrar el modelo con la mayor confianza
export const getMostConfidentModel = (prediction: PredictionResponse): string => {
  let highestConfidence = -1;
  let mostConfidentModel = '';
  
  Object.entries(prediction.model_predictions).forEach(([model, data]) => {
    if (data.disponible && data.confidence !== null && data.confidence > highestConfidence) {
      highestConfidence = data.confidence;
      mostConfidentModel = model;
    }
  });
  
  return mostConfidentModel;
};

// Calcular la confianza promedio de los modelos disponibles
export const getAverageConfidence = (prediction: PredictionResponse): number | null => {
  const availableModels = Object.values(prediction.model_predictions)
    .filter(model => model.disponible && model.confidence !== null);
  
  if (availableModels.length === 0) return null;
  
  const sum = availableModels.reduce((acc, model) => acc + (model.confidence || 0), 0);
  return sum / availableModels.length;
};