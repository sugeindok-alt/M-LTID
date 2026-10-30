'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { MotionConfig, AnimatePresence, motion } from 'motion/react';
import { Check, X, AlertCircle } from 'lucide-react';
const ToastContext = createContext<(message: string, error?: boolean) => void>(() => {});
export const useToast = () => useContext(ToastContext);
export function Providers({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ message: string; error: boolean } | null>(null);
  const notify = useCallback((message: string, error = false) => setToast({ message, error }), []);
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timeout);
  }, [toast]);
  useEffect(() => {
    const theme = localStorage.getItem('maltid-theme');
    if (theme && ['olive', 'tomato', 'nordic', 'dark', 'basil'].includes(theme))
      document.documentElement.dataset.theme = theme;
  }, []);
  return (
    <MotionConfig reducedMotion="user">
      <ToastContext.Provider value={notify}>
        {children}
        <div className="toast-region" aria-live="polite">
          <AnimatePresence>
            {toast && (
              <motion.div
                className="toast"
                role={toast.error ? 'alert' : 'status'}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
              >
                {toast.error ? <AlertCircle size={20} /> : <Check size={20} />}
                <span>{toast.message}</span>
                <button aria-label="Lukk meldinga" onClick={() => setToast(null)}>
                  <X size={18} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ToastContext.Provider>
    </MotionConfig>
  );
}
