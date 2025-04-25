import React from 'react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullPage?: boolean;
}

const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  text = 'Cargando...',
  fullPage = false,
}) => {
  // Size classes for the spinner
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };
  
  // Text size classes
  const textClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };
  
  // Padding classes
  const paddingClasses = {
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
  };
  
  const spinner = (
    <svg 
      className={`animate-spin ${sizeClasses[size]} text-blue-600`} 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      ></circle>
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
  
  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
        <div className="text-center">
          {spinner}
          {text && <p className={`mt-3 ${textClasses[size]} text-gray-700`}>{text}</p>}
        </div>
      </div>
    );
  }
  
  return (
    <div className={`flex flex-col items-center justify-center ${paddingClasses[size]}`}>
      {spinner}
      {text && <p className={`mt-2 ${textClasses[size]} text-gray-700`}>{text}</p>}
    </div>
  );
};

export default Loading;