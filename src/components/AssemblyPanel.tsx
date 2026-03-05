import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { restrictToParentElement } from '@dnd-kit/modifiers'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { AssemblyPage } from '../types'
import { PageThumbnail } from './PageThumbnail'

interface SortableItemProps {
  assemblyPage: AssemblyPage
  index: number
  onRemove: () => void
}

function SortableItem({ assemblyPage, index, onRemove }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: assemblyPage.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
      <PageThumbnail
        page={assemblyPage.source}
        badge={index + 1}
        inAssembly
        onRemove={onRemove}
        dragging={isDragging}
      />
    </div>
  )
}

interface AssemblyPanelProps {
  pages: AssemblyPage[]
  onReorder: (oldIndex: number, newIndex: number) => void
  onRemovePage: (id: string) => void
  onClear: () => void
  onDownload: (filename: string) => void
  downloading: boolean
}

export function AssemblyPanel({
  pages,
  onReorder,
  onRemovePage,
  onClear,
  onDownload,
  downloading,
}: AssemblyPanelProps) {
  const [filename, setFilename] = useState('assembled')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = pages.findIndex(p => p.id === active.id)
    const newIndex = pages.findIndex(p => p.id === over.id)
    if (oldIndex !== -1 && newIndex !== -1) onReorder(oldIndex, newIndex)
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-sm font-semibold text-slate-700 shrink-0">
          Assembly
          {pages.length > 0 && (
            <span className="ml-1.5 text-xs font-normal text-slate-400">
              ({pages.length} {pages.length === 1 ? 'page' : 'pages'})
            </span>
          )}
        </span>
        <div className="flex items-center gap-2 min-w-0">
          {pages.length > 0 && (
            <button
              className="text-xs text-slate-400 hover:text-red-500 shrink-0"
              onClick={onClear}
              title="Clear all pages"
            >
              Clear
            </button>
          )}
          <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden shadow">
            <input
              type="text"
              value={filename}
              onChange={e => setFilename(e.target.value)}
              className="px-2 py-1.5 text-sm text-slate-700 bg-white min-w-0 w-28 focus:outline-none"
              aria-label="Output filename"
              spellCheck={false}
            />
            <span className="px-1.5 py-1.5 text-sm text-slate-400 bg-slate-50 border-l border-slate-200 shrink-0">
              .pdf
            </span>
            <button
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
              onClick={() => onDownload(filename || 'assembled')}
              disabled={pages.length === 0 || downloading}
            >
              {downloading ? 'Assembling…' : 'Download'}
            </button>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {pages.length === 0 && (
        <div className="flex-1 flex items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-slate-400 text-sm">
          <div className="text-center">
            <svg
              className="mx-auto h-10 w-10 mb-2 opacity-40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
              />
            </svg>
            Click pages in the source panel to add them here, then download.
          </div>
        </div>
      )}

      {/* Sortable grid */}
      {pages.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToParentElement]}
        >
          <SortableContext items={pages.map(p => p.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 gap-2 overflow-y-auto flex-1 min-h-0 content-start">
              {pages.map((ap, i) => (
                <SortableItem
                  key={ap.id}
                  assemblyPage={ap}
                  index={i}
                  onRemove={() => onRemovePage(ap.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
