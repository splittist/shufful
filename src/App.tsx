import { useState } from 'react'
import { FileUploader } from './components/FileUploader'
import { DocumentPanel } from './components/DocumentPanel'
import { AssemblyPanel } from './components/AssemblyPanel'
import { usePdfDocuments } from './hooks/usePdfDocuments'
import { useAssembly } from './hooks/useAssembly'
import { assemblePagesFromRegistry, downloadPdf } from './utils/pdfAssembler'

export default function App() {
  const { documents, addDocuments, removeDocument } = usePdfDocuments()
  const { assemblyPages, addPage, addAllPages, removePage, reorderPages, clearAssembly, removeDocumentPages } =
    useAssembly()
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDownload() {
    if (assemblyPages.length === 0) return
    setDownloading(true)
    setError(null)
    try {
      const bytes = await assemblePagesFromRegistry(assemblyPages)
      downloadPdf(bytes, 'assembled.pdf')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setDownloading(false)
    }
  }

  function handleRemoveDocument(id: string) {
    removeDocumentPages(id)
    removeDocument(id)
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center gap-3">
          <svg
            className="h-7 w-7 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25M9 16.5v.75m3-3v3M15 12v5.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
            />
          </svg>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Shufful</h1>
          <span className="text-xs text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">
            PDF Assembly
          </span>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-sm text-red-700">
          {error}
          <button
            className="ml-2 text-red-400 hover:text-red-600"
            onClick={() => setError(null)}
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main layout */}
      <main className="flex-1 max-w-screen-xl w-full mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left panel: source documents */}
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Source Documents
          </h2>
          <FileUploader onFiles={addDocuments} />
          <div className="flex-1 overflow-y-auto">
            <DocumentPanel
              documents={documents}
              onAddPage={addPage}
              onAddAllPages={addAllPages}
              onRemoveDocument={handleRemoveDocument}
            />
          </div>
        </section>

        {/* Right panel: assembly */}
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 sr-only">
            Assembly
          </h2>
          <AssemblyPanel
            pages={assemblyPages}
            onReorder={reorderPages}
            onRemovePage={removePage}
            onClear={clearAssembly}
            onDownload={handleDownload}
            downloading={downloading}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 py-4 border-t border-slate-200 bg-white">
        All processing happens in your browser — no data is sent to any server.
      </footer>
    </div>
  )
}
