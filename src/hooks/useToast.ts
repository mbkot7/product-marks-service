import { useState, useCallback } from 'react'

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback(({ title, description, variant = 'default' }: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: Toast = { id, title, description, variant }
    
    setToasts(prevToasts => [...prevToasts, newToast])
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prevToasts => prevToasts.filter(t => t.id !== id))
    }, 5000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prevToasts => prevToasts.filter(t => t.id !== id))
  }, [])

  return {
    toast,
    toasts,
    removeToast
  }
}
