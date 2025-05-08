"""
Endpoints de la API de predicción.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from typing import List, Dict, Optional, Any
import pandas as pd
from datetime import datetime
import os
from app.models.model_handler import PredictionEngine, estandarizar_nombre_equipo
from app.api.validation import (
    PlayerPredictionRequest,
    MatchPredictionRequest,
    ModelSelectionRequest,
    PredictionResponse
)
from app.config import AVAILABLE_PLAYERS, HISTORICAL_DATA_FILE, MODEL_WEIGHTS
from loguru import logger
router = APIRouter()
prediction_engine = PredictionEngine()

@router.get("/jugadores", response_model=List[str], tags=["Datos"])
async def get_players():
    """Obtener lista de jugadores disponibles para predicción."""
    return AVAILABLE_PLAYERS

@router.get("/equipos", response_model=List[str], tags=["Datos"])
async def get_teams():
    """Obtener lista de equipos disponibles."""
    try:
        # Cargar datos históricos
        df = await prediction_engine.load_data()
        
        # Obtener equipos únicos del oponente estandarizado
        equipos = df['Oponente_Estandarizado'].unique().tolist()
        equipos.sort()
        
        return equipos
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener equipos: {str(e)}"
        )

@router.post("/predict/player", response_model=PredictionResponse, tags=["Predicciones"])
async def predict_player(
    request: PlayerPredictionRequest,
    model_selection: Optional[ModelSelectionRequest] = None
):
    """
    Predecir goles para un jugador específico.
    
    - **player_name**: Nombre del jugador
    - **opponent**: Equipo oponente
    - **is_home**: Si el jugador juega de local (True) o visitante (False)
    - **model_selection**: Selección opcional de modelos y pesos
    """
    # Verificar si el jugador está disponible
    if request.player_name not in AVAILABLE_PLAYERS:
        raise HTTPException(
            status_code=404,
            detail=f"Jugador no encontrado: {request.player_name}"
        )
    
    # Estandarizar nombre del oponente
    opponent_std = estandarizar_nombre_equipo(request.opponent)
    
    # Preparar datos para la predicción
    match_data = {
        "Oponente_Estandarizado": opponent_std,
        "Sede_Local": 1 if request.is_home else 0,
        "Sede_Visitante": 0 if request.is_home else 1,
        "Fecha": request.date or datetime.now().date()
    }
    
    # Añadir características opcionales si están disponibles
    if request.shots_on_target is not None:
        match_data["Tiros_a_puerta"] = request.shots_on_target
        match_data["Tiros a puerta"] = request.shots_on_target  # Versión con espacios para compatibilidad
    
    if request.total_shots is not None:
        match_data["Tiros_totales"] = request.total_shots
        match_data["Tiros totales"] = request.total_shots  # Versión con espacios para compatibilidad
    
    if request.minutes is not None:
        match_data["Minutos"] = request.minutes
    
    # Configurar características específicas para el día de la semana
    if request.date:
        weekday = request.date.weekday()
        match_data["Es_FinDeSemana"] = 1 if weekday >= 4 else 0
        
        # Traducción de día de la semana
        days_map = {
            0: "Lunes", 1: "Martes", 2: "Miércoles", 3: "Jueves",
            4: "Viernes", 5: "Sábado", 6: "Domingo"
        }
        match_data["Día_de_la_semana"] = days_map[weekday]
        match_data["Día de la semana"] = days_map[weekday]  # Versión con espacios
    
    # Determinar qué modelos usar y con qué pesos
    models_to_use = ["ensemble"]
    weights = None
    
    if model_selection:
        models_to_use = model_selection.models
        weights = model_selection.weights
    
    # Realizar predicción
    try:
        if "ensemble" in models_to_use:
            result = await prediction_engine.ensemble_predictions(
                request.player_name,
                match_data,
                weights
            )
            
            # Verificar si la predicción fue exitosa
            if not result.get("disponible", False) and "error" in result:
                return {
                    "player_name": request.player_name,
                    "prediction": None,
                    "confidence": None,
                    "raw_prediction": None,
                    "model_predictions": result.get("model_predictions", {}),
                    "probability_distribution": {},
                    "metadata": {
                        "opponent": request.opponent,
                        "opponent_std": opponent_std,
                        "is_home": request.is_home,
                        "date": request.date.isoformat() if request.date else datetime.now().date().isoformat(),
                        "shots_on_target": request.shots_on_target,
                        "total_shots": request.total_shots,
                        "minutes": request.minutes,
                        "models_used": models_to_use,
                        "weights": weights or MODEL_WEIGHTS,
                        "error": result.get("error", "Error en la predicción ensemble")
                    },
                    "timestamp": datetime.now()
                }
            
            # Construir respuesta
            response = {
                "player_name": request.player_name,
                "prediction": result["ensemble_prediction"],
                "confidence": result["confidence"],
                "raw_prediction": result["raw_prediction"],
                "model_predictions": result["model_predictions"],
                "probability_distribution": result["model_predictions"]["poisson"].get("probability_distribution", {}),
                "metadata": {
                    "opponent": request.opponent,
                    "opponent_std": opponent_std,
                    "is_home": request.is_home,
                    "date": request.date.isoformat() if request.date else datetime.now().date().isoformat(),
                    "shots_on_target": request.shots_on_target,
                    "total_shots": request.total_shots,
                    "minutes": request.minutes,
                    "models_used": models_to_use,
                    "available_models": [
                        model for model, pred in result["model_predictions"].items() 
                        if pred.get("disponible", False)
                    ],
                    "weights": weights or result["metadata"]["weights"]
                },
                "timestamp": datetime.now()
            }
            
            return response
        else:
            # Usar un modelo específico
            model_type = models_to_use[0]  # Tomar el primer modelo solicitado
            result = await prediction_engine.predict_with_model(
                request.player_name,
                model_type,
                match_data
            )
            
            # Verificar si la predicción fue exitosa
            if not result.get("disponible", False) and "error" in result:
                return {
                    "player_name": request.player_name,
                    "prediction": None,
                    "confidence": None,
                    "raw_prediction": None,
                    "model_predictions": {model_type: result},
                    "probability_distribution": {},
                    "metadata": {
                        "opponent": request.opponent,
                        "opponent_std": opponent_std,
                        "is_home": request.is_home,
                        "date": request.date.isoformat() if request.date else datetime.now().date().isoformat(),
                        "shots_on_target": request.shots_on_target,
                        "total_shots": request.total_shots,
                        "minutes": request.minutes,
                        "models_used": [model_type],
                        "model_metadata": result.get("metadata", {}),
                        "error": result.get("error", f"Error en la predicción con {model_type}")
                    },
                    "timestamp": datetime.now()
                }
            
            # Construir respuesta
            response = {
                "player_name": request.player_name,
                "prediction": result["prediction"],
                "confidence": result["confidence"],
                "raw_prediction": result["raw_prediction"],
                "model_predictions": {model_type: result},
                "probability_distribution": result.get("probability_distribution", {}),
                "metadata": {
                    "opponent": request.opponent,
                    "opponent_std": opponent_std,
                    "is_home": request.is_home,
                    "date": request.date.isoformat() if request.date else datetime.now().date().isoformat(),
                    "shots_on_target": request.shots_on_target,
                    "total_shots": request.total_shots,
                    "minutes": request.minutes,
                    "models_used": [model_type],
                    "model_metadata": result.get("metadata", {})
                },
                "timestamp": datetime.now()
            }
            
            return response
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error en la predicción: {str(e)}"
        )

@router.post("/predict/match", tags=["Predicciones"])
async def predict_match(request: MatchPredictionRequest):
    """
    Predecir goles para un partido completo.
    
    - **home_team**: Equipo local
    - **away_team**: Equipo visitante
    - **date**: Fecha del partido (opcional)
    """
    # Estandarizar nombres de equipos
    home_team_std = estandarizar_nombre_equipo(request.home_team)
    away_team_std = estandarizar_nombre_equipo(request.away_team)
    
    # Cargar datos históricos para identificar jugadores de cada equipo
    try:
        df = await prediction_engine.load_data()
        
        # Filtrar jugadores del equipo local
        local_players = df[df['Equipo_Estandarizado'] == home_team_std]['Jugador'].unique().tolist()
        local_players = [p for p in local_players if p in AVAILABLE_PLAYERS]
        
        # Si no hay jugadores disponibles para este equipo
        if not local_players:
            return {
                "message": f"No hay jugadores disponibles para el equipo {request.home_team}",
                "home_team": request.home_team,
                "away_team": request.away_team,
                "date": request.date.isoformat() if request.date else datetime.now().date().isoformat()
            }
        
        # Preparar datos básicos para predicciones
        date = request.date or datetime.now().date()
        
        # Realizar predicciones para el equipo local (simplificado)
        team_predictions = []
        
        for player in local_players[:3]:  # Limitar a los primeros 3 jugadores para el ejemplo
            match_data = {
                "Oponente_Estandarizado": away_team_std,
                "Sede_Local": 1,
                "Sede_Visitante": 0,
                "Fecha": date
            }
            
            # Predicción ensemble
            try:
                prediction = await prediction_engine.ensemble_predictions(player, match_data)
                if prediction.get("disponible", False) or prediction.get("ensemble_prediction") is not None:
                    team_predictions.append({
                        "player": player,
                        "prediction": prediction.get("ensemble_prediction", 0),
                        "confidence": prediction.get("confidence", 0),
                        "available_models": [
                            model for model, pred in prediction.get("model_predictions", {}).items() 
                            if pred.get("disponible", False)
                        ]
                    })
            except Exception as e:
                # Si falla, simplemente continuar con el siguiente jugador
                continue
        
        return {
            "home_team": request.home_team,
            "home_team_std": home_team_std,
            "away_team": request.away_team,
            "away_team_std": away_team_std,
            "date": date.isoformat() if hasattr(date, 'isoformat') else str(date),
            "predictions": team_predictions,
            "total_expected_goals": sum(p["prediction"] for p in team_predictions if p["prediction"] is not None)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error en la predicción de partido: {str(e)}"
        )

@router.get("/player/{player_name}/history", tags=["Datos"])
async def get_player_history(
    player_name: str = Path(..., description="Nombre del jugador"),
    limit: int = Query(10, description="Número de partidos a retornar")
):
    """
    Obtener historial reciente de un jugador.
    
    - **player_name**: Nombre del jugador
    - **limit**: Número de partidos a retornar (default: 10)
    """
    # Verificar si el jugador está disponible
    if player_name not in AVAILABLE_PLAYERS:
        raise HTTPException(
            status_code=404,
            detail=f"Jugador no encontrado: {player_name}"
        )
    
    try:
        # Obtener datos históricos del jugador
        player_data = await prediction_engine.get_player_historical_data(player_name)
        
        # Ordenar por fecha descendente y limitar registros
        player_data = player_data.sort_values('Fecha', ascending=False).head(limit)
        
        # Convertir a formato JSON compatible
        history = []
        for _, row in player_data.iterrows():
            match_info = {
                "fecha": row['Fecha'].strftime('%Y-%m-%d') if pd.notna(row['Fecha']) else None,
                "oponente": row['Oponente_Estandarizado'],
                "goles": int(row['Goles']) if pd.notna(row['Goles']) else 0,
                "es_local": bool(row['Sede_Local']) if 'Sede_Local' in row and pd.notna(row['Sede_Local']) else None,
                "minutos": int(row['Minutos']) if 'Minutos' in row and pd.notna(row['Minutos']) else None,
                "tiros_a_puerta": int(row['Tiros a puerta']) if 'Tiros a puerta' in row and pd.notna(row['Tiros a puerta']) else None,
                "tiros_totales": int(row['Tiros totales']) if 'Tiros totales' in row and pd.notna(row['Tiros totales']) else None
            }
            history.append(match_info)
        
        return {
            "player_name": player_name,
            "history": history,
            "total_matches": len(player_data)
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener historial del jugador: {str(e)}"
        )

@router.get("/metrics/{player_name}", tags=["Análisis"])
async def get_model_metrics(player_name: str = Path(..., description="Nombre del jugador")):
    """
    Obtener métricas de rendimiento de los modelos para un jugador.
    
    - **player_name**: Nombre del jugador
    """
    # Verificar si el jugador está disponible
    if player_name not in AVAILABLE_PLAYERS:
        raise HTTPException(
            status_code=404,
            detail=f"Jugador no encontrado: {player_name}"
        )
    
    # Esta función obtendría las métricas almacenadas con los modelos
    try:
        metrics = {}
        
        # Cargar métricas de cada modelo
        for model_type in ["lstm", "sarimax", "poisson"]:
            model_data = await prediction_engine.model_loader.load_model(model_type, player_name)
            if not model_data.get("disponible", False):
                metrics[model_type] = {"error": model_data.get("error", f"Modelo {model_type} no disponible")}
                continue
                
            if "metricas" in model_data:
                metrics[model_type] = model_data["metricas"]
            elif "metrics" in model_data:
                metrics[model_type] = model_data["metrics"]
            else:
                metrics[model_type] = {"mensaje": "No hay métricas disponibles para este modelo"}
        
        return {
            "player_name": player_name,
            "metrics": metrics
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener métricas: {str(e)}"
        )
    
@router.get("/team-stats", tags=["Datos"])
async def get_team_stats(
    team: Optional[str] = Query(None, description="Filtrar por equipo"),
    tournament: Optional[str] = Query(None, description="Filtrar por torneo")
):
    """Obtener estadísticas de jugadores por equipo y torneo."""
    try:
        # Importar el directorio de datos
        from app.config import DATA_DIR
        import numpy as np
        import os
        
        # Ruta al CSV
        csv_path = os.path.join(DATA_DIR, "jugadores_unificados_cinco_torneos.csv")
        
        # Verificar si el archivo existe
        if not os.path.exists(csv_path):
            raise HTTPException(
                status_code=404,
                detail=f"Archivo de datos no encontrado"
            )
        
        # Cargar datos
        df = pd.read_csv(csv_path)
        
        # Aplicar filtros si están presentes
        if team:
            df = df[df['Team'] == team]
        
        if tournament:
            df = df[df['Torneo'] == tournament]
        
        # Obtener listas únicas para filtros
        unique_teams = df['Team'].unique().tolist()
        unique_tournaments = df['Torneo'].unique().tolist()
        
        # Limpiar valores problemáticos (NaN, Infinity) antes de convertir a JSON
        # Reemplazar NaN e infinitos con None (que se convertirá en null en JSON)
        df = df.replace([np.nan, np.inf, -np.inf], None)
        
        # Convertir DataFrame a lista de diccionarios para JSON
        # Usar orient='records' y asegurar valores Python nativos
        data = df.to_dict(orient='records')
        
        return {
            "data": data,
            "teams": unique_teams,
            "tournaments": unique_tournaments,
            "total_records": len(data)
        }
        
    except Exception as e:
        logger.error(f"Error en team-stats: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al procesar datos de equipos: {str(e)}"
        )
    
@router.get("/status", tags=["Sistema"])
async def get_system_status():
    """
    Verificar el estado del sistema y disponibilidad de modelos.
    """
    try:
        # Cargar datos históricos
        df = await prediction_engine.load_data()
        players_count = len(AVAILABLE_PLAYERS)
        
        # Ejemplo de disponibilidad de modelos (primer jugador)
        model_availability = {"sarimax": 0, "poisson": 0, "lstm": 0}
        
        if players_count > 0:
            test_players = AVAILABLE_PLAYERS[:min(3, players_count)]
            available_models_by_player = {}
            
            for test_player in test_players:
                available_models = []
                
                for model_type in ["lstm", "sarimax", "poisson"]:
                    try:
                        model_data = await prediction_engine.model_loader.load_model(model_type, test_player)
                        if model_data.get("disponible", False):
                            available_models.append(model_type)
                            model_availability[model_type] += 1
                    except:
                        pass
                
                available_models_by_player[test_player] = available_models
            
            return {
                "status": "online",
                "data_loaded": True,
                "players_available": players_count,
                "historical_data_rows": len(df),
                "models_availability": {
                    "sarimax": f"{model_availability['sarimax']}/{len(test_players)} jugadores",
                    "poisson": f"{model_availability['poisson']}/{len(test_players)} jugadores",
                    "lstm": f"{model_availability['lstm']}/{len(test_players)} jugadores"
                },
                "tested_players": available_models_by_player,
                "timestamp": datetime.now().isoformat()
            }
        else:
            return {
                "status": "warning",
                "message": "No hay jugadores disponibles",
                "data_loaded": True,
                "historical_data_rows": len(df),
                "timestamp": datetime.now().isoformat()
            }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "data_loaded": False,
            "timestamp": datetime.now().isoformat()
        }
    
# -------------------ENDPOINT PARA SERVIR DATOS DE VALIDACIÓN DE PREDICCIONES---------------------------

@router.get("/validation-data", tags=["Análisis"])
async def get_validation_data():
    """
    Obtener datos de validación de predicciones vs. resultados reales.
    """
    try:
        # Importar directorios
        from app.config import DATA_DIR
        import pandas as pd
        import numpy as np
        import os
        
        # Definir rutas a los archivos CSV
        model_files = {
            "lstm": os.path.join(DATA_DIR, "predicciones_torneo2025_lstm.csv"),
            "sarimax": os.path.join(DATA_DIR, "predicciones_torneo2025_sarimax.csv"),
            "poisson": os.path.join(DATA_DIR, "predicciones_torneo2025_poisson.csv")
        }
        
        actual_results_file = os.path.join(DATA_DIR, "stats_jugadores2025.csv")
        
        # Comprobar si los archivos existen
        for model, filepath in model_files.items():
            if not os.path.exists(filepath):
                logger.warning(f"Archivo de predicciones {model} no encontrado: {filepath}")
                # Usar datos de ejemplo para el modelo si no está disponible
                model_files[model] = os.path.join(DATA_DIR, "predicciones_torneo2025_sarimax.csv")
        
        if not os.path.exists(actual_results_file):
            logger.warning(f"Archivo de resultados reales no encontrado: {actual_results_file}")
            return {
                "predictions": [],
                "actual_results": []
            }
        
        # Cargar datos de predicción de cada modelo
        predictions = []
        for model, filepath in model_files.items():
            try:
                df = pd.read_csv(filepath)
                df["ModelType"] = model  # Añadir columna para identificar el modelo
                predictions.append(df)
            except Exception as e:
                logger.error(f"Error al cargar predicciones {model}: {str(e)}")
        
        # Combinar predicciones de todos los modelos
        if predictions:
            predictions_df = pd.concat(predictions, ignore_index=True)
        else:
            return {
                "predictions": [],
                "actual_results": []
            }
        
        # Cargar resultados reales
        try:
            actual_results_df = pd.read_csv(actual_results_file, sep=";")  # Notar el separador
            
            # Limpiar y procesar resultados reales
            # Dividir la columna única en múltiples columnas si es necesario
            if len(actual_results_df.columns) == 1:
                columns = ["Jugador", "Equipo", "Fecha_Numero", "Fecha", "Oponente", "Goles", "Tiros_Totales", "Tiros_Puerta"]
                actual_results_df = actual_results_df[actual_results_df.columns[0]].str.split(";", expand=True)
                actual_results_df.columns = columns
            
            # Convertir columnas numéricas
            numeric_columns = ["Fecha_Numero", "Goles", "Tiros_Totales", "Tiros_Puerta"]
            for col in numeric_columns:
                if col in actual_results_df.columns:
                    actual_results_df[col] = pd.to_numeric(actual_results_df[col], errors="coerce")
            
        except Exception as e:
            logger.error(f"Error al cargar resultados reales: {str(e)}")
            actual_results_df = pd.DataFrame(columns=["Jugador", "Equipo", "Fecha_Numero", "Fecha", "Oponente", "Goles", "Tiros_Totales", "Tiros_Puerta"])
        
        # Limpiar valores problemáticos (NaN, Infinity) antes de convertir a JSON
        predictions_df = predictions_df.replace([np.nan, np.inf, -np.inf], None)
        actual_results_df = actual_results_df.replace([np.nan, np.inf, -np.inf], None)
        
        # Convertir dataframes a diccionarios para respuesta JSON
        predictions_list = predictions_df.to_dict(orient="records")
        actual_results_list = actual_results_df.to_dict(orient="records")
        
        return {
            "predictions": predictions_list,
            "actual_results": actual_results_list
        }
        
    except Exception as e:
        logger.error(f"Error en validation-data: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al procesar datos de validación: {str(e)}"
        )
