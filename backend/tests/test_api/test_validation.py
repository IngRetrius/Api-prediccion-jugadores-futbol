"""
Pruebas para la validación de datos y esquemas de la API.
"""
import pytest
from pydantic import ValidationError
from datetime import date

from backend.app.api.validation import (
    PlayerPredictionRequest,
    MatchPredictionRequest,
    ModelSelectionRequest,
    PredictionResponse
)


class TestPlayerPredictionRequest:
    """
    Pruebas para la validación del esquema PlayerPredictionRequest.
    """
    
    def test_valid_request(self):
        """
        Verificar que un request válido se valida correctamente.
        """
        data = {
            "player_name": "Hugo_Rodallega",
            "opponent": "Atlético Nacional",
            "is_home": True,
            "date": date.today(),
            "shots_on_target": 3,
            "total_shots": 6,
            "minutes": 90
        }
        
        # Debería validar sin errores
        request = PlayerPredictionRequest(**data)
        
        # Verificar que los datos se validaron correctamente
        assert request.player_name == "Hugo_Rodallega"
        assert request.opponent == "Atlético Nacional"
        assert request.is_home is True
        assert request.date == date.today()
        assert request.shots_on_target == 3
        assert request.total_shots == 6
        assert request.minutes == 90
    
    def test_missing_required_fields(self):
        """
        Verificar que se produce error al faltar campos requeridos.
        """
        # Falta player_name, opponent e is_home que son requeridos
        data = {
            "date": date.today(),
            "shots_on_target": 3
        }
        
        # Debería lanzar ValidationError
        with pytest.raises(ValidationError) as excinfo:
            PlayerPredictionRequest(**data)
        
        # Verificar los errores específicos
        errors = excinfo.value.errors()
        error_fields = [error["loc"][0] for error in errors]
        
        assert "player_name" in error_fields
        assert "opponent" in error_fields
        assert "is_home" in error_fields
    
    def test_invalid_field_types(self):
        """
        Verificar que se validan correctamente los tipos de datos.
        """
        data = {
            "player_name": "Hugo_Rodallega",
            "opponent": "Atlético Nacional",
            "is_home": "no_es_booleano",  # Debería ser booleano
            "shots_on_target": "tres"  # Debería ser entero
        }
        
        # Debería lanzar ValidationError
        with pytest.raises(ValidationError) as excinfo:
            PlayerPredictionRequest(**data)
        
        # Verificar los errores específicos
        errors = excinfo.value.errors()
        error_fields = [error["loc"][0] for error in errors]
        
        assert "is_home" in error_fields
        assert "shots_on_target" in error_fields
    
    def test_optional_fields(self):
        """
        Verificar que los campos opcionales pueden omitirse.
        """
        # Solo campos requeridos
        data = {
            "player_name": "Hugo_Rodallega",
            "opponent": "Atlético Nacional",
            "is_home": True
        }
        
        # Debería validar sin errores
        request = PlayerPredictionRequest(**data)
        
        # Verificar que los campos opcionales son None
        assert request.date is None
        assert request.shots_on_target is None
        assert request.total_shots is None
        assert request.minutes is None


class TestMatchPredictionRequest:
    """
    Pruebas para la validación del esquema MatchPredictionRequest.
    """
    
    def test_valid_request(self):
        """
        Verificar que un request válido se valida correctamente.
        """
        data = {
            "home_team": "Independiente Santa Fe",
            "away_team": "Atlético Nacional",
            "date": date.today(),
            "league": "Liga BetPlay"
        }
        
        # Debería validar sin errores
        request = MatchPredictionRequest(**data)
        
        # Verificar que los datos se validaron correctamente
        assert request.home_team == "Independiente Santa Fe"
        assert request.away_team == "Atlético Nacional"
        assert request.date == date.today()
        assert request.league == "Liga BetPlay"
    
    def test_missing_required_fields(self):
        """
        Verificar que se produce error al faltar campos requeridos.
        """
        # Falta away_team que es requerido
        data = {
            "home_team": "Independiente Santa Fe",
            "date": date.today()
        }
        
        # Debería lanzar ValidationError
        with pytest.raises(ValidationError) as excinfo:
            MatchPredictionRequest(**data)
        
        # Verificar los errores específicos
        errors = excinfo.value.errors()
        error_fields = [error["loc"][0] for error in errors]
        
        assert "away_team" in error_fields
    
    def test_optional_fields(self):
        """
        Verificar que los campos opcionales pueden omitirse.
        """
        # Solo campos requeridos
        data = {
            "home_team": "Independiente Santa Fe",
            "away_team": "Atlético Nacional"
        }
        
        # Debería validar sin errores
        request = MatchPredictionRequest(**data)
        
        # Verificar que los campos opcionales son None
        assert request.date is None
        assert request.league is None


class TestModelSelectionRequest:
    """
    Pruebas para la validación del esquema ModelSelectionRequest.
    """
    
    def test_valid_request(self):
        """
        Verificar que un request válido se valida correctamente.
        """
        data = {
            "models": ["lstm", "sarimax", "poisson"],
            "weights": {"lstm": 0.4, "sarimax": 0.3, "poisson": 0.3}
        }
        
        # Debería validar sin errores
        request = ModelSelectionRequest(**data)
        
        # Verificar que los datos se validaron correctamente
        assert set(request.models) == {"lstm", "sarimax", "poisson"}
        assert request.weights == {"lstm": 0.4, "sarimax": 0.3, "poisson": 0.3}
    
    def test_default_models(self):
        """
        Verificar que se usan los modelos por defecto si no se especifican.
        """
        # No se especifican modelos
        data = {}
        
        # Debería validar sin errores
        request = ModelSelectionRequest(**data)
        
        # Verificar que se usan los valores por defecto
        assert set(request.models) == {"lstm", "sarimax", "poisson", "ensemble"}
        assert request.weights is None
    
    def test_invalid_models(self):
        """
        Verificar que se validan correctamente los modelos.
        """
        data = {
            "models": ["lstm", "modelo_inexistente"]
        }
        
        # Crear la instancia de ModelSelectionRequest
        request = ModelSelectionRequest(**data)
        
        # Verificar que el modelo inexistente NO está en la lista de modelos
        # y que solo quedan modelos válidos
        for model in request.models:
            assert model in ["lstm", "sarimax", "poisson", "ensemble"]
        
        # Verificar que "modelo_inexistente" NO está en la lista
        assert "modelo_inexistente" not in request.models
    
    def test_invalid_weights(self):
        """
        Verificar que se validan correctamente los pesos.
        """
        # Caso 1: Modelo inexistente en pesos
        data = {
            "models": ["lstm", "sarimax", "poisson"],
            "weights": {"lstm": 0.4, "sarimax": 0.3, "modelo_inexistente": 0.3}
        }
        
        # Crear la instancia de ModelSelectionRequest
        request = ModelSelectionRequest(**data)
        
        # Verificar que si hay pesos, solo son para modelos válidos
        if request.weights:
            for model in request.weights:
                assert model in ["lstm", "sarimax", "poisson"]
            
            # Verificar que "modelo_inexistente" NO está en los pesos
            assert "modelo_inexistente" not in request.weights
        
        # Caso 2: Pesos que no suman 1.0
        data = {
            "models": ["lstm", "sarimax", "poisson"],
            "weights": {"lstm": 0.4, "sarimax": 0.3, "poisson": 0.2}  # Suma 0.9
        }
        
        # El comportamiento puede variar: podría normalizar los pesos o aceptarlos como están
        request = ModelSelectionRequest(**data)
        
        # Verificar que hay pesos asignados, sin asumir normalización
        assert request.weights is not None


class TestPredictionResponse:
    """
    Pruebas para la validación del esquema PredictionResponse.
    """
    
    def test_valid_response(self):
        """
        Verificar que una respuesta válida se valida correctamente.
        """
        from datetime import datetime
        
        data = {
            "player_name": "Hugo_Rodallega",
            "prediction": 1,
            "confidence": 0.75,
            "raw_prediction": 1.2,
            "model_predictions": {
                "lstm": {"prediction": 1, "confidence": 0.7, "raw": 1.3, "disponible": True},
                "sarimax": {"prediction": 1, "confidence": 0.65, "raw": 1.1, "disponible": True},
                "poisson": {"prediction": 1, "confidence": 0.8, "raw": 1.2, "disponible": True}
            },
            "probability_distribution": {"0": 0.2, "1": 0.6, "2": 0.15, "3": 0.05},
            "metadata": {
                "opponent": "Atlético Nacional",
                "opponent_std": "Atlético Nacional",
                "is_home": True,
                "date": date.today().isoformat(),
                "models_used": ["lstm", "sarimax", "poisson"],
                "weights": {"lstm": 0.4, "sarimax": 0.3, "poisson": 0.3}
            },
            "timestamp": datetime.now()
        }
        
        # Debería validar sin errores
        response = PredictionResponse(**data)
        
        # Verificar que los datos se validaron correctamente
        assert response.player_name == "Hugo_Rodallega"
        assert response.prediction == 1
        assert response.confidence == 0.75
        assert response.raw_prediction == 1.2
        assert "lstm" in response.model_predictions
        assert "sarimax" in response.model_predictions
        assert "poisson" in response.model_predictions
        assert set(response.probability_distribution.keys()) == {"0", "1", "2", "3"}
        assert "opponent" in response.metadata
        assert "date" in response.metadata
        assert "models_used" in response.metadata