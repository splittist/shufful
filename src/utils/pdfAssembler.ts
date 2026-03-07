import { PDFDocument } from 'pdf-lib'
import type { AssemblyPage } from '../types'

// In-memory registry: documentId → raw PDF bytes.
const _docRegistry = new Map<string, ArrayBuffer>()

export function registerDocument(id: string, data: ArrayBuffer): void {
  _docRegistry.set(id, data)
}

export function unregisterDocument(id: string): void {
  _docRegistry.delete(id)
}

async function fetchDocBytes(id: string): Promise<ArrayBuffer> {
  const data = _docRegistry.get(id)
  if (!data) throw new Error(`Document ${id} not found in registry`)
  return data
}

/**
 * Assemble pages from simple documentId + pageNumber pairs using the in-memory registry.
 */
export async function assemblePagesFromRefs(
  refs: { documentId: string; pageNumber: number }[],
): Promise<Uint8Array> {
  if (refs.length === 0) throw new Error('No pages to assemble')

  const output = await PDFDocument.create()
  const docCache = new Map<string, PDFDocument>()

  for (const { documentId, pageNumber } of refs) {
    let srcDoc = docCache.get(documentId)
    if (!srcDoc) {
      const bytes = await fetchDocBytes(documentId)
      srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true })
      docCache.set(documentId, srcDoc)
    }
    const [copied] = await output.copyPages(srcDoc, [pageNumber - 1])
    output.addPage(copied)
  }

  return output.save()
}

/**
 * Assemble pages using the in-memory document registry.
 */
export async function assemblePagesFromRegistry(pages: AssemblyPage[]): Promise<Uint8Array> {
  return assemblePagesFromRefs(pages.map(ap => ({
    documentId: ap.source.documentId,
    pageNumber: ap.source.pageNumber,
  })))
}

/**
 * Trigger a browser download of the given Blob.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Trigger a browser download of the given bytes as a PDF file.
 */
export function downloadPdf(bytes: Uint8Array, filename: string): void {
  downloadBlob(new Blob([bytes], { type: 'application/pdf' }), filename)
}
