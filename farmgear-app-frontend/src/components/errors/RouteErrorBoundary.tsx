import React from 'react';
import { useLocation } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import ErrorFallback from './ErrorFallback';

interface RouteErrorBoundaryProps {
  children: React.ReactNode;
}

export function RouteErrorBoundary({ children }: RouteErrorBoundaryProps): React.ReactNode {
  const location = useLocation();
  return (
    <ErrorBoundary fallback={({ error, reset }) => <ErrorFallback error={error} reset={reset} />} resetKeys={[location.pathname]}>
      {children}
    </ErrorBoundary>
  );
}

export default RouteErrorBoundary;


