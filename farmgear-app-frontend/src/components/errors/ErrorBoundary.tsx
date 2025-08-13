import React from 'react';
import { logger } from '../../lib/logger';
import { ENV_CONFIG } from '../../lib/env-config';

type FallbackRender = (props: { error: Error; reset: () => void }) => React.ReactNode;

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode | FallbackRender;
  onError?: (error: Error, info: React.ErrorInfo) => void;
  onReset?: () => void;
  resetKeys?: Array<unknown>;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  state: ErrorBoundaryState = { error: null };

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    if (ENV_CONFIG.ENABLE_ERROR_REPORTING) {
      logger.error('UI render error caught by ErrorBoundary', { error, info });
      // TODO: send to remote error reporting service if integrated
    }
    if (this.props.onError) this.props.onError(error, info);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetKeys } = this.props;
    if (this.state.error && resetKeys && prevProps.resetKeys) {
      const hasChanged = resetKeys.length !== prevProps.resetKeys.length ||
        resetKeys.some((item, index) => !Object.is(item, prevProps.resetKeys![index]));
      if (hasChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  resetErrorBoundary = (): void => {
    this.setState({ error: null });
    if (this.props.onReset) this.props.onReset();
  };

  render(): React.ReactNode {
    const { error } = this.state;
    const { children, fallback } = this.props;

    if (error) {
      if (typeof fallback === 'function') {
        return (fallback as FallbackRender)({ error, reset: this.resetErrorBoundary });
      }
      if (fallback) return fallback;
      return null; // Let parent decide or use a default fallback outside
    }

    return children;
  }
}

export default ErrorBoundary;


