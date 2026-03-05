import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAssembly } from '../hooks/useAssembly'
import type { SourcePage } from '../types'

const makePage = (id: string, docId = 'doc-1'): SourcePage => ({
  id,
  documentId: docId,
  documentName: 'test.pdf',
  pageNumber: 1,
  totalPages: 3,
  thumbnail: '',
})

describe('useAssembly', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useAssembly())
    expect(result.current.assemblyPages).toHaveLength(0)
  })

  it('addPage appends a page', () => {
    const { result } = renderHook(() => useAssembly())
    act(() => result.current.addPage(makePage('p1')))
    expect(result.current.assemblyPages).toHaveLength(1)
    expect(result.current.assemblyPages[0]!.source.id).toBe('p1')
  })

  it('addAllPages appends multiple pages', () => {
    const { result } = renderHook(() => useAssembly())
    act(() => result.current.addAllPages([makePage('p1'), makePage('p2')]))
    expect(result.current.assemblyPages).toHaveLength(2)
  })

  it('removePage removes by id', () => {
    const { result } = renderHook(() => useAssembly())
    act(() => result.current.addPage(makePage('p1')))
    const slotId = result.current.assemblyPages[0]!.id
    act(() => result.current.removePage(slotId))
    expect(result.current.assemblyPages).toHaveLength(0)
  })

  it('clearAssembly removes all pages', () => {
    const { result } = renderHook(() => useAssembly())
    act(() => result.current.addAllPages([makePage('p1'), makePage('p2'), makePage('p3')]))
    act(() => result.current.clearAssembly())
    expect(result.current.assemblyPages).toHaveLength(0)
  })

  it('reorderPages swaps positions', () => {
    const { result } = renderHook(() => useAssembly())
    act(() => result.current.addAllPages([makePage('p1'), makePage('p2'), makePage('p3')]))
    act(() => result.current.reorderPages(0, 2))
    expect(result.current.assemblyPages[0]!.source.id).toBe('p2')
    expect(result.current.assemblyPages[2]!.source.id).toBe('p1')
  })

  it('removeDocumentPages removes pages belonging to a document', () => {
    const { result } = renderHook(() => useAssembly())
    act(() => {
      result.current.addPage(makePage('p1', 'doc-1'))
      result.current.addPage(makePage('p2', 'doc-2'))
      result.current.addPage(makePage('p3', 'doc-1'))
    })
    act(() => result.current.removeDocumentPages('doc-1'))
    expect(result.current.assemblyPages).toHaveLength(1)
    expect(result.current.assemblyPages[0]!.source.documentId).toBe('doc-2')
  })

  it('the same source page can be added multiple times with unique slot ids', () => {
    const { result } = renderHook(() => useAssembly())
    const page = makePage('p1')
    act(() => {
      result.current.addPage(page)
      result.current.addPage(page)
    })
    expect(result.current.assemblyPages).toHaveLength(2)
    const ids = result.current.assemblyPages.map(p => p.id)
    expect(ids[0]).not.toBe(ids[1])
  })
})
