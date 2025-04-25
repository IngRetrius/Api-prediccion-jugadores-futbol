import React from 'react';
import { formatNumber } from '../../utils/formatters';
import { ModelMetricsResponse } from '../../types/models';
import Card from '../common/Card';
import Loading from '../common/Loading';

interface ModelMetricsProps {
  metrics: ModelMetricsResponse | null;
  isLoading?: boolean;
  error?: string | null;
}

const ModelMetrics: React.FC<ModelMetricsProps> = ({
  metrics,
  isLoading = false,
  error = null,
}) => {
  // Renderizar estado de carga
  if (isLoading) {
    return <Loading text="Cargando métricas..." />;
  }
  
  // Renderizar error
  if (error) {
    return (
      <Card title="Métricas de los modelos">
        <div className="text-center text-red-600 py-4">
          <p>{error}</p>
        </div>
      </Card>
    );
  }
  
  // Si no hay métricas disponibles
  if (!metrics) {
    return (
      <Card title="Métricas de los modelos">
        <div className="text-center text-gray-500 py-4">
          No hay métricas disponibles para este jugador.
        </div>
      </Card>
    );
  }
  
  // Determinar qué modelos están disponibles
  const availableModels = Object.keys(metrics.metrics).filter(
    model => !metrics.metrics[model].error
  );
  
  // Si no hay modelos disponibles
  if (availableModels.length === 0) {
    return (
      <Card title="Métricas de los modelos">
        <div className="text-center text-gray-500 py-4">
          No hay modelos disponibles con métricas para este jugador.
        </div>
      </Card>
    );
  }
  
  // Función para mostrar un valor métrico
  const renderMetricValue = (value: any) => {
    if (value === undefined || value === null) return '-';
    if (typeof value === 'number') return formatNumber(value);
    return value.toString();
  };
  
  return (
    <Card title="Métricas de los modelos">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Métrica
              </th>
              {availableModels.map(model => (
                <th key={model} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {model.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* MAE - Error Absoluto Medio */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                MAE
              </td>
              {availableModels.map(model => (
                <td key={model} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {renderMetricValue(metrics.metrics[model].mae)}
                </td>
              ))}
            </tr>
            
            {/* MSE - Error Cuadrático Medio */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                MSE
              </td>
              {availableModels.map(model => (
                <td key={model} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {renderMetricValue(metrics.metrics[model].mse)}
                </td>
              ))}
            </tr>
            
            {/* RMSE - Raíz del Error Cuadrático Medio */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                RMSE
              </td>
              {availableModels.map(model => (
                <td key={model} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {renderMetricValue(metrics.metrics[model].rmse)}
                </td>
              ))}
            </tr>
            
            {/* R² - Coeficiente de determinación */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                R²
              </td>
              {availableModels.map(model => (
                <td key={model} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {renderMetricValue(metrics.metrics[model].r2)}
                </td>
              ))}
            </tr>
            
            {/* Precisión */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                Precisión
              </td>
              {availableModels.map(model => (
                <td key={model} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {renderMetricValue(metrics.metrics[model].accuracy)}
                </td>
              ))}
            </tr>
            
            {/* F1-Score */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                F1-Score
              </td>
              {availableModels.map(model => (
                <td key={model} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {renderMetricValue(metrics.metrics[model].f1_score)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>
          <strong>MAE:</strong> Error Absoluto Medio - Promedio de la diferencia absoluta entre las predicciones y los valores reales.
        </p>
        <p>
          <strong>MSE:</strong> Error Cuadrático Medio - Promedio del cuadrado de las diferencias entre las predicciones y los valores reales.
        </p>
        <p>
          <strong>RMSE:</strong> Raíz del Error Cuadrático Medio - Raíz cuadrada del MSE.
        </p>
        <p>
          <strong>R²:</strong> Coeficiente de determinación - Proporción de la varianza explicada por el modelo (1 es perfecto).
        </p>
        <p>
          <strong>Precisión:</strong> Proporción de predicciones correctas.
        </p>
        <p>
          <strong>F1-Score:</strong> Media armónica de precisión y exhaustividad.
        </p>
      </div>
    </Card>
  );
};

export default ModelMetrics;