import { useEffect, useState } from 'react';
import AppRoutes from './routes';
import Loading from './components/common/Loading';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carga inicial
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <Loading size="lg" text="Cargando aplicación..." />
      </div>
    );
  }

  return <AppRoutes />;
}

export default App;