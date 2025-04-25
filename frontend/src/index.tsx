import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { PredictionProvider } from './contexts/PredictionContext';
import './assets/styles/global.css';

// Usando createRoot en lugar de ReactDOM.render (React 18+)
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = createRoot(rootElement);
root.render(
  <BrowserRouter>
    <PredictionProvider>
      <App />
    </PredictionProvider>
  </BrowserRouter>
);