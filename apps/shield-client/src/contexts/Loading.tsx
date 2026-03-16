import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { createContext, useContext, useState } from "react";

interface ILoadingContext {
  isLoading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const LoadingContext = createContext<ILoadingContext | null>(null);

const useLoadingContext = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("User context must be used inside provider!");
  }

  return context;
};

const LoadingProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setLoading] = useState<boolean>(false);
  const isFetching = useIsFetching({ predicate: (query) => query.state.status === "pending" && query.meta?.loading !== false });
  const isMutating = useIsMutating({ predicate: (mutation) => mutation.meta?.loading !== false });
  const backdropOpen = isLoading || isFetching > 0 || isMutating > 0;

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading }}>
      <Backdrop open={backdropOpen} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1000 }}>
        <CircularProgress size="100px" />
      </Backdrop>
      {children}
    </LoadingContext.Provider>
  );
};

export { useLoadingContext };
export default LoadingProvider;
