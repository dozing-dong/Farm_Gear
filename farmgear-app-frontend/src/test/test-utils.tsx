import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';

// Create QueryClient for testing
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

// Test wrapper component
interface AllTheProvidersProps {
  children: React.ReactNode;
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

// Custom render function
const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) => {
  const user = userEvent.setup();
  return {
    user,
    ...render(ui, { wrapper: AllTheProviders, ...options }),
  };
};

// Re-export all testing-library utilities
export * from '@testing-library/react';
export { customRender as render, userEvent };
