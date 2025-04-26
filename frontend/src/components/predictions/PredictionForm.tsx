import React, { useState, useEffect } from 'react';
import { PlayerPredictionRequest } from '../../types/models';
import Button from '../common/Button';
import Card from '../common/Card';
import { formatAPIDate } from '../../utils/dateUtils';

// Definición de interfaces para opciones de jugadores y equipos
interface PlayerOption {
  name: string;
  displayName: string;
  team?: string;
}

interface TeamOption {
  name: string;
  displayName: string;
}

interface PredictionFormProps {
  onSubmit: (values: PlayerPredictionRequest) => Promise<void>;
  isLoading?: boolean;
}

const PredictionForm: React.FC<PredictionFormProps> = ({ onSubmit, isLoading = false }) => {
  // Estado del formulario
  const [formValues, setFormValues] = useState<PlayerPredictionRequest>({
    player_name: '',
    opponent: '',
    is_home: true,
    date: formatAPIDate(new Date())
  });
  
  // Estado para campos avanzados
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Estado para datos de API
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  
  // Cargar datos de jugadores y equipos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        setDataError(null);
        
        // Datos de jugadores según lo proporcionado
        const playerList: PlayerOption[] = [
          { name: 'Carlos_Bacca', displayName: 'Carlos Bacca', team: 'Junior' },
          { name: 'Dayro_Moreno', displayName: 'Dayro Moreno', team: 'Once Caldas' },
          { name: 'Hugo_Rodallega', displayName: 'Hugo Rodallega', team: 'Independiente Santa Fe' },
          { name: 'Leonardo_Castro', displayName: 'Leonardo Castro', team: 'Millonarios' },
          { name: 'Marco_Perez', displayName: 'Marco Perez', team: 'Junior' }
        ];
        
        // Extraer equipos únicos de los jugadores
        const uniqueTeams = [...new Set(playerList.map(player => player.team))];
        const teamList: TeamOption[] = uniqueTeams
          .filter((team): team is string => team !== undefined) // Filtrar undefined
          .map(team => ({
            name: team,
            displayName: team
          }));
        
        // Añadir más equipos si es necesario
        const additionalTeams: TeamOption[] = [
          { name: 'América de Cali', displayName: 'América de Cali' },
          { name: 'Atlético Nacional', displayName: 'Atlético Nacional' },
          { name: 'Deportivo Cali', displayName: 'Deportivo Cali' },
          { name: 'Bucaramanga', displayName: 'Bucaramanga' },
          { name: 'Pereira', displayName: 'Pereira' },
          { name: 'Rionegro', displayName: 'Rionegro' },
          { name: 'La Equidad', displayName: 'La Equidad' },
          { name: 'Envigado', displayName: 'Envigado' },
          { name: 'Fortaleza CEIF', displayName: 'Fortaleza CEIF' },
          { name: 'Unión Magdalena', displayName: 'Unión Magdalena' },
          { name: 'Deportivo Pasto', displayName: 'Deportivo Pasto' },
          { name: 'Deportes Tolima', displayName: 'Deportes Tolima' },
          { name: 'Alianza FC', displayName: 'Alianza FC' },
          { name: 'Independiente Medellín', displayName: 'Independiente Medellín' },
          { name: 'Boyacá Chicó', displayName: 'Boyacá Chicó' },
          { name: 'Llaneros', displayName: 'Llaneros' }
];
        
        // Combinar y eliminar duplicados
        const allTeams = [...teamList];
        additionalTeams.forEach(team => {
          if (!allTeams.some(t => t.name === team.name)) {
            allTeams.push(team);
          }
        });
        
        setPlayers(playerList);
        setTeams(allTeams);
        setLoadingData(false);
        
      } catch (error) {
        console.error('Error cargando datos:', error);
        setDataError('Error al cargar jugadores o equipos. Por favor, intente de nuevo.');
        setLoadingData(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Manejar cambios en los campos del formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormValues(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      const numberValue = value === '' ? undefined : Number(value);
      setFormValues(prev => ({ ...prev, [name]: numberValue }));
    } else {
      setFormValues(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // Manejar cambio de condición (local/visitante)
  const handleConditionChange = (isHome: boolean) => {
    setFormValues(prev => ({ ...prev, is_home: isHome }));
  };
  
  // Validar el formulario
  const isFormValid = () => {
    return !!formValues.player_name && !!formValues.opponent;
  };
  
  // Manejar envío del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isFormValid()) {
      onSubmit(formValues);
    }
  };
  
  return (
    <Card title="Predicción de Goles">
      {dataError && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded">
          {dataError}
          <button 
            onClick={() => window.location.reload()} 
            className="ml-2 underline"
          >
            Reintentar
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Jugador */}
          <div>
            <label htmlFor="player_name" className="block text-sm font-medium text-gray-700 mb-1">
              Jugador <span className="text-red-500">*</span>
            </label>
            <select
              id="player_name"
              name="player_name"
              value={formValues.player_name}
              onChange={handleChange}
              disabled={isLoading || loadingData}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            >
              <option value="">Seleccione un jugador</option>
              {players.map((player) => (
                <option key={player.name} value={player.name}>
                  {player.displayName} ({player.team})
                </option>
              ))}
            </select>
          </div>

          {/* Oponente */}
          <div>
            <label htmlFor="opponent" className="block text-sm font-medium text-gray-700 mb-1">
              Equipo Oponente <span className="text-red-500">*</span>
            </label>
            <select
              id="opponent"
              name="opponent"
              value={formValues.opponent}
              onChange={handleChange}
              disabled={isLoading || loadingData}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            >
              <option value="">Seleccione un equipo</option>
              {teams.map((team) => (
                <option key={team.name} value={team.name}>
                  {team.displayName}
                </option>
              ))}
            </select>
          </div>

          {/* Local/Visitante */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Condición <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-4">
              <div className="flex items-center">
                <input
                  id="is_home_true"
                  name="is_home"
                  type="radio"
                  checked={formValues.is_home}
                  onChange={() => handleConditionChange(true)}
                  disabled={isLoading}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="is_home_true" className="ml-2 block text-sm text-gray-700">
                  Local
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="is_home_false"
                  name="is_home"
                  type="radio"
                  checked={!formValues.is_home}
                  onChange={() => handleConditionChange(false)}
                  disabled={isLoading}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="is_home_false" className="ml-2 block text-sm text-gray-700">
                  Visitante
                </label>
              </div>
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha
            </label>
            <input
              id="date"
              name="date"
              type="date"
              value={formValues.date || ''}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Botón para mostrar/ocultar opciones avanzadas */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {showAdvanced ? '- Ocultar opciones avanzadas' : '+ Mostrar opciones avanzadas'}
          </button>
        </div>

        {/* Opciones avanzadas */}
        {showAdvanced && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h4 className="font-medium text-gray-900 mb-3">Características adicionales</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Tiros a puerta */}
              <div>
                <label htmlFor="shots_on_target" className="block text-sm font-medium text-gray-700 mb-1">
                  Tiros a puerta
                </label>
                <input
                  id="shots_on_target"
                  name="shots_on_target"
                  type="number"
                  min="0"
                  step="1"
                  value={formValues.shots_on_target || ''}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {/* Tiros totales */}
              <div>
                <label htmlFor="total_shots" className="block text-sm font-medium text-gray-700 mb-1">
                  Tiros totales
                </label>
                <input
                  id="total_shots"
                  name="total_shots"
                  type="number"
                  min="0"
                  step="1"
                  value={formValues.total_shots || ''}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {/* Minutos */}
              <div>
                <label htmlFor="minutes" className="block text-sm font-medium text-gray-700 mb-1">
                  Minutos
                </label>
                <input
                  id="minutes"
                  name="minutes"
                  type="number"
                  min="0"
                  max="120"
                  step="1"
                  value={formValues.minutes || ''}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Botón de envío */}
        <div className="mt-6">
          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isLoading}
            disabled={isLoading || !isFormValid()}
          >
            {isLoading ? 'Procesando...' : 'Predecir Goles'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default PredictionForm;