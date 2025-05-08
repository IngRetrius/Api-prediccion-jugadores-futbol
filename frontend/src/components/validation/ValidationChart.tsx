import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis
} from 'recharts';
import Card from '../common/Card';
// import Button from '../common/Button';
import { ValidationComparison } from '../../types/models';
import { formatPlayerName } from '../../utils/formatters';

interface ValidationChartProps {
  data: ValidationComparison[];
}

const ValidationChart: React.FC<ValidationChartProps> = ({ data }) => {
  const [chartType, setChartType] = useState<'accuracy' | 'scatter' | 'comparison'>('accuracy');
  
  // Preparar datos para el gráfico de precisión por jugador
  const playerAccuracyData = React.useMemo(() => {
    const playerStats = data.reduce((acc, item) => {
      const player = item.prediction.Jugador;
      if (!acc[player]) {
        acc[player] = { player, total: 0, played: 0, accurate: 0 };
      }
      
      acc[player].total += 1;
      
      if (item.didPlay) {
        acc[player].played += 1;
        if (item.isAccurate) {
          acc[player].accurate += 1;
        }
      }
      
      return acc;
    }, {} as Record<string, { player: string, total: number, played: number, accurate: number }>);
    
    return Object.values(playerStats).map(stats => ({
      player: formatPlayerName(stats.player),
      accuracy: stats.played > 0 ? (stats.accurate / stats.played) * 100 : 0,
      played: stats.played
    })).sort((a, b) => b.accuracy - a.accuracy);
  }, [data]);
  
  // Preparar datos para el gráfico de dispersión
  const scatterData = React.useMemo(() => {
    return data.filter(item => item.didPlay).map(item => ({
      player: formatPlayerName(item.prediction.Jugador),
      predicted: item.prediction.Prediccion_Decimal,
      actual: item.actual?.Goles || 0,
      model: item.prediction.ModelType,
      fecha: item.prediction.Fecha_Numero
    }));
  }, [data]);
  
  // Preparar datos para la comparación de predicciones vs. resultados reales
  const comparisonData = React.useMemo(() => {
    // Agrupar por jugador y modelo
    const grouped = data.filter(item => item.didPlay).reduce((acc, item) => {
      const player = item.prediction.Jugador;
      const model = item.prediction.ModelType;
      const key = `${player}-${model}`;
      
      if (!acc[key]) {
        acc[key] = {
          player: formatPlayerName(player),
          model,
          predictedGoals: 0,
          actualGoals: 0,
          matches: 0
        };
      }
      
      acc[key].predictedGoals += item.prediction.Prediccion_Decimal;
      acc[key].actualGoals += item.actual?.Goles || 0;
      acc[key].matches += 1;
      
      return acc;
    }, {} as Record<string, { 
      player: string, 
      model: string, 
      predictedGoals: number, 
      actualGoals: number,
      matches: number 
    }>);
    
    // Convertir a array y calcular promedios
    return Object.values(grouped).map(group => ({
      ...group,
      predictedGoals: group.predictedGoals / group.matches,
      actualGoals: group.actualGoals / group.matches
    })).sort((a, b) => a.player.localeCompare(b.player));
  }, [data]);
  
  // Colores para los modelos
  const modelColors: Record<string, string> = {
    lstm: '#8884d8',
    sarimax: '#82ca9d',
    poisson: '#ffc658'
  };
  
  return (
    <Card title="Visualización de Predicciones">
      <div className="mb-4 flex justify-end">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium ${
              chartType === 'accuracy'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            } border border-gray-200 rounded-l-lg`}
            onClick={() => setChartType('accuracy')}
          >
            Precisión
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium ${
              chartType === 'scatter'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            } border border-gray-200`}
            onClick={() => setChartType('scatter')}
          >
            Dispersión
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium ${
              chartType === 'comparison'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            } border border-gray-200 rounded-r-lg`}
            onClick={() => setChartType('comparison')}
          >
            Comparación
          </button>
        </div>
      </div>
      
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'accuracy' ? (
            <BarChart
              data={playerAccuracyData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="player" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value: any) => [`${value.toFixed(1)}%`, 'Precisión']} />
              <Legend />
              <Bar dataKey="accuracy" fill="#3B82F6" name="Precisión (%)" />
              <Bar dataKey="played" fill="#10B981" name="Partidos Jugados" />
            </BarChart>
          ) : chartType === 'scatter' ? (
            <ScatterChart
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid />
              <XAxis type="number" dataKey="predicted" name="Predicción" domain={[0, 'dataMax']} />
              <YAxis type="number" dataKey="actual" name="Real" domain={[0, 'dataMax']} />
              <ZAxis type="category" dataKey="model" name="Modelo" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter name="LSTM" data={scatterData.filter(d => d.model === 'lstm')} fill={modelColors.lstm} />
              <Scatter name="SARIMAX" data={scatterData.filter(d => d.model === 'sarimax')} fill={modelColors.sarimax} />
              <Scatter name="POISSON" data={scatterData.filter(d => d.model === 'poisson')} fill={modelColors.poisson} />
            </ScatterChart>
          ) : (
            <BarChart
              data={comparisonData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="player" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="predictedGoals" fill="#3B82F6" name="Goles Predichos (Promedio)" />
              <Bar dataKey="actualGoals" fill="#EF4444" name="Goles Reales (Promedio)" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 text-sm text-gray-500 text-center">
        {chartType === 'accuracy' 
          ? 'Precisión de predicciones por jugador (porcentaje)' 
          : chartType === 'scatter'
          ? 'Dispersión de predicciones vs. resultados reales'
          : 'Comparación entre goles predichos y reales por jugador y modelo'}
      </div>
    </Card>
  );
};

export default ValidationChart;