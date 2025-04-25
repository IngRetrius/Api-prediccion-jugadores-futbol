# Tests para el Sistema de Predicción de Goles

Este directorio contiene las pruebas automatizadas para el sistema de predicción de goles para fútbol colombiano.

## Estructura

```
tests/
├── conftest.py                  # Configuración y fixtures compartidos para pytest
├── test_api/                    # Pruebas para los endpoints de la API
│   ├── test_endpoints.py        # Pruebas para endpoints principales
│   └── test_validation.py       # Pruebas para validación de datos
├── test_models/                 # Pruebas para modelos de predicción
│   ├── test_ensemble.py         # Pruebas para el ensemble
│   ├── test_lstm.py             # Pruebas para LSTM
│   ├── test_poisson.py          # Pruebas para Poisson
│   └── test_sarimax.py          # Pruebas para SARIMAX
└── test_utils/                  # Pruebas para utilidades
    └── test_helpers.py          # Pruebas para funciones auxiliares
```

## Ejecución de pruebas

Para ejecutar todas las pruebas:

```bash
# Desde el directorio raíz del proyecto
python -m pytest

# Para ejecutar pruebas con más detalle
python -m pytest -v

# Para ejecutar un archivo específico
python -m pytest tests/test_api/test_endpoints.py

# Para ejecutar una prueba específica
python -m pytest tests/test_api/test_endpoints.py::TestPlayerEndpoints::test_get_players
```

## Fixtures disponibles

Los fixtures principales están definidos en `conftest.py`:

- `test_client`: Cliente de prueba para la API FastAPI
- `sample_players`: Lista de jugadores de muestra
- `sample_teams`: Lista de equipos de muestra
- `mock_historical_data`: DataFrame con datos históricos de muestra
- `mock_prediction_engine`: Instancia simulada del motor de predicción
- `player_prediction_request`: Solicitud de prueba para predicciones de jugadores
- `match_prediction_request`: Solicitud de prueba para predicciones de partidos

## Buenas prácticas

1. **Aislamiento**: Cada prueba debe ser independiente de las otras.
2. **Nombres descriptivos**: Usar nombres que expliquen claramente qué se está probando.
3. **Fixtures**: Utilizar fixtures de pytest para reutilizar código.
4. **Mocks**: Usar mocks para aislar el código de dependencias externas.
5. **Cobertura**: Intentar cubrir todos los caminos posibles (éxito, error, casos límite).

## Ejecución con cobertura

Para ejecutar pruebas y generar un informe de cobertura:

```bash
# Instalar pytest-cov si no está instalado
pip install pytest-cov

# Ejecutar pruebas con cobertura
python -m pytest --cov=backend

# Generar reporte HTML detallado
python -m pytest --cov=backend --cov-report=html
```