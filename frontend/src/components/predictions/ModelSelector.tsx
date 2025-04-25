import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';

interface ModelSelectorProps {
  onModelSelectionChange: (models: string[], weights: Record<string, number> | null) => void;
  availableModels?: string[];
  defaultModels?: string[];
  defaultWeights?: Record<string, number>;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  onModelSelectionChange,
  availableModels = ['lstm', 'sarimax', 'poisson'],
  defaultModels = ['ensemble'],
  defaultWeights = { lstm: 0.4, sarimax: 0.3, poisson: 0.3 }
}) => {
  const [selectedModels, setSelectedModels] = useState<string[]>(defaultModels);
  const [useEnsemble, setUseEnsemble] = useState(defaultModels.includes('ensemble'));
  const [weights, setWeights] = useState<Record<string, number>>(defaultWeights);
  const [isCustomWeights, setIsCustomWeights] = useState(false);
  
  // Manejar cambio en la selección de modelos
  const handleModelChange = (model: string) => {
    if (model === 'ensemble') {
      setUseEnsemble(!useEnsemble);
      if (!useEnsemble) {
        setSelectedModels(['ensemble']);
      } else {
        setSelectedModels(Object.keys(weights));
      }
    } else {
      let newSelection;
      if (selectedModels.includes(model)) {
        // Evitar eliminar todos los modelos
        if (selectedModels.length <= 1) return;
        newSelection = selectedModels.filter((m) => m !== model);
      } else {
        // Eliminar ensemble si se selecciona un modelo específico
        newSelection = [...selectedModels.filter((m) => m !== 'ensemble'), model];
      }
      setSelectedModels(newSelection);
      setUseEnsemble(false);
    }
  };
  
  // Manejar cambio en los pesos
  const handleWeightChange = (model: string, value: number) => {
    const newWeights = { ...weights, [model]: value };
    
    // Ajustar otros pesos para mantener la suma en 1.0
    const total = Object.values(newWeights).reduce((sum, val) => sum + val, 0);
    
    if (total > 0) {
      // Normalizar si hay diferencia significativa
      if (Math.abs(total - 1.0) > 0.01) {
        for (const key of Object.keys(newWeights)) {
          if (key !== model) {
            // Distribuir la diferencia proporcionalmente entre los otros pesos
            const ratio = newWeights[key] / (total - newWeights[model]);
            const difference = 1.0 - newWeights[model];
            newWeights[key] = Math.max(0, ratio * difference);
            
            // Redondear a 2 decimales
            newWeights[key] = Math.round(newWeights[key] * 100) / 100;
          }
        }
      }
    }
    
    setWeights(newWeights);
    setIsCustomWeights(true);
  };
  
  // Aplicar cambios
  const applyChanges = () => {
    onModelSelectionChange(
      selectedModels,
      useEnsemble && !isCustomWeights ? null : weights
    );
  };
  
  // Resetear a valores por defecto
  const resetToDefaults = () => {
    setSelectedModels(defaultModels);
    setUseEnsemble(defaultModels.includes('ensemble'));
    setWeights(defaultWeights);
    setIsCustomWeights(false);
    onModelSelectionChange(defaultModels, null);
  };
  
  return (
    <Card title="Selección de modelos">
      <div>
        {/* Seleccionar ensemble vs modelos individuales */}
        <div className="mb-4">
          <div className="flex items-center">
            <input
              id="ensemble"
              name="model-type"
              type="radio"
              checked={useEnsemble}
              onChange={() => {
                setUseEnsemble(true);
                setSelectedModels(['ensemble']);
              }}
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="ensemble" className="ml-2 block text-sm font-medium text-gray-700">
              Usar ensemble (combinación de modelos)
            </label>
          </div>
          <div className="flex items-center mt-2">
            <input
              id="individual"
              name="model-type"
              type="radio"
              checked={!useEnsemble}
              onChange={() => {
                setUseEnsemble(false);
                if (selectedModels.includes('ensemble')) {
                  setSelectedModels(Object.keys(weights));
                }
              }}
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="individual" className="ml-2 block text-sm font-medium text-gray-700">
              Seleccionar modelos individuales
            </label>
          </div>
        </div>
        
        {/* Selección de modelos individuales */}
        {!useEnsemble && (
          <div className="mb-6 border-t border-b border-gray-200 py-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Seleccionar modelos:
            </h4>
            <div className="space-y-2">
              {availableModels.map((model) => (
                <div key={model} className="flex items-center">
                  <input
                    id={`model-${model}`}
                    name={`model-${model}`}
                    type="checkbox"
                    checked={selectedModels.includes(model)}
                    onChange={() => handleModelChange(model)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`model-${model}`} className="ml-2 block text-sm text-gray-700">
                    {model.toUpperCase()}
                  </label>
                </div>
              ))}
            </div>
            
            {selectedModels.length === 0 && (
              <p className="mt-2 text-sm text-red-600">
                Seleccione al menos un modelo
              </p>
            )}
          </div>
        )}
        
        {/* Configuración de pesos para ensemble */}
        {(useEnsemble || selectedModels.length > 1) && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-gray-700">
                Configuración de pesos:
              </h4>
              <div>
                <button
                  onClick={() => setIsCustomWeights(!isCustomWeights)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {isCustomWeights ? 'Usar pesos predeterminados' : 'Personalizar pesos'}
                </button>
              </div>
            </div>
            
            {isCustomWeights && (
              <div className="space-y-4">
                {availableModels.map((model) => (
                  <div key={model} className="flex items-center">
                    <span className="w-20 text-sm text-gray-700">
                      {model.toUpperCase()}:
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={weights[model] || 0}
                      onChange={(e) => handleWeightChange(model, parseFloat(e.target.value))}
                      className="flex-grow h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="ml-2 w-12 text-right text-sm text-gray-700">
                      {Math.round((weights[model] || 0) * 100)}%
                    </span>
                  </div>
                ))}
                
                <div className="text-right text-xs text-gray-500">
                  La suma de pesos debe ser 100%.
                </div>
              </div>
            )}
            
            {!isCustomWeights && (
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-600">
                  Usando pesos predeterminados: LSTM ({defaultWeights.lstm * 100}%), 
                  SARIMAX ({defaultWeights.sarimax * 100}%), 
                  POISSON ({defaultWeights.poisson * 100}%)
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Botones */}
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefaults}
          >
            Resetear
          </Button>
          
          <Button
            variant="primary"
            size="sm"
            onClick={applyChanges}
            disabled={selectedModels.length === 0}
          >
            Aplicar
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ModelSelector;