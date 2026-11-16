import React from 'react';
import { useLoadingContext } from './LoadingContext';
import { LoadingSpinner } from './LoadingSpinner';
import './loading.css';

/**
 * Premium Hospital Loading Overlay
 * Shows a semi-transparent backdrop, multi-ring pulse spinner, animated progress bar,
 * and high-grade clinical status messaging.
 */
function resolveFriendlyMessage(id: string): string {
  const lower = id.toLowerCase();
  if (lower.includes('patient') || lower.includes('registration')) {
    return 'Retrieving Master Patient Index records...';
  }
  if (lower.includes('sync') || lower.includes('cloud')) {
    return 'Synchronizing records with hospital database...';
  }
  if (lower.includes('auth') || lower.includes('login') || lower.includes('token')) {
    return 'Verifying clinical session credentials...';
  }
  if (lower.includes('billing') || lower.includes('invoice') || lower.includes('payment')) {
    return 'Processing financial and billing ledger...';
  }
  if (lower.includes('pharmacy') || lower.includes('dispense') || lower.includes('medicine')) {
    return 'Querying pharmacy stock and formulary...';
  }
  if (lower.includes('lab') || lower.includes('radiology') || lower.includes('diagnostic')) {
    return 'Loading diagnostic laboratory requests...';
  }
  if (lower.includes('opd') || lower.includes('queue') || lower.includes('triage')) {
    return 'Updating outpatient queue status...';
  }
  if (lower.includes('report') || lower.includes('analytics')) {
    return 'Compiling clinical intelligence reports...';
  }
  return 'Synchronizing MediLink Hospital Information System...';
}

export const LoadingOverlay: React.FC = () => {
  const { loading } = useLoadingContext();
  const activeIds = Object.keys(loading);
  if (activeIds.length === 0) return null;

  const currentId = activeIds[activeIds.length - 1];
  const message = resolveFriendlyMessage(currentId);

  return (
    <div className="loading-overlay" role="dialog" aria-modal="true" aria-live="polite">
      <div className="loading-card">
        <LoadingSpinner size="lg" withPulse={true} />
        
        <div>
          <h4 className="loading-title">MediLink HMIS</h4>
          <p className="loading-subtitle">{message}</p>
        </div>

        <div className="loading-bar-track">
          <div className="loading-bar-fill" />
        </div>
      </div>
    </div>
  );
};
