"use client";
import React, {
  createContext,
  useState,
  ReactNode,
  FC,
  useContext,
} from "react";

// Define the shape of the context state
interface AppModeContextType {
  AppModeVar: string;
  setAppModeVar: (value: string) => void;
}

// Create the context with a default value of undefined
export const AppModeContext = createContext<AppModeContextType | undefined>(
  undefined,
);

// Define the provider props type
interface AppModeProviderProps {
  children: ReactNode;
}

// Create the provider component
export const AppModeProvider: FC<AppModeProviderProps> = ({ children }) => {
  const [AppModeVar, setAppModeVar] = useState<string>("chatMode");

  return (
    <AppModeContext.Provider value={{ AppModeVar, setAppModeVar }}>
      {children}
    </AppModeContext.Provider>
  );
};

// Custom hook for using the AppModeContext in components
export const useAppModeContext = () => {
  const context = useContext(AppModeContext);
  if (!context) {
    throw new Error("useAppModeContext must be used within a AppModeProvider");
  }
  return context;
};
