import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LoadingState {
  // map of loader IDs to active count
  [id: string]: number;
}

interface LoadingContextProps {
  loading: LoadingState;
  show: (id: string) => void;
  hide: (id: string) => void;
}

const LoadingContext = createContext<LoadingContextProps | undefined>(undefined);

export const LoadingProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState<LoadingState>({});

  const show = (id: string) => {
    setLoading((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  };

  const hide = (id: string) => {
    setLoading((prev) => {
      const current = prev[id] ?? 0;
      if (current <= 1) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: current - 1 };
    });
  };

  return (
    <LoadingContext.Provider value={{ loading, show, hide }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoadingContext = () => {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error('useLoadingContext must be used within LoadingProvider');
  return ctx;
};

