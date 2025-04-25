// Interfaces para los modelos de datos
export interface Player {
    name: string;
    displayName?: string;
  }
  
  export interface Team {
    name: string;
    displayName?: string;
  }
  
  export interface ModelSelection {
    models: string[];
    weights?: Record<string, number>;
  }
  
  export interface PlayerPredictionRequest {
    player_name: string;
    opponent: string;
    is_home: boolean;
    date?: string;
    shots_on_target?: number;
    total_shots?: number;
    minutes?: number;
    model_selection?: ModelSelection;
  }
  
  export interface MatchPredictionRequest {
    home_team: string;
    away_team: string;
    date?: string;
    league?: string;
  }
  
  export interface ProbabilityDistribution {
    [key: string]: number;
  }
  
  export interface ModelPrediction {
    prediction: number | null;
    confidence: number | null;
    raw: number | null;
    disponible: boolean;
    error?: string;
    probability_distribution?: ProbabilityDistribution;
  }
  
  export interface PredictionResponse {
    player_name: string;
    prediction: number | null;
    confidence: number | null;
    raw_prediction: number | null;
    model_predictions: Record<string, ModelPrediction>;
    probability_distribution: ProbabilityDistribution;
    metadata: {
      opponent: string;
      opponent_std: string;
      is_home: boolean;
      date: string;
      shots_on_target?: number;
      total_shots?: number;
      minutes?: number;
      models_used: string[];
      available_models?: string[];
      weights?: Record<string, number>;
      error?: string;
    };
    timestamp: string;
  }
  
  export interface PlayerHistory {
    fecha: string;
    oponente: string;
    goles: number;
    es_local: boolean;
    minutos?: number;
    tiros_a_puerta?: number;
    tiros_totales?: number;
  }
  
  export interface PlayerHistoryResponse {
    player_name: string;
    history: PlayerHistory[];
    total_matches: number;
  }
  
  export interface ModelMetrics {
    [key: string]: any;
  }
  
  export interface ModelMetricsResponse {
    player_name: string;
    metrics: Record<string, ModelMetrics>;
  }