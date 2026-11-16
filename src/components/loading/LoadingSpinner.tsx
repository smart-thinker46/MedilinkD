import React from 'react';
import './loading.css';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'teal' | 'white';
  withPulse?: boolean;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'teal',
  withPulse = false,
  className = '',
}) => {
  return (
    <div className={`spinner-container ${className}`} role="status" aria-label="Loading">
      {withPulse && <div className="spinner-pulse-ring" />}
      <div className={`spinner-circle size-${size} variant-${variant}`} />
    </div>
  );
};
