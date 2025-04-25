// Tipos para las respuestas de la API
export interface ApiResponse<T> {
    data: T;
    status: number;
    message?: string;
  }
  
  export interface ApiError {
    detail: string;
    status_code: number;
  }
  
  export interface PlayerListResponse {
    players: string[];
  }
  
  export interface TeamListResponse {
    teams: string[];
  }
  
  export interface SystemStatus {
    status: string;
    data_loaded: boolean;
    players_available: number;
    historical_data_rows: number;
    models_availability: Record<string, string>;
    tested_players?: Record<string, string[]>;
    timestamp: string;
    message?: string;
  }