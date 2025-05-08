import React, { useState } from 'react';
import Card from '../common/Card';
import { ValidationComparison } from '../../types/models';
import { formatPlayerName, formatNumber } from '../../utils/formatters';

interface ValidationTableProps {
  data: ValidationComparison[];
  onRowSelect: (validation: ValidationComparison) => void;
}

const ValidationTable: React.FC<ValidationTableProps> = ({ data, onRowSelect }) => {
  const [sortField, setSortField] = useState<string>('Fecha_Numero');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Manejar clic en cabecera para ordenar
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // Ordenar datos
  const sortedData = [...data].sort((a, b) => {
    let aValue: any;
    let bValue: any;
    
    if (sortField === 'difference') {
      aValue = a.difference;
      bValue = b.difference;
    } else if (sortField === 'actual') {
      aValue = a.actual?.Goles ?? -1;
      bValue = b.actual?.Goles ?? -1;
    } else if (sortField.includes('.')) {
      // Manejar campos anidados como 'prediction.Jugador'
      const [parent, child] = sortField.split('.');
      aValue = a[parent as keyof ValidationComparison]?.[child];
      bValue = b[parent as keyof ValidationComparison]?.[child];
    } else if (sortField === 'didPlay') {
      aValue = a.didPlay ? 1 : 0;
      bValue = b.didPlay ? 1 : 0;
    } else {
      aValue = a.prediction[sortField as keyof typeof a.prediction];
      bValue = b.prediction[sortField as keyof typeof b.prediction];
    }
    
    if (aValue === bValue) return 0;
    
    // Manejar valores null o undefined
    if (aValue === null || aValue === undefined) return sortDirection === 'asc' ? -1 : 1;
    if (bValue === null || bValue === undefined) return sortDirection === 'asc' ? 1 : -1;
    
    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : 1;
    } else {
      return aValue > bValue ? -1 : 1;
    }
  });
  
  // Renderizar cabecera de columna
  const renderColumnHeader = (title: string, field: string) => (
    <th 
      scope="col" 
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center">
        <span>{title}</span>
        {sortField === field && (
          <span className="ml-1">
            {sortDirection === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );
  
  return (
    <Card title="Detalle de Predicciones">
      <div className="overflow-x-auto shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {renderColumnHeader("Fecha", "Fecha_Numero")}
              {renderColumnHeader("Jugador", "prediction.Jugador")}
              {renderColumnHeader("Oponente", "prediction.Oponente")}
              {renderColumnHeader("Modelo", "prediction.ModelType")}
              {renderColumnHeader("Predicción", "prediction.Prediccion_Entero")}
              {renderColumnHeader("Decimal", "prediction.Prediccion_Decimal")}
              {renderColumnHeader("Confianza", "prediction.Confianza_Modelo")}
              {renderColumnHeader("Jugado", "didPlay")}
              {renderColumnHeader("Real", "actual")}
              {renderColumnHeader("Diferencia", "difference")}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((validation, index) => (
              <tr 
                key={`${validation.prediction.Jugador}-${validation.prediction.Fecha_Numero}-${validation.prediction.ModelType}`}
                className="hover:bg-blue-50 cursor-pointer"
                onClick={() => onRowSelect(validation)}
              >
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {validation.prediction.Fecha_Numero}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatPlayerName(validation.prediction.Jugador)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {validation.prediction.Oponente}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${validation.prediction.ModelType === 'lstm' ? 'bg-blue-100 text-blue-800' : 
                      validation.prediction.ModelType === 'sarimax' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'}`}>
                    {validation.prediction.ModelType.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {validation.prediction.Prediccion_Entero}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatNumber(validation.prediction.Prediccion_Decimal)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatNumber(validation.prediction.Confianza_Modelo * 100)}%
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {validation.didPlay ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Sí
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      No
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                  {validation.didPlay ? (
                    <span className={validation.isAccurate ? 'text-green-600' : 'text-red-600'}>
                      {validation.actual?.Goles}
                    </span>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                  {validation.didPlay ? (
                    <span className={
                      Math.abs(validation.difference) < 0.5 ? 'text-green-600' : 
                      Math.abs(validation.difference) < 1 ? 'text-yellow-600' : 
                      'text-red-600'
                    }>
                      {validation.difference > 0 ? '+' : ''}{formatNumber(validation.difference)}
                    </span>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-sm text-gray-500 text-right">
        Mostrando {sortedData.length} predicciones
      </div>
    </Card>
  );
};

export default ValidationTable;