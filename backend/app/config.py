"""
Configuración global para la API de predicción de goles.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Cargar variables de entorno desde archivo .env si existe
load_dotenv()

# Directorio raíz del proyecto
BASE_DIR = Path(__file__).resolve().parent.parent

# Rutas a los modelos
MODELS_DIR = os.path.join(BASE_DIR, "app", "models")
LSTM_MODELS_DIR = os.path.join(MODELS_DIR, "lstm")
SARIMAX_MODELS_DIR = os.path.join(MODELS_DIR, "sarimax")
POISSON_MODELS_DIR = os.path.join(MODELS_DIR, "poisson")

# Ruta al archivo de datos históricos
DATA_DIR = os.path.join(BASE_DIR, "app", "data")
HISTORICAL_DATA_FILE = os.path.join(DATA_DIR, "Goleadores_Procesados.csv")

# Jugadores disponibles
AVAILABLE_PLAYERS = [
    "Hugo_Rodallega",
     "Carlos_Bacca",
     "Dayro_Moreno",
     "Leonardo_Castro",
     "Marco_Perez"   
    # Agrega aquí los demás jugadores disponibles según tus datos
]

# Configuración de predicción
DEFAULT_WINDOW_SIZE = 3  # Tamaño de ventana para modelos LSTM
MAX_PREDICTION_DAYS = 30  # Días máximos para los que se permite predecir

# Configuración de la API
API_PREFIX = "/api/v1"
API_TITLE = "API de Predicción de Goles - Fútbol Colombiano"
API_DESCRIPTION = "API para realizar predicciones de goles utilizando modelos LSTM, SARIMAX y Poisson"
API_VERSION = "1.0.0"

# Configuración para CORS
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
    # Agrega aquí otros orígenes permitidos
]

# Pesos para la combinación de modelos (ensemble)
MODEL_WEIGHTS = {
    "lstm": 0.4,
    "sarimax": 0.3,
    "poisson": 0.3
}

# Configuración de logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"