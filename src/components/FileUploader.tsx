import { useState, useCallback } from 'react'

interface FileUploaderProps {
  onFiles: (files: File[]) => void
}

export function FileUploader({ onFiles }: FileUploaderProps) {
  const [dragging, setDragging] = useState(false)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return
      const pdfs = Array.from(files).filter(f => f.type === 'application/pdf')
      if (pdfs.length > 0) onFiles(pdfs)
    },
    [onFiles],
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles],
  )

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }

  const onDragLeave = () => setDragging(false)

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    handleFiles(e.target.files)

  return (
    <label
      className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors ${
        dragging
          ? 'border-blue-500 bg-blue-50 text-blue-700'
          : 'border-slate-300 bg-slate-50 text-slate-500 hover:border-blue-400 hover:bg-blue-50'
      }`}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      data-testid="file-uploader"
    >
      <svg
        className="h-10 w-10 opacity-60"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 16.5v-9m0 0-3 3m3-3 3 3M4.5 19.5h15a1.5 1.5 0 0 0 1.5-1.5V9a1.5 1.5 0 0 0-1.5-1.5H15l-1.5-3H10.5L9 7.5H4.5A1.5 1.5 0 0 0 3 9v9a1.5 1.5 0 0 0 1.5 1.5Z"
        />
      </svg>
      <span className="text-sm font-medium">
        Drop PDF files here or <span className="text-blue-600 underline">click to browse</span>
      </span>
      <span className="text-xs text-slate-400">PDF files only</span>
      <input
        type="file"
        accept="application/pdf"
        multiple
        className="sr-only"
        onChange={onInputChange}
      />
    </label>
  )
}
