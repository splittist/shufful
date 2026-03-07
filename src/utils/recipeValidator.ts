import type { PdfDocument } from '../types'
import type {
  Recipe,
  RecipeOutput,
  RecipePageSelection,
  ResolvedOutput,
  ResolvedPageSelection,
  OutputQueueItem,
} from '../types/recipe'

// ---------------------------------------------------------------------------
// JSON Schema (exported so the UI can copy it to clipboard for LLM prompting)
// ---------------------------------------------------------------------------

export const RECIPE_JSON_SCHEMA = JSON.stringify(
  {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'Shufful Recipe',
    description:
      'A recipe for Shufful (https://github.com/shufful) that describes one or more output PDFs ' +
      'assembled from pages of uploaded source documents.',
    type: 'object',
    required: ['outputs'],
    additionalProperties: false,
    properties: {
      outputs: {
        type: 'array',
        minItems: 1,
        description: 'One entry per output PDF to be generated.',
        items: {
          type: 'object',
          required: ['filename', 'pages'],
          additionalProperties: false,
          properties: {
            filename: {
              type: 'string',
              description: 'Output PDF filename without the .pdf extension.',
            },
            pages: {
              type: 'array',
              minItems: 1,
              description:
                'Ordered list of page selections. Each entry picks pages from one source document. ' +
                'Specify exactly one of: page, pages, from+to, or omit all to include all pages.',
              items: {
                type: 'object',
                required: ['source'],
                additionalProperties: false,
                properties: {
                  source: {
                    type: 'string',
                    description:
                      'Exact filename of the uploaded source PDF, e.g. "Q4_Report.pdf".',
                  },
                  page: {
                    type: 'integer',
                    minimum: 1,
                    description: 'Single page number (1-based).',
                  },
                  pages: {
                    type: 'array',
                    items: { type: 'integer', minimum: 1 },
                    minItems: 1,
                    description: 'Explicit list of page numbers (1-based).',
                  },
                  from: {
                    type: 'integer',
                    minimum: 1,
                    description:
                      'Start of a page range (1-based, inclusive). Must be used together with "to".',
                  },
                  to: {
                    type: 'integer',
                    minimum: 1,
                    description:
                      'End of a page range (1-based, inclusive). Must be used together with "from".',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  null,
  2,
)

// ---------------------------------------------------------------------------
// Validation & resolution
// ---------------------------------------------------------------------------

export interface RecipeValidationResult {
  /** Top-level parse / structure errors (recipe cannot be used at all). */
  fatalErrors: string[]
  /** Per-output queue items (may be partially valid). */
  items: OutputQueueItem[]
}

/** Parse raw JSON and resolve each output against the loaded documents. */
export function validateRecipe(
  raw: string,
  documents: PdfDocument[],
): RecipeValidationResult {
  // --- 1. Parse JSON ---
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { fatalErrors: ['Invalid JSON — please check the text and try again.'], items: [] }
  }

  // --- 2. Top-level structure ---
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { fatalErrors: ['Recipe must be a JSON object with an "outputs" array.'], items: [] }
  }
  const obj = parsed as Record<string, unknown>
  if (!Array.isArray(obj.outputs)) {
    return { fatalErrors: ['Recipe must have an "outputs" array.'], items: [] }
  }
  if (obj.outputs.length === 0) {
    return { fatalErrors: ['"outputs" array must not be empty.'], items: [] }
  }

  const docByName = new Map<string, PdfDocument>(documents.map(d => [d.name, d]))

  const items: OutputQueueItem[] = (obj.outputs as unknown[]).map((raw, idx) =>
    resolveOutput(raw, idx, docByName),
  )

  return { fatalErrors: [], items }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveOutput(
  raw: unknown,
  idx: number,
  docByName: Map<string, PdfDocument>,
): OutputQueueItem {
  const errors: string[] = []

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return makeErrorItem(`outputs[${idx}]`, [`Output ${idx + 1} must be an object.`])
  }

  const obj = raw as Record<string, unknown>

  // Validate filename
  const filename = typeof obj.filename === 'string' ? obj.filename.trim() : ''
  if (!filename) {
    errors.push(`Output ${idx + 1}: "filename" must be a non-empty string.`)
  }

  // Validate pages array
  if (!Array.isArray(obj.pages) || obj.pages.length === 0) {
    errors.push(`Output ${idx + 1} ("${filename || idx + 1}"): "pages" must be a non-empty array.`)
    return makeErrorItem(filename || `output-${idx + 1}`, errors)
  }

  const resolvedPages: ResolvedPageSelection[] = []

  ;(obj.pages as unknown[]).forEach((sel, selIdx) => {
    const selErrors = resolvePageSelection(sel, selIdx, filename || `output-${idx + 1}`, docByName, resolvedPages)
    errors.push(...selErrors)
  })

  if (errors.length > 0) {
    return makeErrorItem(filename || `output-${idx + 1}`, errors)
  }

  const totalPages = resolvedPages.reduce((s, r) => s + r.pageNumbers.length, 0)
  const resolved: ResolvedOutput = { filename, pages: resolvedPages, totalPages }

  return {
    filename,
    totalPages,
    ready: true,
    errors: [],
    resolved,
    downloading: false,
  }
}

/** Expand a single page-selection entry; push errors; mutate resolvedPages on success. */
function resolvePageSelection(
  raw: unknown,
  selIdx: number,
  outputName: string,
  docByName: Map<string, PdfDocument>,
  resolvedPages: ResolvedPageSelection[],
): string[] {
  const errors: string[] = []
  const prefix = `"${outputName}", pages[${selIdx + 1}]`

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    errors.push(`${prefix}: each page selection must be an object.`)
    return errors
  }

  const sel = raw as RecipePageSelection
  if (typeof sel.source !== 'string' || !sel.source.trim()) {
    errors.push(`${prefix}: "source" must be a non-empty string filename.`)
    return errors
  }

  const sourceName = sel.source.trim()
  const doc = docByName.get(sourceName)
  if (!doc) {
    errors.push(`${prefix}: source document "${sourceName}" is not loaded. Please upload it.`)
    return errors
  }

  // Expand page numbers
  let pageNumbers: number[]
  if (sel.page !== undefined) {
    if (!Number.isInteger(sel.page) || sel.page < 1) {
      errors.push(`${prefix}: "page" must be a positive integer.`)
      return errors
    }
    pageNumbers = [sel.page]
  } else if (sel.pages !== undefined) {
    if (!Array.isArray(sel.pages) || sel.pages.length === 0) {
      errors.push(`${prefix}: "pages" must be a non-empty array.`)
      return errors
    }
    pageNumbers = sel.pages
    const invalid = pageNumbers.filter(p => !Number.isInteger(p) || p < 1)
    if (invalid.length > 0) {
      errors.push(`${prefix}: "pages" contains invalid page numbers: ${invalid.join(', ')}.`)
      return errors
    }
  } else if (sel.from !== undefined || sel.to !== undefined) {
    if (sel.from === undefined || sel.to === undefined) {
      errors.push(`${prefix}: "from" and "to" must both be specified for a page range.`)
      return errors
    }
    if (!Number.isInteger(sel.from) || sel.from < 1 || !Number.isInteger(sel.to) || sel.to < 1) {
      errors.push(`${prefix}: "from" and "to" must be positive integers.`)
      return errors
    }
    if (sel.from > sel.to) {
      errors.push(`${prefix}: "from" (${sel.from}) must not be greater than "to" (${sel.to}).`)
      return errors
    }
    pageNumbers = []
    for (let p = sel.from; p <= sel.to; p++) pageNumbers.push(p)
  } else {
    // All pages
    pageNumbers = Array.from({ length: doc.pages.length }, (_, i) => i + 1)
  }

  // Validate page numbers are in range
  const outOfRange = pageNumbers.filter(p => p > doc.pages.length)
  if (outOfRange.length > 0) {
    errors.push(
      `${prefix}: page number(s) ${outOfRange.join(', ')} exceed the total pages in "${sourceName}" (${doc.pages.length}).`,
    )
    return errors
  }

  resolvedPages.push({
    documentId: doc.id,
    documentName: doc.name,
    pageNumbers,
  })

  return []
}

function makeErrorItem(filename: string, errors: string[]): OutputQueueItem {
  return { filename, totalPages: 0, ready: false, errors, resolved: undefined, downloading: false }
}
