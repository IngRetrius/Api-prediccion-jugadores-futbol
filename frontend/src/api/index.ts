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
    const errorResponse: ApiError = {
      detail: error.response?.data?.detail || 'Error de conexión con el servidor',
      status_code: error.response?.status || 500,
    };
    
    console.error('API Error:', errorResponse);
    return Promise.reject(errorResponse);
  }
);

// Wrapper para peticiones GET
export const apiGet = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  const response = await axiosInstance.get<T>(url, config);
  return response.data;
};

// Wrapper para peticiones POST
export const apiPost = async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  const response = await axiosInstance.post<T>(url, data, config);
  return response.data;
};

export default axiosInstance;