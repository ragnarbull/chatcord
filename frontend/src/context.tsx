import { createContext, useContext, useState, ReactNode } from "react";

const AppContext = createContext<{
  isLoading: boolean;
}>({
  isLoading: false,
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);

  return (
    <AppContext.Provider
      value={{
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useGlobalContext = () => {
  return useContext(AppContext);
};
