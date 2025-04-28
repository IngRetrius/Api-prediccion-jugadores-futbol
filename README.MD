# Sistema de Predicción de Goles - Fútbol Colombiano

Una aplicación web que utiliza modelos de aprendizaje automático para predecir el rendimiento goleador de los jugadores en la liga colombiana de fútbol.

## Características Principales

- **Predicción avanzada**: Combina tres modelos de ML (LSTM, SARIMAX y Poisson) para ofrecer predicciones precisas
- **Visualización interactiva**: Gráficos y estadísticas comparativas de jugadores y modelos
- **Ensemble inteligente**: Ponderación de modelos para mejorar la precisión de las predicciones
- **Análisis histórico**: Visualización de estadísticas y tendencias de jugadores
- **Personalización**: Ajuste de parámetros específicos como minutos jugados, tiros a puerta, y selección de modelos
- **Dashboard de equipos**: Análisis detallado de estadísticas por equipo y torneo

## Arquitectura

El proyecto utiliza una arquitectura de cliente-servidor:

### Backend (Python + FastAPI)

- **FastAPI**: Marco web para crear APIs con Python
- **Modelos de ML**:
  - **LSTM**: Redes neuronales con memoria a largo plazo
  - **SARIMAX**: Modelo estadístico para series temporales
  - **Poisson**: Distribución estadística para eventos discretos

### Frontend (React + TypeScript)

- **React**: Biblioteca para construir interfaces de usuario
- **TypeScript**: Superset tipado de JavaScript
- **Tailwind CSS**: Framework CSS para diseño rápido y responsivo
- **Recharts**: Biblioteca para visualización de datos

## Requisitos Previos

- Python 3.8+
- Node.js 16+
- npm o yarn

## Datos del sistema

### Importante: Acceso a los datos

Para que el sistema funcione correctamente, es necesario descargar los archivos de datos desde el siguiente enlace:

[https://drive.google.com/drive/folders/1I6625Qx3AAPfexX5Z3iAv2BhNV-pl-1X?usp=sharing](https://drive.google.com/drive/folders/1I6625Qx3AAPfexX5Z3iAv2BhNV-pl-1X?usp=sharing)

### Instalación de datos

1. Descarga los archivos del enlace anterior
2. Coloca los archivos descargados en la carpeta: `backend/app/data/`
3. Asegúrate de que los siguientes archivos estén presentes en esa ubicación:
   - `jugadores_unificados_cinco_torneos.csv` (para el módulo de estadísticas de equipos)
   - `Goleadores_Procesados.csv` (para el módulo de predicción de goles)

**Nota**: Sin estos archivos, el sistema no funcionará correctamente. El archivo `Goleadores_Procesados.csv` es esencial para el funcionamiento de los modelos de predicción, mientras que `jugadores_unificados_cinco_torneos.csv` es necesario para el dashboard de estadísticas de equipos.

## Instalación

### Backend

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tuusuario/prediccion-goles.git
   cd prediccion-goles
   ```

2. Crea un entorno virtual e instala las dependencias:
   ```bash
   python -m venv venv
   source venv/bin/activate  # En Windows: venv\Scripts\activate
   pip install -r backend/requirements.txt
   ```

### Frontend

1. Instala las dependencias:
   ```bash
   cd frontend
   npm install
   ```

## Ejecución

### Backend

Para iniciar el servidor backend:

```bash
python -m app.main
```

O alternativamente:

```bash
cd backend
uvicorn app.main:app --reload
```

El servidor estará disponible en `http://localhost:8000`.

### Frontend

Para iniciar el servidor de desarrollo:

```bash
cd frontend
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

## Uso

1. Accede a la aplicación en tu navegador
2. Selecciona un jugador, un equipo oponente y si el partido es de local o visitante
3. Opcionalmente, configura parámetros adicionales como tiros a puerta o minutos jugados
4. Haz clic en "Predecir Goles" para obtener la predicción
5. Explora las diferentes pestañas para ver estadísticas, historial y métricas de modelos
6. En la pestaña "Equipos", puedes analizar estadísticas detalladas por equipo y torneo

## Estructura del Proyecto

```
prediccion-goles/
├── backend/
│   ├── app/
│   │   ├── api/          # Endpoints de la API
│   │   ├── models/       # Modelos de predicción
│   │   ├── data/         # Datos históricos (colocar archivos CSV aquí)
│   │   ├── config.py     # Configuración global
│   │   └── main.py       # Punto de entrada
│   └── tests/            # Pruebas unitarias
└── frontend/
    ├── src/
    │   ├── api/          # Cliente de API
    │   ├── components/   # Componentes React
    │   ├── contexts/     # Contextos para estado global
    │   ├── hooks/        # Hooks personalizados
    │   ├── pages/        # Páginas principales
    │   ├── types/        # Definiciones de TypeScript
    │   └── utils/        # Utilidades
    ├── public/           # Recursos estáticos
    └── index.html        # HTML principal
```

## Pruebas

### Backend

Para ejecutar las pruebas del backend:

```bash
cd backend
python -m pytest
```

### Frontend

Para ejecutar las pruebas del frontend:

```bash
cd frontend
npm test
```

## Modelos de predicción

El sistema utiliza una combinación de tres modelos:

1. **LSTM (Long Short-Term Memory)**: Red neuronal para capturar patrones temporales complejos
2. **SARIMAX**: Modelo estadístico para series temporales que considera factores externos
3. **Poisson**: Distribución estadística adaptada para modelar la ocurrencia de goles

Estos tres modelos se combinan en un ensemble para proporcionar predicciones más robustas.

## Contribuir

1. Fork el repositorio
2. Crea una nueva rama (`git checkout -b feature/nueva-funcionalidad`)
3. Realiza los cambios y haz commit (`git commit -m 'Añade nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## Notas

- Este sistema proporciona predicciones basadas en análisis estadístico y modelos de aprendizaje automático
- Las predicciones tienen un margen de error inherente debido a la naturaleza impredecible del deporte
- No debe utilizarse como única fuente para toma de decisiones importantes

---

Desarrollado por:
- Juan David Alvarez
- Daniel Hoyos
- Juan Camilo Perea Possos