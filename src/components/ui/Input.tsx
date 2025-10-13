import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, ...props }, ref) => {
    return (
      <div className="w-full text-left">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        <input
        autoComplete="on"
          ref={ref}
          {...props}
          className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            error ? 'border-red-500 ring-red-200' : 'border-gray-300 ring-blue-200'
          }`}
        />
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>
    );
  }
);

export default Input;