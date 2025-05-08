import React from 'react';
import Card from '../common/Card';
import { formatNumber } from '../../utils/formatters';

interface ValidationSummaryProps {
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
}

const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  totalPredictions,
  playedMatches,
  accuratePredictions,
  accuracy,
  meanAbsoluteError,
  modelStats
}) => {
  return (
    <Card title="Resumen de Validación">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-blue-700">Total Predicciones</h4>
          <p className="text-2xl font-bold text-blue-900">{totalPredictions}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-green-700">Partidos Jugados</h4>
          <p className="text-2xl font-bold text-green-900">{playedMatches}</p>
          <p className="text-sm text-green-600">
            {playedMatches > 0 
              ? `${formatNumber((playedMatches / totalPredictions) * 100)}% del total` 
              : 'No hay partidos'}
          </p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-yellow-700">Precisión</h4>
          <p className="text-2xl font-bold text-yellow-900">{formatNumber(accuracy)}%</p>
          <p className="text-sm text-yellow-600">
            {accuratePredictions} de {playedMatches} correctas
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-purple-700">Error Absoluto Medio</h4>
          <p className="text-2xl font-bold text-purple-900">{formatNumber(meanAbsoluteError)}</p>
          <p className="text-sm text-purple-600">
            Goles de diferencia en promedio
          </p>
        </div>
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-4">Rendimiento por Modelo</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(modelStats).map(([model, stats]) => (
          <div key={model} className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-medium text-gray-700">{model.toUpperCase()}</h4>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Predicciones:</span>
                <span className="text-sm font-medium">{stats.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Jugados:</span>
                <span className="text-sm font-medium">{stats.played}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Correctas:</span>
                <span className="text-sm font-medium">{stats.accurate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Precisión:</span>
                <span className="text-sm font-medium">{formatNumber(stats.accuracy)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ValidationSummary;