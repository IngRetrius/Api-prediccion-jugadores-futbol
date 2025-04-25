import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-blue-600 shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-white font-bold text-xl">
                Predicción de Goles
              </Link>
            </div>
            
            {/* Desktop menu */}
            <nav className="hidden md:ml-6 md:flex md:space-x-8">
              <Link to="/" className="text-white hover:bg-blue-700 inline-flex items-center px-1 pt-1 text-sm font-medium">
                Inicio
              </Link>
              <Link to="/predict" className="text-white hover:bg-blue-700 inline-flex items-center px-1 pt-1 text-sm font-medium">
                Predicciones
              </Link>
              <Link to="/players" className="text-white hover:bg-blue-700 inline-flex items-center px-1 pt-1 text-sm font-medium">
                Jugadores
              </Link>
              <Link to="/teams" className="text-white hover:bg-blue-700 inline-flex items-center px-1 pt-1 text-sm font-medium">
                Equipos
              </Link>
              <Link to="/about" className="text-white hover:bg-blue-700 inline-flex items-center px-1 pt-1 text-sm font-medium">
                Acerca de
              </Link>
            </nav>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-blue-700 focus:outline-none"
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">Abrir menú principal</span>
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, toggle based on isMenuOpen state */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          <Link 
            to="/" 
            className="bg-blue-700 text-white block pl-3 pr-4 py-2 text-base font-medium"
            onClick={() => setIsMenuOpen(false)}
          >
            Inicio
          </Link>
          <Link 
            to="/predict" 
            className="text-white hover:bg-blue-700 block pl-3 pr-4 py-2 text-base font-medium"
            onClick={() => setIsMenuOpen(false)}
          >
            Predicciones
          </Link>
          <Link 
            to="/players" 
            className="text-white hover:bg-blue-700 block pl-3 pr-4 py-2 text-base font-medium"
            onClick={() => setIsMenuOpen(false)}
          >
            Jugadores
          </Link>
          <Link 
            to="/teams" 
            className="text-white hover:bg-blue-700 block pl-3 pr-4 py-2 text-base font-medium"
            onClick={() => setIsMenuOpen(false)}
          >
            Equipos
          </Link>
          <Link 
            to="/about" 
            className="text-white hover:bg-blue-700 block pl-3 pr-4 py-2 text-base font-medium"
            onClick={() => setIsMenuOpen(false)}
          >
            Acerca de
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;