// Formatear número con 2 decimales
export const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '-';
    return num.toFixed(2);
  };
  
  // Formatear porcentaje
  export const formatPercent = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '-';
    return `${(value * 100).toFixed(1)}%`;
  };
  
  // Formatear nombre de jugador para mostrar (reemplazar guiones bajos por espacios)
  export const formatPlayerName = (name: string): string => {
    return name.replace(/_/g, ' ');
  };
  
  // Formatear nombre de jugador para API (reemplazar espacios por guiones bajos)
  export const formatPlayerNameForApi = (name: string): string => {
    return name.replace(/\s+/g, '_');
  };
  
  // Formatear predicción como texto
  export const formatPrediction = (prediction: number | null): string => {
    if (prediction === null || prediction === undefined) return 'No disponible';
    return `${prediction} ${prediction === 1 ? 'gol' : 'goles'}`;
  };
  
  // Obtener color basado en confianza
  export const getConfidenceColor = (confidence: number | null): string => {
    if (confidence === null || confidence === undefined) return 'text-gray-500';
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-green-500';
    if (confidence >= 0.4) return 'text-yellow-500';
    return 'text-red-500';
  };