import { useEffect, useMemo, useState } from 'react'
import { getHistoryAsync } from '../lib/storage'
import ProductPriceChart from './ProductPriceChart'
import type { SavedCalculation } from '../lib/storage'

export default function PriceHistory({ onEdit }: { onEdit?: (item: SavedCalculation) => void }) {
  const [allItems, setAllItems] = useState<SavedCalculation[]>([])

  useEffect(() => {
    // Refresh when mounted
    getHistoryAsync().then(setAllItems).catch((e) => {
      console.warn('Failed to load history', e)
    })
  }, [])

  const todayKey = new Date().toDateString()
  const nameKey = (s: string) => (s || '').trim().toLowerCase().replace(/\s+/g, '')
  const latestTsForProductToday = useMemo(() => {
    const m: Record<string, number> = {}
    for (const it of allItems) {
      const key = nameKey(it.productName)
      const day = new Date(it.timestamp).toDateString()
      if (day === todayKey) {
        if (!m[key] || it.timestamp > m[key]) m[key] = it.timestamp
      }
    }
    return m
  }, [allItems])
  // Show latest unique products (limit 4), similar to Recent Saved
  const uniqueLatestLimited = useMemo(() => {
    const seen = new Set<string>()
    const sorted = [...allItems].sort((a, b) => b.timestamp - a.timestamp)
    const out: SavedCalculation[] = []
    for (const it of sorted) {
      const key = nameKey(it.productName)
      if (!seen.has(key)) {
        seen.add(key)
        out.push(it)
        if (out.length >= 4) break
      }
    }
    return out
  }, [allItems])

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Price History</h1>
      {allItems.length === 0 ? (
        <p style={{ color: '#cbd5e1' }}>No saved items yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ fontSize: 18 }}>Latest Calculations (with trend)</div>
          {uniqueLatestLimited.map((item, idx) => (
            <div key={idx} style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{item.productName || '(unnamed)'}</div>
                  {item.input && item.input.location && (
                    <div style={{ fontSize: 14, color: '#e5e7eb' }}>Location: {item.input.location}</div>
                  )}
                </div>
                <div style={{ fontSize: 14, color: '#e5e7eb' }}>{new Date(item.timestamp).toLocaleString()}</div>
              </div>
              {/* per-product chart */}
              <div style={{ marginTop: 8 }}>
                {(() => {
                  const key = nameKey(item.productName)
                  const series = allItems
                    .filter((i) => nameKey(i.productName) === key)
                    .sort((a, b) => a.timestamp - b.timestamp)
                    .map((i) => ({ time: i.timestamp, value: i.result.pricePerItem }))
                  return <ProductPriceChart points={series} />
                })()}
              </div>
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 6, alignItems: 'center' }}>
                  {/* Only show: price per item, price per unit, price per unit (all) x2 */}
                  <div><strong>Price per item</strong></div>
                  <div style={{ textAlign: 'center' }}>{item.result.pricePerItem.toFixed(2)}</div>
                  <div style={{ textAlign: 'right' }}>$ / item</div>

                  {item.result.pricePerUnit && (
                    <div style={{ display: 'contents' }}>
                      <div><strong>Price per unit</strong></div>
                      <div style={{ textAlign: 'center' }}>{item.result.pricePerUnit.value.toFixed(2)}</div>
                      <div style={{ textAlign: 'right' }}>{item.result.pricePerUnit.unitLabel}</div>
                    </div>
                  )}

                  {item.result.allUnits && item.result.allUnits.pricePerUnit.slice(0, 2).map((p, i2) => (
                    <div key={`ppu-h-${idx}-${i2}`} style={{ display: 'contents' }}>
                      <div><strong>Price per unit (all)</strong></div>
                      <div style={{ textAlign: 'center' }}>{p.value.toFixed(2)}</div>
                      <div style={{ textAlign: 'right' }}>{p.unitLabel}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                {(() => {
                  const key = nameKey(item.productName)
                  const dayKey = new Date(item.timestamp).toDateString()
                  const editable = dayKey === todayKey && latestTsForProductToday[key] === item.timestamp
                  return (
                    <button
                      disabled={!editable}
                      onClick={() => editable && onEdit && onEdit(item)}
                      style={{ padding: 10, borderRadius: 6, border: '1px solid #e5e7eb', background: editable ? '#374151' : '#6b7280', color: 'white', opacity: editable ? 1 : 0.6 }}
                    >
                      Edit
                    </button>
                  )
                })()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}