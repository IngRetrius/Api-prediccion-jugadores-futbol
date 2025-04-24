"""
Esquemas de validación para la API.
"""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Union, Any, ClassVar, Type
from datetime import datetime, date

class PlayerPredictionRequest(BaseModel):
    """Esquema para solicitar predicción de un jugador."""
    player_name: str = Field(..., description="Nombre del jugador")
    opponent: str = Field(..., description="Nombre del equipo oponente")
    is_home: bool = Field(..., description="True si el jugador juega de local")
    date: Optional[date] = Field(None, description="Fecha del partido (opcional)")
    
    # Características opcionales
    shots_on_target: Optional[int] = Field(None, description="Tiros a puerta esperados")
    total_shots: Optional[int] = Field(None, description="Tiros totales esperados")
    minutes: Optional[int] = Field(None, description="Minutos esperados de juego")
    
    # Configuración estática del modelo en lugar de decoradores
    @classmethod
    def validate_player_name(cls, v):
        """Validar nombre del jugador."""
        if not v or len(v) < 2:
            raise ValueError("El nombre del jugador es demasiado corto")
        # Normalizar reemplazando espacios con guiones bajos
        return v.replace(' ', '_')
    
    @classmethod
    def validate_opponent(cls, v):
        """Validar nombre del oponente."""
        if not v or len(v) < 2:
            raise ValueError("El nombre del oponente es demasiado corto")
        return v
    
    # Configurar validadores manualmente
    class Config:
        @staticmethod
        def schema_extra(schema, model):
            for field_name, field in model.__fields__.items():
                if field_name == 'player_name':
                    field.pre_validators = [PlayerPredictionRequest.validate_player_name]
                elif field_name == 'opponent':
                    field.pre_validators = [PlayerPredictionRequest.validate_opponent]

class MatchPredictionRequest(BaseModel):
    """Esquema para solicitar predicción de un partido completo."""
    home_team: str = Field(..., description="Equipo local")
    away_team: str = Field(..., description="Equipo visitante")
    date: Optional[date] = Field(None, description="Fecha del partido (opcional)")
    
    # Características opcionales del partido
    league: Optional[str] = Field(None, description="Liga del partido")
    
    # Método de validación estática
    @classmethod
    def validate_team_names(cls, v):
        """Validar nombres de equipos."""
        if not v or len(v) < 2:
            raise ValueError("El nombre del equipo es demasiado corto")
        return v
    
    # Aplicar validadores
    class Config:
        @staticmethod
        def schema_extra(schema, model):
            for field_name, field in model.__fields__.items():
                if field_name in ['home_team', 'away_team']:
                    field.pre_validators = [MatchPredictionRequest.validate_team_names]

class ModelSelectionRequest(BaseModel):
    """Esquema para seleccionar modelos específicos."""
    models: List[str] = Field(
        default=["lstm", "sarimax", "poisson", "ensemble"],
        description="Lista de modelos a utilizar"
    )
    
    weights: Optional[Dict[str, float]] = Field(
        None,
        description="Pesos personalizados para combinación de modelos"
    )
    
    # Métodos de validación
    @classmethod
    def validate_models(cls, v):
        """Validar lista de modelos."""
        valid_models = ["lstm", "sarimax", "poisson", "ensemble"]
        for model in v:
            if model not in valid_models:
                raise ValueError(f"Modelo no válido: {model}. Valores permitidos: {valid_models}")
        return v
    
    @classmethod
    def validate_weights(cls, v, values=None):
        """Validar pesos de modelos."""
        if v is None:
            return v
            
        valid_models = ["lstm", "sarimax", "poisson"]
        for model in v:
            if model not in valid_models:
                raise ValueError(f"Modelo no válido en pesos: {model}")
        
        # Verificar que la suma sea 1.0
        total = sum(v.values())
        if abs(total - 1.0) > 0.01:
            raise ValueError(f"La suma de pesos debe ser 1.0, es {total}")
            
        return v
    
    # Configurar validadores
    class Config:
        @staticmethod
        def schema_extra(schema, model):
            for field_name, field in model.__fields__.items():
                if field_name == 'models':
                    field.pre_validators = [ModelSelectionRequest.validate_models]
                elif field_name == 'weights':
                    field.pre_validators = [ModelSelectionRequest.validate_weights]

class PredictionResponse(BaseModel):
    """Esquema para respuesta de predicción."""
    player_name: str
    prediction: Optional[int] = None
    confidence: Optional[float] = None
    raw_prediction: Optional[float] = None
    model_predictions: Optional[Dict[str, Any]] = None
    probability_distribution: Optional[Dict[str, float]] = None
    metadata: Dict[str, Any]
    timestamp: datetime