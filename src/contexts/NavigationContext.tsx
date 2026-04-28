import React, { createContext, useContext, useState } from 'react';
import { Page } from '../lib/types';

interface NavigationContextType {
  page: Page;
  pageParams: Record<string, string>;
  navigate: (page: Page, params?: Record<string, string>) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [page, setPage] = useState<Page>('home');
  const [pageParams, setPageParams] = useState<Record<string, string>>({});

  const navigate = (newPage: Page, params: Record<string, string> = {}) => {
    setPage(newPage);
    setPageParams(params);
  };

  return (
    <NavigationContext.Provider value={{ page, pageParams, navigate }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider');
  return ctx;
}
