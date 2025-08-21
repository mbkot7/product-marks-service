import { Toast } from '@/hooks/useToast'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToasterProps {
  toasts: Toast[]
  removeToast: (id: string) => void
}

export function Toaster({ toasts, removeToast }: ToasterProps) {
  return (
    <div className="fixed top-0 right-0 z-50 w-full md:max-w-[420px] p-4 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "relative bg-white border rounded-lg shadow-lg p-4 transition-all duration-300 ease-in-out",
            toast.variant === 'destructive' && "border-red-200 bg-red-50"
          )}
        >
          <button
            onClick={() => removeToast(toast.id)}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
          
          {toast.title && (
            <div className={cn(
              "font-semibold text-sm mb-1",
              toast.variant === 'destructive' ? "text-red-900" : "text-gray-900"
            )}>
              {toast.title}
            </div>
          )}
          
          {toast.description && (
            <div className={cn(
              "text-sm",
              toast.variant === 'destructive' ? "text-red-700" : "text-gray-600"
            )}>
              {toast.description}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
