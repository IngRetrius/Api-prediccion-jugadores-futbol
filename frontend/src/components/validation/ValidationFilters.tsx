import React from 'react';
import Select from '../common/Select';
import Button from '../common/Button';
import Card from '../common/Card';
import { formatPlayerName } from '../../utils/formatters';

interface ValidationFiltersProps {
  players: string[];
  models: string[];
  dates: number[];
  onPlayerSelect: (player: string) => void;
  onModelSelect: (model: string) => void;
  onDateRangeSelect: (range: number[]) => void;
  onReset: () => void;
  selectedPlayer: string;
  selectedModel: string;
  selectedDateRange: number[];
}

const ValidationFilters: React.FC<ValidationFiltersProps> = ({
  players,
  models,
  dates,
  onPlayerSelect,
  onModelSelect,
  onDateRangeSelect,
  onReset,
  selectedPlayer,
  selectedModel,
  selectedDateRange
}) => {
  const handlePlayerChange = (value: string) => {
    onPlayerSelect(value);
  };
  
  const handleModelChange = (value: string) => {
    onModelSelect(value);
  };
  
  const handleDateChange = (dateNumber: number, isMin: boolean) => {
    const newRange = [...selectedDateRange];
    if (isMin) {
      newRange[0] = dateNumber;
    } else {
      newRange[1] = dateNumber;
    }
    // Asegurar que min <= max
    if (newRange[0] > newRange[1]) {
      if (isMin) {
        newRange[1] = newRange[0];
      } else {
        newRange[0] = newRange[1];
      }
    }
    onDateRangeSelect(newRange);
  };
  
  return (
    <Card title="Filtros de Validación">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Select
            label="Jugador"
            options={[
              { value: '', label: 'Todos los jugadores' }, 
              ...players.map(p => ({ value: p, label: formatPlayerName(p) }))
            ]}
            value={selectedPlayer}
            onChange={handlePlayerChange}
            placeholder="Seleccione un jugador"
          />
        </div>
        <div>
          <Select
            label="Modelo"
            options={[
              { value: '', label: 'Todos los modelos' }, 
              ...models.map(m => ({ value: m, label: m.toUpperCase() }))
            ]}
            value={selectedModel}
            onChange={handleModelChange}
            placeholder="Seleccione un modelo"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fechas
          </label>
          <div className="flex space-x-2">
            <Select
              options={dates.map(d => ({ value: d.toString(), label: `Fecha ${d}` }))}
              value={selectedDateRange[0].toString()}
              onChange={(value) => handleDateChange(parseInt(value), true)}
              fullWidth
            />
            <span className="self-center">a</span>
            <Select
              options={dates.map(d => ({ value: d.toString(), label: `Fecha ${d}` }))}
              value={selectedDateRange[1].toString()}
              onChange={(value) => handleDateChange(parseInt(value), false)}
              fullWidth
            />
          </div>
        </div>
        <div className="flex items-end">
          <Button
            variant="outline"
            fullWidth
            onClick={onReset}
          >
            Limpiar filtros
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ValidationFilters;