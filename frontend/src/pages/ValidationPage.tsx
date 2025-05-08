import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import ValidationFilters from '../components/validation/ValidationFilters';
import ValidationSummary from '../components/validation/ValidationSummary';
import ValidationChart from '../components/validation/ValidationChart';
import ValidationTable from '../components/validation/ValidationTable';
import ValidationDetail from '../components/validation/ValidationDetail';
import Loading from '../components/common/Loading';
import Card from '../components/common/Card';
import useValidationData from '../hooks/useValidationData';
import { ValidationComparison } from '../types/models';

const ValidationPage: React.FC = () => {
  const {
    filteredData,
    isLoading,
    error,
    filters,
    uniquePlayers,
    uniqueModels,
    uniqueDates,
    filterByPlayer,
    filterByModel,
    filterByDateRange,
    resetFilters,
    summary
  } = useValidationData();
  
  const [selectedValidation, setSelectedValidation] = useState<ValidationComparison | null>(null);
  
  // Manejar selección de fila de la tabla
  const handleRowSelect = (validation: ValidationComparison) => {
    setSelectedValidation(validation);
  };
  
  // Cerrar detalle de validación
  const handleCloseDetail = () => {
    setSelectedValidation(null);
  };
  
  return (
    <Layout 
      title="Validación de Predicciones" 
      showSidebar={false}
    >
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="bg-blue-600 px-6 py-8 text-white">
            <h1 className="text-2xl font-bold mb-2">
              Validación de Predicciones
            </h1>
            <p className="text-blue-100">
              Compara las predicciones de los modelos con los resultados reales del torneo 2025.
            </p>
          </div>
        </div>
        
        {/* Filtros */}
        <ValidationFilters 
          players={uniquePlayers}
          models={uniqueModels}
          dates={uniqueDates}
          onPlayerSelect={filterByPlayer}
          onModelSelect={filterByModel}
          onDateRangeSelect={filterByDateRange}
          onReset={resetFilters}
          selectedPlayer={filters.player}
          selectedModel={filters.model}
          selectedDateRange={filters.dateRange}
        />
        
        {/* Estado de carga o error */}
        {isLoading && (
          <Card>
            <Loading text="Cargando datos de validación..." />
          </Card>
        )}
        
        {error && !isLoading && (
          <Card>
            <div className="text-center text-red-600 py-4">
              <p>{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                Reintentar
              </button>
            </div>
          </Card>
        )}
        
        {/* Detalle de validación (si hay una selección) */}
        {selectedValidation && (
          <ValidationDetail 
            validation={selectedValidation} 
            onClose={handleCloseDetail} 
          />
        )}
        
        {/* Contenido principal */}
        {!isLoading && !error && filteredData.length > 0 && (
          <>
            {/* Resumen */}
            <ValidationSummary 
              totalPredictions={summary.totalPredictions}
              playedMatches={summary.playedMatches}
              accuratePredictions={summary.accuratePredictions}
              accuracy={summary.accuracy}
              meanAbsoluteError={summary.meanAbsoluteError}
              modelStats={summary.modelStats}
            />
            
            {/* Gráficos */}
            <ValidationChart data={filteredData} />
            
            {/* Tabla de detalles */}
            <ValidationTable 
              data={filteredData}
              onRowSelect={handleRowSelect}
            />
          </>
        )}
        
        {/* Sin datos */}
        {!isLoading && !error && filteredData.length === 0 && (
          <Card>
            <div className="text-center py-8 text-gray-500">
              No se encontraron datos de validación con los filtros seleccionados
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default ValidationPage;