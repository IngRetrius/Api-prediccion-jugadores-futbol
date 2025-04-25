import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Columna 1: Navegación */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Navegación
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/predict" className="text-gray-300 hover:text-white">
                  Predicciones
                </Link>
              </li>
              <li>
                <Link to="/players" className="text-gray-300 hover:text-white">
                  Jugadores
                </Link>
              </li>
              <li>
                <Link to="/teams" className="text-gray-300 hover:text-white">
                  Equipos
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-white">
                  Acerca de
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Columna 2: Tecnologías */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Tecnologías
            </h3>
            <ul className="space-y-2">
              <li className="text-gray-300">
                <span className="flex items-center">
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                    <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
                  </svg>
                  React + TypeScript
                </span>
              </li>
              <li className="text-gray-300">
                <span className="flex items-center">
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
                  </svg>
                  FastAPI
                </span>
              </li>
              <li className="text-gray-300">
                <span className="flex items-center">
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 .75a8.75 8.75 0 00-8.75 8.75v.008c0 4.83 3.92 8.75 8.75 8.75 2.04 0 3.92-.7 5.4-1.88l3.24 3.24a.75.75 0 001.06-1.06l-3.24-3.24A8.75 8.75 0 0012 .75zm0 1.5a7.25 7.25 0 100 14.5 7.25 7.25 0 000-14.5z" />
                  </svg>
                  Machine Learning
                </span>
              </li>
            </ul>
          </div>
          
          {/* Columna 3: Información adicional */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Predicción de Goles
            </h3>
            <p className="text-gray-300 mb-4">
              Sistema de predicción de goles para el fútbol colombiano utilizando modelos
              de aprendizaje automático.
            </p>
            <p className="text-gray-400 text-xs">
              &copy; {currentYear} Sistema de Predicción de Goles. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;