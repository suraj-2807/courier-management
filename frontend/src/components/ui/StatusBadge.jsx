import { getStatusLabel, getStatusColor } from '../../utils/formatters'

export default function StatusBadge({ status, size = 'sm' }) {
  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-0.5 text-[11px]',
    md: 'px-3 py-1 text-[12px]'
  }

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-md border ${getStatusColor(status)} ${sizeClasses[size]}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse-dot" />
      {getStatusLabel(status)}
    </span>
  )
}
