import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileUploader } from '../components/FileUploader'

describe('FileUploader', () => {
  it('renders the upload area', () => {
    render(<FileUploader onFiles={() => {}} />)
    expect(screen.getByTestId('file-uploader')).toBeInTheDocument()
    expect(screen.getByText(/drop pdf files here/i)).toBeInTheDocument()
  })

  it('only accepts PDF files', async () => {
    const user = userEvent.setup()
    const onFiles = vi.fn()
    render(<FileUploader onFiles={onFiles} />)

    const input = screen.getByTestId('file-uploader').querySelector('input[type="file"]') as HTMLElement
    const pdfFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' })
    const txtFile = new File(['hello'], 'note.txt', { type: 'text/plain' })

    await user.upload(input, [pdfFile, txtFile])
    expect(onFiles).toHaveBeenCalledWith([pdfFile])
  })
})
