import type { PdfDocument } from '../types'
import type { UseRecipeReturn } from '../hooks/useRecipe'
import { RECIPE_JSON_SCHEMA } from '../utils/recipeValidator'

interface RecipePanelProps {
  documents: PdfDocument[]
  recipe: UseRecipeReturn
}

export function RecipePanel({ documents, recipe }: RecipePanelProps) {
  const {
    rawJson, setRawJson,
    fatalErrors, queueItems,
    hasApplied,
    applyRecipe, resetRecipe,
    downloadOne, downloadAll, downloadingAll,
  } = recipe

  async function handleCopySchema() {
    try {
      await navigator.clipboard.writeText(RECIPE_JSON_SCHEMA)
    } catch {
      // Fallback: open in a new window
      const w = window.open('', '_blank')
      w?.document.write(`<pre>${RECIPE_JSON_SCHEMA}</pre>`)
    }
  }

  if (hasApplied) {
    return <QueueView queueItems={queueItems} downloadOne={downloadOne} downloadAll={downloadAll} downloadingAll={downloadingAll} onBack={resetRecipe} />
  }

  return <EntryView
    documents={documents}
    rawJson={rawJson}
    fatalErrors={fatalErrors}
    onChangeJson={setRawJson}
    onApply={() => applyRecipe(documents)}
    onCopySchema={handleCopySchema}
  />
}

// ---------------------------------------------------------------------------
// Entry sub-view
// ---------------------------------------------------------------------------

interface EntryViewProps {
  documents: PdfDocument[]
  rawJson: string
  fatalErrors: string[]
  onChangeJson: (v: string) => void
  onApply: () => void
  onCopySchema: () => void
}

function EntryView({ documents, rawJson, fatalErrors, onChangeJson, onApply, onCopySchema }: EntryViewProps) {
  const missingDocs = documents.length === 0

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-slate-600 leading-snug">
          Ask your LLM to produce a recipe JSON, then paste it below.{' '}
          <button
            className="text-blue-600 hover:underline focus:outline-none"
            onClick={onCopySchema}
          >
            Copy the JSON schema
          </button>{' '}
          to share with your LLM so it knows the format.
        </p>
      </div>

      {missingDocs && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          Upload your source PDFs first so the recipe can be validated against them.
        </div>
      )}

      <textarea
        className="flex-1 min-h-[12rem] w-full font-mono text-xs bg-white border border-slate-300 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder-slate-400"
        placeholder={'{\n  "outputs": [\n    {\n      "filename": "MyReport",\n      "pages": [\n        { "source": "Q4.pdf", "from": 1, "to": 3 }\n      ]\n    }\n  ]\n}'}
        value={rawJson}
        onChange={e => onChangeJson(e.target.value)}
        spellCheck={false}
        aria-label="Recipe JSON"
      />

      {fatalErrors.length > 0 && (
        <ul className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2 space-y-1">
          {fatalErrors.map((e, i) => <li key={i}>⚠ {e}</li>)}
        </ul>
      )}

      <button
        className="shrink-0 w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
        onClick={onApply}
        disabled={!rawJson.trim()}
      >
        Apply Recipe
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Queue sub-view
// ---------------------------------------------------------------------------

import type { OutputQueueItem } from '../types/recipe'

interface QueueViewProps {
  queueItems: OutputQueueItem[]
  downloadOne: (i: number) => Promise<void>
  downloadAll: () => Promise<void>
  downloadingAll: boolean
  onBack: () => void
}

function QueueView({ queueItems, downloadOne, downloadAll, downloadingAll, onBack }: QueueViewProps) {
  const readyCount = queueItems.filter(i => i.ready).length

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between shrink-0">
        <button
          className="text-xs text-slate-500 hover:text-blue-600 hover:underline focus:outline-none"
          onClick={onBack}
        >
          ← Back to recipe
        </button>
        <span className="text-xs text-slate-500">
          {readyCount} of {queueItems.length} output{queueItems.length !== 1 ? 's' : ''} ready
        </span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
        {queueItems.map((item, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 bg-white ${
              item.ready ? 'border-slate-200' : 'border-red-200 bg-red-50'
            }`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">
                {item.filename}.pdf
              </p>
              {item.ready ? (
                <p className="text-xs text-slate-500">{item.totalPages} page{item.totalPages !== 1 ? 's' : ''}</p>
              ) : (
                <ul className="text-xs text-red-600 mt-0.5 space-y-0.5">
                  {item.errors.map((e, ei) => <li key={ei}>⚠ {e}</li>)}
                </ul>
              )}
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${item.ready ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {item.ready ? 'Ready' : 'Error'}
              </span>
              {item.ready && (
                <button
                  className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-2.5 py-1 rounded-lg transition-colors"
                  onClick={() => downloadOne(idx)}
                  disabled={item.downloading}
                >
                  {item.downloading ? '…' : 'Download'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        className="shrink-0 w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
        onClick={downloadAll}
        disabled={readyCount === 0 || downloadingAll}
      >
        {downloadingAll ? 'Building ZIP…' : `Download All as ZIP (${readyCount})`}
      </button>
    </div>
  )
}
