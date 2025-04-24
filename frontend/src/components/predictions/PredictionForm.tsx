// src/components/predictions/PredictionForm.tsx
import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { format } from 'date-fns';

import Button from '../common/Button';
import Card from '../common/Card';
import Input from '../common/Input';
import Select from '../common/Select';
import { getAvailablePlayers } from '../../api/playersApi';
import { getAvailableTeams } from '../../api/teamsApi';
import { PlayerPredictionRequest } from '../../types/models';

interface PredictionFormProps {
  onSubmit: (values: PlayerPredictionRequest) => void;
  isLoading?: boolean;
}

const PredictionForm: React.FC<PredictionFormProps> = ({ onSubmit, isLoading = false }) => {
  const [players, setPlayers] = useState<{value: string, label: string}[]>([]);
  const [teams, setTeams] = useState<{value: string, label: string}[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Validación del formulario
  const validationSchema = Yup.object({
    player_name: Yup.string().required('El jugador es requerido'),
    opponent: Yup.string().required('El equipo oponente es requerido'),
    is_home: Yup.boolean().required('Indique si es local o visitante'),
    date: Yup.date().nullable(),
    shots_on_target: Yup.number().min(0, 'Debe ser mayor o igual a 0').nullable(),
    total_shots: Yup.number().min(0, 'Debe ser mayor o igual a 0').nullable(),
    minutes: Yup.number().min(0, 'Debe ser mayor o igual a 0').max(120, 'Máximo 120 minutos').nullable(),
  });

  // Configuración de Formik
  const formik = useFormik({
    initialValues: {
      player_name: '',
      opponent: '',
      is_home: true,
      date: format(new Date(), 'yyyy-MM-dd'),
      shots_on_target: undefined,
      total_shots: undefined,
      minutes: undefined,
      use_ensemble: true,
      models: ['lstm', 'sarimax', 'poisson']
    },
    validationSchema,
    onSubmit: (values) => {
      // Preparar request para la API
      const request: PlayerPredictionRequest = {
        player_name: values.player_name,
        opponent: values.opponent,
        is_home: values.is_home,
        date: values.date,
      };

      // Añadir campos opcionales si están definidos
      if (values.shots_on_target !== undefined) {
        request.shots_on_target = values.shots_on_target;
      }
      
      if (values.total_shots !== undefined) {
        request.total_shots = values.total_shots;
      }
      
      if (values.minutes !== undefined) {
        request.minutes = values.minutes;
      }

      // Añadir configuración de modelos si no se usa el ensemble
      if (!values.use_ensemble) {
        request.model_selection = {
          models: values.models,
        };
      }

      onSubmit(request);
    },
  });

  // Cargar jugadores y equipos al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        // Obtener jugadores
        const playersData = await getAvailablePlayers();
        setPlayers(playersData.map(player => ({
          value: player.name,
          label: player.name.replace('_', ' ')
        })));

        // Obtener equipos
        const teamsData = await getAvailableTeams();
        setTeams(teamsData.map(team => ({
          value: team.name,
          label: team.name
        })));
      } catch (error) {
        console.error('Error cargando datos:', error);
      }
    };

    loadData();
  }, []);

  return (
    <Card title="Predicción de Goles">
      <form onSubmit={formik.handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Jugador */}
          <div>
            <label htmlFor="player_name" className="block text-sm font-medium text-gray-700 mb-1">
              Jugador <span className="text-red-500">*</span>
            </label>
            <select
              id="player_name"
              name="player_name"
              value={formik.values.player_name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={isLoading}
              className={`w-full px-3 py-2 border ${
                formik.touched.player_name && formik.errors.player_name 
                  ? 'border-red-500' 
                  : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
            >
              <option value="">Seleccione un jugador</option>
              {players.map((player) => (
                <option key={player.value} value={player.value}>
                  {player.label}
                </option>
              ))}
            </select>
            {formik.touched.player_name && formik.errors.player_name && (
              <p className="mt-1 text-sm text-red-600">{formik.errors.player_name}</p>
            )}
          </div>

          {/* Oponente */}
          <div>
            <label htmlFor="opponent" className="block text-sm font-medium text-gray-700 mb-1">
              Equipo Oponente <span className="text-red-500">*</span>
            </label>
            <select
              id="opponent"
              name="opponent"
              value={formik.values.opponent}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={isLoading}
              className={`w-full px-3 py-2 border ${
                formik.touched.opponent && formik.errors.opponent 
                  ? 'border-red-500' 
                  : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
            >
              <option value="">Seleccione un equipo</option>
              {teams.map((team) => (
                <option key={team.value} value={team.value}>
                  {team.label}
                </option>
              ))}
            </select>
            {formik.touched.opponent && formik.errors.opponent && (
              <p className="mt-1 text-sm text-red-600">{formik.errors.opponent}</p>
            )}
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
                  checked={formik.values.is_home}
                  onChange={() => formik.setFieldValue('is_home', true)}
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
                  checked={!formik.values.is_home}
                  onChange={() => formik.setFieldValue('is_home', false)}
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
              value={formik.values.date}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
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
                  value={formik.values.shots_on_target || ''}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {formik.touched.shots_on_target && formik.errors.shots_on_target && (
                  <p className="mt-1 text-sm text-red-600">{formik.errors.shots_on_target}</p>
                )}
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
                  value={formik.values.total_shots || ''}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {formik.touched.total_shots && formik.errors.total_shots && (
                  <p className="mt-1 text-sm text-red-600">{formik.errors.total_shots}</p>
                )}
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
                  value={formik.values.minutes || ''}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {formik.touched.minutes && formik.errors.minutes && (
                  <p className="mt-1 text-sm text-red-600">{formik.errors.minutes}</p>
                )}
              </div>
            </div>

            {/* Selección de modelos */}
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-3">Configuración de modelos</h4>
              
              <div className="mb-3">
                <div className="flex items-center">
                  <input
                    id="use_ensemble"
                    name="use_ensemble"
                    type="checkbox"
                    checked={formik.values.use_ensemble}
                    onChange={formik.handleChange}
                    disabled={isLoading}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="use_ensemble" className="ml-2 block text-sm text-gray-700">
                    Usar ensemble (combinación de modelos)
                  </label>
                </div>
              </div>

              {/* Mostrar selección de modelos si no se usa ensemble */}
              {!formik.values.use_ensemble && (
                <div className="ml-2">
                  <p className="text-sm text-gray-700 mb-2">Seleccionar modelos:</p>
                  <div className="space-y-2">
                    {['lstm', 'sarimax', 'poisson'].map(model => (
                      <div key={model} className="flex items-center">
                        <input
                          id={`model_${model}`}
                          name="models"
                          type="checkbox"
                          value={model}
                          checked={formik.values.models.includes(model)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              formik.setFieldValue('models', [...formik.values.models, model]);
                            } else {
                              formik.setFieldValue(
                                'models',
                                formik.values.models.filter(m => m !== model)
                              );
                            }
                          }}
                          disabled={isLoading}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`model_${model}`} className="ml-2 block text-sm text-gray-700">
                          {model.toUpperCase()}
                        </label>
                      </div>
                    ))}
                  </div>
                  {formik.values.models.length === 0 && (
                    <p className="mt-1 text-sm text-red-600">Seleccione al menos un modelo</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Botón de envío */}
        <div className="mt-6">
          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={isLoading || !formik.isValid}
          >
            {isLoading ? 'Procesando...' : 'Predecir Goles'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default PredictionForm;