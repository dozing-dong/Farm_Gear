import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ENV_CONFIG } from './lib/env-config';

// Disable React DevTools warning in development environment
if (import.meta.env.DEV) {
  // @ts-expect-error React DevTools global hook
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { isDisabled: true };
}

createRoot(document.getElementById('root')!).render(
  ENV_CONFIG.ENABLE_DEBUG_LOGS ? (
    <StrictMode>
      <App />
    </StrictMode>
  ) : (
    <App />
  )
);
