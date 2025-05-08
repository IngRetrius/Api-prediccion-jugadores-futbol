import React from 'react';
import { ValidationComparison } from '../../types/models';
import Card from '../common/Card';
import { formatPlayerName, formatNumber } from '../../utils/formatters';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';

interface ValidationDetailProps {
  validation: ValidationComparison | null;
  onClose: () => void;
}

const ValidationDetail: React.FC<ValidationDetailProps> = ({ validation, onClose }) => {
  if (!validation) return null;
  
  // Colores para gráficos
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  
  // Datos para el gráfico de distribución
  const distributionData = [
    { name: 'Tiros a Puerta', value: validation.prediction.Historico_Tiros_Puerta },
    { name: 'Otros Tiros', value: validation.prediction.Historico_Tiros_Totales - validation.prediction.Historico_Tiros_Puerta },
  ];
  
  // Datos para comparación de predicción vs real
  const comparisonData = [
    { 
      name: 'Predicción', 
      valor: validation.prediction.Prediccion_Decimal,
      label: 'Predicción'
    },
    { 
      name: 'Real', 
      valor: validation.didPlay ? validation.actual?.Goles || 0 : null,
      label: 'Real'
    }
  ];
  
  // Factores de predicción
  const factorsData = [
    { 
      name: 'Prom. vs Oponente', 
      valor: validation.prediction.Promedio_Goles_vs_Oponente,
      label: 'Promedio histórico vs oponente'
    },
    { 
      name: 'Tiros Puerta', 
      valor: validation.prediction.Historico_Tiros_Puerta,
      label: 'Histórico tiros a puerta'
    },
    { 
      name: 'Tiros Totales', 
      valor: validation.prediction.Historico_Tiros_Totales,
      label: 'Histórico tiros totales'
    },
    { 
      name: 'Confianza', 
      valor: validation.prediction.Confianza_Modelo * 100,
      label: 'Confianza del modelo (%)'
    }
  ];
  
  return (
    <Card 
      title={`Detalle de Predicción: ${formatPlayerName(validation.prediction.Jugador)}`}
      subtitle={`Fecha ${validation.prediction.Fecha_Numero} vs ${validation.prediction.Oponente}`}
      headerAction={
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Información General</h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Modelo</h4>
                <p className="text-lg font-bold text-gray-900">
                  {validation.prediction.ModelType.toUpperCase()}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700">Predicción</h4>
                <p className="text-lg font-bold text-blue-600">
                  {validation.prediction.Prediccion_Entero} 
                  <span className="text-sm text-gray-500 ml-1">
                    ({formatNumber(validation.prediction.Prediccion_Decimal)})
                  </span>
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700">Resultado Real</h4>
                {validation.didPlay ? (
                  <p className={`text-lg font-bold ${validation.isAccurate ? 'text-green-600' : 'text-red-600'}`}>
                    {validation.actual?.Goles} goles
                  </p>
                ) : (
                  <p className="text-lg font-medium text-gray-500">
                    No jugó
                  </p>
                )}
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700">Confianza</h4>
                <p className="text-lg font-bold text-purple-600">
                  {formatNumber(validation.prediction.Confianza_Modelo * 100)}%
                </p>
              </div>
            </div>
            
            {validation.didPlay && validation.actual && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Estadísticas del Partido</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Tiros a Puerta:</p>
                    <p className="text-lg font-medium">{validation.actual.Tiros_Puerta}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tiros Totales:</p>
                    <p className="text-lg font-medium">{validation.actual.Tiros_Totales}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-600">Equipo:</p>
                  <p className="text-lg font-medium">{validation.actual.Equipo}</p>
                </div>
              </div>
            )}
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6">Distribución Histórica de Tiros</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}`, 'Valor']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Comparación de Predicción vs Real</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [value !== null ? value : 'N/A', 'Goles']} />
                <Legend />
                <Bar dataKey="valor" name="Goles" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6">Factores de Predicción</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={factorsData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" />
                <Tooltip formatter={(value, name, props) => {
                  return [value, props.payload.label];
                }} />
                <Bar dataKey="valor" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {validation.didPlay && (
        <div className={`mt-6 p-4 ${validation.isAccurate ? 'bg-green-50' : 'bg-red-50'} rounded-md`}>
          <h3 className={`text-lg font-medium ${validation.isAccurate ? 'text-green-700' : 'text-red-700'}`}>
            Resultado de la Validación
          </h3>
          <p className={`${validation.isAccurate ? 'text-green-600' : 'text-red-600'}`}>
            {validation.isAccurate 
              ? 'La predicción coincidió exactamente con el resultado real.' 
              : `La predicción difirió del resultado real por ${formatNumber(Math.abs(validation.difference))} goles.`}
          </p>
        </div>
      )}
    </Card>
  );
};

export default ValidationDetail;