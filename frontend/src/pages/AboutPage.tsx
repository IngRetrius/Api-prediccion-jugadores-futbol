import React from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';

const AboutPage: React.FC = () => {
  return (
    <Layout title="Acerca de - Sistema de Predicción de Goles">
      <div className="space-y-8">
        <div className="bg-blue-600 rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-8 md:px-10 text-white">
            <h1 className="text-2xl font-bold mb-4">
              Acerca del Sistema de Predicción de Goles
            </h1>
            <p className="text-lg">
              Una plataforma avanzada para predecir el rendimiento goleador 
              de jugadores en el fútbol colombiano utilizando algoritmos de 
              aprendizaje automático y análisis estadístico.
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="El Proyecto">
            <div className="prose max-w-none">
              <p>
                Este sistema de predicción fue desarrollado con el objetivo de proporcionar 
                estimaciones precisas sobre el rendimiento goleador de los jugadores del 
                fútbol colombiano, utilizando técnicas de aprendizaje automático y análisis 
                estadístico avanzados.
              </p>
              <p>
                El proyecto combina varios modelos predictivos para ofrecer resultados más 
                precisos y confiables que los métodos tradicionales, considerando una amplia 
                gama de factores que influyen en el rendimiento de un jugador.
              </p>
              <p>
                Toda la información y datos utilizados provienen de fuentes públicas y son 
                procesados sistemáticamente para entrenar los modelos de predicción.
              </p>
            </div>
          </Card>
          
          <Card title="Tecnologías Utilizadas">
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-md font-medium text-gray-800">Backend</h3>
                  <p className="text-sm text-gray-600">
                    Desarrollado con FastAPI (Python), implementando modelos de 
                    aprendizaje automático como LSTM, SARIMAX y distribución de Poisson.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-md font-medium text-gray-800">Frontend</h3>
                  <p className="text-sm text-gray-600">
                    Interfaz construida con React, TypeScript y Tailwind CSS, 
                    proporcionando una experiencia fluida y visualizaciones interactivas.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-md font-medium text-gray-800">Modelos</h3>
                  <p className="text-sm text-gray-600">
                    <strong>LSTM:</strong> Redes neuronales con capacidad de memoria a largo plazo.<br />
                    <strong>SARIMAX:</strong> Modelo estadístico para series temporales con variables exógenas.<br />
                    <strong>Poisson:</strong> Distribución para modelar eventos discretos como goles.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
        
        <Card title="Modelos de Predicción">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">LSTM (Long Short-Term Memory)</h3>
              <p className="text-gray-600">
                Las redes LSTM son un tipo especial de redes neuronales recurrentes capaces 
                de aprender dependencias a largo plazo. Son particularmente útiles para analizar 
                series temporales, como el rendimiento de un jugador a lo largo de varios partidos. 
                Este modelo considera factores como racha actual, minutos jugados, tiros a puerta, 
                y el historial reciente del jugador.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">SARIMAX</h3>
              <p className="text-gray-600">
                Seasonal AutoRegressive Integrated Moving Average with eXogenous factors (SARIMAX) 
                es un modelo estadístico para series temporales que toma en cuenta la estacionalidad 
                y factores externos. Es especialmente adecuado para capturar patrones cíclicos en el 
                rendimiento de los jugadores, como mejor desempeño en ciertos días de la semana o 
                contra equipos específicos.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Poisson</h3>
              <p className="text-gray-600">
                El modelo de Poisson se basa en la distribución estadística del mismo nombre, 
                que modela eventos discretos y poco frecuentes. Es particularmente adecuado para 
                modelar goles en fútbol, ya que proporciona una distribución de probabilidad completa 
                para diferentes cantidades de goles (0, 1, 2, etc.). Este modelo considera la media 
                histórica de goles del jugador y factores específicos del partido.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ensemble</h3>
              <p className="text-gray-600">
                El modelo ensemble combina las predicciones de los tres modelos anteriores, 
                ponderando cada uno según su fiabilidad histórica. Este enfoque ayuda a mitigar 
                las debilidades individuales de cada modelo y aprovechar sus fortalezas, 
                proporcionando una predicción más robusta y precisa que cualquier modelo individual.
              </p>
            </div>
          </div>
        </Card>
        
        <Card title="Nota de Limitación">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Aviso importante:</strong> Este sistema proporciona predicciones 
                  basadas en análisis estadístico y modelos de aprendizaje automático, pero 
                  no debe utilizarse como única fuente para toma de decisiones importantes. 
                  Las predicciones tienen un margen de error inherente debido a la naturaleza 
                  impredecible del deporte.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default AboutPage;