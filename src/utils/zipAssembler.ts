import JSZip from 'jszip'
import type { ResolvedOutput } from '../types/recipe'

// Re-use the existing in-memory registry from pdfAssembler.
// We import only the registry-fetching logic by duplicating the fetch approach
// so we don't introduce a circular dependency. The registry is module-level state
// in pdfAssembler, so we import the assembler function directly.
import { assemblePagesFromRegistry } from './pdfAssembler'
import type { AssemblyPage } from '../types'

// ---------------------------------------------------------------------------
// Assemble a single resolved output into PDF bytes.
// ---------------------------------------------------------------------------

/** Convert a ResolvedOutput into AssemblyPage[] compatible with the existing assembler. */
function resolvedOutputToAssemblyPages(output: ResolvedOutput): AssemblyPage[] {
  const pages: AssemblyPage[] = []
  for (const sel of output.pages) {
    for (const pageNumber of sel.pageNumbers) {
      // AssemblyPage needs a SourcePage; we construct a minimal one.
      pages.push({
        id: `${sel.documentId}-p${pageNumber}-${Math.random()}`,
        source: {
          id: `${sel.documentId}-p${pageNumber}`,
          documentId: sel.documentId,
          documentName: sel.documentName,
          pageNumber,
          totalPages: 0, // not used by assembler
          thumbnail: '',  // not used by assembler
        },
      })
    }
  }
  return pages
}

/** Assemble one output PDF and return the bytes. */
export async function assembleOne(output: ResolvedOutput): Promise<Uint8Array> {
  const pages = resolvedOutputToAssemblyPages(output)
  return assemblePagesFromRegistry(pages)
}

/** Assemble all ready outputs and bundle them into a ZIP blob. */
export async function assembleAllAsZip(outputs: ResolvedOutput[]): Promise<Blob> {
  const zip = new JSZip()

  for (const output of outputs) {
    const bytes = await assembleOne(output)
    const filename = output.filename.endsWith('.pdf') ? output.filename : `${output.filename}.pdf`
    zip.file(filename, bytes)
  }

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } })
}

/** Trigger a browser download of a Blob. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
