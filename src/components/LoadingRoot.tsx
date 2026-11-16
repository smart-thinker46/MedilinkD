import React from 'react';
import App from '../App';
import { LoadingProvider } from './loading/LoadingContext';
import { LoadingOverlay } from './loading/LoadingOverlay';

/**
 * Root component that provides global loading context and overlay.
 * Wraps the main App component.
 */
export const LoadingRoot = () => (
  <LoadingProvider>
    <App />
    <LoadingOverlay />
  </LoadingProvider>
);

export default LoadingRoot;

