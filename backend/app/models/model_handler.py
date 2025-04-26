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
import keras
from keras.models import load_model 
try:
    import tensorflow as tf
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
    
    Asegura que los nombres coincidan exactamente con los valores en la columna 
    Oponente_Estandarizado del archivo Goleadores_Procesados.csv
    """
    # Mapeo de nombres de equipos hacia los valores exactos en Oponente_Estandarizado
    mapeo_equipos = {
        # Variantes de Junior
        'Atlético Junior': 'Junior',
        'Junior': 'Junior',
        'JUNIOR': 'Junior',
        'JR FC': 'Junior',
        'ATLÉTICO JUNIOR': 'Junior',
        'ATLETICO JUNIOR': 'Junior',
        
        # Variantes de América
        'América': 'CD América',
        'América de Cali': 'CD América',
        'CD AMÉRICA': 'CD América',
        'CD AMERICA': 'CD América',
        'America': 'CD América',
        
        # Variantes de Millonarios
        'Millonarios': 'Millonarios',
        'MILLONARIOS': 'Millonarios',
        'co MILLONARIOS': 'Millonarios',
        
        # Variantes de Nacional
        'Nacional': 'Atlético Nacional',
        'NACIONAL': 'Atlético Nacional',
        'Atlético Nacional': 'Atlético Nacional',
        'Atletico Nacional': 'Atlético Nacional',
        
        # Variantes de Santa Fe
        'Santa Fe': 'Independiente Santa Fe',
        'SANTA FE': 'Independiente Santa Fe',
        'co SANTA FE': 'Independiente Santa Fe',
        'Independiente Santa Fe': 'Independiente Santa Fe',
        
        # Variantes de Tolima
        'Tolima': 'Deportes Tolima',
        'TOLIMA': 'Deportes Tolima',
        'co TOLIMA': 'Deportes Tolima',
        'Deportes Tolima': 'Deportes Tolima',
        
        # Variantes de Medellín
        'Medellín': 'Independiente Medellín',
        'Medellin': 'Independiente Medellín',
        'Independiente': 'Independiente Medellín',
        'DIM': 'Independiente Medellín',
        
        # Variantes de Cali
        'Cali': 'Deportivo Cali',
        'AD CALI': 'Deportivo Cali',
        'Deportivo Cali': 'Deportivo Cali',
        
        # Variantes de Pasto
        'Pasto': 'Deportivo Pasto',
        'PASTO': 'Deportivo Pasto',
        'Deportivo Pasto': 'Deportivo Pasto',
        
        # Variantes de Once Caldas
        'Once Caldas': 'Once Caldas',
        'ONCE CALDAS': 'Once Caldas',
        'co ONCE CALDAS': 'Once Caldas',
        
        # Variantes de Alianza
        'Alianza': 'Alianza FC',
        'ALIANZA': 'Alianza FC',
        
        # Variantes de Pereira
        'Pereira': 'Pereira',
        'PEREIRA': 'Pereira',
        'DEPORTIVO PEREIRA': 'Pereira',
        'Deportivo Pereira': 'Pereira',
        
        # Variantes de Bucaramanga
        'Bucaramanga': 'Bucaramanga',
        'CA BUCARAMANGA': 'Bucaramanga',
        'ATLETICO BUCARAMANGA': 'Bucaramanga',
        'ATLÉTICO BUCARAMANGA': 'Bucaramanga',
        'Atlético Bucaramanga': 'Bucaramanga',
        
        # Variantes de Chicó
        'Chicó': 'Boyacá Chicó',
        'Boyacá Chicó': 'Boyacá Chicó',
        'BOYACÁ CHICÓ': 'Boyacá Chicó',
        'BOYACA CHICO': 'Boyacá Chicó',
        'BOYACÁ PATRIOT': 'Boyacá Chicó',
        'BOYACA PATRIOT': 'Boyacá Chicó',
        
        # Variantes de Envigado
        'Envigado': 'Envigado',
        'ENVIGADO': 'Envigado',
        
        # Variantes de Fortaleza
        'Fortaleza': 'Fortaleza CEIF',
        'FORTALEZA FC': 'Fortaleza CEIF',
        
        # Variantes de Rionegro
        'Rionegro': 'Rionegro',
        'RIONEGRO': 'Rionegro',
        'ÁGUILAS DORADAS': 'Rionegro',
        'AGUILAS DORADAS': 'Rionegro',
        'Águilas Doradas': 'Rionegro',
        
        # Variantes de La Equidad
        'La Equidad': 'La Equidad',
        'LA EQUIDAD': 'La Equidad',
        
        # Variantes de Unión Magdalena
        'Unión Magdalena': 'Unión Magdalena',
        'UNIÓN MAGDALENA': 'Unión Magdalena',
        'UNION MAGDALENA': 'Unión Magdalena',
        
        # Variantes de Jaguares
        'Jaguares': 'Jaguares',
        'JAGUARES': 'Jaguares',
        
        # Variantes de Cortuluá
        'Cortuluá': 'Cortuluá',
        'CORTULUÁ': 'Cortuluá',
        'CORTULUA': 'Cortuluá',
        
        # Variantes de Atlético Huila
        'Atlético Huila': 'Atlético Huila',
        'ATLÉTICO HUILA': 'Atlético Huila',
        'ATLETICO HUILA': 'Atlético Huila',
        
        # Variantes de Llaneros
        'Llaneros': 'Llaneros',
        'LLANEROS': 'Llaneros'
    }
    
    # Si el nombre está en el mapeo, devuelve la versión exacta usada en Oponente_Estandarizado
    if nombre in mapeo_equipos:
        return mapeo_equipos[nombre]
    
    # Si no se encuentra una coincidencia exacta, intentamos con otras normalizaciones
    nombre_norm = nombre.strip()  # eliminar espacios en blanco
    if nombre_norm in mapeo_equipos:
        return mapeo_equipos[nombre_norm]
    
    # Si no hay coincidencia, devolver el nombre original
    return nombre


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
            pkl_file_name = f"lstm_{player_name}.pkl"
            h5_file_name = f"lstm_{player_name}.h5"
        elif model_type == "sarimax":
            model_dir = SARIMAX_MODELS_DIR
            file_name = f"arima_{player_name}.pkl"
        elif model_type == "poisson":
            model_dir = POISSON_MODELS_DIR
            file_name = f"poisson_{player_name}.pkl"
        else:
            raise ValueError(f"Tipo de modelo no válido: {model_type}")
        
        # Para modelos LSTM, manejar el caso especial donde puede haber .h5 pero no .pkl
        if model_type == "lstm":
            pkl_model_path = os.path.join(model_dir, pkl_file_name)
            h5_model_path = os.path.join(model_dir, h5_file_name)
            
            # Si no existe el archivo .pkl pero sí el .h5, crear una estructura básica
            if not os.path.exists(pkl_model_path) and os.path.exists(h5_model_path):
                try:
                    if HAS_TF:
                        # Crear un modelo básico con configuración por defecto
                        model_data = {
                            "disponible": True,
                            "modelo_config": {
                                "tipo_modelo": "lstm",
                                "ventana": DEFAULT_WINDOW_SIZE,
                                "caracteristicas": [
                                    'Tiros_a_puerta', 'Tiros_totales', 'Minutos',
                                    'Sede_Local', 'Sede_Visitante', 'Es_FinDeSemana'
                                ]
                            }
                        }
                        
                        # Cargar el modelo Keras directamente
                        model_data["modelo_keras"] = load_model(h5_model_path)
                        logger.info(f"Modelo Keras para {player_name} cargado directamente de H5")
                        
                        # Crear un scaler por defecto si es necesario
                        model_data["scaler"] = RobustScaler()
                        
                        # Almacenar en caché
                        self.model_cache[cache_key] = model_data
                        return model_data
                    else:
                        logger.warning("TensorFlow no está disponible, no se puede cargar el modelo LSTM")
                        return {
                            "error": "TensorFlow no está disponible",
                            "modelo_entrenado": None,
                            "modelo_config": {"tipo_modelo": model_type},
                            "disponible": False
                        }
                except Exception as e:
                    logger.error(f"Error al cargar modelo H5: {str(e)}")
                    return {
                        "error": f"Error al cargar modelo H5: {str(e)}",
                        "modelo_entrenado": None,
                        "modelo_config": {"tipo_modelo": model_type},
                        "disponible": False
                    }
            elif not os.path.exists(pkl_model_path):
                # Si no existe ni el PKL ni el H5
                logger.warning(f"No se encontró el modelo {pkl_file_name} en {model_dir}")
                return {
                    "error": f"Modelo no encontrado: {pkl_file_name}",
                    "modelo_entrenado": None,
                    "modelo_config": {"tipo_modelo": model_type},
                    "disponible": False
                }
            
            # Si existe el .pkl, continuamos con el flujo normal
            model_path = pkl_model_path
        else:
            # Para otros modelos, usamos el comportamiento normal
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
        
        # Verificar si el modelo usa variables exógenas y obtener la lista de variables
        usa_exogenas = model_data.get('modelo_config', {}).get('usa_exogenas', False)
        variables_exogenas = model_data.get('modelo_config', {}).get('variables_exogenas', [])
        
        if not usa_exogenas:
            return {
                "usa_exogenas": False,
                "match_data": match_data,
                "historical_data": history_df,
                "disponible": True
            }
        
        # Preparar datos exógenos para predicción
        exog_data = {}
        
        # 1. Mapear variables básicas desde match_data
        basic_vars = {
            'Sede_Local': match_data.get('Sede_Local', 1 if match_data.get('is_home', True) else 0),
            'Sede_Visitante': match_data.get('Sede_Visitante', 0 if match_data.get('is_home', True) else 1),
            'Tiros a puerta': match_data.get('Tiros a puerta', match_data.get('shots_on_target')),
            'Tiros totales': match_data.get('Tiros totales', match_data.get('total_shots')),
            'Minutos': match_data.get('Minutos', match_data.get('minutes', 90))
        }
        
        # Añadir variables básicas al diccionario
        for var, value in basic_vars.items():
            if value is not None:
                exog_data[var] = value
        
        # 2. Calcular Promedio_Historico_vs_Oponente (exactamente como en el código de entrenamiento)
        opponent_std = match_data.get('Oponente_Estandarizado', '')
        if not opponent_std and 'opponent' in match_data:
            opponent_std = self.estandarizar_nombre_equipo(match_data['opponent'])
        
        # Filtrar partidos previos contra este oponente
        hist_vs_opponent = history_df[history_df['Oponente_Estandarizado'] == opponent_std]
        
        if len(hist_vs_opponent) > 0:
            exog_data['Promedio_Historico_vs_Oponente'] = hist_vs_opponent['Goles'].mean()
        else:
            # Si no hay historial contra este oponente, usar promedio general reciente
            recent_history = history_df.sort_values('Fecha', ascending=False).head(5)
            exog_data['Promedio_Historico_vs_Oponente'] = recent_history['Goles'].mean() if len(recent_history) > 0 else 0.0
        
        # 3. Calcular Tendencia_Reciente
        if len(history_df) >= 5:
            # Usar los últimos 5 partidos
            ultimos_partidos = history_df.sort_values('Fecha', ascending=False).head(5)
            promedio_reciente = ultimos_partidos['Goles'].mean()
            promedio_general = history_df['Goles'].mean()
            
            if promedio_general > 0:
                exog_data['Tendencia_Reciente'] = promedio_reciente / promedio_general
            else:
                exog_data['Tendencia_Reciente'] = 1.0
        else:
            exog_data['Tendencia_Reciente'] = 1.0
        
        # 4. Normalizar variables numéricas como en el entrenamiento
        normalizacion = model_data.get('normalizacion', {})
        for var in ['Tiros a puerta', 'Tiros totales', 'Minutos']:
            if var in normalizacion and var in exog_data:
                mean_val = normalizacion[var]['mean']
                std_val = normalizacion[var]['std']
                if std_val > 0:
                    norm_var = f"{var}_norm"
                    exog_data[norm_var] = (exog_data[var] - mean_val) / std_val
        
        # 5. Construir array de variables exógenas en el orden correcto
        # Verificamos que estemos usando exactamente las mismas variables que se usaron en el entrenamiento
        if variables_exogenas:
            # Construir el array en el orden correcto
            exog_values = [exog_data.get(var, 0) for var in variables_exogenas]
            exog_array = np.array([exog_values])  # [1, n_features]
        else:
            # Si no tenemos la lista exacta de variables, usar el orden estándar
            exog_array = np.array([
                [
                    exog_data.get('Tiros a puerta', 0),
                    exog_data.get('Tiros totales', 0),
                    exog_data.get('Minutos', 90),
                    exog_data.get('Sede_Local', 1 if match_data.get('is_home', True) else 0),
                    exog_data.get('Sede_Visitante', 0 if match_data.get('is_home', True) else 1),
                    exog_data.get('Promedio_Historico_vs_Oponente', 0),
                    exog_data.get('Tendencia_Reciente', 1.0)
                ]
            ])
        
        # Devolver resultados
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
        """Predicción con modelo LSTM (maneja incompatibilidad de características)."""
        result = {
            "prediction": None,
            "confidence": None,
            "metadata": {},
            "disponible": False,
            "raw_prediction": None
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
                
                # Normalizar datos con el scaler guardado si existe
                if 'scaler' in model_data and model_data['scaler'] is not None:
                    try:
                        scaler = model_data['scaler']
                        n_samples, n_steps, n_features = X.shape
                        X_2d = X.reshape(n_samples * n_steps, n_features)
                        
                        # Verificar que el scaler esté ajustado antes de usarlo
                        if hasattr(scaler, 'center_') and hasattr(scaler, 'scale_'):
                            X_norm = scaler.transform(X_2d).reshape(n_samples, n_steps, n_features)
                        else:
                            logger.warning("RobustScaler no está ajustado, usando datos sin normalizar")
                            X_norm = X
                    except Exception as e:
                        logger.warning(f"Error al normalizar con scaler: {str(e)}")
                        X_norm = X  # Usar datos originales si falla la normalización
                else:
                    X_norm = X
                
                # NUEVO: Verificar compatibilidad de forma y realizar ajuste si es necesario
                # Obtener la forma esperada por el modelo
                expected_shape = None
                if hasattr(modelo, 'input_shape'):
                    expected_shape = modelo.input_shape
                elif hasattr(modelo, 'inputs') and hasattr(modelo.inputs[0], 'shape'):
                    expected_shape = modelo.inputs[0].shape
                    
                if expected_shape is not None:
                    # Extraer dimensiones actuales y esperadas
                    _, _, current_features = X_norm.shape
                    _, _, expected_features = expected_shape
                    
                    logger.info(f"Forma actual: (None, {n_steps}, {current_features}), Forma esperada: {expected_shape}")
                    
                    # Si hay diferencia en el número de características
                    if current_features != expected_features:
                        logger.warning(f"Incompatibilidad de características: modelo espera {expected_features}, datos tienen {current_features}")
                        
                        if current_features < expected_features:
                            # Rellenar con ceros hasta alcanzar el número esperado de características
                            padding = np.zeros((n_samples, n_steps, expected_features - current_features))
                            X_norm = np.concatenate([X_norm, padding], axis=2)
                            logger.info(f"Datos ajustados a forma: {X_norm.shape}")
                        else:
                            # Si tenemos más características de las esperadas, truncar
                            logger.warning(f"Truncando características de {current_features} a {expected_features}")
                            X_norm = X_norm[:, :, :expected_features]
                
                # Realizar predicción
                pred_raw = modelo.predict(X_norm, verbose=0)
                
                # Extraer el valor predicho del resultado (manejar diferentes formatos)
                pred = None
                
                # Formato Array/Tensor
                if hasattr(pred_raw, 'flatten'):
                    pred_flatten = pred_raw.flatten()
                    if len(pred_flatten) > 0:
                        pred = float(pred_flatten[0])
                
                # Formato Lista/Array
                elif isinstance(pred_raw, (list, np.ndarray)):
                    if len(pred_raw) > 0:
                        if isinstance(pred_raw[0], (list, np.ndarray)):
                            if len(pred_raw[0]) > 0:
                                pred = float(pred_raw[0][0])
                        else:
                            pred = float(pred_raw[0])
                
                # Último recurso
                if pred is None:
                    try:
                        pred = float(pred_raw)
                    except:
                        pred = 0.0
                
                # Asegurar que la predicción no sea negativa
                if pred < 0:
                    pred = 0
                
                # Calcular valores para la respuesta
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
                    "features_used": processed_data.get('features', []),
                    "original_shape": X.shape,
                    "expected_shape": expected_shape if expected_shape else "unknown",
                    "padding_applied": current_features != expected_features if expected_shape else False
                }
                
                return result
            except Exception as e:
                logger.error(f"Error en predicción LSTM con Keras: {str(e)}")
                result["error"] = f"Error en predicción LSTM: {str(e)}"
                return result
        
        # Si no hay modelo Keras válido, intentar con modelo_entrenado (alternativa)
        if 'modelo_entrenado' in model_data and model_data['modelo_entrenado'] is not None and not isinstance(model_data['modelo_entrenado'], str) and 'X' in processed_data:
            try:
                modelo = model_data['modelo_entrenado']
                X = processed_data['X']
                
                # Realizar predicción
                pred_raw = modelo.predict(X)
                
                # Extraer valor
                pred = 0.0
                if hasattr(pred_raw, 'flatten'):
                    pred_flatten = pred_raw.flatten()
                    if len(pred_flatten) > 0:
                        pred = float(pred_flatten[0])
                elif isinstance(pred_raw, (list, np.ndarray)):
                    if len(pred_raw) > 0:
                        pred = float(pred_raw[0])
                else:
                    try:
                        pred = float(pred_raw)
                    except:
                        pred = 0.0
                
                # Asegurar que la predicción no sea negativa
                pred = max(0, pred)
                
                entero = int(pred)
                decimal = pred - entero
                
                result["prediction"] = entero
                result["confidence"] = 1 - decimal if decimal <= 0.5 else decimal
                result["raw_prediction"] = float(pred)
                result["disponible"] = True
                
                # Añadir metadatos
                result["metadata"] = {
                    "model_type": "LSTM",
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
                # Manejar todas las formas posibles del resultado
                pred_val = 0.0
                
                if exog is not None:
                    prediccion = modelo.forecast(steps=1, exog=exog)
                else:
                    prediccion = modelo.forecast(steps=1)
                
                # Manejo robusto del resultado de predicción
                if hasattr(prediccion, 'iloc'):
                    # Es un DataFrame o Series de pandas
                    try:
                        pred_val = float(prediccion.iloc[0])
                    except (IndexError, AttributeError) as e:
                        logger.warning(f"Error al acceder usando .iloc[0]: {str(e)}")
                        # Intentar otros métodos
                        try:
                            pred_val = float(prediccion[0])
                        except:
                            logger.warning("Error al acceder usando [0]")
                            if hasattr(prediccion, 'values'):
                                try:
                                    pred_val = float(prediccion.values[0])
                                except:
                                    logger.warning("Error al acceder usando .values[0]")
                elif isinstance(prediccion, (list, np.ndarray)):
                    # Es una lista o array
                    try:
                        pred_val = float(prediccion[0])
                    except (IndexError, TypeError):
                        logger.warning("Error al acceder usando [0] en lista/array")
                else:
                    # Último recurso - intentar convertir directamente
                    try:
                        pred_val = float(prediccion)
                    except:
                        logger.warning("Error al convertir predicción a float")
                
                # Asegurar que la predicción no sea negativa
                pred_val = max(0, pred_val)
                
                # Asignar resultados
                entero = int(pred_val)
                decimal = pred_val - entero
                
                result["prediction"] = entero
                result["confidence"] = 1 - decimal if decimal <= 0.5 else decimal
                result["raw_prediction"] = float(pred_val)
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
        available_models = []
        
        # Intentar obtener predicción LSTM solo si TensorFlow está disponible
        if HAS_TF:
            try:
                lstm_result = await self.predict_with_model(player_name, "lstm", match_data)
                model_predictions["lstm"] = lstm_result
                if lstm_result.get("disponible", False):
                    available_models.append("lstm")
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
            if sarimax_result.get("disponible", False):
                available_models.append("sarimax")
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
            if poisson_result.get("disponible", False):
                available_models.append("poisson")
        except Exception as e:
            logger.warning(f"Error al obtener predicción Poisson para {player_name}: {str(e)}")
            model_predictions["poisson"] = {
                "error": f"Error en predicción Poisson: {str(e)}",
                "prediction": None,
                "confidence": None,
                "raw_prediction": None,
                "disponible": False
            }
        
        # Si no hay modelos disponibles, retornar error
        if not available_models:
            return {
                "ensemble_prediction": None,
                "confidence": None,
                "raw_prediction": None,
                "disponible": False,
                "error": "No hay modelos disponibles para predicción",
                "model_predictions": model_predictions,
                "metadata": {
                    "weights": weights,
                    "timestamp": datetime.now().isoformat()
                }
            }
        
        # Ajustar pesos para usar solo modelos disponibles
        adjusted_weights = {}
        for model in available_models:
            if model in weights:
                adjusted_weights[model] = weights[model]
        
        # Normalizar pesos
        total_weight = sum(adjusted_weights.values())
        if total_weight > 0:
            adjusted_weights = {k: v/total_weight for k, v in adjusted_weights.items()}
        else:
            # Si no hay pesos válidos, usar pesos iguales
            adjusted_weights = {k: 1.0/len(available_models) for k in available_models}
        
        # Calcular predicción ensemble con los modelos disponibles
        ensemble_result = self.calculate_prediction_ensemble(
            {k: v for k, v in model_predictions.items() if k in available_models},
            adjusted_weights
        )
        
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
                "adjusted_weights": adjusted_weights,
                "timestamp": datetime.now().isoformat(),
                "models_used": available_models
            }
        }
        
        return result