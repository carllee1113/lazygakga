// React 19 automatic JSX runtime; no import needed

interface Point { time: number; value: number }

export default function ProductPriceChart({ points, height = 120 }: { points: Point[]; height?: number }) {
  const vbW = 400
  const vbH = height
  const padding = 28

  if (!points || points.length === 0) {
    return (
      <div style={{ fontSize: 12, color: '#cbd5e1', padding: 8 }}>
        No data yet for this product.
      </div>
    )
  }

  const times = points.map((p) => p.time)
  const values = points.map((p) => p.value)
  const tMin = Math.min(...times)
  const tMax = Math.max(...times)
  const vMinRaw = Math.min(...values)
  const vMaxRaw = Math.max(...values)
  const vRange = vMaxRaw - vMinRaw
  const vPadding = vRange < 1e-6 ? Math.max(1, vMaxRaw * 0.1) : vRange * 0.1
  const vMin = vMinRaw - vPadding
  const vMax = vMaxRaw + vPadding

  const x = (t: number) => {
    if (tMax === tMin) return padding + (vbW - padding * 2) / 2
    return padding + ((t - tMin) / (tMax - tMin)) * (vbW - padding * 2)
  }
  const y = (v: number) => {
    if (vMax === vMin) return vbH / 2
    return vbH - padding - ((v - vMin) / (vMax - vMin)) * (vbH - padding * 2)
  }

  const path = (() => {
    if (points.length === 0) return ''
    const first = points[0]
    let d = `M ${x(first.time)} ${y(first.value)}`
    for (let i = 1; i < points.length; i++) {
      const p = points[i]
      d += ` L ${x(p.time)} ${y(p.value)}`
    }
    return d
  })()

  const startDate = new Date(tMin).toLocaleDateString()
  const endDate = new Date(tMax).toLocaleDateString()

  return (
    <svg viewBox={`0 0 ${vbW} ${vbH}`} style={{ width: '100%', height }} aria-label="Price per item over time">
      {/* axes */}
      <line x1={padding} y1={vbH - padding} x2={vbW - padding} y2={vbH - padding} stroke="#6b7280" strokeWidth={1} />
      <line x1={padding} y1={padding} x2={padding} y2={vbH - padding} stroke="#6b7280" strokeWidth={1} />

      {/* range labels */}
      <text x={padding} y={padding - 8} fontSize={12} fill="#cbd5e1">${vMaxRaw.toFixed(2)}</text>
      <text x={padding} y={vbH - padding + 18} fontSize={12} fill="#cbd5e1">{startDate}</text>
      <text x={vbW - padding} y={vbH - padding + 18} fontSize={12} textAnchor="end" fill="#cbd5e1">{endDate}</text>

      {/* line */}
      {path && <path d={path} fill="none" stroke="#10b981" strokeWidth={2} />}
      {/* points */}
      {points.map((p, i) => (
        <circle key={i} cx={x(p.time)} cy={y(p.value)} r={3} fill="#10b981" />
      ))}
    </svg>
  )
}