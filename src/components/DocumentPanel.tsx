import { useState } from 'react'
import type { PdfDocument, SourcePage } from '../types'
import { PageThumbnail } from './PageThumbnail'

interface DocumentPanelProps {
  documents: PdfDocument[]
  onAddPage: (page: SourcePage) => void
  onAddAllPages: (pages: SourcePage[]) => void
  onRemoveDocument: (id: string) => void
}

export function DocumentPanel({
  documents,
  onAddPage,
  onAddAllPages,
  onRemoveDocument,
}: DocumentPanelProps) {
  // Per-document select mode: docId → Set of selected page ids
  const [selectingDoc, setSelectingDoc] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  function enterSelectMode(docId: string) {
    setSelectingDoc(docId)
    setSelectedIds(new Set())
  }

  function exitSelectMode() {
    setSelectingDoc(null)
    setSelectedIds(new Set())
  }

  function togglePage(page: SourcePage) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(page.id)) next.delete(page.id)
      else next.add(page.id)
      return next
    })
  }

  function addSelected(pages: SourcePage[]) {
    const toAdd = pages.filter(p => selectedIds.has(p.id))
    toAdd.forEach(onAddPage)
    exitSelectMode()
  }

  if (documents.length === 0) {
    return (
      <p className="text-sm text-slate-400 text-center py-8">
        Upload PDF files to get started.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {documents.map(doc => {
        const isSelecting = selectingDoc === doc.id
        return (
          <div key={doc.id} className="rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Document header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
              <svg
                className="h-4 w-4 text-red-500 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M3 3.5A1.5 1.5 0 0 1 4.5 2h6.879a1.5 1.5 0 0 1 1.06.44l3.122 3.12A1.5 1.5 0 0 1 16 6.622V16.5A1.5 1.5 0 0 1 14.5 18h-10A1.5 1.5 0 0 1 3 16.5v-13Z" />
              </svg>
              <span
                className="text-sm font-medium text-slate-700 truncate flex-1"
                title={doc.name}
              >
                {doc.name}
              </span>
              {!doc.loading && !doc.error && (
                isSelecting ? (
                  <>
                    <button
                      className="text-xs text-blue-600 hover:underline shrink-0 disabled:opacity-40"
                      onClick={() => addSelected(doc.pages)}
                      disabled={selectedIds.size === 0}
                    >
                      Add selected ({selectedIds.size})
                    </button>
                    <button
                      className="text-xs text-slate-400 hover:text-slate-600 shrink-0"
                      onClick={exitSelectMode}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="text-xs text-slate-500 hover:text-blue-600 shrink-0"
                      onClick={() => enterSelectMode(doc.id)}
                      title="Select multiple pages"
                    >
                      Select
                    </button>
                    <button
                      className="text-xs text-blue-600 hover:underline shrink-0"
                      onClick={() => onAddAllPages(doc.pages)}
                      title="Add all pages to assembly"
                    >
                      Add all
                    </button>
                  </>
                )
              )}
              <button
                className="text-xs text-slate-400 hover:text-red-500 shrink-0"
                onClick={() => { if (isSelecting) exitSelectMode(); onRemoveDocument(doc.id) }}
                title="Remove document"
                aria-label="Remove document"
              >
                ✕
              </button>
            </div>

            {/* Loading / error states */}
            {doc.loading && doc.pages.length === 0 && (
              <div className="p-4 text-sm text-slate-400 text-center">Loading pages…</div>
            )}
            {doc.error && (
              <div className="p-4 text-sm text-red-500">Error: {doc.error}</div>
            )}

            {/* Page thumbnails */}
            {doc.pages.length > 0 && (
              <div className="p-3">
                {isSelecting && (
                  <p className="text-xs text-slate-400 mb-2">Click pages to select them.</p>
                )}
                <div className="grid grid-cols-3 gap-2">
                  {doc.pages.map(page => (
                    <div
                      key={page.id}
                      className="relative"
                      title={isSelecting ? `Page ${page.pageNumber} – click to select` : `Page ${page.pageNumber} – click to add to assembly`}
                    >
                      <PageThumbnail
                        page={page}
                        selected={isSelecting && selectedIds.has(page.id)}
                        onSelect={() => isSelecting ? togglePage(page) : onAddPage(page)}
                      />
                    </div>
                  ))}
                </div>
                {doc.loading && (
                  <p className="text-xs text-slate-400 text-center mt-2">Loading more pages…</p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
