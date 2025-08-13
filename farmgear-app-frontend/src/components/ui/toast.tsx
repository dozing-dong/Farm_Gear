import * as Toast from '@radix-ui/react-toast';
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from 'lucide-react';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FC,
  type ReactNode,
} from 'react';

// Toast type definitions
export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

// Toast Context type
interface ToastContextType {
  showToast: (message: Omit<ToastMessage, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Optimized Toast Provider component
export const ToastProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // 🎯 Key optimization: use useCallback to stabilize function reference, avoid child component re-renders
  const showToast = useCallback((message: Omit<ToastMessage, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const toast = { ...message, id };

    // 🎯 Use functional update to avoid closure issues
    setToasts((prev) => [...prev, toast]);

    // 🎯 Key optimization: don't re-render entire Provider when removing toast
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, message.duration || 5000);
  }, []); // Empty dependency array, function reference never changes

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Listen for global toast events
  useEffect(() => {
    const handleGlobalToast = (event: CustomEvent) => {
      const toastData = event.detail;
      showToast({
        type: toastData.type,
        title: toastData.title,
        description: toastData.description,
        duration: toastData.duration,
      });
    };

    window.addEventListener('global-toast', handleGlobalToast as EventListener);

    return () => {
      window.removeEventListener('global-toast', handleGlobalToast as EventListener);
    };
  }, [showToast]);

  // 🎯 Key optimization: use useMemo to stabilize context value
  const contextValue = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      <Toast.Provider swipeDirection="left">
        {children}
        {/* 🎯 Toast rendering area, isolated from children */}
        {toasts.map((toast) => (
          <Toast.Root
            key={toast.id}
            className={`
              bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80 max-w-sm
              data-[state=open]:animate-slideIn
              data-[state=closed]:animate-slideOut
              data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]
              data-[swipe=cancel]:translate-x-0
              data-[swipe=cancel]:transition-transform
              data-[swipe=end]:animate-swipeOut
              ${toast.type === 'success' ? 'border-green-200 bg-green-50' : ''}
              ${toast.type === 'error' ? 'border-red-200 bg-red-50' : ''}
              ${toast.type === 'warning' ? 'border-yellow-200 bg-yellow-50' : ''}
              ${toast.type === 'info' ? 'border-blue-200 bg-blue-50' : ''}
            `}
            style={{
              animationDuration: '0.4s',
              animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            duration={toast.duration || 5000}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                {toast.type === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
                {toast.type === 'warning' && <TriangleAlert className="w-5 h-5 text-yellow-600" />}
                {toast.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
              </div>

              {/* Content */}
              <div className="flex-1">
                <Toast.Title
                  className={`
                  text-sm font-semibold
                  ${toast.type === 'success' ? 'text-green-800' : ''}
                  ${toast.type === 'error' ? 'text-red-800' : ''}
                  ${toast.type === 'warning' ? 'text-yellow-800' : ''}
                  ${toast.type === 'info' ? 'text-blue-800' : ''}
                `}
                >
                  {toast.title}
                </Toast.Title>
                {toast.description && (
                  <Toast.Description
                    className={`
                    text-sm mt-1
                    ${toast.type === 'success' ? 'text-green-700' : ''}
                    ${toast.type === 'error' ? 'text-red-700' : ''}
                    ${toast.type === 'warning' ? 'text-yellow-700' : ''}
                    ${toast.type === 'info' ? 'text-blue-700' : ''}
                  `}
                  >
                    {toast.description}
                  </Toast.Description>
                )}
              </div>

              {/* Close button */}
              <Toast.Close
                className="text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => removeToast(toast.id)}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </Toast.Close>
            </div>
          </Toast.Root>
        ))}
        <Toast.Viewport className="fixed top-16 left-4 flex flex-col p-6 gap-2 w-80 max-w-[100vw] m-0 list-none z-[2147483647] outline-none" />
      </Toast.Provider>
    </ToastContext.Provider>
  );
};

// Export ToastContext for external use
export { ToastContext };
