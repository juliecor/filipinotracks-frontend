import { createContext, useContext, useCallback, useState, useMemo } from 'react'
import { Snackbar, Alert, Slide, Stack } from '@mui/material'

const ToastContext = createContext(null)

/**
 * Global toast / snackbar system.
 *
 * Usage anywhere in the app:
 *   const toast = useToast()
 *   toast.success('Property saved')
 *   toast.error('Could not delete this transaction')
 *   toast.info('5 new notifications')
 *   toast.warning('Map will not save without a pin')
 *
 * Toasts stack at the bottom-right (max 3 visible), auto-dismiss after 4s,
 * and can be manually closed via the X button.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const close = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const push = useCallback((severity, message, options = {}) => {
    const id = Date.now() + Math.random()
    const duration = options.duration ?? 4000
    setToasts(prev => [
      // Keep last 2 + new one = max 3 stacked
      ...prev.slice(-2),
      { id, severity, message, duration, action: options.action },
    ])
    return id
  }, [])

  const api = useMemo(() => ({
    success: (msg, opts) => push('success', msg, opts),
    error:   (msg, opts) => push('error',   msg, opts),
    info:    (msg, opts) => push('info',    msg, opts),
    warning: (msg, opts) => push('warning', msg, opts),
    dismiss: close,
  }), [push, close])

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/* Stack of toasts, bottom-right */}
      <Stack
        spacing={1}
        sx={{
          position: 'fixed',
          right: { xs: 12, sm: 24 },
          bottom: { xs: 12, sm: 24 },
          zIndex: (theme) => theme.zIndex.snackbar + 10,
          maxWidth: { xs: 'calc(100% - 24px)', sm: 420 },
          pointerEvents: 'none',
          alignItems: 'flex-end',
        }}
      >
        {toasts.map((t) => (
          <Snackbar
            key={t.id}
            open
            autoHideDuration={t.duration}
            onClose={(_, reason) => {
              // Ignore clickaway so multi-toast stacks don't dismiss on stray clicks
              if (reason === 'clickaway') return
              close(t.id)
            }}
            TransitionComponent={(props) => <Slide {...props} direction="left" />}
            sx={{
              position: 'static',
              transform: 'none',
              pointerEvents: 'auto',
            }}
          >
            <Alert
              severity={t.severity}
              variant="filled"
              onClose={() => close(t.id)}
              action={t.action}
              sx={{
                minWidth: { xs: 'auto', sm: 280 },
                boxShadow: '0 10px 30px rgba(10,22,40,0.25)',
                borderRadius: 2,
                fontWeight: 600,
                '& .MuiAlert-icon': { alignItems: 'center' },
              }}
            >
              {t.message}
            </Alert>
          </Snackbar>
        ))}
      </Stack>
    </ToastContext.Provider>
  )
}

/**
 * Hook for any component to fire toasts.
 * Returns { success, error, info, warning, dismiss(id) }.
 */
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    // Soft fallback during dev so missing provider doesn't crash everything.
    if (typeof window !== 'undefined' && import.meta.env?.DEV) {
      // eslint-disable-next-line no-console
      console.warn('useToast() called outside <ToastProvider>. Wrap your app in <ToastProvider>.')
    }
    return {
      success: () => {}, error: () => {}, info: () => {}, warning: () => {}, dismiss: () => {},
    }
  }
  return ctx
}
