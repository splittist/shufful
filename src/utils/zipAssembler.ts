import JSZip from 'jszip'
import type { ResolvedOutput } from '../types/recipe'
import { assemblePagesFromRefs, downloadBlob } from './pdfAssembler'

/** Assemble one output PDF and return the bytes. */
export async function assembleOne(output: ResolvedOutput): Promise<Uint8Array> {
  const refs = output.pages.flatMap(sel =>
    sel.pageNumbers.map(pageNumber => ({ documentId: sel.documentId, pageNumber })),
  )
  return assemblePagesFromRefs(refs)
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

export { downloadBlob }
