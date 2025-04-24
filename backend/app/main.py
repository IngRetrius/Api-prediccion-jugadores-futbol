"""
Punto de entrada principal para la API de predicción de goles.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
import uvicorn

from backend.app.api.endpoints import router as api_router

from backend.app.config import (
    API_TITLE, 
    API_DESCRIPTION, 
    API_VERSION, 
    API_PREFIX, 
    CORS_ORIGINS
)

# Configurar el logger
logger.add("logs/api.log", rotation="10 MB", level="INFO")

# Crear aplicación FastAPI
app = FastAPI(
    title=API_TITLE,
    description=API_DESCRIPTION,
    version=API_VERSION,
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir router de API
app.include_router(api_router, prefix=API_PREFIX)

# Endpoint de salud
@app.get("/health", tags=["Health"])
async def health_check():
    """Verificar el estado de la API."""
    return {"status": "ok"}

# Manejador de errores global
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Error no manejado: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Error interno del servidor"},
    )

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)