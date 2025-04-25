import React from 'react';
import { formatPlayerName, formatNumber, getConfidenceColor } from '../../utils/formatters';
import { PredictionResponse } from '../../types/models';
import Card from '../common/Card';
import GoalDistribution from './GoalDistribution';

interface PredictionResultsProps {
  prediction: PredictionResponse | null;
  showModelComparison?: boolean;
}

const PredictionResults: React.FC<PredictionResultsProps> = ({
  prediction,
  showModelComparison = true,
}) => {
  if (!prediction) {
    return null;
  }
  
  // Verificar si hay error en la predicción
  if (!prediction.prediction && prediction.metadata.error) {
    return (
      <Card title="Resultado de la predicción">
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Error en la predicción
          </h3>
          <p className="text-gray-600 mb-4">
            {prediction.metadata.error}
          </p>
          <p className="text-sm text-gray-500">
            Intente con diferentes parámetros o verifique la disponibilidad de los modelos.
          </p>
        </div>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Resultado principal */}
      <Card title="Resultado de la predicción">
        <div className="text-center py-4">
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {formatPlayerName(prediction.player_name)}
          </h3>
          <p className="text-gray-600 mb-4">
            vs. {prediction.metadata.opponent} ({prediction.metadata.is_home ? 'Local' : 'Visitante'})
          </p>
          
          <div className="bg-blue-50 inline-block rounded-full px-6 py-3 mb-4">
            <span className="text-4xl font-bold text-blue-700">
              {prediction.prediction !== null ? prediction.prediction : '?'}
            </span>
            <span className="text-lg text-blue-600 ml-1">
              {prediction.prediction === 1 ? 'gol' : 'goles'}
            </span>
          </div>
          
          <div>
            <span className={`font-medium ${getConfidenceColor(prediction.confidence)}`}>
              Confianza: {prediction.confidence !== null ? formatNumber(prediction.confidence * 100) + '%' : 'N/A'}
            </span>
          </div>
        </div>
      </Card>
      
      {/* Distribución de probabilidad */}
      {prediction.probability_distribution && Object.keys(prediction.probability_distribution).length > 0 && (
        <Card title="Distribución de probabilidad">
          <GoalDistribution distribution={prediction.probability_distribution} />
        </Card>
      )}
      
      {/* Comparativa de modelos */}
      {showModelComparison && (
        <Card title="Comparativa de modelos">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Modelo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Predicción
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Confianza
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor bruto
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(prediction.model_predictions).map(([modelName, modelData]) => (
                  <tr key={modelName} className={modelData.disponible ? '' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {modelName.toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {modelData.prediction !== null ? modelData.prediction : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={modelData.confidence !== null ? getConfidenceColor(modelData.confidence) : ''}>
                        {modelData.confidence !== null ? `${formatNumber(modelData.confidence * 100)}%` : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {modelData.raw !== null ? formatNumber(modelData.raw) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {modelData.disponible ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Disponible
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          No disponible
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            <p>
              <strong>Modelos utilizados:</strong> {prediction.metadata.models_used.join(', ')}
            </p>
            {prediction.metadata.weights && (
              <p className="mt-1">
                <strong>Pesos:</strong> {Object.entries(prediction.metadata.weights).map(([model, weight]) => (
                  `${model.toUpperCase()}: ${formatNumber(weight * 100)}%`
                )).join(', ')}
              </p>
            )}
          </div>
        </Card>
      )}
      
      {/* Información adicional */}
      <Card title="Información adicional">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Detalles del partido</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><strong>Fecha:</strong> {prediction.metadata.date}</li>
              <li><strong>Condición:</strong> {prediction.metadata.is_home ? 'Local' : 'Visitante'}</li>
              <li><strong>Equipo oponente:</strong> {prediction.metadata.opponent}</li>
              <li><strong>Equipo oponente (std):</strong> {prediction.metadata.opponent_std}</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Parámetros utilizados</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><strong>Minutos:</strong> {prediction.metadata.minutes ?? 'No especificado'}</li>
              <li><strong>Tiros a puerta:</strong> {prediction.metadata.shots_on_target ?? 'No especificado'}</li>
              <li><strong>Tiros totales:</strong> {prediction.metadata.total_shots ?? 'No especificado'}</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 text-xs text-gray-400 text-right">
          Predicción generada el: {new Date(prediction.timestamp).toLocaleString()}
        </div>
      </Card>
    </div>
  );
};

export default PredictionResults;