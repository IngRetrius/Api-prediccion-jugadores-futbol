import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Cell, ReferenceLine
} from 'recharts';
import Card from '../common/Card';
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
    // Primero agrupamos por jugador para obtener los goles reales (que son los mismos independientemente del modelo)
    const playerRealGoals: Record<string, { player: string, actualGoals: number, count: number }> = {};
    
    data.filter(item => item.didPlay).forEach(item => {
      const playerName = formatPlayerName(item.prediction.Jugador);
      
      if (!playerRealGoals[playerName]) {
        playerRealGoals[playerName] = {
          player: playerName,
          actualGoals: 0,
          count: 0
        };
      }
      
      playerRealGoals[playerName].actualGoals += item.actual?.Goles || 0;
      playerRealGoals[playerName].count += 1;
    });
    
    // Calcular el promedio de goles reales por jugador
    Object.values(playerRealGoals).forEach(player => {
      player.actualGoals = player.actualGoals / player.count;
    });
    
    // Ahora agrupamos por jugador y modelo para las predicciones
    const result: any[] = [];
    
    // Crear un objeto para cada jugador único
    const uniquePlayers = [...new Set(data.filter(item => item.didPlay).map(item => formatPlayerName(item.prediction.Jugador)))];
    
    uniquePlayers.forEach(playerName => {
      const playerData: any = {
        player: playerName,
        actualGoals: playerRealGoals[playerName]?.actualGoals || 0
      };
      
      // Agrupar predicciones por modelo para este jugador
      const modelPredictions: Record<string, { total: number, count: number }> = {};
      
      data.filter(item => item.didPlay && formatPlayerName(item.prediction.Jugador) === playerName)
        .forEach(item => {
          const model = item.prediction.ModelType;
          
          if (!modelPredictions[model]) {
            modelPredictions[model] = {
              total: 0,
              count: 0
            };
          }
          
          modelPredictions[model].total += item.prediction.Prediccion_Decimal;
          modelPredictions[model].count += 1;
        });
      
      // Calcular promedio para cada modelo
      Object.entries(modelPredictions).forEach(([model, data]) => {
        playerData[`${model}_predicted`] = data.total / data.count;
      });
      
      result.push(playerData);
    });
    
    return result;
  }, [data]);
  
  // Colores para los modelos
  const modelColors: Record<string, string> = {
    lstm: '#4F46E5',     // Azul/Indigo
    sarimax: '#059669',  // Verde
    poisson: '#B45309'   // Ámbar/Naranja
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
              barSize={20}  // Controlar el ancho de las barras
              barGap={2}    // Espacio entre barras del mismo grupo
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="player" 
                axisLine={true}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: any, name: string) => {
                  if (name === 'actualGoals') {
                    return [`${value.toFixed(2)}`, 'Goles Reales (Promedio)'];
                  } else if (name.includes('_predicted')) {
                    const model = name.split('_')[0].toUpperCase();
                    return [`${value.toFixed(2)}`, `Goles Predichos (${model})`];
                  }
                  return [value, name];
                }}
              />
              <Legend />
              
              {/* Una sola barra para goles reales */}
              <Bar 
                dataKey="actualGoals" 
                name="Goles Reales (Promedio)" 
                fill="#EF4444" 
                radius={[4, 4, 0, 0]}
              />
              
              {/* Barras para predicciones por modelo */}
              <Bar 
                dataKey="lstm_predicted" 
                name="Goles Predichos (LSTM)" 
                fill={modelColors.lstm}
                radius={[4, 4, 0, 0]}
              />
              
              <Bar 
                dataKey="sarimax_predicted" 
                name="Goles Predichos (SARIMAX)" 
                fill={modelColors.sarimax}
                radius={[4, 4, 0, 0]}
              />
              
              <Bar 
                dataKey="poisson_predicted" 
                name="Goles Predichos (POISSON)" 
                fill={modelColors.poisson}
                radius={[4, 4, 0, 0]}
              />
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