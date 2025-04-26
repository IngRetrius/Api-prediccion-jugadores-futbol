import { useState, useEffect, useCallback } from 'react';
import { getAvailablePlayers, getPlayerHistory, getPlayerModelMetrics } from '../api/playersApi';
import { Player, PlayerHistoryResponse, ModelMetricsResponse } from '../types/models';
import { ApiError } from '../types/api';

interface UsePlayersReturn {
  players: Player[];
  isLoadingPlayers: boolean;
  playersError: string | null;
  refreshPlayers: () => Promise<void>;
}

/**
 * Hook para obtener lista de jugadores
 */
export const usePlayers = (): UsePlayersReturn => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchPlayers = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getAvailablePlayers();
      setPlayers(result);
      setError(null);
    } catch (err) {
      console.error('Error obteniendo jugadores:', err);
      const errorMessage = (err as ApiError)?.detail || 'Error al cargar la lista de jugadores';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Cargar jugadores al montar el componente
  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);
  
  return {
    players,
    isLoadingPlayers: isLoading,
    playersError: error,
    refreshPlayers: fetchPlayers
  };
};

interface UsePlayerHistoryReturn {
  history: PlayerHistoryResponse | null;
  isLoadingHistory: boolean;
  historyError: string | null;
  fetchHistory: (playerName: string, limit?: number) => Promise<void>;
}

/**
 * Hook para obtener historial de un jugador
 */
export const usePlayerHistory = (): UsePlayerHistoryReturn => {
  const [history, setHistory] = useState<PlayerHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRequest, setCurrentRequest] = useState<AbortController | null>(null);
  
  const fetchHistory = useCallback(async (playerName: string, limit: number = 10) => {
    // Cancelar solicitud anterior si existe
    if (currentRequest) {
      currentRequest.abort();
    }
    
    // Crear controlador para esta nueva solicitud
    const abortController = new AbortController();
    setCurrentRequest(abortController);
    
    try {
      setIsLoading(true);
      const result = await getPlayerHistory(playerName, limit, abortController.signal);
      setHistory(result);
      setError(null);
    } catch (err) {
      // Solo establecer error si no fue una cancelación
      if ((err as any)?.name !== 'AbortError') {
        console.error('Error obteniendo historial:', err);
        const errorMessage = (err as ApiError)?.detail || 'Error al cargar el historial del jugador';
        setError(errorMessage);
        setHistory(null);
      }
    } finally {
      setIsLoading(false);
      setCurrentRequest(null);
    }
  }, []);
  
  return {
    history,
    isLoadingHistory: isLoading,
    historyError: error,
    fetchHistory
  };
};

interface UsePlayerMetricsReturn {
  metrics: ModelMetricsResponse | null;
  isLoadingMetrics: boolean;
  metricsError: string | null;
  fetchMetrics: (playerName: string) => Promise<void>;
}

/**
 * Hook para obtener métricas de modelos para un jugador
 */
export const usePlayerMetrics = (): UsePlayerMetricsReturn => {
  const [metrics, setMetrics] = useState<ModelMetricsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRequest, setCurrentRequest] = useState<AbortController | null>(null);
  
  const fetchMetrics = useCallback(async (playerName: string) => {
    // Cancelar solicitud anterior si existe
    if (currentRequest) {
      currentRequest.abort();
    }
    
    // Crear controlador para esta nueva solicitud
    const abortController = new AbortController();
    setCurrentRequest(abortController);
    
    try {
      setIsLoading(true);
      const result = await getPlayerModelMetrics(playerName, abortController.signal);
      setMetrics(result);
      setError(null);
    } catch (err) {
      // Solo establecer error si no fue una cancelación
      if ((err as any)?.name !== 'AbortError') {
        console.error('Error obteniendo métricas:', err);
        const errorMessage = (err as ApiError)?.detail || 'Error al cargar las métricas del jugador';
        setError(errorMessage);
        setMetrics(null);
      }
    } finally {
      setIsLoading(false);
      setCurrentRequest(null);
    }
  }, []);
  
  return {
    metrics,
    isLoadingMetrics: isLoading,
    metricsError: error,
    fetchMetrics
  };
};

/**
 * Hook completo para gestionar datos de un jugador específico
 */
interface UsePlayerDataReturn {
  history: PlayerHistoryResponse | null;
  metrics: ModelMetricsResponse | null;
  isLoading: boolean;
  error: string | null;
  loadPlayerData: (playerName: string) => Promise<void>;
}

export const usePlayerData = (initialPlayerName?: string): UsePlayerDataReturn => {
  const { history, isLoadingHistory, historyError, fetchHistory } = usePlayerHistory();
  const { metrics, isLoadingMetrics, metricsError, fetchMetrics } = usePlayerMetrics();
  
  const isLoading = isLoadingHistory || isLoadingMetrics;
  const error = historyError || metricsError;
  
  // Usar useCallback para estabilizar la función y evitar rerenderizaciones
  const loadPlayerData = useCallback(async (playerName: string) => {
    await Promise.all([
      fetchHistory(playerName),
      fetchMetrics(playerName)
    ]);
  }, [fetchHistory, fetchMetrics]);
  
  // Cargar datos iniciales si se proporciona un nombre de jugador
  useEffect(() => {
    if (initialPlayerName) {
      loadPlayerData(initialPlayerName);
    }
  }, [initialPlayerName, loadPlayerData]);
  
  return {
    history,
    metrics,
    isLoading,
    error,
    loadPlayerData
  };
};