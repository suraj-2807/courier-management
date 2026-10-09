import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  limit = 10,
  onLimitChange,
  total = 0,
  limitOptions = [10, 20, 50, 100]
}) {
  const currentTotal = total || 0
  const startItem = currentTotal === 0 ? 0 : (page - 1) * limit + 1
  const endItem = Math.min(page * limit, currentTotal)

  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    let start = Math.max(1, page - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return pages
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-surface rounded-xl border border-border mt-3">
      {/* Left: Counts */}
      <div className="flex items-center gap-3 text-[12px] text-text-secondary">
        {currentTotal > 0 ? (
          <span>
            Showing <span className="font-semibold text-text-primary">{startItem}–{endItem}</span> of{' '}
            <span className="font-semibold text-text-primary">{currentTotal}</span>
          </span>
        ) : (
          <span>
            Page <span className="font-semibold text-text-primary">{page}</span> of{' '}
            <span className="font-semibold text-text-primary">{Math.max(1, totalPages)}</span>
          </span>
        )}

        {/* Per-page selector */}
        {onLimitChange && (
          <div className="flex items-center gap-1.5 pl-3 border-l border-border">
            <span className="text-[11px] font-medium text-text-tertiary">Rows:</span>
            <div className="flex items-center gap-0.5 bg-surface-alt p-0.5 rounded-md border border-border-light">
              {limitOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onLimitChange(opt)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                    limit === opt
                      ? 'text-white'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                  }`}
                  style={limit === opt ? { backgroundColor: 'var(--color-primary)' } : undefined}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: Navigation */}
      {totalPages > 1 && (
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded-md hover:bg-surface-hover disabled:opacity-25 disabled:cursor-not-allowed text-text-secondary hover:text-text-primary transition-colors cursor-pointer border border-border-light"
            title="Previous Page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {getPageNumbers().map((num) => (
            <button
              key={num}
              onClick={() => onPageChange(num)}
              className={`w-7 h-7 rounded-md text-[12px] font-semibold transition-all cursor-pointer ${
                num === page
                  ? 'text-white'
                  : 'hover:bg-surface-hover text-text-secondary border border-transparent hover:border-border-light'
              }`}
              style={num === page ? { backgroundColor: 'var(--color-primary)' } : undefined}
            >
              {num}
            </button>
          ))}

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded-md hover:bg-surface-hover disabled:opacity-25 disabled:cursor-not-allowed text-text-secondary hover:text-text-primary transition-colors cursor-pointer border border-border-light"
            title="Next Page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
