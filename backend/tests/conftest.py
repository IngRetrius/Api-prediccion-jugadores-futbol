"""
Configuración y fixtures compartidos para pruebas del sistema de predicción de goles.
"""
import os
import sys
import pytest
import pandas as pd
from datetime import datetime, date
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch, MagicMock

# Agregar directorio raíz al path para poder importar módulos del backend
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app.main import app
from backend.app.models.model_handler import PredictionEngine, estandarizar_nombre_equipo


@pytest.fixture
def test_client():
    """
    Fixture que proporciona un cliente de prueba para la API FastAPI.
    """
    with TestClient(app) as client:
        yield client


@pytest.fixture
def sample_players():
    """
    Fixture que proporciona una lista de jugadores de muestra.
    """
    return [
        "Carlos_Bacca",
        "Dayro_Moreno",
        "Hugo_Rodallega",
        "Leonardo_Castro",
        "Marco_Perez"
    ]


@pytest.fixture
def sample_teams():
    """
    Fixture que proporciona una lista de equipos de muestra.
    """
    return [
        "Junior",
        "Once Caldas",
        "Independiente Santa Fe", 
        "Millonarios",
        "América de Cali",
        "Atlético Nacional"
    ]


@pytest.fixture
def mock_historical_data():
    """
    Fixture que proporciona datos históricos ficticios para pruebas.
    """
    # Crear DataFrame de prueba
    data = {
        'Jugador': ['Hugo_Rodallega', 'Hugo_Rodallega', 'Carlos_Bacca', 'Carlos_Bacca', 'Dayro_Moreno'],
        'Equipo': ['Santa Fe', 'Santa Fe', 'Junior', 'Junior', 'Once Caldas'],
        'Equipo_Estandarizado': ['Independiente Santa Fe', 'Independiente Santa Fe', 'Junior', 'Junior', 'Once Caldas'],
        'Oponente': ['Nacional', 'Millonarios', 'América', 'Once Caldas', 'Junior'],
        'Oponente_Estandarizado': ['Atlético Nacional', 'Millonarios', 'América de Cali', 'Once Caldas', 'Junior'],
        'Fecha': [
            pd.Timestamp('2023-05-01'), 
            pd.Timestamp('2023-05-15'), 
            pd.Timestamp('2023-05-20'),
            pd.Timestamp('2023-06-01'), 
            pd.Timestamp('2023-06-10')
        ],
        'Goles': [1, 2, 0, 1, 2],
        'Sede_Local': [1, 0, 1, 0, 1],
        'Sede_Visitante': [0, 1, 0, 1, 0],
        'Minutos': [90, 85, 90, 75, 90],
        'Tiros a puerta': [3, 4, 1, 2, 5],
        'Tiros totales': [6, 7, 3, 5, 8],
        'Día_de_la_semana': ['Lunes', 'Lunes', 'Sábado', 'Jueves', 'Sábado'],
        'Es_FinDeSemana': [0, 0, 1, 0, 1]
    }
    
    return pd.DataFrame(data)


@pytest.fixture
def mock_prediction_engine(monkeypatch, mock_historical_data):
    """
    Fixture que proporciona un motor de predicción con datos históricos ficticios.
    """
    # Crear una clase MockPredictionEngine que hereda de PredictionEngine
    class MockPredictionEngine(PredictionEngine):
        async def load_data(self):
            """Sobrescribir para devolver datos de prueba"""
            self.historical_data = mock_historical_data
            return self.historical_data
        
        async def predict_with_model(self, player_name, model_type, match_data):
            """Mock para predict_with_model"""
            return {
                "prediction": 1,
                "confidence": 0.75,
                "raw_prediction": 1.2,
                "disponible": True,
                "metadata": {"model_type": model_type}
            }
    
    # Instanciar el motor mock
    engine = MockPredictionEngine()
    
    yield engine


@pytest.fixture
def player_prediction_request():
    """
    Fixture que proporciona una solicitud de predicción para un jugador.
    """
    return {
        "player_name": "Hugo_Rodallega",
        "opponent": "Atlético Nacional",
        "is_home": True,
        "date": date.today().isoformat(),
        "shots_on_target": 3,
        "total_shots": 6,
        "minutes": 90
    }


@pytest.fixture
def match_prediction_request():
    """
    Fixture que proporciona una solicitud de predicción para un partido.
    """
    return {
        "home_team": "Independiente Santa Fe",
        "away_team": "Atlético Nacional",
        "date": date.today().isoformat()
    }


@pytest.fixture
def mock_predict():
    """
    Fixture que proporciona un mock para el método predict_with_model.
    """
    return AsyncMock()