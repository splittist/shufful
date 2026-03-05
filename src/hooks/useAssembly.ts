import { useState, useCallback } from 'react'
import { v4 as uuidv4 } from '../utils/uuid'
import type { AssemblyPage, SourcePage } from '../types'
import { arrayMove } from '@dnd-kit/sortable'

export function useAssembly() {
  const [assemblyPages, setAssemblyPages] = useState<AssemblyPage[]>([])

  const addPage = useCallback((source: SourcePage) => {
    setAssemblyPages(prev => [
      ...prev,
      { id: uuidv4(), source },
    ])
  }, [])

  const addAllPages = useCallback((pages: SourcePage[]) => {
    setAssemblyPages(prev => [
      ...prev,
      ...pages.map(source => ({ id: uuidv4(), source })),
    ])
  }, [])

  const removePage = useCallback((id: string) => {
    setAssemblyPages(prev => prev.filter(p => p.id !== id))
  }, [])

  const reorderPages = useCallback((oldIndex: number, newIndex: number) => {
    setAssemblyPages(prev => arrayMove(prev, oldIndex, newIndex))
  }, [])

  const clearAssembly = useCallback(() => {
    setAssemblyPages([])
  }, [])

  const removeDocumentPages = useCallback((documentId: string) => {
    setAssemblyPages(prev => prev.filter(p => p.source.documentId !== documentId))
  }, [])

  return {
    assemblyPages,
    addPage,
    addAllPages,
    removePage,
    reorderPages,
    clearAssembly,
    removeDocumentPages,
  }
}
