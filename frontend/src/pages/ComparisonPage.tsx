import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import ComparisonChart from '../components/predictions/ComparisonChart';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { usePredictionContext } from '../contexts/PredictionContext';
import { formatPlayerName } from '../utils/formatters';

const ComparisonPage: React.FC = () => {
  const { compareList, removeFromCompare, clearCompareList } = usePredictionContext();
  const navigate = useNavigate();
  
  // Si no hay predicciones para comparar, mostrar mensaje
  if (!compareList || compareList.length === 0) {
    return (
      <Layout title="Comparación de Predicciones">
        <Card>
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              No hay predicciones para comparar
            </h3>
            <p className="mt-1 text-gray-500">
              Primero realiza predicciones y añádelas a la lista de comparación.
            </p>
            <div className="mt-6">
              <Button
                variant="primary"
                onClick={() => navigate('/predict')}
              >
                Ir a predicciones
              </Button>
            </div>
          </div>
        </Card>
      </Layout>
    );
  }
  
  return (
    <Layout title="Comparación de Predicciones">
      <div className="space-y-6">
        {/* Tabla de predicciones */}
        <Card title="Predicciones para comparar">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jugador
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equipo Oponente
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Condición
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Goles
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Confianza
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {compareList.map((prediction) => (
                  <tr key={prediction.player_name}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatPlayerName(prediction.player_name)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {prediction.metadata.opponent}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {prediction.metadata.is_home ? 'Local' : 'Visitante'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={`${prediction.prediction === 0 ? 'text-gray-700' : 'text-blue-600'}`}>
                        {prediction.prediction !== null ? prediction.prediction : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {prediction.confidence !== null 
                        ? `${(prediction.confidence * 100).toFixed(1)}%` 
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => removeFromCompare(prediction.player_name)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearCompareList}
            >
              Limpiar lista
            </Button>
          </div>
        </Card>
        
        {/* Gráfico de comparación */}
        <ComparisonChart predictions={compareList} />
        
        {/* Leyenda de modelos */}
        <Card title="Información sobre los modelos">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-md">
              <h3 className="font-medium text-blue-700 mb-2">Ensemble</h3>
              <p className="text-sm text-blue-600">
                Combinación ponderada de los tres modelos individuales. 
                Generalmente ofrece la predicción más balanceada y precisa.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-md">
              <h3 className="font-medium text-green-700 mb-2">LSTM</h3>
              <p className="text-sm text-green-600">
                Red neuronal de memoria a largo plazo. Captura patrones 
                complejos y dependencias temporales en el rendimiento del jugador.
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-md">
              <h3 className="font-medium text-yellow-700 mb-2">SARIMAX</h3>
              <p className="text-sm text-yellow-600">
                Modelo estadístico para series temporales. Considera 
                estacionalidad y variables externas que afectan al rendimiento.
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-md md:col-span-3">
              <h3 className="font-medium text-red-700 mb-2">Poisson</h3>
              <p className="text-sm text-red-600">
                Modelo basado en la distribución de Poisson, especialmente adecuado 
                para eventos discretos como goles. Proporciona una distribución de 
                probabilidad completa para diferentes cantidades de goles.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default ComparisonPage;