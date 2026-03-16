import { QueryClientProvider as ClientProvider, MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

const queryCache = new QueryCache();
const mutationCache = new MutationCache({});

const QueryClientProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    queryCache,
    mutationCache,
    defaultOptions: {
      queries: { staleTime: Infinity, retry: false },
      mutations: {
        retry: false,
      },
    },
  });

  return <ClientProvider client={queryClient}>{children}</ClientProvider>;
};

export default QueryClientProvider;
