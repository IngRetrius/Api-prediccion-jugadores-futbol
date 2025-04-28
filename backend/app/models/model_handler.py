"""
Gestión de modelos predictivos y procesamiento de datos.
Versión mejorada para alinear predicciones con el entrenamiento original.
"""
import os
import pickle
import numpy as np
import pandas as pd
from loguru import logger
from typing import Dict, List, Tuple, Union, Optional, Any
import time
from datetime import datetime, timedelta
from scipy.stats import poisson, linregress
import keras
from keras.models import load_model 
from collections import defaultdict
try:
    import tensorflow as tf
    HAS_TF = True
except ImportError:
    HAS_TF = False
    def load_model(path):
        raise ImportError("TensorFlow no está disponible") 
from sklearn.preprocessing import RobustScaler

from app.config import (
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


# Nuevas funciones auxiliares para mejorar la predicción
def calcular_tendencia_robusta(serie, ventanas=[3, 5, 7]):
    """
    Calcula la tendencia de una serie de forma más robusta usando múltiples 
    ventanas temporales y promediando los resultados (idéntico al entrenamiento).
    
    Args:
        serie: Serie de datos
        ventanas: Tamaños de ventana para calcular la tendencia
    
    Returns:
        Serie con la tendencia calculada
    """
    tendencias = pd.Series(0, index=serie.index)
    pesos = {3: 0.5, 5: 0.3, 7: 0.2}  # Pesos para diferentes ventanas
    
    for ventana in ventanas:
        if len(serie) >= ventana:
            for i in range(ventana, len(serie) + 1):
                try:
                    # Obtener datos de la ventana actual
                    datos_ventana = serie.iloc[i-ventana:i].values
                    x = np.arange(ventana)
                    # Regresión lineal para calcular la pendiente
                    slope, _, _, _, _ = linregress(x, datos_ventana)
                    idx = serie.index[i-1]
                    tendencias.loc[idx] += slope * pesos[ventana]
                except:
                    pass
    
    return tendencias


def redondeo_probabilistico_mejorado(predicciones, varianza=0.1):
    """
    Implementa el redondeo probabilístico con varianza ajustable, 
    idéntico al usado en entrenamiento.
    
    Args:
        predicciones: Array de predicciones continuas
        varianza: Varianza para el muestreo aleatorio
    
    Returns:
        Array de predicciones enteras
    """
    predicciones_redondeadas = []
    
    for pred in predicciones:
        # Asegurar que no sea negativo
        pred = max(0, pred)
        
        # Parte entera
        parte_entera = int(np.floor(pred))
        
        # Parte decimal como probabilidad, ajustada por la varianza
        parte_decimal = pred - parte_entera
        
        # Ajustar probabilidad con varianza (más robusto)
        prob_ajustada = np.clip(parte_decimal + np.random.normal(0, varianza), 0, 1)
        
        # Redondeo probabilístico
        if np.random.random() < prob_ajustada:
            resultado = parte_entera + 1
        else:
            resultado = parte_entera
            
        predicciones_redondeadas.append(resultado)
            
    return np.array(predicciones_redondeadas)


def calcular_factores_oponente(df_jugador, oponente_actual=None):
    """
    Calcula factores avanzados para oponentes, incluyendo rendimiento histórico
    y similitud entre equipos (similar al entrenamiento).
    
    Args:
        df_jugador: DataFrame con los datos del jugador
        oponente_actual: Nombre del oponente actual (opcional)
    
    Returns:
        DataFrame actualizado con factores de oponente y factor específico para el oponente actual
    """
    # Inicializar factor básico
    df_jugador['Factor_Oponente'] = 1.0
    factor_oponente_actual = 1.0
    
    # Calcular el factor tradicional basado en historial directo
    oponentes_unicos = df_jugador['Oponente_Estandarizado'].unique()
    
    for oponente in oponentes_unicos:
        df_oponente = df_jugador[df_jugador['Oponente_Estandarizado'] == oponente].copy()
        
        for idx, row in df_oponente.iterrows():
            fecha_actual = row['Fecha']
            # Historial directo contra este oponente
            hist_directo = df_oponente[(df_oponente['Fecha'] < fecha_actual)]
            
            factor = 1.0
            if len(hist_directo) > 0:
                promedio_vs_oponente = hist_directo['Goles'].mean()
                # Normalizar para crear un factor multiplicativo
                factor = (promedio_vs_oponente + 1) / (df_jugador['Goles'].mean() + 1)
                
                # Dar más peso a partidos recientes (últimos 3)
                hist_reciente = hist_directo.sort_values('Fecha').tail(3)
                if len(hist_reciente) > 0:
                    factor_reciente = (hist_reciente['Goles'].mean() + 1) / (df_jugador['Goles'].mean() + 1)
                    # Combinar factor histórico (peso 0.7) y reciente (peso 0.3)
                    factor = 0.7 * factor + 0.3 * factor_reciente
            
            df_jugador.loc[idx, 'Factor_Oponente'] = factor
            
            # Si es el oponente actual, guardar el factor
            if oponente == oponente_actual:
                factor_oponente_actual = factor
    
    return df_jugador, factor_oponente_actual


def crear_secuencias(df, caracteristicas, ventana=3, include_labels=False):
    """
    Crea secuencias para el modelo LSTM, igual que en el entrenamiento.
    
    Args:
        df: DataFrame con datos históricos
        caracteristicas: Lista de características a incluir
        ventana: Número de partidos anteriores a considerar
        include_labels: Si se deben incluir etiquetas (False para predicción)
    
    Returns:
        Tupla con X, y, fechas, oponentes
    """
    if df.empty:
        return np.array([]), np.array([]), [], []
    
    X, y, fechas, oponentes = [], [], [], []
    
    # Si solo necesitamos X para predecir (sin etiquetas)
    if not include_labels:
        # Usar los últimos 'ventana' registros
        if len(df) >= ventana:
            ultimos_datos = df.iloc[-ventana:][caracteristicas].values
            X.append(ultimos_datos)
            fechas.append(df.iloc[-1]['Fecha'])
            oponentes.append(df.iloc[-1]['Oponente_Estandarizado'])
    else:
        # Crear secuencias para entrenamiento/validación
        for i in range(ventana, len(df)):
            # Secuencia de ventana partidos anteriores
            X.append(df.iloc[i-ventana:i][caracteristicas].values)
            
            # Variable objetivo: Número exacto de goles
            y.append(df.iloc[i]['Goles'])
            
            # Información adicional para análisis
            fechas.append(df.iloc[i]['Fecha'])
            oponentes.append(df.iloc[i]['Oponente_Estandarizado'])
    
    return np.array(X), np.array(y), fechas, oponentes


# Clase para mantener un caché de contexto de predicciones por jugador
class PredictionContext:
    """Mantiene un contexto de predicciones previas para cada jugador."""
    
    def __init__(self, max_context_size=10):
        """Inicializar el contexto de predicciones."""
        self.contexts = defaultdict(list)
        self.max_context_size = max_context_size
    
    def add_prediction(self, player_name, match_data, prediction_result):
        """
        Añadir una predicción al contexto del jugador.
        
        Args:
            player_name: Nombre del jugador
            match_data: Datos del partido
            prediction_result: Resultado de la predicción
        """
        context = self.contexts[player_name]
        context.append({
            "match_data": match_data.copy() if isinstance(match_data, dict) else match_data,
            "prediction": prediction_result.get("raw_prediction", 0) if isinstance(prediction_result, dict) else prediction_result,
            "timestamp": datetime.now().isoformat()
        })
        
        # Mantener solo los últimos N contextos
        if len(context) > self.max_context_size:
            context.pop(0)
    
    def get_context(self, player_name):
        """Obtener el contexto de predicciones de un jugador."""
        return self.contexts.get(player_name, [])
    
    def clear_context(self, player_name=None):
        """Limpiar el contexto de predicciones."""
        if player_name is None:
            self.contexts.clear()
        else:
            self.contexts[player_name] = []


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
            
            # Buscar modelo específico del tipo si existe
            if not os.path.exists(pkl_model_path):
                # Buscar modelos alternativos: simple, bidireccional, gru, ensemble
                model_types = ["simple", "bidireccional", "gru", "ensemble"]
                for tipo in model_types:
                    alt_pkl = os.path.join(model_dir, f"{player_name}_{tipo}.pkl")
                    alt_h5 = os.path.join(model_dir, f"{player_name}_{tipo}.h5")
                    if os.path.exists(alt_pkl) and os.path.exists(alt_h5):
                        pkl_model_path = alt_pkl
                        h5_model_path = alt_h5
                        logger.info(f"Encontrado modelo LSTM alternativo: {tipo} para {player_name}")
                        break
            
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
                                    'Sede_Local', 'Sede_Visitante', 'Factor_Oponente', 
                                    'Goles_Prom_3', 'Goles_Prom_5',
                                    'Marco_Ultimo_Partido', 'Goles_Ult_3', 'Tendencia_Robusta',
                                    'Es_FinDeSemana', 'Racha_Con_Gol'
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
            if model_type == "lstm":
                tipo_modelo = model_data.get('tipo_modelo', model_data.get('modelo_config', {}).get('tipo_modelo', 'simple'))
                h5_file = f"{player_name}_{tipo_modelo}.h5"
                h5_path = os.path.join(model_dir, h5_file)
                
                # Si no existe este H5, buscar el H5 general
                if not os.path.exists(h5_path):
                    h5_path = os.path.join(model_dir, f"lstm_{player_name}.h5")
                    
                if os.path.exists(h5_path):
                    try:
                        if HAS_TF:
                            model_data["modelo_keras"] = load_model(h5_path)
                            logger.info(f"Modelo Keras para {player_name} cargado correctamente: {h5_path}")
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
                scaler_file = f"{player_name}_{tipo_modelo}_scaler.pkl"
                scaler_path = os.path.join(model_dir, scaler_file)
                
                # Si no existe este scaler, buscar el scaler general
                if not os.path.exists(scaler_path):
                    scaler_path = os.path.join(model_dir, f"lstm_{player_name}_scaler.pkl")
                
                if os.path.exists(scaler_path):
                    try:
                        with open(scaler_path, 'rb') as f:
                            model_data["scaler"] = pickle.load(f)
                        logger.info(f"Scaler para {player_name} cargado correctamente: {scaler_path}")
                    except Exception as e:
                        logger.error(f"Error al cargar scaler: {str(e)}")
                        model_data["scaler"] = None
                else:
                    logger.warning(f"Archivo scaler no encontrado: {scaler_path}")
                    model_data["scaler"] = None
                    
                # Verificar si el modelo LSTM está realmente disponible
                if model_data.get("modelo_keras") is None and model_data.get("modelo_entrenado") is None:
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
        self.prediction_context = PredictionContext(max_context_size=10)
        
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
        
        # Obtener contexto de predicciones previas
        prediction_context = self.prediction_context.get_context(player_name)
        
        # Características según el modelo
        if model_type == "lstm":
            return await self._prepare_lstm_features(player_name, player_history, match_data, prediction_context)
        elif model_type == "sarimax":
            return await self._prepare_sarimax_features(player_name, player_history, match_data, prediction_context)
        elif model_type == "poisson":
            return await self._prepare_poisson_features(player_name, player_history, match_data, prediction_context)
        else:
            raise ValueError(f"Tipo de modelo no válido: {model_type}")
    
    async def _prepare_lstm_features(
        self, 
        player_name: str, 
        history_df: pd.DataFrame, 
        match_data: dict, 
        prediction_context: List[dict] = None
    ):
        """
        Preparar características para modelo LSTM, emulando el procesamiento 
        secuencial usado en entrenamiento.
        """
        # Cargar modelo para obtener configuración
        model_data = await self.model_loader.load_model("lstm", player_name)
        
        # Verificar disponibilidad del modelo
        if not model_data.get("disponible", False):
            return {
                "error": model_data.get("error", "Modelo LSTM no disponible"),
                "disponible": False
            }
        
        # Obtener configuración del modelo
        model_config = model_data.get('modelo_config', {})
        window_size = model_config.get('ventana', DEFAULT_WINDOW_SIZE)
        
        # Características del modelo basadas en el código de entrenamiento
        default_features = [
            'Tiros_a_puerta', 'Tiros_totales', 'Minutos',
            'Sede_Local', 'Sede_Visitante', 'Factor_Oponente', 
            'Goles_Prom_3', 'Goles_Prom_5',
            'Marco_Ultimo_Partido', 'Goles_Ult_3', 'Tendencia_Robusta',
            'Es_FinDeSemana', 'Racha_Con_Gol', 'Goles_Prom_7'
        ]
        
        # Usar características del modelo si están disponibles
        model_features = model_config.get('caracteristicas', default_features)
        
        # Preparar las características adicionales basadas en el historial
        df_work = history_df.copy()
        
        # Normalizar nombres de columnas (convertir espacios a guiones bajos)
        rename_dict = {}
        for col in df_work.columns:
            if ' ' in col:
                rename_dict[col] = col.replace(' ', '_')
        if rename_dict:
            df_work = df_work.rename(columns=rename_dict)
            
        # Incorporar predicciones anteriores al historial si hay contexto
        if prediction_context and len(prediction_context) > 0:
            # Ordenar contexto por timestamp
            sorted_context = sorted(prediction_context, key=lambda x: x.get('timestamp', ''))
            
            # Crear filas temporales con predicciones previas
            temp_rows = []
            for pred_ctx in sorted_context:
                ctx_match = pred_ctx.get('match_data', {})
                ctx_pred = pred_ctx.get('prediction', 0)
                
                # Crear una nueva fila con la predicción como si fuera un resultado real
                new_row = match_data.copy()  # Usar estructura de dato actual como plantilla
                new_row['Fecha'] = pd.to_datetime(ctx_match.get('Fecha', datetime.now()))
                new_row['Goles'] = ctx_pred
                temp_rows.append(new_row)
            
            # Si hay filas temporales, añadirlas al DataFrame
            if temp_rows:
                # Convertir a DataFrame y asegurar compatibilidad de columnas
                temp_df = pd.DataFrame(temp_rows)
                
                # Asegurar que tenga las mismas columnas que df_work
                for col in df_work.columns:
                    if col not in temp_df.columns:
                        temp_df[col] = 0
                
                # Añadir solo las columnas que existen en df_work
                temp_df = temp_df[df_work.columns.intersection(temp_df.columns)]
                
                # Concatenar con el historial original
                df_work = pd.concat([df_work, temp_df]).sort_values('Fecha')
                logger.info(f"Incorporadas {len(temp_rows)} predicciones previas al historial de {player_name}")
        
        # 1. Preparar variables específicas del modelo LSTM
        # Promedios móviles de goles (múltiples ventanas)
        ventanas = [3, 5, 7, 10]
        for ventana in ventanas:
            if len(df_work) >= ventana:
                col_name = f'Goles_Prom_{ventana}'
                df_work[col_name] = df_work['Goles'].rolling(window=ventana, min_periods=1).mean()
        
        # Variables para marcar partidos recientes
        if 'Goles' in df_work.columns:
            df_work['Marco_Ultimo_Partido'] = df_work['Goles'].shift(1).fillna(0)
            df_work['Goles_Ult_3'] = df_work['Goles'].rolling(window=3, min_periods=1).sum()
            df_work['Goles_Ult_5'] = df_work['Goles'].rolling(window=5, min_periods=1).sum()
            
            # Secuencias de partidos con/sin gol (racha)
            goles_binario = (df_work['Goles'] > 0).astype(int)
            df_work['Racha_Con_Gol'] = goles_binario.groupby((goles_binario != goles_binario.shift()).cumsum()).cumcount()
        
        # Factor de oponente usando la función mejorada
        opponent_std = match_data.get('Oponente_Estandarizado', '')
        df_work, factor_oponente = calcular_factores_oponente(df_work, opponent_std)
        match_data['Factor_Oponente'] = factor_oponente
        
        # Calcular tendencia robusta
        if 'Goles' in df_work.columns:
            df_work['Tendencia_Robusta'] = calcular_tendencia_robusta(df_work['Goles'])
            
            # Si no hay suficientes datos para calcular tendencia, usar 0
            if df_work['Tendencia_Robusta'].isna().all():
                df_work['Tendencia_Robusta'] = 0
                
        # Agregar características de día de la semana
        match_data['Es_FinDeSemana'] = 0
        if 'Fecha' in match_data and isinstance(match_data['Fecha'], (datetime, pd.Timestamp)):
            weekday = match_data['Fecha'].weekday()
            match_data['Es_FinDeSemana'] = 1 if weekday >= 4 else 0
        
        # 2. Crear la matriz de características para LSTM
        # Generar una fila temporal con los datos del partido a predecir
        temp_match = match_data.copy()
        
        # Asegurar que todas las características necesarias estén presentes
        for feat in model_features:
            if feat not in temp_match and feat in df_work.columns:
                # Tomar el último valor disponible
                if len(df_work) > 0:
                    temp_match[feat] = df_work[feat].iloc[-1] if not df_work[feat].isna().all() else 0
                else:
                    temp_match[feat] = 0
        
        # 3. Crear la secuencia para el modelo LSTM
        # Usar el método de crear_secuencias del entrenamiento
        if len(df_work) >= window_size:
            # Seleccionar solo características disponibles
            available_features = [f for f in model_features if f in df_work.columns]
            
            # Crear secuencia para el modelo
            X, _, fechas, oponentes = crear_secuencias(
                df_work, available_features, ventana=window_size, include_labels=False
            )
            
            return {
                "X": X,
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
    
    async def _prepare_sarimax_features(
        self, 
        player_name: str, 
        history_df: pd.DataFrame, 
        match_data: dict,
        prediction_context: List[dict] = None
    ):
        """
        Preparar características para modelo SARIMAX, considerando series temporales
        y predicciones anteriores.
        """
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
        
        # Preparar DataFrame de trabajo
        df_work = history_df.copy()
        
        # Normalizar nombres de columnas
        rename_dict = {}
        for col in df_work.columns:
            if ' ' in col:
                rename_dict[col] = col.replace(' ', '_')
        if rename_dict:
            df_work = df_work.rename(columns=rename_dict)
            
        # Incorporar predicciones anteriores al historial si hay contexto
        if prediction_context and len(prediction_context) > 0:
            # Ordenar contexto por timestamp
            sorted_context = sorted(prediction_context, key=lambda x: x.get('timestamp', ''))
            
            # Crear filas temporales con predicciones previas
            temp_rows = []
            for pred_ctx in sorted_context:
                ctx_match = pred_ctx.get('match_data', {})
                ctx_pred = pred_ctx.get('prediction', 0)
                
                # Crear una nueva fila con la predicción como si fuera un resultado real
                new_row = {}
                for key, value in ctx_match.items():
                    if key in df_work.columns:
                        new_row[key] = value
                
                new_row['Fecha'] = pd.to_datetime(ctx_match.get('Fecha', datetime.now()))
                new_row['Goles'] = ctx_pred
                temp_rows.append(new_row)
            
            # Si hay filas temporales, añadirlas al DataFrame
            if temp_rows:
                # Convertir a DataFrame y asegurar compatibilidad de columnas
                temp_df = pd.DataFrame(temp_rows)
                
                # Añadir solo las columnas que existen en df_work
                for col in df_work.columns:
                    if col not in temp_df.columns:
                        temp_df[col] = None
                
                temp_df = temp_df[df_work.columns.intersection(temp_df.columns)]
                
                # Concatenar con el historial original y ordenar por fecha
                df_work = pd.concat([df_work, temp_df]).sort_values('Fecha')
                logger.info(f"Incorporadas {len(temp_rows)} predicciones previas al historial SARIMAX de {player_name}")
        
        # Obtener lista de variables exógenas
        variables_exogenas = model_data.get('modelo_config', {}).get('variables_exogenas', [])
        
        # Preparar datos exógenos para predicción
        exog_data = {}
        
        # MEJORA: Asegurar que las características clave estén disponibles
        # Si match_data no tiene estas características, estimarlas desde el historial
        caracteristicas_clave = ['Tiros_a_puerta', 'Tiros_totales', 'Minutos']
        
        # Añadir caractéristicas clave si no están presentes
        for caracteristica in caracteristicas_clave:
            # Verificar tanto con espacios como con guiones bajos
            caract_con_espacio = caracteristica.replace('_', ' ')
            caract_con_guion = caracteristica.replace(' ', '_')
            
            # Si no está en match_data, intentar estimarla
            if caracteristica not in match_data and caract_con_espacio not in match_data and caract_con_guion not in match_data:
                # Buscar en el historial
                if caracteristica in df_work.columns:
                    # Calcular promedio de últimos 5 partidos si hay suficientes
                    if len(df_work) >= 5:
                        valor_estimado = df_work[caracteristica].tail(5).mean()
                    else:
                        valor_estimado = df_work[caracteristica].mean()
                    
                    # Si sigue siendo NaN, usar valores típicos por defecto
                    if pd.isna(valor_estimado):
                        if caracteristica == 'Tiros_a_puerta':
                            valor_estimado = 1.5
                        elif caracteristica == 'Tiros_totales':
                            valor_estimado = 2.5
                        elif caracteristica == 'Minutos':
                            valor_estimado = 90.0
                        else:
                            valor_estimado = 0.0
                            
                # Si no está en el historial, usar valores por defecto
                else:
                    if caracteristica == 'Tiros_a_puerta':
                        valor_estimado = 1.5
                    elif caracteristica == 'Tiros_totales':
                        valor_estimado = 2.5
                    elif caracteristica == 'Minutos':
                        valor_estimado = 90.0
                    else:
                        valor_estimado = 0.0
                
                # Añadir a match_data
                match_data[caracteristica] = valor_estimado
                logger.info(f"Característica '{caracteristica}' estimada para {player_name}: {valor_estimado}")
        
        # Características calculadas automáticamente
        # 1. Calcular promedios móviles
        if len(df_work) > 0:
            df_work['Goles_Prom_3'] = df_work['Goles'].rolling(window=3, min_periods=1).mean()
            df_work['Goles_Prom_5'] = df_work['Goles'].rolling(window=5, min_periods=1).mean()
        
        # 2. Calcular factores de oponente
        opponent_std = match_data.get('Oponente_Estandarizado', '')
        df_work, factor_oponente = calcular_factores_oponente(df_work, opponent_std)
        match_data['Factor_Oponente'] = factor_oponente
        
        # 3. Calcular tendencia reciente
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
            
        # 4. Calcular promedio histórico vs oponente
        hist_vs_opponent = df_work[df_work['Oponente_Estandarizado'] == opponent_std]
        if len(hist_vs_opponent) > 0:
            promedio_vs_oponente = hist_vs_opponent['Goles'].mean()
            match_data['Promedio_Historico_vs_Oponente'] = promedio_vs_oponente
        else:
            match_data['Promedio_Historico_vs_Oponente'] = df_work['Goles'].mean() if len(df_work) > 0 else 0.0
        
        # Preparar datos exógenos según las variables del modelo
        for var in variables_exogenas:
            if var in match_data:
                exog_data[var] = match_data[var]
            elif var == 'Promedio_Historico_vs_Oponente':
                exog_data[var] = match_data.get('Promedio_Historico_vs_Oponente', 0.0)
            elif var == 'Tendencia_Reciente':
                exog_data[var] = match_data.get('Tendencia_Reciente', 1.0)
            elif var in df_work.columns and len(df_work) > 0:
                # Usar el último valor disponible
                exog_data[var] = df_work[var].iloc[-1] if not df_work[var].isna().all() else 0
            else:
                # MEJORA: Para otras variables, usar valores estimados más inteligentes
                if var.startswith('Tiros_a_puerta') or var == 'Tiros a puerta':
                    exog_data[var] = match_data.get('Tiros_a_puerta', 1.5)
                elif var.startswith('Tiros_totales') or var == 'Tiros totales':
                    exog_data[var] = match_data.get('Tiros_totales', 2.5)
                elif var.startswith('Minutos'):
                    exog_data[var] = match_data.get('Minutos', 90.0)
                elif var.startswith('Goles_Prom_'):
                    # Extraer el número de la ventana
                    try:
                        ventana = int(var.split('_')[-1])
                        if len(df_work) >= ventana:
                            exog_data[var] = df_work['Goles'].tail(ventana).mean()
                        else:
                            exog_data[var] = df_work['Goles'].mean() if len(df_work) > 0 else 0.3
                    except:
                        exog_data[var] = 0.3  # Valor por defecto para promedios de goles
                else:
                    # Para otras variables, usar un valor por defecto
                    exog_data[var] = 0.0
        
        # MEJORA: Generar versiones normalizadas de todas las variables si se necesitan
        # Normalizar variables si hay información de normalización
        normalizacion = model_data.get('normalizacion', {})
        
        # Verificar si se necesitan variables normalizadas
        for var in variables_exogenas:
            if var.endswith('_norm'):
                # Extraer el nombre base
                base_var = var.replace('_norm', '')
                
                # Si tenemos la versión base y la información de normalización
                if base_var in exog_data:
                    # Normalizar usando estadísticas guardadas o estimadas
                    if base_var in normalizacion:
                        media = normalizacion[base_var].get('mean', 0)
                        std = normalizacion[base_var].get('std', 1)
                    else:
                        # Estimar estadísticas desde el historial
                        if base_var in df_work.columns:
                            media = df_work[base_var].mean()
                            std = df_work[base_var].std()
                        else:
                            # Valores por defecto
                            media = 0
                            std = 1
                    
                    # Calcular valor normalizado
                    if std > 0:
                        exog_data[var] = (exog_data[base_var] - media) / std
                    else:
                        exog_data[var] = 0
                else:
                    # Si no tenemos la versión base, usar un valor por defecto
                    exog_data[var] = 0
        
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
            "historical_data": df_work,
            "disponible": True
        }
    
    async def _prepare_poisson_features(
        self, 
        player_name: str, 
        history_df: pd.DataFrame, 
        match_data: dict,
        prediction_context: List[dict] = None
    ):
        """
        Preparar características para modelo Poisson, considerando el contexto y tendencias.
        """
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
         
        # MEJORA: Asegurar que las características clave estén disponibles
        # Si match_data no tiene estas características, estimarlas desde el historial
        caracteristicas_clave = ['Tiros_a_puerta', 'Tiros_totales', 'Minutos']
        
        # Añadir caractéristicas clave si no están presentes
        for caracteristica in caracteristicas_clave:
            # Verificar tanto con espacios como con guiones bajos
            caract_con_espacio = caracteristica.replace('_', ' ')
            caract_con_guion = caracteristica.replace(' ', '_')
            
            # Si no está en match_data, intentar estimarla
            if caracteristica not in match_data and caract_con_espacio not in match_data and caract_con_guion not in match_data:
                # Buscar en el historial
                if caracteristica in df_work.columns:
                    # Calcular promedio de últimos 5 partidos si hay suficientes
                    if len(df_work) >= 5:
                        valor_estimado = df_work[caracteristica].tail(5).mean()
                    else:
                        valor_estimado = df_work[caracteristica].mean()
                    
                    # Si sigue siendo NaN, usar valores típicos por defecto
                    if pd.isna(valor_estimado):
                        if caracteristica == 'Tiros_a_puerta':
                            valor_estimado = 1.5
                        elif caracteristica == 'Tiros_totales':
                            valor_estimado = 2.5
                        elif caracteristica == 'Minutos':
                            valor_estimado = 90.0
                        else:
                            valor_estimado = 0.0
                            
                # Si no está en el historial, usar valores por defecto
                else:
                    if caracteristica == 'Tiros_a_puerta':
                        valor_estimado = 1.5
                    elif caracteristica == 'Tiros_totales':
                        valor_estimado = 2.5
                    elif caracteristica == 'Minutos':
                        valor_estimado = 90.0
                    else:
                        valor_estimado = 0.0
                
                # Añadir a match_data
                match_data[caracteristica] = valor_estimado
                logger.info(f"Característica '{caracteristica}' estimada para {player_name}: {valor_estimado}")
            
        # Incorporar predicciones anteriores si hay contexto
        if prediction_context and len(prediction_context) > 0:
            # Ordenar contexto por timestamp
            sorted_context = sorted(prediction_context, key=lambda x: x.get('timestamp', ''))
            
            # Crear filas temporales con predicciones previas
            temp_rows = []
            for pred_ctx in sorted_context:
                ctx_match = pred_ctx.get('match_data', {})
                ctx_pred = pred_ctx.get('prediction', 0)
                
                # Crear una nueva fila con la predicción como si fuera un resultado real
                new_row = {}
                for key, value in ctx_match.items():
                    if key in df_work.columns:
                        new_row[key] = value
                
                new_row['Fecha'] = pd.to_datetime(ctx_match.get('Fecha', datetime.now()))
                new_row['Goles'] = ctx_pred
                temp_rows.append(new_row)
            
            # Si hay filas temporales, añadirlas al DataFrame
            if temp_rows:
                # Convertir a DataFrame y asegurar compatibilidad de columnas
                temp_df = pd.DataFrame(temp_rows)
                
                # Añadir solo las columnas que existen en df_work
                for col in df_work.columns:
                    if col not in temp_df.columns:
                        temp_df[col] = None
                
                temp_df = temp_df[df_work.columns.intersection(temp_df.columns)]
                
                # Concatenar con el historial original y ordenar por fecha
                df_work = pd.concat([df_work, temp_df]).sort_values('Fecha')
                logger.info(f"Incorporadas {len(temp_rows)} predicciones previas al historial Poisson de {player_name}")
        
        # Calcular promedios móviles como en entrenamiento
        df_work['Goles_Prom_3'] = df_work['Goles'].rolling(window=3, min_periods=1).mean()
        df_work['Goles_Prom_5'] = df_work['Goles'].rolling(window=5, min_periods=1).mean()
        
        # Calcular factores de oponente
        opponent_std = match_data.get('Oponente_Estandarizado', '')
        df_work, factor_oponente = calcular_factores_oponente(df_work, opponent_std)
        match_data['Factor_Oponente'] = factor_oponente
        
        # Calcular tendencia usando regresión lineal como en el entrenamiento
        if len(df_work) >= 5:
            try:
                # Usar los últimos 5 partidos para la tendencia
                recent_form = df_work['Goles'].iloc[-5:].values
                from scipy import stats
                slope, _, _, _, _ = stats.linregress(range(len(recent_form)), recent_form)
                match_data['Tendencia'] = slope
            except:
                match_data['Tendencia'] = 0
        else:
            match_data['Tendencia'] = 0
        
        # Preparar variables para la fórmula
        formula_vars = {}
        normalizacion = model_data.get('normalization_info', {})
        
        # MEJORA: Procesar los términos de la fórmula y asegurar que todos están disponibles
        for feature in formula_terms:
            if feature in match_data:
                formula_vars[feature] = match_data[feature]
            elif feature.startswith('Goles_Prom_'):
                # Usar los valores calculados de promedios móviles
                if feature in df_work.columns and len(df_work) > 0:
                    formula_vars[feature] = df_work[feature].iloc[-1] if not df_work[feature].isna().all() else 0.0
                else:
                    # Si no está disponible, extraer el número de ventana y calcular
                    try:
                        ventana = int(feature.split('_')[-1])
                        if len(df_work) >= ventana:
                            formula_vars[feature] = df_work['Goles'].tail(ventana).mean()
                        else:
                            formula_vars[feature] = df_work['Goles'].mean() if len(df_work) > 0 else 0.3
                    except:
                        formula_vars[feature] = 0.3
            elif feature == 'Factor_Oponente':
                formula_vars[feature] = match_data.get('Factor_Oponente', 1.0)
            elif feature == 'Tendencia':
                formula_vars[feature] = match_data.get('Tendencia', 0)
            elif feature.endswith('_norm'):
                # Buscar la versión original y normalizarla
                base_feature = feature.replace('_norm', '')
                
                # MEJORA: Manejar mejor la normalización
                if base_feature in match_data:
                    # Aplicar normalización si hay información disponible
                    if base_feature in normalizacion:
                        media = normalizacion[base_feature].get('mean', 0)
                        std = normalizacion[base_feature].get('std', 1)
                        if std > 0:
                            formula_vars[feature] = (match_data[base_feature] - media) / std
                        else:
                            formula_vars[feature] = 0
                    else:
                        # Si no hay información, usar promedio y std del historial
                        if base_feature in df_work.columns:
                            media = df_work[base_feature].mean()
                            std = df_work[base_feature].std()
                            if std > 0:
                                formula_vars[feature] = (match_data[base_feature] - media) / std
                            else:
                                formula_vars[feature] = 0
                        else:
                            formula_vars[feature] = 0
                elif base_feature in df_work.columns and len(df_work) > 0:
                    # Si no está en match_data pero sí en historial, usar último valor
                    base_value = df_work[base_feature].iloc[-1] if not df_work[base_feature].isna().all() else 0
                    
                    # Normalizar
                    if base_feature in normalizacion:
                        media = normalizacion[base_feature].get('mean', 0)
                        std = normalizacion[base_feature].get('std', 1)
                        if std > 0:
                            formula_vars[feature] = (base_value - media) / std
                        else:
                            formula_vars[feature] = 0
                    else:
                        # Normalizar con estadísticas del historial
                        media = df_work[base_feature].mean()
                        std = df_work[base_feature].std()
                        if std > 0:
                            formula_vars[feature] = (base_value - media) / std
                        else:
                            formula_vars[feature] = 0
                else:
                    # MEJORA: Manejar casos especiales para características normalizadas
                    if base_feature == 'Tiros_a_puerta' or base_feature == 'Tiros a puerta':
                        base_value = match_data.get('Tiros_a_puerta', 1.5)
                        # Normalizar con valores típicos si no hay información específica
                        media = normalizacion.get(base_feature, {}).get('mean', 1.2)
                        std = normalizacion.get(base_feature, {}).get('std', 0.8)
                        formula_vars[feature] = (base_value - media) / std if std > 0 else 0
                    elif base_feature == 'Tiros_totales' or base_feature == 'Tiros totales':
                        base_value = match_data.get('Tiros_totales', 2.5)
                        media = normalizacion.get(base_feature, {}).get('mean', 2.0)
                        std = normalizacion.get(base_feature, {}).get('std', 1.2)
                        formula_vars[feature] = (base_value - media) / std if std > 0 else 0
                    elif base_feature == 'Minutos':
                        base_value = match_data.get('Minutos', 90.0)
                        media = normalizacion.get(base_feature, {}).get('mean', 78.0)
                        std = normalizacion.get(base_feature, {}).get('std', 20.0)
                        formula_vars[feature] = (base_value - media) / std if std > 0 else 0
                    else:
                        formula_vars[feature] = 0
            else:
                # MEJORA: Para otras variables, buscar en datos históricos y usar valores más inteligentes
                if feature in df_work.columns and len(df_work) > 0:
                    formula_vars[feature] = df_work[feature].iloc[-1] if not df_work[feature].isna().all() else 0
                elif feature == 'Tiros_a_puerta' or feature == 'Tiros a puerta':
                    formula_vars[feature] = match_data.get('Tiros_a_puerta', 1.5)
                elif feature == 'Tiros_totales' or feature == 'Tiros totales':
                    formula_vars[feature] = match_data.get('Tiros_totales', 2.5)
                elif feature == 'Minutos':
                    formula_vars[feature] = match_data.get('Minutos', 90.0)
                elif feature.startswith('Sede_'):
                    # Manejar variables de sede (local/visitante)
                    if feature == 'Sede_Local':
                        formula_vars[feature] = 1 if match_data.get('Es_Local', False) else 0
                    elif feature == 'Sede_Visitante':
                        formula_vars[feature] = 0 if match_data.get('Es_Local', False) else 1
                    else:
                        formula_vars[feature] = 0
                else:
                    # Valor por defecto
                    formula_vars[feature] = 0
        
        # Agregar oponente específico si está en los términos de la fórmula
        oponente_col = f"Oponente_{opponent_std}"
        if oponente_col in formula_terms:
            formula_vars[oponente_col] = 1
        
        # MEJORA: Verificar que todos los términos de fórmula tienen un valor asignado
        missing_features = [term for term in formula_terms if term not in formula_vars]
        if missing_features:
            logger.warning(f"Términos de fórmula faltantes para {player_name}: {missing_features}")
            # Asignar valores por defecto a términos faltantes
            for term in missing_features:
                formula_vars[term] = 0
                logger.info(f"Asignado valor por defecto 0 a término '{term}'")
        
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
            processed_data = await self.prepare_prediction_features(
                player_name, match_data, model_type
            )
            
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
                result = self._predict_lstm(model_data, prediction_input)
            elif model_type == "sarimax":
                result = self._predict_sarimax(model_data, prediction_input)
            elif model_type == "poisson":
                result = self._predict_poisson(model_data, prediction_input)
            else:
                raise ValueError(f"Tipo de modelo no válido: {model_type}")
            
            # Actualizar contexto de predicciones con el resultado
            if result.get("disponible", False) and "raw_prediction" in result:
                self.prediction_context.add_prediction(
                    player_name, 
                    match_data, 
                    result["raw_prediction"]
                )
                
            return result
                
        except Exception as e:
            logger.error(f"Error en predicción con modelo {model_type} para {player_name}: {str(e)}")
            return {
                "error": f"Error en predicción: {str(e)}",
                "prediction": None,
                "confidence": None,
                "disponible": False
            }
    
    def _predict_lstm(self, model_data: dict, processed_data: dict) -> dict:
        """
        Predicción con modelo LSTM mejorada para coincidir con el entrenamiento.
        Incluye redondeo probabilístico y tratamiento especial de incompatibilidad de 
        características.
        """
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
                
                # Verificar compatibilidad de forma y realizar ajuste
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
                    
                    # Manejar incompatibilidad de forma preservando dimensiones importantes
                    if current_features != expected_features:
                        logger.warning(f"Incompatibilidad de características: modelo espera {expected_features}, datos tienen {current_features}")
                        
                        if current_features < expected_features:
                            # Rellenar con ceros en orden para mantener las características originales en las primeras posiciones
                            padding = np.zeros((n_samples, n_steps, expected_features - current_features))
                            X_norm = np.concatenate([X_norm, padding], axis=2)
                            logger.info(f"Datos ajustados a forma: {X_norm.shape}")
                        else:
                            # Si tenemos más características de las esperadas, usar las primeras (más importantes)
                            logger.warning(f"Truncando características de {current_features} a {expected_features}")
                            X_norm = X_norm[:, :, :expected_features]
                
                # Realizar múltiples predicciones y promediar para reducir variabilidad
                n_predicciones = 5
                predicciones = []
                
                for _ in range(n_predicciones):
                    pred_raw = modelo.predict(X_norm, verbose=0)
                    
                    # Extraer el valor predicho del resultado
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
                        
                    predicciones.append(pred)
                
                # Tomar el promedio para mayor estabilidad
                pred = np.mean(predicciones)
                
                # Aplicar redondeo probabilístico mejorado (igual al entrenamiento)
                pred_redondeada = redondeo_probabilistico_mejorado([pred])[0]
                
                # Calcular valores para la respuesta
                result["prediction"] = int(pred_redondeada)
                result["confidence"] = 1.0 - abs(pred - pred_redondeada)
                result["raw_prediction"] = float(pred)
                result["disponible"] = True
                
                # Añadir metadatos
                result["metadata"] = {
                    "model_type": "LSTM",
                    "architecture": model_data.get('modelo_config', {}).get('architecture', 'simple'),
                    "features_used": processed_data.get('features', []),
                    "original_shape": X.shape,
                    "expected_shape": expected_shape if expected_shape else "unknown",
                    "padding_applied": current_features != expected_features if expected_shape else False,
                    "n_predictions": n_predicciones,
                    "std_predictions": np.std(predicciones)
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
                
                # Usar redondeo probabilístico mejorado
                pred_redondeada = redondeo_probabilistico_mejorado([pred])[0]
                
                result["prediction"] = int(pred_redondeada)
                result["confidence"] = 1.0 - abs(pred - pred_redondeada)
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
        """Predicción con modelo SARIMAX mejorada para mejor manejo de formatos de resultado."""
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
                
                # Aplicar redondeo probabilístico mejorado (mismo que en entrenamiento)
                pred_redondeada = redondeo_probabilistico_mejorado([pred_val])[0]
                
                # Asignar resultados
                result["prediction"] = int(pred_redondeada)
                result["confidence"] = 1.0 - abs(pred_val - pred_redondeada)
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
        """
        Predicción con modelo Poisson mejorada para incluir distribución de probabilidad
        completa y mejorar precisión.
        """
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
                
                # Realizar múltiples predicciones para estabilidad
                n_repeticiones = 10
                predicciones = []
                
                for _ in range(n_repeticiones):
                    # Usar distribución de Poisson para generar una muestra
                    valor_muestra = np.random.poisson(lambda_pred)
                    predicciones.append(valor_muestra)
                
                # Tomar la moda como predicción final
                valores, conteo = np.unique(predicciones, return_counts=True)
                pred_final = valores[np.argmax(conteo)]
                
                # Calcular distribución de probabilidad
                probs = [poisson.pmf(i, lambda_pred) for i in range(6)]
                probs.append(1 - sum(probs))  # Probabilidad para 6+ goles
                
                # Calcular confianza como la probabilidad asociada al valor predicho
                confianza = poisson.pmf(pred_final, lambda_pred) if pred_final < 6 else probs[6]
                
                # Asignar resultados
                result["prediction"] = int(pred_final)
                result["confidence"] = float(confianza)
                result["raw_prediction"] = float(lambda_pred)
                result["disponible"] = True
                
                # Distribución de probabilidad completa
                result["probability_distribution"] = {
                    "0": float(probs[0]),
                    "1": float(probs[1]),
                    "2": float(probs[2]),
                    "3": float(probs[3]),
                    "4": float(probs[4]),
                    "5": float(probs[5]),
                    "6+": float(probs[6])
                }
                
                # Añadir metadatos
                result["metadata"] = {
                    "model_type": "Poisson",
                    "formula": model_data.get('modelo_config', {}).get('formula', ''),
                    "lambda": float(lambda_pred),
                    "num_repeticiones": n_repeticiones,
                    "predicciones": predicciones,
                    "moda": int(pred_final)
                }
            except Exception as e:
                logger.error(f"Error en predicción Poisson: {str(e)}")
                result["error"] = f"Error en predicción Poisson: {str(e)}"
        else:
            result["error"] = "Modelo Poisson no disponible o datos insuficientes"
        
        return result
    
    def calculate_prediction_ensemble(self, predictions: Dict[str, dict], weights: Dict[str, float] = None) -> dict:
        """
        Calcular predicción ensemble a partir de predicciones individuales con ponderación
        dinámica basada en confianza.
        
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
        
        # MEJORA: Ajustar pesos dinámicamente basado en la confianza del modelo
        dynamic_weights = {}
        
        for model, pred in available_predictions.items():
            # Peso base del modelo
            base_weight = weights.get(model, 1.0)
            
            # Factor de confianza (si existe)
            confidence = pred.get("confidence", 0.5)
            
            # Ajustar peso por confianza
            adjusted_weight = base_weight * (0.5 + confidence)
            
            dynamic_weights[model] = adjusted_weight
        
        # Normalizar pesos dinámicos
        total_weight = sum(dynamic_weights.values())
        if total_weight > 0:
            dynamic_weights = {k: v/total_weight for k, v in dynamic_weights.items()}
        else:
            # Si no hay pesos válidos, usar pesos iguales
            dynamic_weights = {k: 1.0/len(available_predictions) for k in available_predictions}
        
        # Calcular predicción ponderada
        weighted_sum = 0
        for model, pred in available_predictions.items():
            raw_pred = pred["raw_prediction"]
            weight = dynamic_weights.get(model, 0)
            weighted_sum += raw_pred * weight
        
        # Asegurar que la predicción no sea negativa
        ensemble_pred = max(0, weighted_sum)
        
        # Usar redondeo probabilístico mejorado para la predicción final
        ensemble_pred_rounded = redondeo_probabilistico_mejorado([ensemble_pred])[0]
        
        # Calcular confianza como promedio ponderado de confianzas individuales
        weighted_confidence = 0
        for model, pred in available_predictions.items():
            confidence = pred.get("confidence", 0.5)
            weight = dynamic_weights.get(model, 0)
            weighted_confidence += confidence * weight
        
        return {
            "prediction": int(ensemble_pred_rounded),
            "confidence": float(weighted_confidence),
            "raw_prediction": float(ensemble_pred),
            "dynamic_weights": dynamic_weights,
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
        
        # Calcular predicción ensemble con los modelos disponibles
        ensemble_result = self.calculate_prediction_ensemble(
            {k: v for k, v in model_predictions.items() if k in available_models},
            weights
        )
        
        # Extraer probabilidad del modelo Poisson si está disponible
        probability_distribution = {}
        if "poisson" in model_predictions and model_predictions["poisson"].get("disponible", False):
            probability_distribution = model_predictions["poisson"].get("probability_distribution", {})
        
        # Guardar resultado en el contexto de predicción
        if ensemble_result.get("disponible", False):
            self.prediction_context.add_prediction(
                player_name, 
                match_data, 
                ensemble_result["raw_prediction"]
            )
        
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
                "dynamic_weights": ensemble_result.get("dynamic_weights", {}),
                "timestamp": datetime.now().isoformat(),
                "models_used": available_models,
                "context_size": len(self.prediction_context.get_context(player_name))
            }
        }
        
        return result