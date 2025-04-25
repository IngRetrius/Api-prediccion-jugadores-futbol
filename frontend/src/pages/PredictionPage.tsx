import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import PredictionForm from '../components/predictions/PredictionForm';
import PredictionResults from '../components/predictions/PredictionResults';
import ModelSelector from '../components/predictions/ModelSelector';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { usePredictionContext } from '../contexts/PredictionContext';
import { PlayerPredictionRequest } from '../types/models';

const PredictionPage: React.FC = () => {
  const { 
    prediction, 
    isLoading, 
    error, 
    predictPlayer, 
    clearPrediction,
    addToCompare,
    compareList
  } = usePredictionContext();
  
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [selectedModels, setSelectedModels] = useState<string[]>(['ensemble']);
  const [customWeights, setCustomWeights] = useState<Record<string, number> | null>(null);
  
  // Manejar el envío del formulario
  const handleSubmit = async (values: PlayerPredictionRequest) => {
    // Si hay selección personalizada de modelos, agregarla a la solicitud
    if (selectedModels.length > 0 && !selectedModels.includes('ensemble')) {
      values.model_selection = {
        models: selectedModels,
        weights: customWeights || undefined
      };
    }
    
    await predictPlayer(values);
  };
  
  // Manejar el cambio en la selección de modelos
  const handleModelSelectionChange = (models: string[], weights: Record<string, number> | null) => {
    setSelectedModels(models);
    setCustomWeights(weights);
    setShowModelSelector(false);
  };
  
  // Manejar agregar a comparación
  const handleAddToCompare = () => {
    if (prediction) {
      addToCompare(prediction);
    }
  };
  
  return (
    <Layout title="Predicción de Goles">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="space-y-6">
            <PredictionForm onSubmit={handleSubmit} isLoading={isLoading} />
            
            {/* Botón para mostrar/ocultar selector de modelos */}
            <div className="text-center">
              <Button 
                variant="outline" 
                onClick={() => setShowModelSelector(!showModelSelector)}
              >
                {showModelSelector ? 'Ocultar opciones avanzadas' : 'Opciones avanzadas de modelos'}
              </Button>
            </div>
            
            {/* Selector de modelos (condicional) */}
            {showModelSelector && (
              <ModelSelector 
                onModelSelectionChange={handleModelSelectionChange}
                defaultModels={selectedModels}
                defaultWeights={customWeights || undefined}
              />
            )}
            
            {/* Lista de comparación */}
            {compareList.length > 0 && (
              <Card title="Comparar predicciones">
                <div className="space-y-2">
                  {compareList.map(item => (
                    <div key={item.player_name} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span>{item.player_name.replace('_', ' ')}</span>
                      <span className="font-medium">{item.prediction} goles</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <Link to="/compare">
                    <Button variant="primary" size="sm">
                      Ver comparación
                    </Button>
                  </Link>
                </div>
              </Card>
            )}
          </div>
        </div>
        
        <div className="lg:col-span-2">
          {error && (
            <Card>
              <div className="text-center text-red-600 py-4">
                <p>{error}</p>
                <button 
                  onClick={() => clearPrediction()} 
                  className="mt-2 text-blue-600 hover:text-blue-800"
                >
                  Reintentar
                </button>
              </div>
            </Card>
          )}
          
          {prediction && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <div className="space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAddToCompare}
                    disabled={compareList.some(p => p.player_name === prediction.player_name)}
                  >
                    {compareList.some(p => p.player_name === prediction.player_name) 
                      ? 'Ya añadido' 
                      : 'Añadir a comparación'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => clearPrediction()}
                  >
                    Nueva predicción
                  </Button>
                </div>
              </div>
              
              <PredictionResults prediction={prediction} />
            </div>
          )}
          
          {!prediction && !error && !isLoading && (
            <Card>
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  Realiza una predicción
                </h3>
                <p className="mt-1 text-gray-500">
                  Completa el formulario para predecir los goles de un jugador.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

// Importación necesaria para el Link
import { Link } from 'react-router-dom';

export default PredictionPage;