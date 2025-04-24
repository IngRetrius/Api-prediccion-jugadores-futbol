"""
Gestión de modelos predictivos y procesamiento de datos.
"""
import os
import pickle
import numpy as np
import pandas as pd
from loguru import logger
from typing import Dict, List, Tuple, Union, Optional
import time
from datetime import datetime, timedelta
from scipy.stats import poisson
try:
    import tensorflow as tf
    from tensorflow.keras.models import load_model
    HAS_TF = True
except ImportError:
    HAS_TF = False
    def load_model(path):
        raise ImportError("TensorFlow no está disponible") 
from sklearn.preprocessing import RobustScaler

from backend.app.config import (
    LSTM_MODELS_DIR,
    SARIMAX_MODELS_DIR,
    POISSON_MODELS_DIR,
    HISTORICAL_DATA_FILE,
    DEFAULT_WINDOW_SIZE,
    MODEL_WEIGHTS
)


def load_historical_data():
    """Cargar datos históricos desde el archivo CSV."""
    try:
        df = pd.read_csv(HISTORICAL_DATA_FILE)
        # Convertir fechas
        if 'Fecha' in df.columns:
            df['Fecha'] = pd.to_datetime(df['Fecha'], errors='coerce')
        logger.info(f"Datos históricos cargados: {len(df)} registros")
        return df
    except Exception as e:
        logger.error(f"Error al cargar datos históricos: {str(e)}")
        raise


def estandarizar_nombre_equipo(nombre):
    """
    Estandariza nombres de equipos para coincidir con los datos históricos.
    """
    mapeo_equipos = {
        'Atlético Junior': 'Junior',
        'Junior': 'Junior',
        'Nacional': 'Atlético Nacional',
        'Atlético Nacional': 'Atlético Nacional',
        'Deportivo Pereira': 'Pereira',
        'Pereira': 'Pereira',
        'Atlético Bucaramanga': 'Bucaramanga',
        'Bucaramanga': 'Bucaramanga',
        'Santa Fe': 'Independiente Santa Fe',
        'Independiente Santa Fe': 'Independiente Santa Fe',
        'Cali': 'Deportivo Cali',
        'Deportivo Cali': 'Deportivo Cali',
        'América': 'América de Cali',
        'América de Cali': 'América de Cali',
        'Millonarios': 'Millonarios',
        'Once Caldas': 'Once Caldas',
        'Águilas Doradas': 'Rionegro',
        'La Equidad': 'La Equidad',
        'Envigado': 'Envigado',
        'Fortaleza': 'Fortaleza CEIF',
        'Unión Magdalena': 'Unión Magdalena',
        'Pasto': 'Deportivo Pasto',
        'Deportivo Pasto': 'Deportivo Pasto',
        'Tolima': 'Deportes Tolima',
        'Deportes Tolima': 'Deportes Tolima',
        'Alianza': 'Alianza FC',
        'Medellín': 'Independiente Medellín',
        'Chicó': 'Boyacá Chicó',
        'Boyacá Chicó': 'Boyacá Chicó',
        'Llaneros': 'Llaneros'
    }
    return mapeo_equipos.get(nombre, nombre)


class ModelLoader:
    """Clase para cargar y gestionar los modelos predictivos."""
    
    def __init__(self):
        """Inicializar el cargador de modelos."""
        self.lstm_models = {}
        self.sarimax_models = {}
        self.poisson_models = {}
        self.model_cache = {}
        
    async def load_model(self, model_type: str, player_name: str) -> dict:
        """
        Cargar un modelo específico para un jugador.
        
        Args:
            model_type: Tipo de modelo ('lstm', 'sarimax', 'poisson')
            player_name: Nombre del jugador
            
        Returns:
            Diccionario con el modelo y su configuración
        """
        # Verificar si el modelo ya está en caché
        cache_key = f"{model_type}_{player_name}"
        if cache_key in self.model_cache:
            return self.model_cache[cache_key]
        
        # Determinar ruta del modelo
        if model_type == "lstm":
            model_dir = LSTM_MODELS_DIR
            file_name = f"lstm_{player_name}.pkl"
        elif model_type == "sarimax":
            model_dir = SARIMAX_MODELS_DIR
            file_name = f"arima_{player_name}.pkl"
        elif model_type == "poisson":
            model_dir = POISSON_MODELS_DIR
            file_name = f"poisson_{player_name}.pkl"
        else:
            raise ValueError(f"Tipo de modelo no válido: {model_type}")
        
        model_path = os.path.join(model_dir, file_name)
        
        # Verificar existencia del modelo
        if not os.path.exists(model_path):
            logger.warning(f"No se encontró el modelo {file_name} en {model_dir}")
            # Retornar un diccionario indicando que el modelo no está disponible
            return {
                "error": f"Modelo no encontrado: {file_name}",
                "modelo_entrenado": None,
                "modelo_config": {"tipo_modelo": model_type},
                "disponible": False
            }
        
        # Cargar modelo
        try:
            with open(model_path, 'rb') as f:
                model_data = pickle.load(f)
            
            logger.info(f"Modelo {model_type} para {player_name} cargado correctamente")
            
            # Añadir flag de disponibilidad
            model_data["disponible"] = True
            
            # Cargar modelo complementario si es LSTM (modelo H5)
            if model_type == "lstm" and "tipo_modelo" in model_data:
                h5_file = f"{player_name}_{model_data['tipo_modelo']}.h5"
                h5_path = os.path.join(model_dir, h5_file)
                if os.path.exists(h5_path):
                    try:
                        if HAS_TF:
                            model_data["modelo_keras"] = load_model(h5_path)
                            logger.info(f"Modelo Keras para {player_name} cargado correctamente")
                        else:
                            logger.warning("TensorFlow no está disponible, no se puede cargar el modelo LSTM")
                            model_data["modelo_keras"] = None
                            model_data["error_keras"] = "TensorFlow no está disponible"
                    except Exception as e:
                        logger.error(f"Error al cargar modelo Keras: {str(e)}")
                        model_data["modelo_keras"] = None
                        model_data["error_keras"] = str(e)
                else:
                    logger.warning(f"Archivo H5 no encontrado para {player_name}: {h5_path}")
                    model_data["modelo_keras"] = None
                    model_data["error_keras"] = "Archivo H5 no encontrado"
                
                # Cargar scaler para normalización
                scaler_file = f"{player_name}_{model_data['tipo_modelo']}_scaler.pkl"
                scaler_path = os.path.join(model_dir, scaler_file)
                if os.path.exists(scaler_path):
                    try:
                        with open(scaler_path, 'rb') as f:
                            model_data["scaler"] = pickle.load(f)
                        logger.info(f"Scaler para {player_name} cargado correctamente")
                    except Exception as e:
                        logger.error(f"Error al cargar scaler: {str(e)}")
                        model_data["scaler"] = None
                else:
                    model_data["scaler"] = None
                    
                # Verificar si el modelo LSTM está realmente disponible
                if model_data["modelo_keras"] is None:
                    model_data["disponible"] = False
                    model_data["error"] = model_data.get("error_keras", "Modelo Keras no disponible")
            
            # Almacenar en caché
            self.model_cache[cache_key] = model_data
            return model_data
            
        except Exception as e:
            logger.error(f"Error al cargar el modelo {file_name}: {str(e)}")
            return {
                "error": f"Error al cargar el modelo: {str(e)}",
                "modelo_entrenado": None,
                "modelo_config": {"tipo_modelo": model_type},
                "disponible": False
            }
    
    def clear_cache(self):
        """Limpiar la caché de modelos."""
        self.model_cache.clear()
        logger.info("Caché de modelos limpiada")


class PredictionEngine:
    """Motor de predicción para todos los modelos."""
    
    def __init__(self):
        """Inicializar el motor de predicción."""
        self.model_loader = ModelLoader()
        self.historical_data = None
        
    async def load_data(self):
        """Cargar datos históricos si no están cargados."""
        if self.historical_data is None:
            self.historical_data = load_historical_data()
        return self.historical_data
        
    async def get_player_historical_data(self, player_name: str):
        """
        Obtener datos históricos de un jugador específico.
        
        Args:
            player_name: Nombre del jugador
            
        Returns:
            DataFrame con datos históricos del jugador
        """
        data = await self.load_data()
        player_data = data[data['Jugador'] == player_name].sort_values('Fecha')
        
        # Filtro específico para Hugo Rodallega (como se ve en el código original)
        if player_name == 'Hugo_Rodallega':
            fecha_inicio = pd.Timestamp('2023-01-01')
            player_data = player_data[player_data['Fecha'] >= fecha_inicio]
            logger.info(f"Aplicando filtro de fecha para {player_name} desde {fecha_inicio}")
            
        return player_data
    
    async def prepare_prediction_features(self, player_name: str, match_data: dict, model_type: str):
        """
        Preparar características específicas para cada modelo basadas en datos históricos.
        
        Args:
            player_name: Nombre del jugador
            match_data: Datos del partido para predicción
            model_type: Tipo de modelo
            
        Returns:
            Diccionario con características preprocesadas
        """
        # Obtener datos históricos
        player_history = await self.get_player_historical_data(player_name)
        
        # Características según el modelo
        if model_type == "lstm":
            return await self._prepare_lstm_features(player_name, player_history, match_data)
        elif model_type == "sarimax":
            return await self._prepare_sarimax_features(player_name, player_history, match_data)
        elif model_type == "poisson":
            return await self._prepare_poisson_features(player_name, player_history, match_data)
        else:
            raise ValueError(f"Tipo de modelo no válido: {model_type}")
    
    async def _prepare_lstm_features(self, player_name: str, history_df: pd.DataFrame, match_data: dict):
        """Preparar características para modelo LSTM."""
        # Cargar modelo para obtener configuración
        model_data = await self.model_loader.load_model("lstm", player_name)
        
        # Verificar disponibilidad del modelo
        if not model_data.get("disponible", False):
            return {
                "error": model_data.get("error", "Modelo LSTM no disponible"),
                "disponible": False
            }
        
        # Obtener ventana y características del modelo
        window_size = model_data.get('modelo_config', {}).get('ventana', DEFAULT_WINDOW_SIZE)
        
        # Características del modelo basadas en el código de entrenamiento
        default_features = [
            'Tiros_a_puerta', 'Tiros_totales', 'Minutos',
            'Sede_Local', 'Sede_Visitante',
            'Promedio_Historico_vs_Oponente', 'Tendencia_Reciente',
            'Marco_Ultimo_Partido', 'Goles_Ult_3', 'Tendencia_Robusta',
            'Es_FinDeSemana', 'Racha_Con_Gol'
        ]
        
        # Usar características del modelo si están disponibles
        model_features = model_data.get('modelo_config', {}).get('caracteristicas', default_features)
        
        # Preparar las características adicionales basadas en el historial
        # Obtener datos de partidos previos
        df_work = history_df.copy()
        
        # Normalizar nombres de columnas (convertir espacios a guiones bajos)
        rename_dict = {}
        for col in df_work.columns:
            if ' ' in col:
                rename_dict[col] = col.replace(' ', '_')
        if rename_dict:
            df_work = df_work.rename(columns=rename_dict)
        
        # 1. Preparar datos para el último partido (para predecir el siguiente)
        # Promedios móviles de goles
        ventanas = [3, 5, 7, 10]
        for ventana in ventanas:
            if len(df_work) >= ventana:
                col_name = f'Goles_Prom_{ventana}'
                df_work[col_name] = df_work['Goles'].rolling(window=ventana, min_periods=1).mean()
        
        # Rachas de goles
        if 'Goles' in df_work.columns:
            df_work['Marco_Ultimo_Partido'] = df_work['Goles'].shift(1).fillna(0)
            df_work['Goles_Ult_3'] = df_work['Goles'].rolling(window=3, min_periods=1).sum()
            df_work['Goles_Ult_5'] = df_work['Goles'].rolling(window=5, min_periods=1).sum()
            
            # Secuencias de partidos con/sin gol
            goles_binario = (df_work['Goles'] > 0).astype(int)
            df_work['Racha_Con_Gol'] = goles_binario.groupby((goles_binario != goles_binario.shift()).cumsum()).cumcount()
        
        # Factor de oponente historial
        df_work['Factor_Oponente'] = 1.0
        opponent_std = match_data.get('Oponente_Estandarizado', '')
        
        # Filtrar partidos previos contra el mismo oponente
        hist_vs_opponent = df_work[df_work['Oponente_Estandarizado'] == opponent_std]
        
        if len(hist_vs_opponent) > 0:
            promedio_vs_oponente = hist_vs_opponent['Goles'].mean()
            # Normalizar para crear un factor multiplicativo
            factor = (promedio_vs_oponente + 1) / (df_work['Goles'].mean() + 1)
            match_data['Factor_Oponente'] = factor
        else:
            match_data['Factor_Oponente'] = 1.0
        
        # Agregar características de día de la semana
        match_data['Es_FinDeSemana'] = 0
        if 'Fecha' in match_data and isinstance(match_data['Fecha'], datetime):
            weekday = match_data['Fecha'].weekday()
            match_data['Es_FinDeSemana'] = 1 if weekday >= 4 else 0
        
        # Calcular tendencia reciente basada en los últimos partidos
        if len(df_work) >= 5:
            ultimos_partidos = df_work.tail(5)
            promedio_reciente = ultimos_partidos['Goles'].mean()
            promedio_general = df_work['Goles'].mean()
            
            if promedio_general > 0:
                tendencia = promedio_reciente / promedio_general
            else:
                tendencia = 1.0
            
            match_data['Tendencia_Reciente'] = tendencia
        else:
            match_data['Tendencia_Reciente'] = 1.0
        
        # 2. Crear la matriz de características para LSTM
        # Tomar los últimos 'window_size' partidos
        if len(df_work) >= window_size:
            # Seleccionar solo características disponibles
            available_features = [f for f in model_features if f in df_work.columns]
            
            # Crear secuencia para el modelo
            window_data = df_work[available_features].values[-window_size:]
            
            return {
                "X": np.array([window_data]),
                "features": available_features,
                "match_data": match_data,
                "historical_data": df_work,
                "disponible": True
            }
        else:
            logger.warning(f"Datos insuficientes para {player_name}. Se necesitan al menos {window_size} partidos.")
            return {
                "error": f"Datos insuficientes. Se necesitan al menos {window_size} partidos.",
                "disponible": False
            }
    
    async def _prepare_sarimax_features(self, player_name: str, history_df: pd.DataFrame, match_data: dict):
        """Preparar características para modelo SARIMAX."""
        # Cargar modelo para obtener configuración
        model_data = await self.model_loader.load_model("sarimax", player_name)
        
        # Verificar disponibilidad del modelo
        if not model_data.get("disponible", False):
            return {
                "error": model_data.get("error", "Modelo SARIMAX no disponible"),
                "disponible": False
            }
        
        # Verificar si el modelo usa variables exógenas
        usa_exogenas = model_data.get('modelo_config', {}).get('usa_exogenas', False)
        
        if not usa_exogenas:
            return {
                "usa_exogenas": False,
                "match_data": match_data,
                "historical_data": history_df,
                "disponible": True
            }
        
        # Obtener lista de variables exógenas
        variables_exogenas = model_data.get('modelo_config', {}).get('variables_exogenas', [])
        
        # Preparar datos exógenos para predicción
        exog_data = {}
        
        for var in variables_exogenas:
            if var in match_data:
                exog_data[var] = match_data[var]
            elif var == 'Promedio_Historico_vs_Oponente':
                # Calcular el promedio histórico contra el oponente actual
                opponent_std = match_data.get('Oponente_Estandarizado', '')
                hist_vs_opponent = history_df[history_df['Oponente_Estandarizado'] == opponent_std]
                
                if len(hist_vs_opponent) > 0:
                    exog_data[var] = hist_vs_opponent['Goles'].mean()
                else:
                    exog_data[var] = 0.0
            elif var == 'Tendencia_Reciente':
                # Calcular tendencia basada en los últimos partidos
                if len(history_df) >= 5:
                    ultimos_partidos = history_df.tail(5)
                    promedio_reciente = ultimos_partidos['Goles'].mean()
                    promedio_general = history_df['Goles'].mean()
                    
                    if promedio_general > 0:
                        exog_data[var] = promedio_reciente / promedio_general
                    else:
                        exog_data[var] = 1.0
                else:
                    exog_data[var] = 1.0
            else:
                # Para otras variables, usar el promedio si está disponible en los datos históricos
                if var in history_df.columns:
                    exog_data[var] = history_df[var].mean()
                else:
                    exog_data[var] = 0.0
        
        # Normalizar variables si hay información de normalización
        normalizacion = model_data.get('normalizacion', {})
        for var in variables_exogenas:
            if var in normalizacion and var in exog_data:
                media = normalizacion[var].get('mean', 0)
                std = normalizacion[var].get('std', 1)
                if std > 0:
                    norm_var = f"{var}_norm"
                    exog_data[norm_var] = (exog_data[var] - media) / std
        
        # Convertir a array para el modelo
        if exog_data:
            # Ordenar según las variables del modelo
            exog_array = np.array([[exog_data.get(var, 0) for var in variables_exogenas]])
        else:
            exog_array = None
        
        return {
            "usa_exogenas": True,
            "exog": exog_array,
            "exog_dict": exog_data,
            "variables_exogenas": variables_exogenas,
            "match_data": match_data,
            "historical_data": history_df,
            "disponible": True
        }
    
    async def _prepare_poisson_features(self, player_name: str, history_df: pd.DataFrame, match_data: dict):
        """Preparar características para modelo Poisson."""
        # Cargar modelo para obtener configuración
        model_data = await self.model_loader.load_model("poisson", player_name)
        
        # Verificar disponibilidad del modelo
        if not model_data.get("disponible", False):
            return {
                "error": model_data.get("error", "Modelo Poisson no disponible"),
                "disponible": False
            }
        
        # Obtener la fórmula y los términos
        formula = model_data.get('modelo_config', {}).get('formula', '')
        formula_terms = model_data.get('modelo_config', {}).get('features', [])
        
        # Normalizar nombres de columnas del historial
        df_work = history_df.copy()
        rename_dict = {}
        for col in df_work.columns:
            if ' ' in col:
                rename_dict[col] = col.replace(' ', '_')
        if rename_dict:
            df_work = df_work.rename(columns=rename_dict)
        
        # Preparar variables para la fórmula
        formula_vars = {}
        
        # 1. Promedios móviles de goles
        df_work['Goles_Prom_3'] = df_work['Goles'].rolling(window=3, min_periods=1).mean()
        df_work['Goles_Prom_5'] = df_work['Goles'].rolling(window=5, min_periods=1).mean()
        
        for feature in formula_terms:
            if feature in match_data:
                formula_vars[feature] = match_data[feature]
            elif feature.startswith('Goles_Prom_'):
                # Usar los valores calculados de promedios móviles
                if feature in df_work.columns and len(df_work) > 0:
                    formula_vars[feature] = df_work[feature].iloc[-1]
                else:
                    formula_vars[feature] = 0.0
            elif feature == 'Factor_Oponente':
                # Calcular factor basado en historial vs oponente
                opponent_std = match_data.get('Oponente_Estandarizado', '')
                hist_vs_opponent = df_work[df_work['Oponente_Estandarizado'] == opponent_std]
                
                if len(hist_vs_opponent) > 0:
                    promedio_vs_oponente = hist_vs_opponent['Goles'].mean()
                    if df_work['Goles'].mean() > 0:
                        factor = (promedio_vs_oponente + 1) / (df_work['Goles'].mean() + 1)
                    else:
                        factor = 1.0
                    formula_vars[feature] = factor
                else:
                    formula_vars[feature] = 1.0
            elif feature == 'Tendencia':
                # Calcular tendencia basada en los últimos partidos
                if len(df_work) >= 5:
                    ultima_tendencia = 0
                    try:
                        # Usar los últimos 5 partidos para la tendencia
                        recent_form = df_work['Goles'].iloc[-5:].values
                        from scipy import stats
                        slope, _, _, _, _ = stats.linregress(range(len(recent_form)), recent_form)
                        ultima_tendencia = slope
                    except:
                        ultima_tendencia = 0
                    formula_vars[feature] = ultima_tendencia
                else:
                    formula_vars[feature] = 0
            elif feature.endswith('_norm'):
                # Buscar la versión original y normalizarla si está disponible
                base_feature = feature.replace('_norm', '')
                if base_feature in match_data:
                    # Usar información de normalización del modelo
                    normalizacion = model_data.get('normalization_info', {})
                    if base_feature in normalizacion:
                        media = normalizacion[base_feature].get('mean', 0)
                        std = normalizacion[base_feature].get('std', 1)
                        if std > 0:
                            formula_vars[feature] = (match_data[base_feature] - media) / std
                        else:
                            formula_vars[feature] = 0
                    else:
                        # Si no hay información de normalización, usar promedio y std del historial
                        if base_feature in df_work.columns:
                            media = df_work[base_feature].mean()
                            std = df_work[base_feature].std()
                            if std > 0:
                                formula_vars[feature] = (match_data[base_feature] - media) / std
                            else:
                                formula_vars[feature] = 0
                        else:
                            formula_vars[feature] = 0
                else:
                    formula_vars[feature] = 0
            else:
                # Para otras variables, usar un valor por defecto
                formula_vars[feature] = 0
        
        # Agregar oponente específico si está en los términos de la fórmula
        opponent_std = match_data.get('Oponente_Estandarizado', '')
        oponente_col = f"Oponente_{opponent_std}"
        if oponente_col in formula_terms:
            formula_vars[oponente_col] = 1
        
        return {
            "formula_vars": formula_vars,
            "formula_terms": formula_terms,
            "formula": formula,
            "match_data": match_data,
            "historical_data": df_work,
            "disponible": True
        }
    
    async def preprocess_data(self, player_data: dict, model_type: str) -> dict:
        """
        Preprocesar datos para un tipo de modelo específico.
        
        Args:
            player_data: Datos del jugador para la predicción
            model_type: Tipo de modelo ('lstm', 'sarimax', 'poisson')
            
        Returns:
            Datos preprocesados listos para predicción
        """
        # Verificar disponibilidad
        if not player_data.get("disponible", True):
            return player_data
        
        # Implementación específica para cada tipo de modelo
        if model_type == "lstm":
            return self._preprocess_lstm(player_data)
        elif model_type == "sarimax":
            return self._preprocess_sarimax(player_data)
        elif model_type == "poisson":
            return self._preprocess_poisson(player_data)
        else:
            raise ValueError(f"Tipo de modelo no válido: {model_type}")
    
    def _preprocess_lstm(self, player_data: dict) -> dict:
        """Preprocesamiento específico para LSTM."""
        processed_data = {}
        
        # Verificar disponibilidad
        if not player_data.get("disponible", True):
            return player_data
        
        # Extraer X si ya está procesado
        if "X" in player_data:
            processed_data["X"] = player_data["X"]
            processed_data["features"] = player_data.get("features", [])
            processed_data["disponible"] = True
            return processed_data
        
        # Crear ventanas de tiempo si no está ya procesado
        if 'historical_data' in player_data and len(player_data['historical_data']) >= DEFAULT_WINDOW_SIZE:
            # Extraer características y crear secuencias
            features = player_data.get('features', [])
            historical = player_data['historical_data']
            
            # Ordenar por fecha
            if 'Fecha' in historical.columns:
                historical = historical.sort_values('Fecha')
            
            # Crear la secuencia para el modelo
            window_data = historical[features].values[-DEFAULT_WINDOW_SIZE:]
            processed_data['X'] = np.array([window_data])
            processed_data['features'] = features
            processed_data["disponible"] = True
        else:
            processed_data["disponible"] = False
            processed_data["error"] = "Datos históricos insuficientes"
        
        return processed_data
    
    def _preprocess_sarimax(self, player_data: dict) -> dict:
        """Preprocesamiento específico para SARIMAX."""
        processed_data = {}
        
        # Verificar disponibilidad
        if not player_data.get("disponible", True):
            return player_data
        
        # Extraer variables exógenas si están disponibles
        if 'exog' in player_data:
            processed_data['exog'] = player_data['exog']
            processed_data["disponible"] = True
        elif 'exog_dict' in player_data:
            exog_dict = player_data['exog_dict']
            variables_exogenas = player_data.get('variables_exogenas', [])
            
            # Convertir a array para el modelo
            if exog_dict and variables_exogenas:
                # Ordenar según las variables del modelo
                exog_array = np.array([[exog_dict.get(var, 0) for var in variables_exogenas]])
                processed_data['exog'] = exog_array
                processed_data["disponible"] = True
            else:
                processed_data["disponible"] = False
                processed_data["error"] = "Variables exógenas no disponibles"
        else:
            processed_data["disponible"] = player_data.get("disponible", True)
        
        return processed_data
    
    def _preprocess_poisson(self, player_data: dict) -> dict:
        """Preprocesamiento específico para Poisson."""
        processed_data = {}
        
        # Verificar disponibilidad
        if not player_data.get("disponible", True):
            return player_data
        
        # Extraer características relevantes para Poisson
        if 'formula_vars' in player_data:
            formula_vars = player_data['formula_vars']
            
            # Crear DataFrame con variables de la fórmula
            processed_data['formula_vars'] = formula_vars
            processed_data["disponible"] = True
        else:
            processed_data["disponible"] = False
            processed_data["error"] = "Variables de fórmula no disponibles"
        
        return processed_data
    
    async def predict_with_model(
        self, 
        player_name: str, 
        model_type: str, 
        match_data: dict
    ) -> dict:
        """
        Realizar predicción con un modelo específico.
        
        Args:
            player_name: Nombre del jugador
            model_type: Tipo de modelo ('lstm', 'sarimax', 'poisson')
            match_data: Datos del partido para predicción
            
        Returns:
            Resultado de la predicción
        """
        try:
            # Cargar modelo
            model_data = await self.model_loader.load_model(model_type, player_name)
            
            # Verificar disponibilidad del modelo
            if not model_data.get("disponible", False):
                return {
                    "error": model_data.get("error", f"Modelo {model_type} no disponible para {player_name}"),
                    "prediction": None,
                    "confidence": None,
                    "disponible": False
                }
            
            # Preparar características específicas para el modelo
            processed_data = await self.prepare_prediction_features(player_name, match_data, model_type)
            
            # Si hay error en la preparación de datos, devolverlo
            if not processed_data.get("disponible", True) or "error" in processed_data:
                return {
                    "error": processed_data.get("error", "Error al preparar datos"),
                    "prediction": None,
                    "confidence": None,
                    "disponible": False
                }
            
            # Preprocesar datos
            prediction_input = await self.preprocess_data(processed_data, model_type)
            
            # Si hay error en el preprocesamiento, devolverlo
            if not prediction_input.get("disponible", True) or "error" in prediction_input:
                return {
                    "error": prediction_input.get("error", "Error al preprocesar datos"),
                    "prediction": None,
                    "confidence": None,
                    "disponible": False
                }
            
            # Realizar predicción según el tipo de modelo
            if model_type == "lstm":
                return self._predict_lstm(model_data, prediction_input)
            elif model_type == "sarimax":
                return self._predict_sarimax(model_data, prediction_input)
            elif model_type == "poisson":
                return self._predict_poisson(model_data, prediction_input)
            else:
                raise ValueError(f"Tipo de modelo no válido: {model_type}")
                
        except Exception as e:
            logger.error(f"Error en predicción con modelo {model_type} para {player_name}: {str(e)}")
            return {
                "error": f"Error en predicción: {str(e)}",
                "prediction": None,
                "confidence": None,
                "disponible": False
            }
    
    def _predict_lstm(self, model_data: dict, processed_data: dict) -> dict:
        """Predicción con modelo LSTM."""
        result = {
            "prediction": None,
            "confidence": None,
            "metadata": {},
            "disponible": False
        }
        
        # Verificar si TensorFlow está disponible
        if not HAS_TF:
            result["error"] = "TensorFlow no está disponible, los modelos LSTM no se pueden usar"
            return result
        
        # Verificar disponibilidad
        if not processed_data.get("disponible", True) or "error" in processed_data:
            result["error"] = processed_data.get("error", "Datos no disponibles para LSTM")
            return result
        
        # Verificar si hay un modelo Keras
        if 'modelo_keras' in model_data and model_data['modelo_keras'] is not None and 'X' in processed_data:
            try:
                modelo = model_data['modelo_keras']
                X = processed_data['X']
                
                # Normalizar datos con el scaler guardado
                if 'scaler' in model_data and model_data['scaler'] is not None:
                    scaler = model_data['scaler']
                    n_samples, n_steps, n_features = X.shape
                    X_2d = X.reshape(n_samples * n_steps, n_features)
                    X_norm = scaler.transform(X_2d).reshape(n_samples, n_steps, n_features)
                else:
                    X_norm = X
                
                # Realizar predicción
                pred = modelo.predict(X_norm, verbose=0).flatten()[0]
                
                # Aplicar redondeo probabilístico
                if pred < 0:
                    pred = 0
                
                # Calcular probabilidades
                entero = int(pred)
                decimal = pred - entero
                
                result["prediction"] = entero
                result["confidence"] = 1 - decimal if decimal <= 0.5 else decimal
                result["raw_prediction"] = float(pred)
                result["disponible"] = True
                
                # Añadir metadatos
                result["metadata"] = {
                    "model_type": "LSTM",
                    "architecture": model_data.get('modelo_config', {}).get('architecture', 'simple'),
                    "features_used": processed_data.get('features', [])
                }
                
                return result
            except Exception as e:
                logger.error(f"Error en predicción LSTM con Keras: {str(e)}")
                result["error"] = f"Error en predicción LSTM: {str(e)}"
                return result
        
        # Si no hay modelo Keras válido, intentar con modelo_entrenado
        if 'modelo_entrenado' in model_data and model_data['modelo_entrenado'] is not None and not isinstance(model_data['modelo_entrenado'], str) and 'X' in processed_data:
            try:
                modelo = model_data['modelo_entrenado']
                X = processed_data['X']
                
                # Realizar predicción
                pred = modelo.predict(X).flatten()[0]
                
                # Aplicar redondeo probabilístico
                if pred < 0:
                    pred = 0
                
                # Calcular probabilidades
                entero = int(pred)
                decimal = pred - entero
                
                result["prediction"] = entero
                result["confidence"] = 1 - decimal if decimal <= 0.5 else decimal
                result["raw_prediction"] = float(pred)
                result["disponible"] = True
                
                # Añadir metadatos
                result["metadata"] = {
                    "model_type": "LSTM",
                    "architecture": model_data.get('modelo_config', {}).get('architecture', 'simple'),
                    "features_used": processed_data.get('features', [])
                }
                
                return result
            except Exception as e:
                logger.error(f"Error en predicción LSTM con modelo_entrenado: {str(e)}")
                result["error"] = f"Error en predicción LSTM: {str(e)}"
                return result
        
        # Si llegamos aquí, no hay modelo válido
        result["error"] = "No hay modelo LSTM válido disponible"
        return result
    
    def _predict_sarimax(self, model_data: dict, processed_data: dict) -> dict:
        """Predicción con modelo SARIMAX."""
        result = {
            "prediction": None,
            "confidence": None,
            "metadata": {},
            "disponible": False
        }
        
        # Verificar disponibilidad
        if not processed_data.get("disponible", True) or "error" in processed_data:
            result["error"] = processed_data.get("error", "Datos no disponibles para SARIMAX")
            return result
        
        # Extraer modelo y realizar predicción
        if 'modelo_entrenado' in model_data and model_data['modelo_entrenado'] is not None:
            modelo = model_data['modelo_entrenado']
            
            # Obtener variables exógenas si están disponibles
            exog = processed_data.get('exog', None)
            
            # Realizar predicción
            try:
                if exog is not None:
                    pred = modelo.forecast(steps=1, exog=exog)[0]
                else:
                    pred = modelo.forecast(steps=1)[0]
                
                # Asegurar que la predicción no sea negativa
                pred = max(0, pred)
                
                # Asignar resultados
                entero = int(pred)
                decimal = pred - entero
                
                result["prediction"] = entero
                result["confidence"] = 1 - decimal if decimal <= 0.5 else decimal
                result["raw_prediction"] = float(pred)
                result["disponible"] = True
                
                # Añadir metadatos
                result["metadata"] = {
                    "model_type": "SARIMAX",
                    "order": model_data.get('modelo_config', {}).get('orden', []),
                    "uses_exog": model_data.get('modelo_config', {}).get('usa_exogenas', False)
                }
            except Exception as e:
                logger.error(f"Error en predicción SARIMAX: {str(e)}")
                result["error"] = f"Error en predicción SARIMAX: {str(e)}"
        else:
            result["error"] = "Modelo SARIMAX no disponible"
        
        return result
    
    def _predict_poisson(self, model_data: dict, processed_data: dict) -> dict:
        """Predicción con modelo Poisson."""
        result = {
            "prediction": None,
            "confidence": None,
            "metadata": {},
            "probability_distribution": {},
            "disponible": False
        }
        
        # Verificar disponibilidad
        if not processed_data.get("disponible", True) or "error" in processed_data:
            result["error"] = processed_data.get("error", "Datos no disponibles para Poisson")
            return result
        
        # Extraer modelo y realizar predicción
        if 'modelo_entrenado' in model_data and model_data['modelo_entrenado'] is not None and 'formula_vars' in processed_data:
            modelo = model_data['modelo_entrenado']
            formula_vars = processed_data['formula_vars']
            
            # Crear DataFrame con variables de la fórmula
            df_pred = pd.DataFrame([formula_vars])
            
            try:
                # Predecir lambda (tasa de Poisson)
                lambda_pred = modelo.predict(df_pred)[0]
                
                # Limitar lambda para evitar valores extremos
                lambda_pred = min(max(0, lambda_pred), 5)
                
                # Calcular distribución de probabilidad
                probs = [poisson.pmf(i, lambda_pred) for i in range(5)]
                probs.append(1 - sum(probs))  # Probabilidad para 5+ goles
                
                # Valor esperado (predicción puntual)
                pred = lambda_pred
                entero = int(pred)
                decimal = pred - entero
                
                # Asignar resultados
                result["prediction"] = entero
                result["confidence"] = 1 - decimal if decimal <= 0.5 else decimal
                result["raw_prediction"] = float(pred)
                result["disponible"] = True
                
                # Distribución de probabilidad
                result["probability_distribution"] = {
                    "0": float(probs[0]),
                    "1": float(probs[1]),
                    "2": float(probs[2]),
                    "3": float(probs[3]),
                    "4": float(probs[4]),
                    "5+": float(probs[5])
                }
                
                # Añadir metadatos
                result["metadata"] = {
                    "model_type": "Poisson",
                    "formula": model_data.get('modelo_config', {}).get('formula', '')
                }
            except Exception as e:
                logger.error(f"Error en predicción Poisson: {str(e)}")
                result["error"] = f"Error en predicción Poisson: {str(e)}"
        else:
            result["error"] = "Modelo Poisson no disponible o datos insuficientes"
        
        return result
    
    def calculate_prediction_ensemble(self, predictions: Dict[str, dict], weights: Dict[str, float] = None) -> dict:
        """
        Calcular predicción ensemble a partir de predicciones individuales.
        
        Args:
            predictions: Diccionario con predicciones de cada modelo
            weights: Pesos para cada modelo
            
        Returns:
            Predicción ensemble
        """
        if weights is None:
            weights = MODEL_WEIGHTS.copy()
        
        # Filtrar solo modelos disponibles
        available_predictions = {}
        for model, pred in predictions.items():
            if pred.get("disponible", False) and "raw_prediction" in pred:
                available_predictions[model] = pred
        
        # Si no hay predicciones disponibles, devolver error
        if not available_predictions:
            return {
                "prediction": None,
                "confidence": None,
                "raw_prediction": None,
                "error": "No hay predicciones disponibles para ensemble",
                "disponible": False
            }
        
        # Ajustar pesos para usar solo modelos disponibles
        adjusted_weights = {}
        for model in available_predictions:
            if model in weights:
                adjusted_weights[model] = weights[model]
        
        # Normalizar pesos
        total_weight = sum(adjusted_weights.values())
        if total_weight > 0:
            adjusted_weights = {k: v/total_weight for k, v in adjusted_weights.items()}
        else:
            # Si no hay pesos válidos, usar pesos iguales
            adjusted_weights = {k: 1.0/len(available_predictions) for k in available_predictions}
        
        # Calcular predicción ponderada
        weighted_sum = 0
        for model, pred in available_predictions.items():
            raw_pred = pred["raw_prediction"]
            weight = adjusted_weights.get(model, 0)
            weighted_sum += raw_pred * weight
        
        # Asegurar que la predicción no sea negativa
        ensemble_pred = max(0, weighted_sum)
        
        # Determinar valor entero y confianza
        entero = int(ensemble_pred)
        decimal = ensemble_pred - entero
        confidence = 1 - decimal if decimal <= 0.5 else decimal
        
        return {
            "prediction": entero,
            "confidence": confidence,
            "raw_prediction": float(ensemble_pred),
            "disponible": True
        }
    
    async def ensemble_predictions(
        self, 
        player_name: str, 
        match_data: dict,
        weights: Optional[Dict[str, float]] = None
    ) -> dict:
        """
        Combinar predicciones de todos los modelos.
        
        Args:
            player_name: Nombre del jugador
            match_data: Datos del partido para predicción
            weights: Pesos para cada modelo (opcional)
            
        Returns:
            Resultado combinado de las predicciones
        """
        if weights is None:
            weights = MODEL_WEIGHTS.copy()
        
        # Obtener predicciones individuales
        model_predictions = {}
        
        # Intentar obtener predicción LSTM solo si TensorFlow está disponible
        if HAS_TF:
            try:
                lstm_result = await self.predict_with_model(player_name, "lstm", match_data)
                model_predictions["lstm"] = lstm_result
            except Exception as e:
                logger.warning(f"Error al obtener predicción LSTM para {player_name}: {str(e)}")
                model_predictions["lstm"] = {
                    "error": f"Error en predicción LSTM: {str(e)}",
                    "prediction": None,
                    "confidence": None,
                    "raw_prediction": None,
                    "disponible": False
                }
        else:
            # Si TensorFlow no está disponible, ajustar pesos
            if "lstm" in weights:
                del weights["lstm"]
                # Normalizar pesos restantes
                total = sum(weights.values())
                if total > 0:
                    weights = {k: v/total for k, v in weights.items()}
            
            model_predictions["lstm"] = {
                "error": "TensorFlow no está disponible",
                "prediction": None,
                "confidence": None,
                "raw_prediction": None,
                "disponible": False
            }
        
        # Obtener predicciones SARIMAX y Poisson
        try:
            sarimax_result = await self.predict_with_model(player_name, "sarimax", match_data)
            model_predictions["sarimax"] = sarimax_result
        except Exception as e:
            logger.warning(f"Error al obtener predicción SARIMAX para {player_name}: {str(e)}")
            model_predictions["sarimax"] = {
                "error": f"Error en predicción SARIMAX: {str(e)}",
                "prediction": None,
                "confidence": None,
                "raw_prediction": None,
                "disponible": False
            }
        
        try:
            poisson_result = await self.predict_with_model(player_name, "poisson", match_data)
            model_predictions["poisson"] = poisson_result
        except Exception as e:
            logger.warning(f"Error al obtener predicción Poisson para {player_name}: {str(e)}")
            model_predictions["poisson"] = {
                "error": f"Error en predicción Poisson: {str(e)}",
                "prediction": None,
                "confidence": None,
                "raw_prediction": None,
                "disponible": False
            }
        
        # Calcular predicción ensemble
        ensemble_result = self.calculate_prediction_ensemble(model_predictions, weights)
        
        # Extraer probabilidad del modelo Poisson si está disponible
        probability_distribution = {}
        if "poisson" in model_predictions and model_predictions["poisson"].get("disponible", False):
            probability_distribution = model_predictions["poisson"].get("probability_distribution", {})
        
        # Construir resultado
        result = {
            "ensemble_prediction": ensemble_result.get("prediction"),
            "confidence": ensemble_result.get("confidence"),
            "raw_prediction": ensemble_result.get("raw_prediction"),
            "disponible": ensemble_result.get("disponible", False),
            "model_predictions": {
                "lstm": {
                    "prediction": model_predictions["lstm"].get("prediction"),
                    "confidence": model_predictions["lstm"].get("confidence"),
                    "raw": model_predictions["lstm"].get("raw_prediction"),
                    "disponible": model_predictions["lstm"].get("disponible", False),
                    "error": model_predictions["lstm"].get("error")
                },
                "sarimax": {
                    "prediction": model_predictions["sarimax"].get("prediction"),
                    "confidence": model_predictions["sarimax"].get("confidence"),
                    "raw": model_predictions["sarimax"].get("raw_prediction"),
                    "disponible": model_predictions["sarimax"].get("disponible", False),
                    "error": model_predictions["sarimax"].get("error")
                },
                "poisson": {
                    "prediction": model_predictions["poisson"].get("prediction"),
                    "confidence": model_predictions["poisson"].get("confidence"),
                    "raw": model_predictions["poisson"].get("raw_prediction"),
                    "disponible": model_predictions["poisson"].get("disponible", False),
                    "error": model_predictions["poisson"].get("error"),
                    "probability_distribution": probability_distribution
                }
            },
            "metadata": {
                "weights": weights,
                "adjusted_weights": ensemble_result.get("adjusted_weights", weights),
                "timestamp": datetime.now().isoformat()
            }
        }
        
        # Si no hay ningún modelo disponible, agregar error
        if not ensemble_result.get("disponible", False):
            result["error"] = ensemble_result.get("error", "No hay modelos disponibles para predicción")
        
        return result