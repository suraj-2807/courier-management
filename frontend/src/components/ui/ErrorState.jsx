import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function ErrorState({
  message = 'Something went wrong',
  onRetry
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
        style={{ backgroundColor: 'var(--color-danger-bg)' }}
      >
        <AlertTriangle className="w-7 h-7" style={{ color: 'var(--color-danger)' }} strokeWidth={1.5} />
      </div>
      <h3 className="text-[15px] font-semibold text-text-primary mb-1"
        style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}
      >
        Something went wrong
      </h3>
      <p className="text-[13px] text-text-tertiary max-w-sm mb-4">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn btn-primary btn-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try Again
        </button>
      )}
    </div>
  )
}
