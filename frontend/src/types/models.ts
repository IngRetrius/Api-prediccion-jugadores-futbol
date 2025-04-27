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
// Añadir a models.ts
  export interface PlayerStats {
    Team: string;
    Name: string;
    Torneo: string;
    Goals: number;
    "Succ. dribbles": number;
    Tackles: number;
    Assists: number;
    "Accurate passes %": number;
    "Big chances missed": number;
    "Total shots": number;
    "Goal conversion %": number;
    Interceptions: number;
    Clearances: number;
    "Errors leading to goal": number;
    "Big chances created": number;
    "Accurate passes": number;
    "Key passes": number;
    Saves: number;
    "Clean sheet": number;
    "Penalties saved": number;
    "Saves from inside box": number;
    "Runs out": number;
    [key: string]: any; // Para acceder dinámicamente a las propiedades
  }

  export interface TeamStatsResponse {
    data: PlayerStats[];
    teams: string[];
    tournaments: string[];
    total_records: number;
  }