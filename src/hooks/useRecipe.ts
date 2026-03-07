import { useState, useCallback } from 'react'
import type { PdfDocument } from '../types'
import type { OutputQueueItem } from '../types/recipe'
import { validateRecipe } from '../utils/recipeValidator'
import { assembleOne, assembleAllAsZip, downloadBlob } from '../utils/zipAssembler'
import { downloadPdf } from '../utils/pdfAssembler'

export interface UseRecipeReturn {
  rawJson: string
  setRawJson: (v: string) => void
  fatalErrors: string[]
  queueItems: OutputQueueItem[]
  /** Whether the queue is currently shown (recipe has been applied). */
  hasApplied: boolean
  applyRecipe: (documents: PdfDocument[]) => void
  resetRecipe: () => void
  downloadOne: (index: number) => Promise<void>
  downloadAll: () => Promise<void>
  downloadingAll: boolean
}

export function useRecipe(): UseRecipeReturn {
  const [rawJson, setRawJson] = useState('')
  const [fatalErrors, setFatalErrors] = useState<string[]>([])
  const [queueItems, setQueueItems] = useState<OutputQueueItem[]>([])
  const [hasApplied, setHasApplied] = useState(false)
  const [downloadingAll, setDownloadingAll] = useState(false)

  const applyRecipe = useCallback((documents: PdfDocument[]) => {
    const result = validateRecipe(rawJson, documents)
    setFatalErrors(result.fatalErrors)
    setQueueItems(result.items)
    setHasApplied(result.fatalErrors.length === 0)
  }, [rawJson])

  const resetRecipe = useCallback(() => {
    setHasApplied(false)
    setFatalErrors([])
    setQueueItems([])
  }, [])

  const setItemDownloading = (index: number, value: boolean) => {
    setQueueItems(prev =>
      prev.map((item, i) => (i === index ? { ...item, downloading: value } : item)),
    )
  }

  const downloadOne = useCallback(async (index: number) => {
    const item = queueItems[index]
    if (!item?.ready || !item.resolved) return
    setItemDownloading(index, true)
    try {
      const bytes = await assembleOne(item.resolved)
      const filename = item.filename.endsWith('.pdf') ? item.filename : `${item.filename}.pdf`
      downloadPdf(bytes, filename)
    } finally {
      setItemDownloading(index, false)
    }
  }, [queueItems])

  const downloadAll = useCallback(async () => {
    const readyOutputs = queueItems.filter(i => i.ready && i.resolved).map(i => i.resolved!)
    if (readyOutputs.length === 0) return
    setDownloadingAll(true)
    try {
      const blob = await assembleAllAsZip(readyOutputs)
      downloadBlob(blob, 'shufful-recipe.zip')
    } finally {
      setDownloadingAll(false)
    }
  }, [queueItems])

  return {
    rawJson,
    setRawJson,
    fatalErrors,
    queueItems,
    hasApplied,
    applyRecipe,
    resetRecipe,
    downloadOne,
    downloadAll,
    downloadingAll,
  }
}
