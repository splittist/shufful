/** A page sourced from an uploaded PDF. */
export interface SourcePage {
  /** Unique id for this page entry. */
  id: string
  /** Id of the parent document. */
  documentId: string
  /** Human-readable document name. */
  documentName: string
  /** 1-based page index within the source document. */
  pageNumber: number
  /** Total pages in the source document. */
  totalPages: number
  /** Canvas data URL used as thumbnail. */
  thumbnail: string
}

/** An uploaded PDF document. */
export interface PdfDocument {
  id: string
  name: string
  /** Raw PDF bytes. */
  data: ArrayBuffer
  pages: SourcePage[]
  /** Whether thumbnails are still being generated. */
  loading: boolean
  /** Error message if loading failed. */
  error?: string
}

/** A page added to the assembly area. */
export interface AssemblyPage {
  /** Unique id for this assembly slot (different from SourcePage.id so the same
   *  source page can be added multiple times). */
  id: string
  /** The source page this references. */
  source: SourcePage
}
