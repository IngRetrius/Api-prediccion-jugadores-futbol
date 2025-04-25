"""
Pruebas para funciones auxiliares del sistema de predicción.
"""
import pytest
import pandas as pd
from datetime import datetime

from backend.app.models.model_handler import estandarizar_nombre_equipo, load_historical_data


class TestEquipoStandardization:
    """
    Pruebas para la función estandarizar_nombre_equipo.
    """
    
    def test_estandarizar_nombre_equipo(self):
        """
        Verificar que la función estandariza correctamente diferentes nombres de equipos.
        """
        # Casos de prueba
        test_cases = [
            # (input, expected_output)
            ("Junior", "Junior"),
            ("Atlético Junior", "Junior"),
            ("Nacional", "Atlético Nacional"),
            ("Atlético Nacional", "Atlético Nacional"),
            ("Pereira", "Pereira"),
            ("Deportivo Pereira", "Pereira"),
            ("Santa Fe", "Independiente Santa Fe"),
            ("Independiente Santa Fe", "Independiente Santa Fe"),
            ("Cali", "Deportivo Cali"),
            ("América", "América de Cali"),
            ("América de Cali", "América de Cali"),
            ("Millonarios", "Millonarios"),
            ("Águilas Doradas", "Rionegro"),
            ("Tolima", "Deportes Tolima"),
            ("Medellín", "Independiente Medellín"),
            ("Chicó", "Boyacá Chicó"),
            ("EquipoNoRegistrado", "EquipoNoRegistrado")  # Equipo no en el mapeo
        ]
        
        # Ejecutar casos de prueba
        for input_name, expected_output in test_cases:
            assert estandarizar_nombre_equipo(input_name) == expected_output
    
    def test_case_sensitivity(self):
        """
        Verificar la sensibilidad a mayúsculas y minúsculas.
        """
        # La función debería ser sensible a mayúsculas y minúsculas
        # Verificar que "JUNIOR" no es lo mismo que "Junior"
        assert estandarizar_nombre_equipo("JUNIOR") != estandarizar_nombre_equipo("Junior")
        
        # "JUNIOR" no está en el mapeo, por lo que debería devolverse tal cual
        assert estandarizar_nombre_equipo("JUNIOR") == "JUNIOR"
    
    def test_edge_cases(self):
        """
        Verificar casos extremos como strings vacíos o None.
        """
        # String vacío
        assert estandarizar_nombre_equipo("") == ""
        
        # None (verificar comportamiento real)
        try:
            result = estandarizar_nombre_equipo(None)
            # Si no lanza excepción, verificar el resultado
            assert result is None
        except (TypeError, AttributeError):
            # Si lanza alguna de estas excepciones, es el comportamiento esperado
            pass
        
        # Nombres con espacios adicionales
        assert estandarizar_nombre_equipo("  Junior  ") == "  Junior  "
        
        # Nombres con caracteres especiales
        assert estandarizar_nombre_equipo("Juñior") == "Juñior"


class TestHistoricalDataLoading:
    """
    Pruebas para la función load_historical_data.
    """
    
    def test_load_historical_data_mock(self, monkeypatch, mock_historical_data):
        """
        Verificar que la función carga correctamente los datos históricos (con mock).
        """
        # Mockear pd.read_csv para devolver nuestros datos de prueba
        def mock_read_csv(*args, **kwargs):
            return mock_historical_data
        
        monkeypatch.setattr(pd, "read_csv", mock_read_csv)
        
        # Llamar a la función
        df = load_historical_data()
        
        # Verificar que devuelve un DataFrame
        assert isinstance(df, pd.DataFrame)
        
        # Verificar las columnas esperadas
        expected_columns = [
            'Jugador', 'Equipo', 'Equipo_Estandarizado', 'Oponente', 
            'Oponente_Estandarizado', 'Fecha', 'Goles', 'Sede_Local', 
            'Sede_Visitante', 'Minutos', 'Tiros a puerta', 'Tiros totales',
            'Día_de_la_semana', 'Es_FinDeSemana'
        ]
        
        for col in expected_columns:
            assert col in df.columns
        
        # Verificar conversión de fechas
        assert pd.api.types.is_datetime64_dtype(df['Fecha'])
        
        # Verificar número de registros
        assert len(df) == len(mock_historical_data)
    
    def test_load_historical_data_error(self, monkeypatch):
        """
        Verificar que la función maneja correctamente los errores al cargar datos.
        """
        # Mockear pd.read_csv para lanzar una excepción
        def mock_read_csv_error(*args, **kwargs):
            raise FileNotFoundError("Archivo no encontrado")
        
        monkeypatch.setattr(pd, "read_csv", mock_read_csv_error)
        
        # La función debería propagar la excepción
        with pytest.raises(Exception):
            load_historical_data()


class TestDataProcessing:
    """
    Pruebas para funciones de procesamiento de datos.
    """
    
    @pytest.mark.asyncio
    async def test_get_player_historical_data(self, mock_prediction_engine):
        """
        Verificar que la función get_player_historical_data filtra correctamente los datos de un jugador.
        """
        # Jugador a buscar
        player_name = "Hugo_Rodallega"
        
        # Llamar a la función
        result = await mock_prediction_engine.get_player_historical_data(player_name)
        
        # Verificar que devuelve un DataFrame
        assert isinstance(result, pd.DataFrame)
        
        # Verificar que solo contiene datos del jugador especificado
        assert (result['Jugador'] == player_name).all()
        
        # Verificar que los datos están ordenados por fecha
        dates = result['Fecha'].tolist()
        assert dates == sorted(dates)
        
        # Caso especial para Hugo_Rodallega (filtro por fecha)
        if player_name == "Hugo_Rodallega":
            assert all(date >= pd.Timestamp('2023-01-01') for date in result['Fecha'])
    
    def test_prepare_prediction_features_structure(self, mock_prediction_engine):
        """
        Verificar la estructura de las características preparadas para predicción.
        """
        # Esta prueba es más difícil de implementar sin acceso a los datos reales
        # Podríamos verificar que las funciones existen y tienen la firma correcta
        
        # Verificar que los métodos existen
        assert hasattr(mock_prediction_engine, 'prepare_prediction_features')
        assert hasattr(mock_prediction_engine, '_prepare_lstm_features')
        assert hasattr(mock_prediction_engine, '_prepare_sarimax_features')
        assert hasattr(mock_prediction_engine, '_prepare_poisson_features')
        
        # Verificar la firma de prepare_prediction_features
        import inspect
        sig = inspect.signature(mock_prediction_engine.prepare_prediction_features)
        parameters = list(sig.parameters.keys())
        
        assert 'player_name' in parameters
        assert 'match_data' in parameters
        assert 'model_type' in parameters