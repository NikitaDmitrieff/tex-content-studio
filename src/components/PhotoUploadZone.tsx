'use client'

import { useState, useRef } from 'react'
import { Upload, X, Camera } from 'lucide-react'

type PhotoUploadZoneProps = {
  onAnalyze: (base64: string, mimeType: 'image/jpeg' | 'image/png') => Promise<void>
  analyzing: boolean
}

export function PhotoUploadZone({ onAnalyze, analyzing }: PhotoUploadZoneProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [mimeType, setMimeType] = useState<'image/jpeg' | 'image/png'>('image/jpeg')
  const [fileError, setFileError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function processFile(file: File) {
    setFileError(null)
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setFileError('Only JPG and PNG files are supported.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setFileError('File must be under 5MB.')
      return
    }
    setMimeType(file.type as 'image/jpeg' | 'image/png')
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave() {
    setDragging(false)
  }

  function handleClear() {
    setPreview(null)
    setFileError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleAnalyze() {
    if (!preview) return
    const base64 = preview.split(',')[1]
    await onAnalyze(base64, mimeType)
  }

  return (
    <div className="space-y-3">
      {!preview ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
            dragging
              ? 'border-[var(--accent)] bg-[var(--accent)]/10'
              : 'border-white/[0.12] hover:border-white/[0.24] hover:bg-white/[0.02]'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-white/[0.06] flex items-center justify-center">
            <Upload className="w-5 h-5 text-zinc-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-300">Drop a photo here or click to upload</p>
            <p className="text-xs text-zinc-500 mt-1">JPG or PNG, max 5MB</p>
          </div>
        </div>
      ) : (
        <div className="flex gap-4 items-start">
          <div className="relative shrink-0">
            <img
              src={preview}
              alt="Photo preview"
              className="w-24 h-24 rounded-xl object-cover border border-white/[0.12]"
            />
            <button
              onClick={handleClear}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center hover:bg-zinc-600 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-xs text-zinc-400">Photo ready for analysis</p>
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="btn-accent flex items-center gap-2"
            >
              {analyzing ? (
                <>
                  <div className="spinner" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>Analyze Photo</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={handleFileInput}
      />

      {fileError && <p className="text-xs text-red-400">{fileError}</p>}
    </div>
  )
}
