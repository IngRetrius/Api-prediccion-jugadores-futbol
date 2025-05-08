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

  // Interfaz para las predicciones
  export interface PredictionValidation {
    Fecha_Numero: number;
    Jugador: string;
    Oponente: string;
    Prediccion_Decimal: number;
    Prediccion_Entero: number;
    Historico_Tiros_Totales: number;
    Historico_Tiros_Puerta: number;
    Promedio_Goles_vs_Oponente: number;
    Confianza_Modelo: number;
    ModelType: string; // Qué modelo hizo esta predicción (lstm, sarimax, poisson)
  }

  // Interfaz para los resultados reales
  export interface ActualResult {
    Jugador: string;
    Equipo: string;
    Fecha_Numero: number;
    Fecha: string;
    Oponente: string;
    Goles: number;
    Tiros_Totales: number;
    Tiros_Puerta: number;
  }

  // Interfaz combinada para comparación
  export interface ValidationComparison {
    prediction: PredictionValidation;
    actual: ActualResult | null; // null si el jugador no jugó
    didPlay: boolean;
    isAccurate: boolean; // true si la predicción coincide con el resultado real
    difference: number; // diferencia entre la predicción y el resultado real
  }

  // Interfaz para la respuesta de la API
  export interface ValidationDataResponse {
    predictions: PredictionValidation[];
    actual_results: ActualResult[];
  }