import { format, parse, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

// Formato de fecha para la API
export const API_DATE_FORMAT = 'yyyy-MM-dd';

// Formatear fecha para mostrar en la UI
export const formatDisplayDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd MMM yyyy', { locale: es });
};

// Formatear fecha para enviar a la API
export const formatAPIDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, API_DATE_FORMAT);
};

// Parsear fecha desde string
export const parseDate = (dateString: string, dateFormat = API_DATE_FORMAT): Date => {
  const parsed = parse(dateString, dateFormat, new Date());
  return isValid(parsed) ? parsed : new Date();
};

// Obtener fecha actual formateada
export const getCurrentDate = (): string => {
  return formatAPIDate(new Date());
};

// Obtener día de la semana
export const getDayOfWeek = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'EEEE', { locale: es });
};

// Verificar si es fin de semana
export const isWeekend = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const day = dateObj.getDay();
  return day === 0 || day === 6; // 0 es domingo, 6 es sábado
};