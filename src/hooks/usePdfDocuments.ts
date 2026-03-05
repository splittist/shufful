import { useState, useCallback } from 'react'
import { getDocument } from 'pdfjs-dist'
import { v4 as uuidv4 } from '../utils/uuid'
import type { PdfDocument, SourcePage } from '../types'
import { renderPageThumbnail } from '../utils/pdfRenderer'
import { registerDocument, unregisterDocument } from '../utils/pdfAssembler'

export function usePdfDocuments() {
  const [documents, setDocuments] = useState<PdfDocument[]>([])

  const addDocuments = useCallback(async (files: File[]) => {
    for (const file of files) {
      const id = uuidv4()
      const data = await file.arrayBuffer()

      // Register bytes so the assembler can access them.
      registerDocument(id, data)

      // Add a placeholder entry immediately.
      const placeholder: PdfDocument = {
        id,
        name: file.name,
        data,
        pages: [],
        loading: true,
      }
      setDocuments(prev => [...prev, placeholder])

      // Generate thumbnails asynchronously.
      try {
        const pdf = await getDocument({ data: data.slice(0), password: '' }).promise
        const totalPages = pdf.numPages
        const pages: SourcePage[] = []

        for (let p = 1; p <= totalPages; p++) {
          const thumbnail = await renderPageThumbnail(data, p)
          pages.push({
            id: `${id}-p${p}`,
            documentId: id,
            documentName: file.name,
            pageNumber: p,
            totalPages,
            thumbnail,
          })
          // Update progressively.
          setDocuments(prev =>
            prev.map(d =>
              d.id === id ? { ...d, pages: [...pages] } : d,
            ),
          )
        }

        setDocuments(prev =>
          prev.map(d => (d.id === id ? { ...d, pages, loading: false } : d)),
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        setDocuments(prev =>
          prev.map(d =>
            d.id === id ? { ...d, loading: false, error: message } : d,
          ),
        )
      }
    }
  }, [])

  const removeDocument = useCallback((id: string) => {
    unregisterDocument(id)
    setDocuments(prev => prev.filter(d => d.id !== id))
  }, [])

  return { documents, addDocuments, removeDocument }
}
