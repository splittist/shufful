import * as pdfjs from 'pdfjs-dist'

// Use the legacy build worker bundled with pdfjs-dist to avoid a separate
// network request that may be blocked in a SharePoint deployment.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

/**
 * Render a single page from an already-loaded PDF document to a canvas and return its data URL.
 */
export async function renderPageFromDocument(
  pdf: pdfjs.PDFDocumentProxy,
  pageNumber: number,
  thumbnailWidth = 200,
): Promise<string> {
  const page = await pdf.getPage(pageNumber)
  const viewport = page.getViewport({ scale: 1 })
  const scale = thumbnailWidth / viewport.width
  const scaledViewport = page.getViewport({ scale })

  const canvas = document.createElement('canvas')
  canvas.width = Math.floor(scaledViewport.width)
  canvas.height = Math.floor(scaledViewport.height)
  const ctx = canvas.getContext('2d')!

  await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise
  return canvas.toDataURL('image/jpeg', 0.8)
}
