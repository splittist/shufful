import { describe, it, expect, vi, beforeEach } from 'vitest'
import { registerDocument, unregisterDocument, assemblePagesFromRegistry, assemblePagesFromRefs, downloadPdf, downloadBlob } from '../utils/pdfAssembler'
import type { AssemblyPage } from '../types'

// Minimal mock for pdf-lib
vi.mock('pdf-lib', () => {
  const mockPage = {}
  const mockOutput = {
    copyPages: vi.fn().mockResolvedValue([mockPage]),
    addPage: vi.fn(),
    save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
  }
  const mockSrc = {
    // stub
  }
  return {
    PDFDocument: {
      create: vi.fn().mockResolvedValue(mockOutput),
      load: vi.fn().mockResolvedValue(mockSrc),
    },
  }
})

describe('pdfAssembler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('registerDocument and unregisterDocument work without throwing', () => {
    const buf = new ArrayBuffer(4)
    expect(() => registerDocument('doc-1', buf)).not.toThrow()
    expect(() => unregisterDocument('doc-1')).not.toThrow()
  })

  it('assemblePagesFromRegistry throws when no pages provided', async () => {
    await expect(assemblePagesFromRegistry([])).rejects.toThrow('No pages to assemble')
  })

  it('assemblePagesFromRegistry throws when document is not registered', async () => {
    const page: AssemblyPage = {
      id: 'slot-1',
      source: {
        id: 'doc-x-p1',
        documentId: 'doc-x',
        documentName: 'test.pdf',
        pageNumber: 1,
        totalPages: 1,
        thumbnail: '',
      },
    }
    await expect(assemblePagesFromRegistry([page])).rejects.toThrow('doc-x not found')
  })

  it('assemblePagesFromRegistry succeeds with a registered document', async () => {
    const buf = new ArrayBuffer(8)
    registerDocument('doc-2', buf)

    const page: AssemblyPage = {
      id: 'slot-2',
      source: {
        id: 'doc-2-p1',
        documentId: 'doc-2',
        documentName: 'test.pdf',
        pageNumber: 1,
        totalPages: 1,
        thumbnail: '',
      },
    }

    const result = await assemblePagesFromRegistry([page])
    expect(result).toBeInstanceOf(Uint8Array)
    unregisterDocument('doc-2')
  })

  it('assemblePagesFromRefs throws when no refs provided', async () => {
    await expect(assemblePagesFromRefs([])).rejects.toThrow('No pages to assemble')
  })

  it('assemblePagesFromRefs throws when document is not registered', async () => {
    await expect(assemblePagesFromRefs([{ documentId: 'doc-missing', pageNumber: 1 }])).rejects.toThrow('doc-missing not found')
  })

  it('assemblePagesFromRefs succeeds with a registered document', async () => {
    const buf = new ArrayBuffer(8)
    registerDocument('doc-3', buf)
    const result = await assemblePagesFromRefs([{ documentId: 'doc-3', pageNumber: 1 }])
    expect(result).toBeInstanceOf(Uint8Array)
    unregisterDocument('doc-3')
  })
})

describe('downloadPdf', () => {
  it('creates an anchor element and clicks it', () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:fake-url')
    const revokeObjectURL = vi.fn()
    const click = vi.fn()
    const createElement = vi.spyOn(document, 'createElement').mockReturnValueOnce({
      href: '',
      download: '',
      click,
    } as unknown as HTMLAnchorElement)

    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, writable: true })
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, writable: true })

    downloadPdf(new Uint8Array([1, 2]), 'output.pdf')

    expect(createElement).toHaveBeenCalledWith('a')
    expect(click).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake-url')
  })
})

describe('downloadBlob', () => {
  it('creates an anchor element and clicks it', () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:fake-url-2')
    const revokeObjectURL = vi.fn()
    const click = vi.fn()
    const createElement = vi.spyOn(document, 'createElement').mockReturnValueOnce({
      href: '',
      download: '',
      click,
    } as unknown as HTMLAnchorElement)

    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, writable: true })
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, writable: true })

    downloadBlob(new Blob(['data']), 'archive.zip')

    expect(createElement).toHaveBeenCalledWith('a')
    expect(click).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake-url-2')
  })
})
