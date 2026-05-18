import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UI_SCALES } from '../widgets/uiScales';
import { HeaderScale } from '../widgets/Header/types';

interface UIScaleContextType {
  scale: HeaderScale;
  setScale: (scale: HeaderScale) => void;
  getScaleValue: () => typeof UI_SCALES[keyof typeof UI_SCALES];  
}

const UIScaleContext = createContext<UIScaleContextType | undefined>(undefined);

export const useUIScale = () => {
  const context = useContext(UIScaleContext);
  if (!context) {
    throw new Error('useUIScale must be used within UIScaleProvider');
  }
  return context;
};

interface UIScaleProviderProps {
  children: ReactNode;
}

export const UIScaleProvider: React.FC<UIScaleProviderProps> = ({ children }) => {
  const [scale, setScale] = useState<HeaderScale>('M');

  useEffect(() => {
    const savedScale = localStorage.getItem('uiScale') as HeaderScale;
    if (savedScale && UI_SCALES[savedScale]) {
      setScale(savedScale);
    }
    const values = UI_SCALES[scale];
    const root = document.documentElement;
    root.style.setProperty('--header-height', `${values.headerHeight}px`);
    root.style.setProperty('--title-font-size', `${values.titleFont}px`);
    root.style.setProperty('--font-base', `${values.baseFont}px`);
    root.style.setProperty('--font-small', `${values.smallFont}px`);
    root.style.setProperty('--spacing', `${values.spacing}px`);
  }, [scale]);

  const handleSetScale = (newScale: HeaderScale) => {
    setScale(newScale);
    localStorage.setItem('uiScale', newScale);
  };

  const getScaleValue = () => UI_SCALES[scale];

  return (
    <UIScaleContext.Provider value={{ scale, setScale: handleSetScale, getScaleValue }}>
      {children}
    </UIScaleContext.Provider>
  );
};