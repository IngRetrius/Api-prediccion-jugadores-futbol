import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PredictionResponse } from '../../types/models';
import Card from '../common/Card';

interface ComparisonChartProps {
  predictions: PredictionResponse[];
  title?: string;
}

const ComparisonChart: React.FC<ComparisonChartProps> = ({ 
  predictions, 
  title = "Comparación de predicciones" 
}) => {
  const [chartType, setChartType] = useState<'goals' | 'confidence'>('goals');
  
  // No hay datos para mostrar
  if (!predictions || predictions.length === 0) {
    return (
      <Card title={title}>
        <div className="text-center py-8 text-gray-500">
          No hay datos disponibles para comparar
        </div>
      </Card>
    );
  }
  
  // Preparar datos para el gráfico
  const chartData = predictions.map(prediction => {
    const modelPredictions: Record<string, number | null> = {};
    
    // Extraer predicciones de cada modelo
    Object.entries(prediction.model_predictions).forEach(([model, data]) => {
      if (data.disponible) {
        modelPredictions[model] = chartType === 'goals' 
          ? data.prediction 
          : data.confidence ? data.confidence * 100 : null;
      }
    });
    
    return {
      name: prediction.player_name.replace('_', ' '),
      ensemble: chartType === 'goals' 
        ? prediction.prediction 
        : prediction.confidence ? prediction.confidence * 100 : null,
      ...modelPredictions
    };
  });
  
  // Obtener todos los modelos disponibles en cualquiera de las predicciones
  const allModels = Array.from(
    new Set(
      predictions.flatMap(prediction => 
        Object.entries(prediction.model_predictions)
          .filter(([_, data]) => data.disponible)
          .map(([model]) => model)
      )
    )
  );
  
  // Colores para los modelos
  const modelColors: Record<string, string> = {
    ensemble: '#3B82F6', // blue-500
    lstm: '#10B981',     // emerald-500
    sarimax: '#F59E0B',  // amber-500
    poisson: '#EF4444',  // red-500
  };
  
  const formatYAxis = (value: number) => {
    if (chartType === 'confidence') {
      return `${value}%`;
    }
    return value.toString();
  };
  
  return (
    <Card title={title}>
      <div className="mb-4 flex justify-end">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
              chartType === 'goals'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            } border border-gray-200`}
            onClick={() => setChartType('goals')}
          >
            Goles
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
              chartType === 'confidence'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            } border border-gray-200`}
            onClick={() => setChartType('confidence')}
          >
            Confianza
          </button>
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis 
              tickFormatter={formatYAxis}
              domain={chartType === 'confidence' ? [0, 100] : [0, 'auto']} 
            />
            <Tooltip 
              formatter={(value: any) => {
                if (value === null) return ['No disponible', ''];
                return chartType === 'confidence' 
                  ? [`${value.toFixed(1)}%`, 'Confianza'] 
                  : [value, 'Goles'];
              }}
            />
            <Legend />
            
            {/* Barra para ensemble */}
            <Bar 
              dataKey="ensemble" 
              fill={modelColors.ensemble} 
              name="Ensemble" 
            />
            
            {/* Barras para cada modelo disponible */}
            {allModels.map(model => (
              <Bar 
                key={model}
                dataKey={model} 
                fill={modelColors[model] || '#9CA3AF'} // gray-400 como fallback
                name={model.toUpperCase()} 
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 text-sm text-gray-500 text-center">
        {chartType === 'goals' 
          ? 'Predicción de goles por jugador y modelo' 
          : 'Nivel de confianza (%) por jugador y modelo'}
      </div>
    </Card>
  );
};

export default ComparisonChart;