import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import './MedilinkSplashScreen.css';

/**
 * Splash screen component displayed in the dedicated Tauri "splash" window.
 * It shows the Medilink logo, a tagline, a spinner, and the current
 * initialization stage sent from the Rust side via the `progress-update`
 * Tauri event.
 */
export const MedilinkSplashScreen = () => {
  const [stage, setStage] = useState('Starting…');

  // Listen for backend progress updates.
  useEffect(() => {
    let unlisten: (() => void) | null = null;
    listen('progress-update', (e) => {
      // Payload shape: { stage: string }
      if (e && e.payload && typeof (e.payload as any).stage === 'string') {
        setStage((e.payload as any).stage);
      }
    }).then((fn) => { unlisten = fn; });
    return () => {
      unlisten?.();
    };
  }, []);

  // When the main app signals it is ready, request the Rust command to hide this
  // splash and show the main window.
  useEffect(() => {
    let unlistenDone: (() => void) | null = null;
    listen('init-done', async () => {
      try {
        await invoke('show_main');
      } catch (err) {
        console.error('Failed to show main window:', err);
      }
    }).then((fn) => { unlistenDone = fn; });
    return () => {
      unlistenDone?.();
    };
  }, []);

  return (
    <div className="medilink-splash-root" role="presentation">
      <div className="logo" />
      <h1 className="title">Medilink HMIS Desktop</h1>
      <p className="tagline">Intelligent Healthcare. Connected Operations.</p>
      <div className="spinner" />
      <p className="stage" aria-live="polite">
        {stage}
      </p>
      <p className="version">v{import.meta.env.VITE_APP_VERSION ?? '1.0.0'}</p>
    </div>
  );
};
