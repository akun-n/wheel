import { useEffect, useMemo, useRef, useState } from 'react'

type WheelProps = {
  names: string[]
  spinning: boolean
  setSpinning: (value: boolean) => void
  onPick: (pickedIndex: number) => void
  riggedPick?: (names: string[]) => number | null
}

const TAU = Math.PI * 2
const POINTER_ANGLE = 0 // right side
const BASE_ANGLE = -Math.PI / 2 // first slice starts at top

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function normalizeAngle(angle: number) {
  const a = angle % TAU
  return a < 0 ? a + TAU : a
}

function easeOutCubic(t: number) {
  const x = clamp(t, 0, 1)
  return 1 - Math.pow(1 - x, 3)
}

function randomInt(maxExclusive: number) {
  if (maxExclusive <= 0) return 0
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0] % maxExclusive
}

function truncateLabel(s: string, max: number) {
  if (s.length <= max) return s
  return `${s.slice(0, Math.max(1, max - 1))}…`
}

const SLICE_COLORS = [
  '#ef4444',
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#a855f7',
  '#06b6d4',
  '#f97316',
  '#10b981',
  '#e11d48',
  '#6366f1',
]

export function Wheel({ names, spinning, setSpinning, onPick, riggedPick }: WheelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const [size, setSize] = useState(520)
  const [rotation, setRotation] = useState(0)
  const rotationRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    rotationRef.current = rotation
  }, [rotation])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect()
      const next = Math.round(clamp(rect.width, 280, 640))
      setSize(next)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const canSpin = names.length >= 2 && !spinning
  const segAngle = useMemo(() => (names.length ? TAU / names.length : TAU), [names.length])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.floor(size * dpr)
    canvas.height = Math.floor(size * dpr)
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.scale(dpr, dpr)

    const cx = size / 2
    const cy = size / 2
    const r = Math.max(10, size * 0.48)

    // Wheel background + shadow ring
    ctx.save()
    ctx.translate(cx, cy)
    ctx.beginPath()
    ctx.arc(0, 0, r + 6, 0, TAU)
    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    ctx.shadowColor = 'rgba(0,0,0,0.55)'
    ctx.shadowBlur = 18
    ctx.shadowOffsetY = 8
    ctx.fill()
    ctx.restore()

    if (!names.length) {
      ctx.save()
      ctx.translate(cx, cy)
      ctx.beginPath()
      ctx.arc(0, 0, r, 0, TAU)
      ctx.fillStyle = 'rgba(255,255,255,0.06)'
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.font = `600 ${Math.max(14, Math.round(size * 0.04))}px system-ui`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Add people to start', 0, 0)
      ctx.restore()
      return
    }

    for (let i = 0; i < names.length; i++) {
      const start = BASE_ANGLE + rotation + i * segAngle
      const end = start + segAngle

      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, r, start, end, false)
      ctx.closePath()
      ctx.fillStyle = SLICE_COLORS[i % SLICE_COLORS.length]!
      ctx.fill()
      ctx.lineWidth = 2
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'
      ctx.stroke()

      const centerAngle = (start + end) / 2
      const onLeftSide = normalizeAngle(centerAngle) > Math.PI / 2 && normalizeAngle(centerAngle) < (Math.PI * 3) / 2

      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(centerAngle + (onLeftSide ? Math.PI : 0))
      ctx.fillStyle = 'rgba(255,255,255,0.92)'
      ctx.font = `700 ${Math.max(12, Math.round(size * 0.032))}px system-ui`
      ctx.textBaseline = 'middle'
      ctx.textAlign = onLeftSide ? 'left' : 'right'
      const x = onLeftSide ? -r * 0.9 : r * 0.9
      ctx.fillText(truncateLabel(names[i]!, 18), x, 0)
      ctx.restore()
    }

    // Center hub
    ctx.save()
    ctx.translate(cx, cy)
    ctx.beginPath()
    ctx.arc(0, 0, r * 0.18, 0, TAU)
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.stroke()
    ctx.restore()
  }, [names, rotation, segAngle, size])

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  function spin() {
    if (!canSpin) return
    const n = names.length
    const riggedIndex = riggedPick?.(names) ?? null
    const winIndex =
      riggedIndex != null && Number.isInteger(riggedIndex) && riggedIndex >= 0 && riggedIndex < n
        ? riggedIndex
        : randomInt(n)

    const desiredRotationMod = POINTER_ANGLE - BASE_ANGLE - (winIndex + 0.5) * segAngle
    const desiredMod = normalizeAngle(desiredRotationMod)

    const current = rotationRef.current
    const currentMod = normalizeAngle(current)
    const baseTarget = current - currentMod + desiredMod

    const extraTurns = 5 + randomInt(3) // 5–7
    const target = (baseTarget <= current ? baseTarget + TAU : baseTarget) + extraTurns * TAU

    const durationMs = 4200 + randomInt(500)
    const start = performance.now()
    const from = current
    const delta = target - from

    setSpinning(true)
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)

    const tick = (now: number) => {
      const t = (now - start) / durationMs
      const eased = easeOutCubic(t)
      const next = from + delta * eased
      setRotation(next)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }
      setRotation(target)
      rotationRef.current = target
      setSpinning(false)
      onPick(winIndex)
      rafRef.current = null
    }

    rafRef.current = requestAnimationFrame(tick)
  }

  return (
    <div className="wheel" ref={containerRef}>
      <div className="wheelPointer" aria-hidden="true" />
      <button type="button" className="spinButton" onClick={spin} disabled={!canSpin}>
        {spinning ? 'Spinning…' : 'Spin'}
      </button>
      <canvas
        ref={canvasRef}
        className="wheelCanvas"
        onClick={spin}
        role="img"
        aria-label={names.length ? 'Wheel of names' : 'Empty wheel'}
      />
    </div>
  )
}

