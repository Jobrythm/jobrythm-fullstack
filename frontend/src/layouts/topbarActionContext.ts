import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

export interface TopbarActionContextValue {
  setTopbarAction: (node: ReactNode) => void;
}

export const TopbarActionContext = createContext<TopbarActionContextValue | null>(null);

export const useTopbarAction = () => {
  const ctx = useContext(TopbarActionContext);
  if (!ctx) {
    throw new Error('useTopbarAction must be used inside AppLayout');
  }
  return ctx;
};

