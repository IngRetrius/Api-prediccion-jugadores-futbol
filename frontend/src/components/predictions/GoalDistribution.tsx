import React from 'react';
import { ProbabilityDistribution } from '../../types/models';
import { formatNumber } from '../../utils/formatters';

interface GoalDistributionProps {
  distribution: ProbabilityDistribution;
}

const GoalDistribution: React.FC<GoalDistributionProps> = ({ distribution }) => {
  // Ordenar las claves para mostrar en orden ascendente (0, 1, 2, ...)
  const sortedKeys = Object.keys(distribution).sort((a, b) => {
    // Manejar el caso especial de "5+"
    if (a === '5+') return 1;
    if (b === '5+') return -1;
    return parseInt(a) - parseInt(b);
  });
  
  // Obtener el valor máximo para normalizar los tamaños de las barras
  const maxProbability = Math.max(...Object.values(distribution));
  
  return (
    <div className="py-4">
      <div className="flex flex-col space-y-4">
        {sortedKeys.map((goals) => {
          const probability = distribution[goals];
          const barWidth = `${(probability / maxProbability) * 100}%`;
          const percentage = probability * 100;
          
          return (
            <div key={goals} className="flex items-center">
              <div className="w-8 text-right mr-4">
                <span className="font-medium">{goals}</span>
              </div>
              <div className="flex-grow bg-gray-100 rounded-full h-6 overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: barWidth }}
                >
                </div>
              </div>
              <div className="w-16 text-right ml-4">
                <span className="text-sm text-gray-600">{formatNumber(percentage)}%</span>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 text-sm text-gray-500">
        <p>La distribución muestra la probabilidad de que el jugador marque un número específico de goles en el partido.</p>
      </div>
    </div>
  );
};

export default GoalDistribution;