import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  className = '',
  startIcon,
  endIcon,
  ...rest
}) => {
  const hasError = !!error;
  
  // Base classes
  const baseInputClasses = 'rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm';
  
  // Input state classes
  const stateClasses = hasError 
    ? 'border-red-300 text-red-900 placeholder-red-300'
    : 'border-gray-300 placeholder-gray-400';
  
  // Width classes
  const widthClasses = fullWidth ? 'w-full' : '';
  
  // Padding classes (adjust for icons)
  const paddingClasses = startIcon && endIcon 
    ? 'pl-10 pr-10' 
    : startIcon 
      ? 'pl-10' 
      : endIcon 
        ? 'pr-10' 
        : 'px-3';
  
  const inputClasses = `
    ${baseInputClasses}
    ${stateClasses}
    ${widthClasses}
    ${paddingClasses}
    py-2
    border
    ${className}
  `;
  
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        {startIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {startIcon}
          </div>
        )}
        
        <input
          className={inputClasses}
          aria-invalid={hasError}
          {...rest}
        />
        
        {endIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {endIcon}
          </div>
        )}
      </div>
      
      {hasError ? (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      ) : null}
    </div>
  );
};

export default Input;