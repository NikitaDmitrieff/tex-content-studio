'use client'

interface PhoneMockupFrameProps {
  children: React.ReactNode
  className?: string
  frameRef?: React.RefObject<HTMLDivElement | null>
}

export function PhoneMockupFrame({ children, className, frameRef }: PhoneMockupFrameProps) {
  return (
    <div
      className={className}
      style={{ width: 320, height: 693, position: 'relative', flexShrink: 0 }}
    >
      {/* Outer bezel */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 48,
          background: 'linear-gradient(145deg, #2e2e34 0%, #1c1c20 50%, #111114 100%)',
          boxShadow:
            'inset 0 0 0 1.5px rgba(255,255,255,0.10), 0 25px 60px rgba(0,0,0,0.7), 0 8px 24px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      />

      {/* Side buttons (volume) */}
      <div
        style={{
          position: 'absolute',
          left: -4,
          top: 140,
          width: 4,
          height: 32,
          background: '#1a1a1e',
          borderRadius: '2px 0 0 2px',
          boxShadow: '-1px 0 2px rgba(0,0,0,0.6)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: -4,
          top: 184,
          width: 4,
          height: 32,
          background: '#1a1a1e',
          borderRadius: '2px 0 0 2px',
          boxShadow: '-1px 0 2px rgba(0,0,0,0.6)',
        }}
      />

      {/* Power button */}
      <div
        style={{
          position: 'absolute',
          right: -4,
          top: 160,
          width: 4,
          height: 48,
          background: '#1a1a1e',
          borderRadius: '0 2px 2px 0',
          boxShadow: '1px 0 2px rgba(0,0,0,0.6)',
        }}
      />

      {/* Screen area */}
      <div
        ref={frameRef}
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          right: 12,
          bottom: 12,
          borderRadius: 38,
          background: '#000',
          overflow: 'hidden',
        }}
      >
        {/* Actual content */}
        {children}

        {/* Dynamic Island */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 110,
            height: 30,
            background: '#000',
            borderRadius: 20,
            zIndex: 50,
            boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
          }}
        />

        {/* Home indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 120,
            height: 5,
            background: 'rgba(255,255,255,0.45)',
            borderRadius: 3,
            zIndex: 50,
          }}
        />
      </div>
    </div>
  )
}
