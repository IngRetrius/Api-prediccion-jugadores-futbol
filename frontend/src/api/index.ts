import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiError } from '../types/api';

// Crear instancia de axios con configuración base
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const axiosInstance: AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos de timeout
});

// Interceptor para manejar errores de forma global
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    // Crear un objeto de error más detallado
    let errorDetail = 'Error de conexión con el servidor';
    let statusCode = 500;
    
    if (error.response) {
      // La respuesta del servidor contiene información de error
      statusCode = error.response.status;
      
      if (error.response.data) {
        if (typeof error.response.data === 'string') {
          errorDetail = error.response.data;
        } else if (error.response.data.detail) {
          if (Array.isArray(error.response.data.detail)) {
            // Para errores de validación (422)
            const validationErrors = error.response.data.detail.map((err: any) => 
              `Campo: ${err.loc.join('.')} - ${err.msg}`
            ).join('; ');
            errorDetail = `Error de validación: ${validationErrors}`;
          } else {
            errorDetail = error.response.data.detail;
          }
        }
      }
    } else if (error.request) {
      // La petición fue hecha pero no se recibió respuesta
      errorDetail = 'No se recibió respuesta del servidor';
    } else {
      // Error al configurar la petición
      errorDetail = error.message;
    }
    
    const errorResponse: ApiError = {
      detail: errorDetail,
      status_code: statusCode,
    };
    
    console.error('API Error:', errorResponse);
    return Promise.reject(errorResponse);
  }
);

// Wrapper para peticiones GET
export const apiGet = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  try {
    const response = await axiosInstance.get<T>(url, config);
    return response.data;
  } catch (error) {
    console.error(`Error en GET ${url}:`, error);
    throw error;
  }
};

// Wrapper para peticiones POST
export const apiPost = async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  try {
    // NO modificar la estructura de los datos aquí
    // Eliminamos la línea: const cleanData = data?.request ? data.request : data;
    
    // Log para depuración
    console.log(`POST ${url}:`, data);
    
    const response = await axiosInstance.post<T>(url, data, config);
    return response.data;
  } catch (error) {
    console.error(`Error en POST ${url}:`, error);
    throw error;
  }
};

export default axiosInstance;