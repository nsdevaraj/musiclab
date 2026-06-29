import { createContext, useContext } from 'react';

export const StudioContext = createContext(null);

export function useStudio() {
  const c = useContext(StudioContext);
  if (!c) throw new Error('useStudio must be used within StudioProvider');
  return c;
}
