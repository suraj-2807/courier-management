import { PackageOpen } from 'lucide-react'

export default function EmptyState({
  icon: Icon = PackageOpen,
  title = 'No data found',
  description = 'There are no records to display.',
  action
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
        style={{ backgroundColor: 'var(--color-surface-alt)' }}
      >
        <Icon className="w-7 h-7 text-text-tertiary" strokeWidth={1.5} />
      </div>
      <h3 className="text-[15px] font-semibold text-text-primary mb-1"
        style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}
      >
        {title}
      </h3>
      <p className="text-[13px] text-text-tertiary max-w-sm mb-4">
        {description}
      </p>
      {action}
    </div>
  )
}
