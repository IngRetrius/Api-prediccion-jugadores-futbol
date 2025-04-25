"""
Pruebas para el modelo ensemble del sistema de predicción.
"""
import pytest
import numpy as np
from unittest.mock import AsyncMock, patch, MagicMock
mock_historical_data = MagicMock()

class TestEnsembleModel:
    """
    Pruebas para el modelo ensemble que combina diferentes modelos predictivos.
    """
    
    def test_calculate_prediction_ensemble(self, mock_prediction_engine):
        """
        Verificar que el cálculo de la predicción ensemble funciona correctamente.
        """
        # Crear predicciones de muestra para cada modelo
        predictions = {
            "lstm": {
                "disponible": True,
                "raw_prediction": 1.3,
                "prediction": 1,
                "confidence": 0.7
            },
            "sarimax": {
                "disponible": True,
                "raw_prediction": 0.8,
                "prediction": 1,
                "confidence": 0.8
            },
            "poisson": {
                "disponible": True,
                "raw_prediction": 1.2,
                "prediction": 1,
                "confidence": 0.8
            }
        }
        
        # Pesos personalizados
        weights = {
            "lstm": 0.4,
            "sarimax": 0.3,
            "poisson": 0.3
        }
        
        # Calcular ensemble
        result = mock_prediction_engine.calculate_prediction_ensemble(predictions, weights)
        
        # Verificar resultados
        assert result["disponible"] is True
        assert result["prediction"] is not None
        assert result["confidence"] is not None
        assert result["raw_prediction"] is not None
        
        # Calcular manualmente el resultado esperado
        expected_raw = (1.3 * 0.4) + (0.8 * 0.3) + (1.2 * 0.3)
        expected_prediction = int(expected_raw)
        
        # Verificar que el cálculo es correcto
        assert abs(result["raw_prediction"] - expected_raw) < 0.0001
        assert result["prediction"] == expected_prediction
    
    def test_ensemble_with_unavailable_models(self, mock_prediction_engine):
        """
        Verificar que el ensemble maneja correctamente modelos no disponibles.
        """
        # Crear predicciones donde uno de los modelos no está disponible
        predictions = {
            "lstm": {
                "disponible": True,
                "raw_prediction": 1.3,
                "prediction": 1,
                "confidence": 0.7
            },
            "sarimax": {
                "disponible": False,  # No disponible
                "error": "Modelo no disponible",
                "raw_prediction": None,
                "prediction": None,
                "confidence": None
            },
            "poisson": {
                "disponible": True,
                "raw_prediction": 1.2,
                "prediction": 1,
                "confidence": 0.8
            }
        }
        
        # Pesos estándar
        weights = {
            "lstm": 0.4,
            "sarimax": 0.3,
            "poisson": 0.3
        }
        
        # Calcular ensemble
        result = mock_prediction_engine.calculate_prediction_ensemble(predictions, weights)
        
        # Verificar que el ensemble es disponible
        assert result["disponible"] is True
        
        # Los pesos deberían ser ajustados automáticamente para usar solo modelos disponibles
        # Esperaríamos que lstm y poisson se repartan el peso en proporción 4:3
        expected_lstm_weight = 0.4 / (0.4 + 0.3)  # aproximadamente 0.57
        expected_poisson_weight = 0.3 / (0.4 + 0.3)  # aproximadamente 0.43
        expected_raw = (1.3 * expected_lstm_weight) + (1.2 * expected_poisson_weight)
        expected_prediction = int(expected_raw)
        
        # Verificar que el cálculo es correcto considerando solo modelos disponibles
        assert abs(result["raw_prediction"] - expected_raw) < 0.0001
        assert result["prediction"] == expected_prediction
    
    def test_ensemble_with_no_available_models(self, mock_prediction_engine):
        """
        Verificar que el ensemble maneja correctamente el caso donde ningún modelo está disponible.
        """
        # Crear predicciones donde ningún modelo está disponible
        predictions = {
            "lstm": {
                "disponible": False,
                "error": "Error en LSTM",
                "raw_prediction": None,
                "prediction": None,
                "confidence": None
            },
            "sarimax": {
                "disponible": False,
                "error": "Error en SARIMAX",
                "raw_prediction": None,
                "prediction": None,
                "confidence": None
            },
            "poisson": {
                "disponible": False,
                "error": "Error en Poisson",
                "raw_prediction": None,
                "prediction": None,
                "confidence": None
            }
        }
        
        # Calcular ensemble
        result = mock_prediction_engine.calculate_prediction_ensemble(predictions)
        
        # Verificar que el ensemble no está disponible
        assert result["disponible"] is False
        assert result["prediction"] is None
        assert result["confidence"] is None
        assert result["raw_prediction"] is None
        assert "error" in result
    
    def test_ensemble_with_custom_weights(self, mock_prediction_engine):
        """
        Verificar que el ensemble respeta los pesos personalizados.
        """
        # Crear predicciones de muestra para cada modelo
        predictions = {
            "lstm": {
                "disponible": True,
                "raw_prediction": 1.0,
                "prediction": 1,
                "confidence": 0.7
            },
            "sarimax": {
                "disponible": True,
                "raw_prediction": 2.0,
                "prediction": 2,
                "confidence": 0.8
            },
            "poisson": {
                "disponible": True,
                "raw_prediction": 0.0,
                "prediction": 0,
                "confidence": 0.8
            }
        }
        
        # Pesos personalizados que favorecen sarimax
        custom_weights = {
            "lstm": 0.1,
            "sarimax": 0.8,
            "poisson": 0.1
        }
        
        # Calcular ensemble con pesos personalizados
        result = mock_prediction_engine.calculate_prediction_ensemble(predictions, custom_weights)
        
        # Calcular manualmente el resultado esperado
        expected_raw = (1.0 * 0.1) + (2.0 * 0.8) + (0.0 * 0.1)  # 1.7
        expected_prediction = int(expected_raw)  # 1
        
        # Verificar que el cálculo es correcto
        assert abs(result["raw_prediction"] - expected_raw) < 0.0001
        assert result["prediction"] == expected_prediction
        
        # Verificar la confianza (el cálculo exacto depende de la implementación)
        assert 0 <= result["confidence"] <= 1
    
    @pytest.mark.asyncio
    async def test_ensemble_predictions_integration(self, monkeypatch, mock_prediction_engine):
        """
        Prueba de integración para ensemble_predictions.
        """
        # Configurar el mock para predict_with_model
        async def mock_predict_with_model(player_name, model_type, match_data):
            if model_type == "lstm":
                return {
                    "disponible": True,
                    "raw_prediction": 1.3,
                    "prediction": 1,
                    "confidence": 0.7
                }
            elif model_type == "sarimax":
                return {
                    "disponible": True,
                    "raw_prediction": 0.8,
                    "prediction": 1,
                    "confidence": 0.8
                }
            elif model_type == "poisson":
                return {
                    "disponible": True,
                    "raw_prediction": 1.2,
                    "prediction": 1,
                    "confidence": 0.8,
                    "probability_distribution": {"0": 0.2, "1": 0.6, "2": 0.15, "3": 0.05}
                }
            return {"disponible": False, "error": "Modelo no reconocido"}
        
        # Reemplazar el método en el mock_prediction_engine
        monkeypatch.setattr(mock_prediction_engine, "predict_with_model", mock_predict_with_model)
        
        # Llamar a ensemble_predictions
        player_name = "Hugo_Rodallega"
        match_data = {
            "Oponente_Estandarizado": "Atlético Nacional",
            "Sede_Local": 1,
            "Sede_Visitante": 0,
            "Fecha": "2023-07-15"
        }
        
        result = await mock_prediction_engine.ensemble_predictions(player_name, match_data)
        
        # Verificar la estructura del resultado
        assert "ensemble_prediction" in result
        assert "confidence" in result
        assert "raw_prediction" in result
        assert "disponible" in result
        assert "model_predictions" in result
        assert "metadata" in result
        
        # Verificar que contiene predicciones para cada modelo
        assert "lstm" in result["model_predictions"]
        assert "sarimax" in result["model_predictions"]
        assert "poisson" in result["model_predictions"]
        
        # Verificar que incluye la distribución de probabilidad del modelo Poisson
        if "poisson" in result["model_predictions"] and result["model_predictions"]["poisson"]["disponible"]:
            assert "probability_distribution" in result["model_predictions"]["poisson"]
    
    @pytest.mark.asyncio
    async def test_ensemble_with_different_predictions(self, monkeypatch, mock_prediction_engine):
        """
        Verificar que el ensemble maneja correctamente cuando los modelos dan predicciones diferentes.
        """
        # Configurar predicciones variadas
        async def mock_predict_with_model(player_name, model_type, match_data):
            if model_type == "lstm":
                return {
                    "disponible": True,
                    "raw_prediction": 2.7,  # Predice casi 3 goles
                    "prediction": 3,
                    "confidence": 0.7
                }
            elif model_type == "sarimax":
                return {
                    "disponible": True,
                    "raw_prediction": 0.3,  # Predice casi 0 goles
                    "prediction": 0,
                    "confidence": 0.7
                }
            elif model_type == "poisson":
                return {
                    "disponible": True,
                    "raw_prediction": 1.2,  # Predice 1 gol
                    "prediction": 1,
                    "confidence": 0.8,
                    "probability_distribution": {"0": 0.2, "1": 0.6, "2": 0.15, "3": 0.05}
                }
            return {"disponible": False, "error": "Modelo no reconocido"}
        
        # Reemplazar el método en el mock_prediction_engine
        monkeypatch.setattr(mock_prediction_engine, "predict_with_model", mock_predict_with_model)
        
        # Llamar a ensemble_predictions con diferentes pesos
        player_name = "Hugo_Rodallega"
        match_data = {
            "Oponente_Estandarizado": "Atlético Nacional",
            "Sede_Local": 1,
            "Sede_Visitante": 0
        }
        
        # Caso 1: Pesos iguales
        equal_weights = {"lstm": 1/3, "sarimax": 1/3, "poisson": 1/3}
        result1 = await mock_prediction_engine.ensemble_predictions(player_name, match_data, equal_weights)
        
        # Caso 2: Favorecer LSTM
        lstm_weights = {"lstm": 0.8, "sarimax": 0.1, "poisson": 0.1}
        result2 = await mock_prediction_engine.ensemble_predictions(player_name, match_data, lstm_weights)
        
        # Caso 3: Favorecer SARIMAX
        sarimax_weights = {"lstm": 0.1, "sarimax": 0.8, "poisson": 0.1}
        result3 = await mock_prediction_engine.ensemble_predictions(player_name, match_data, sarimax_weights)
        
        # Verificar que las predicciones son diferentes según los pesos
        raw1 = result1["raw_prediction"]
        raw2 = result2["raw_prediction"]
        raw3 = result3["raw_prediction"]
        
        # Las predicciones crudas deben reflejar los diferentes pesos
        assert raw2 > raw1 > raw3  # lstm > equilibrado > sarimax
        
        # Las predicciones enteras pueden coincidir, pero deberían seguir la tendencia
        # Caso LSTM-favorecido debería estar más cerca de 3
        assert abs(raw2 - 2.7) < abs(raw1 - 2.7)
        # Caso SARIMAX-favorecido debería estar más cerca de 0.3
        assert abs(raw3 - 0.3) < abs(raw1 - 0.3)