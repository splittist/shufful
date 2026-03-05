import type { SourcePage } from '../types'

interface PageThumbnailProps {
  page: SourcePage
  selected?: boolean
  onSelect?: () => void
  /** Small badge to show (e.g. assembly index). */
  badge?: number | string
  /** Whether this is in the assembly area (shows remove button). */
  inAssembly?: boolean
  onRemove?: () => void
  dragging?: boolean
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
}

export function PageThumbnail({
  page,
  selected = false,
  onSelect,
  badge,
  inAssembly = false,
  onRemove,
  dragging = false,
  dragHandleProps,
}: PageThumbnailProps) {
  return (
    <div
      className={`relative rounded-lg border-2 overflow-hidden cursor-pointer group transition-all select-none ${
        dragging
          ? 'shadow-xl scale-105 opacity-80 border-blue-400'
          : selected
          ? 'border-blue-500 shadow-md'
          : 'border-slate-200 hover:border-blue-300'
      }`}
      onClick={onSelect}
      data-testid="page-thumbnail"
      data-page-id={page.id}
    >
      {/* Thumbnail image */}
      <img
        src={page.thumbnail}
        alt={`Page ${page.pageNumber} of ${page.documentName}`}
        className="w-full object-cover bg-white"
        draggable={false}
      />

      {/* Page number label */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-0.5">
        p.{page.pageNumber}
      </div>

      {/* Assembly index badge */}
      {badge !== undefined && (
        <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow">
          {badge}
        </div>
      )}

      {/* Remove button (assembly area) */}
      {inAssembly && onRemove && (
        <button
          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow text-xs leading-none"
          onClick={e => {
            e.stopPropagation()
            onRemove()
          }}
          aria-label="Remove page from assembly"
          title="Remove"
        >
          ×
        </button>
      )}

      {/* Drag handle */}
      {dragHandleProps && (
        <div
          {...dragHandleProps}
          className="absolute top-1 right-1 p-0.5 rounded bg-slate-200/80 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Drag to reorder"
          onClick={e => e.stopPropagation()}
        >
          <svg className="h-3 w-3 text-slate-600" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
          </svg>
        </div>
      )}
    </div>
  )
}
