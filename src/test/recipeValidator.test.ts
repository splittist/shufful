import { describe, it, expect } from 'vitest'
import { validateRecipe, RECIPE_JSON_SCHEMA } from '../utils/recipeValidator'
import type { PdfDocument } from '../types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDoc(name: string, pageCount: number): PdfDocument {
  return {
    id: `id-${name}`,
    name,
    data: new ArrayBuffer(0),
    loading: false,
    pages: Array.from({ length: pageCount }, (_, i) => ({
      id: `${name}-p${i + 1}`,
      documentId: `id-${name}`,
      documentName: name,
      pageNumber: i + 1,
      totalPages: pageCount,
      thumbnail: '',
    })),
  }
}

const DOCS = [makeDoc('Report.pdf', 10), makeDoc('Appendix.pdf', 5)]

// ---------------------------------------------------------------------------
// Fatal errors
// ---------------------------------------------------------------------------

describe('validateRecipe — fatal errors', () => {
  it('returns a fatal error for invalid JSON', () => {
    const result = validateRecipe('{not json', DOCS)
    expect(result.fatalErrors).toHaveLength(1)
    expect(result.fatalErrors[0]).toMatch(/invalid json/i)
    expect(result.items).toHaveLength(0)
  })

  it('returns a fatal error when root is not an object', () => {
    const result = validateRecipe('"hello"', DOCS)
    expect(result.fatalErrors).toHaveLength(1)
  })

  it('returns a fatal error when outputs is missing', () => {
    const result = validateRecipe('{}', DOCS)
    expect(result.fatalErrors).toHaveLength(1)
    expect(result.fatalErrors[0]).toMatch(/outputs/)
  })

  it('returns a fatal error when outputs is empty', () => {
    const result = validateRecipe('{"outputs":[]}', DOCS)
    expect(result.fatalErrors).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// Page selection modes
// ---------------------------------------------------------------------------

describe('validateRecipe — page selection: single page', () => {
  it('resolves a single "page" selection', () => {
    const recipe = { outputs: [{ filename: 'Out', pages: [{ source: 'Report.pdf', page: 3 }] }] }
    const result = validateRecipe(JSON.stringify(recipe), DOCS)
    expect(result.fatalErrors).toHaveLength(0)
    expect(result.items[0].ready).toBe(true)
    expect(result.items[0].resolved!.pages[0].pageNumbers).toEqual([3])
  })

  it('fails for page number out of range', () => {
    const recipe = { outputs: [{ filename: 'Out', pages: [{ source: 'Report.pdf', page: 99 }] }] }
    const result = validateRecipe(JSON.stringify(recipe), DOCS)
    expect(result.items[0].ready).toBe(false)
    expect(result.items[0].errors[0]).toMatch(/exceed/)
  })
})

describe('validateRecipe — page selection: pages array', () => {
  it('resolves explicit page list', () => {
    const recipe = { outputs: [{ filename: 'Out', pages: [{ source: 'Report.pdf', pages: [1, 5, 10] }] }] }
    const result = validateRecipe(JSON.stringify(recipe), DOCS)
    expect(result.items[0].ready).toBe(true)
    expect(result.items[0].resolved!.pages[0].pageNumbers).toEqual([1, 5, 10])
  })

  it('fails when pages array contains out-of-range numbers', () => {
    const recipe = { outputs: [{ filename: 'Out', pages: [{ source: 'Report.pdf', pages: [1, 20] }] }] }
    const result = validateRecipe(JSON.stringify(recipe), DOCS)
    expect(result.items[0].ready).toBe(false)
  })
})

describe('validateRecipe — page selection: from/to range', () => {
  it('resolves a page range', () => {
    const recipe = { outputs: [{ filename: 'Out', pages: [{ source: 'Report.pdf', from: 3, to: 6 }] }] }
    const result = validateRecipe(JSON.stringify(recipe), DOCS)
    expect(result.items[0].ready).toBe(true)
    expect(result.items[0].resolved!.pages[0].pageNumbers).toEqual([3, 4, 5, 6])
  })

  it('fails when from > to', () => {
    const recipe = { outputs: [{ filename: 'Out', pages: [{ source: 'Report.pdf', from: 5, to: 2 }] }] }
    const result = validateRecipe(JSON.stringify(recipe), DOCS)
    expect(result.items[0].ready).toBe(false)
    expect(result.items[0].errors[0]).toMatch(/from.*greater/i)
  })

  it('fails when only from is provided without to', () => {
    const recipe = { outputs: [{ filename: 'Out', pages: [{ source: 'Report.pdf', from: 1 }] }] }
    const result = validateRecipe(JSON.stringify(recipe), DOCS)
    expect(result.items[0].ready).toBe(false)
  })
})

describe('validateRecipe — page selection: all pages (no specifier)', () => {
  it('includes all pages when no page specifier is given', () => {
    const recipe = { outputs: [{ filename: 'Out', pages: [{ source: 'Appendix.pdf' }] }] }
    const result = validateRecipe(JSON.stringify(recipe), DOCS)
    expect(result.items[0].ready).toBe(true)
    expect(result.items[0].resolved!.pages[0].pageNumbers).toEqual([1, 2, 3, 4, 5])
  })
})

// ---------------------------------------------------------------------------
// Source matching
// ---------------------------------------------------------------------------

describe('validateRecipe — source matching', () => {
  it('flags a missing source document', () => {
    const recipe = { outputs: [{ filename: 'Out', pages: [{ source: 'Missing.pdf' }] }] }
    const result = validateRecipe(JSON.stringify(recipe), DOCS)
    expect(result.items[0].ready).toBe(false)
    expect(result.items[0].errors[0]).toMatch(/not loaded/i)
  })

  it('matches source documents case-sensitively', () => {
    const recipe = { outputs: [{ filename: 'Out', pages: [{ source: 'report.pdf' }] }] }
    const result = validateRecipe(JSON.stringify(recipe), DOCS)
    expect(result.items[0].ready).toBe(false) // 'report.pdf' ≠ 'Report.pdf'
  })
})

// ---------------------------------------------------------------------------
// Multiple outputs
// ---------------------------------------------------------------------------

describe('validateRecipe — multiple outputs', () => {
  it('resolves multiple outputs independently', () => {
    const recipe = {
      outputs: [
        { filename: 'A', pages: [{ source: 'Report.pdf', page: 1 }] },
        { filename: 'B', pages: [{ source: 'Appendix.pdf', from: 1, to: 3 }] },
        { filename: 'C', pages: [{ source: 'Missing.pdf' }] },
      ],
    }
    const result = validateRecipe(JSON.stringify(recipe), DOCS)
    expect(result.fatalErrors).toHaveLength(0)
    expect(result.items).toHaveLength(3)
    expect(result.items[0].ready).toBe(true)
    expect(result.items[1].ready).toBe(true)
    expect(result.items[2].ready).toBe(false)
  })

  it('counts total pages correctly across selections', () => {
    const recipe = {
      outputs: [{
        filename: 'Combined',
        pages: [
          { source: 'Report.pdf', page: 1 },
          { source: 'Appendix.pdf', from: 1, to: 3 },
        ],
      }],
    }
    const result = validateRecipe(JSON.stringify(recipe), DOCS)
    expect(result.items[0].totalPages).toBe(4) // 1 + 3
  })
})

// ---------------------------------------------------------------------------
// Schema constant
// ---------------------------------------------------------------------------

describe('RECIPE_JSON_SCHEMA', () => {
  it('is valid JSON', () => {
    expect(() => JSON.parse(RECIPE_JSON_SCHEMA)).not.toThrow()
  })

  it('contains expected schema fields', () => {
    const schema = JSON.parse(RECIPE_JSON_SCHEMA)
    expect(schema.title).toBe('Shufful Recipe')
    expect(schema.properties.outputs).toBeDefined()
  })
})
