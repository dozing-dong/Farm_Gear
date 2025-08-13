import React from 'react';

interface ErrorFallbackProps {
  error: Error;
  reset: () => void;
}

export function ErrorFallback({ error, reset }: ErrorFallbackProps): React.ReactNode {
  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center text-center p-6">
      <h1 className="text-2xl font-semibold mb-2">Something went wrong</h1>
      <p className="text-muted-foreground max-w-xl mb-4">
        An unexpected error occurred while rendering this page. You can try again.
      </p>
      <pre className="text-sm bg-muted p-3 rounded mb-4 max-w-xl overflow-auto">
        {error.message}
      </pre>
      <button onClick={reset} className="px-4 py-2 rounded bg-black text-white dark:bg-white dark:text-black">
        Try again
      </button>
    </div>
  );
}

export default ErrorFallback;


