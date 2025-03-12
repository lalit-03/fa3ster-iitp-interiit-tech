"use client"
import React, {
  createContext,
  useState,
  ReactNode,
  FC,
  useContext,
} from "react";

// Define the shape of the context state
interface RefreshContextType {
  refreshVar: string;
  setrefreshVar: (value: string) => void;
}

// Create the context with a default value of undefined
export const RefreshContext = createContext<RefreshContextType | undefined>(
  undefined,
);

// Define the provider props type
interface RefreshProviderProps {
  children: ReactNode;
}

// Create the provider component
export const RefreshProvider: FC<RefreshProviderProps> = ({ children }) => {
  const [refreshVar, setrefreshVar] = useState<string>("nope");

  return (
    <RefreshContext.Provider value={{ refreshVar, setrefreshVar }}>
      {children}
    </RefreshContext.Provider>
  );
};

// Custom hook for using the RefreshContext in components
export const useRefreshContext = () => {
  const context = useContext(RefreshContext);
  if (!context) {
    throw new Error("useRefreshContext must be used within a RefreshProvider");
  }
  return context;
};
