'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Copy, CheckCircle2, Download, QrCode } from 'lucide-react'

interface SharePreviewModalProps {
  storyId: string
  currentSlide: number
  captionVariant?: string | null
  onClose: () => void
}

export function SharePreviewModal({
  storyId,
  currentSlide,
  captionVariant,
  onClose,
}: SharePreviewModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const previewUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/stories/${storyId}/preview`
      : `/stories/${storyId}/preview`

  // Generate QR code lazily
  useEffect(() => {
    let cancelled = false
    async function generate() {
      try {
        const QRCode = (await import('qrcode')).default
        const url = await QRCode.toDataURL(previewUrl, {
          width: 200,
          margin: 2,
          color: { dark: '#ffffff', light: '#00000000' },
        })
        if (!cancelled) setQrDataUrl(url)
      } catch (err) {
        console.error('QR generation failed:', err)
      }
    }
    generate()
    return () => { cancelled = true }
  }, [previewUrl])

  async function handleCopy() {
    await navigator.clipboard.writeText(previewUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleDownload() {
    setDownloading(true)
    try {
      const res = await fetch('/api/preview-slide-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId,
          slideIndex: currentSlide,
          captionVariant: captionVariant ?? null,
        }),
      })

      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `slide_${currentSlide + 1}_1080x1920.jpg`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Download failed:', err)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#111118',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20,
          padding: 28,
          width: '100%',
          maxWidth: 420,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>Share Preview</h3>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
              Scan or share the link to preview on mobile
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>

        {/* QR Code */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          {qrDataUrl ? (
            <div
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 16,
                padding: 16,
              }}
            >
              <img src={qrDataUrl} alt="QR Code" style={{ width: 160, height: 160, display: 'block' }} />
            </div>
          ) : (
            <div
              style={{
                width: 192,
                height: 192,
                borderRadius: 16,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <QrCode style={{ width: 32, height: 32, color: 'rgba(255,255,255,0.2)' }} />
            </div>
          )}
        </div>

        {/* URL + copy */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              padding: '8px 12px',
              fontSize: 11,
              color: 'rgba(255,255,255,0.5)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {previewUrl}
          </div>
          <button
            onClick={handleCopy}
            style={{
              background: copied ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${copied ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 10,
              padding: '8px 12px',
              cursor: 'pointer',
              color: copied ? '#34d399' : 'rgba(255,255,255,0.7)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            {copied ? (
              <>
                <CheckCircle2 style={{ width: 14, height: 14 }} />
                Copied
              </>
            ) : (
              <>
                <Copy style={{ width: 14, height: 14 }} />
                Copy
              </>
            )}
          </button>
        </div>

        {/* Download slide PNG */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          style={{
            width: '100%',
            background: downloading ? 'rgba(255,255,255,0.04)' : 'rgba(109,90,255,0.9)',
            border: 'none',
            borderRadius: 12,
            padding: '12px',
            cursor: downloading ? 'not-allowed' : 'pointer',
            color: 'white',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            opacity: downloading ? 0.5 : 1,
            transition: 'all 0.2s',
          }}
        >
          {downloading ? (
            <>
              <div className="spinner" style={{ width: 14, height: 14 }} />
              Exporting…
            </>
          ) : (
            <>
              <Download style={{ width: 14, height: 14 }} />
              Download Slide {currentSlide + 1} (1080×1920)
            </>
          )}
        </button>

        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginTop: 12 }}>
          JPEG with caption overlay, ready to post
        </p>
      </div>
    </div>
  )
}
