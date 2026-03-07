/** A single page-selection entry within a recipe output. */
export interface RecipePageSelection {
  /** Filename of the uploaded source PDF (exact match). */
  source: string
  /** Single page number (1-based). Takes priority over other fields. */
  page?: number
  /** Explicit list of page numbers (1-based). */
  pages?: number[]
  /** Start of a page range (1-based, inclusive). Requires `to`. */
  from?: number
  /** End of a page range (1-based, inclusive). Requires `from`. */
  to?: number
}

/** One output PDF defined in a recipe. */
export interface RecipeOutput {
  /** Output filename (without .pdf extension). */
  filename: string
  /** Ordered list of page selections. */
  pages: RecipePageSelection[]
}

/** Top-level recipe object. */
export interface Recipe {
  outputs: RecipeOutput[]
}

// ---------------------------------------------------------------------------
// Resolved / validated types used internally after matching to loaded docs
// ---------------------------------------------------------------------------

/** A page selection that has been expanded to concrete 1-based page numbers
 *  and matched to a loaded document id. */
export interface ResolvedPageSelection {
  documentId: string
  documentName: string
  /** 1-based page numbers in the order they should appear. */
  pageNumbers: number[]
}

/** A validated output entry ready for assembly. */
export interface ResolvedOutput {
  filename: string
  pages: ResolvedPageSelection[]
  /** Total page count across all selections. */
  totalPages: number
}

/** An item in the download queue shown to the user. */
export interface OutputQueueItem {
  filename: string
  totalPages: number
  /** True if all source documents were found and page numbers are in range. */
  ready: boolean
  /** Validation / resolution errors specific to this output. */
  errors: string[]
  /** Resolved data — undefined if not ready. */
  resolved?: ResolvedOutput
  /** Whether this item is currently being assembled/downloaded. */
  downloading: boolean
}
