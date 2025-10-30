import { useEffect, useMemo, useState } from 'react'
import type { DealResult } from '../lib/calculation'
import { computeDeal } from '../lib/calculation'
import { findLastByProductName, saveCalculation, getLatestPerProduct, getProductStats, updateByTimestamp } from '../lib/storage'
import type { ProductStats, SavedCalculation } from '../lib/storage'

export default function Calculator({ prefill }: { prefill?: SavedCalculation }) {
  const [productName, setProductName] = useState('')
  const [totalPrice, setTotalPrice] = useState<string>('')
  const [itemCount, setItemCount] = useState<string>('1')
  const [measurementPerItem, setMeasurementPerItem] = useState<string>('')
  const [unit, setUnit] = useState<'g' | 'kg' | 'ml' | 'l' | ''>('g')
  // Add location state
  const [location, setLocation] = useState<string>('')

  const [result, setResult] = useState<DealResult | null>(null)
  const [previous, setPrevious] = useState<DealResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recentItems, setRecentItems] = useState<SavedCalculation[]>([])
  const [stats, setStats] = useState<ProductStats | null>(null)
  const [editingTs, setEditingTs] = useState<number | null>(null)

  // Apply prefill from history when provided
  useEffect(() => {
    if (!prefill) return
    const i = prefill.input
    setProductName(prefill.productName || '')
    setLocation(i.location || '')
    setTotalPrice(String(i.totalPrice ?? ''))
    setItemCount(String(i.itemCount ?? '1'))
    setMeasurementPerItem(i.measurementPerItem !== undefined ? String(i.measurementPerItem) : '')
    setUnit((i.unit as any) || 'g')
    setEditingTs(prefill.timestamp || null)
  }, [prefill])

  // Load previous on product name change
  useEffect(() => {
    if (!productName.trim()) {
      setPrevious(null)
      setStats(null)
      return
    }
    const prev = findLastByProductName(productName)
    setPrevious(prev ? prev.result : null)
    const s = getProductStats(productName)
    setStats(s || null)
  }, [productName])

  // Load latest unique products (limit 10) for quick selection
  useEffect(() => {
    setRecentItems(getLatestPerProduct(10))
  }, [])

  // Auto-calculate on input changes
  useEffect(() => {
    setError(null)
    try {
      const input = {
        productName: productName.trim() || undefined,
        // add location to input for persistence
        location: location.trim() || undefined,
        totalPrice: parseFloat(totalPrice),
        itemCount: parseInt(itemCount || '1', 10),
        measurementPerItem: measurementPerItem ? parseFloat(measurementPerItem) : undefined,
        unit: unit || undefined,
      }
      if (!isFinite(input.totalPrice) || input.totalPrice <= 0) {
        setResult(null)
        return
      }
      if (!isFinite(input.itemCount) || input.itemCount <= 0) {
        setResult(null)
        return
      }
      const res = computeDeal(input)
      setResult(res)
    } catch (e: any) {
      setResult(null)
      setError(e.message || 'Failed to calculate')
    }
  }, [productName, location, totalPrice, itemCount, measurementPerItem, unit])

  const handleSave = () => {
    if (!result) return
    const name = productName.trim()
    if (!name) {
      setError('Please enter a Product Name to save')
      return
    }
    const input = {
      productName: name,
      location: location.trim() || undefined,
      totalPrice: parseFloat(totalPrice),
      itemCount: parseInt(itemCount || '1', 10),
      measurementPerItem: measurementPerItem ? parseFloat(measurementPerItem) : undefined,
      unit: unit || undefined,
    }
    if (editingTs) {
      const updated: SavedCalculation = { productName: name, timestamp: editingTs, input, result }
      updateByTimestamp(editingTs, updated)
    } else {
      saveCalculation(name, input, result)
    }
    // Refresh recent items list to latest unique products
    setRecentItems(getLatestPerProduct(10))
    setStats(getProductStats(name) || null)
  }

  const clearAll = () => {
    setProductName('')
    setLocation('')
    setTotalPrice('')
    setItemCount('1')
    setMeasurementPerItem('')
    setUnit('g')
    setResult(null)
    setError(null)
    setPrevious(null)
  }

  const comparisonHint = useMemo(() => {
    if (!previous) return ''
    return `Comparing against your last price of $${previous.pricePerItem.toFixed(2)} per item.`
  }, [previous])

  // Compute indicator state against average price
  const resultIndicatorColor = useMemo(() => {
    if (!result || !stats) return '#9ca3af' // neutral grey when no stats
    // Prefer unit price comparison when present
    const label = result.pricePerUnit?.unitLabel
    let currentBase: number | null = null
    if (label) {
      if (label === '$/g') currentBase = result.pricePerUnit!.value
      else if (label === '$/kg') currentBase = result.pricePerUnit!.value / 1000
      else if (label === '$/ml') currentBase = result.pricePerUnit!.value
      else if (label === '$/L') currentBase = result.pricePerUnit!.value / 1000
    }
    if (currentBase !== null && stats.unitPrice) {
      return currentBase < stats.unitPrice.avgBase ? '#10b981' : '#ef4444'
    }
    if (stats.itemPrice) {
      return result.pricePerItem < stats.itemPrice.avg ? '#10b981' : '#ef4444'
    }
    return '#9ca3af'
  }, [result, stats])

  // Prepare range values for display under Results
  const rangeDisplay = useMemo(() => {
    if (!result || !stats) return null
    // unit price range if available in both
    if (result.pricePerUnit && stats.unitPrice) {
      const label = result.pricePerUnit.unitLabel // '$/g', '$/kg', '$/ml', '$/L'
      const factor = label.includes('kg') || label.includes('L') ? 1000 : 1
      const convert = (base: number) => (factor === 1 ? base : base * factor)
      const lowerBase = stats.unitPrice.minBase
      const upperBase = stats.unitPrice.maxBase
      const avgBase = stats.unitPrice.avgBase
      // If min and max are identical, do not show range
      if (!isFinite(lowerBase) || !isFinite(upperBase) || Math.abs(upperBase - lowerBase) < 1e-6) {
        return null
      }
      const lower = convert(lowerBase)
      const avg = convert(avgBase)
      const upper = convert(upperBase)
      const unitLabel = label
      const current = result.pricePerUnit.value
      return { type: 'unit', lower, avg, upper, unitLabel, current }
    }
    if (stats.itemPrice) {
      const lower = stats.itemPrice.min
      const upper = stats.itemPrice.max
      const avg = stats.itemPrice.avg
      if (!isFinite(lower) || !isFinite(upper) || Math.abs(upper - lower) < 1e-6) {
        return null
      }
      const unitLabel = '$/item'
      const current = result.pricePerItem
      return { type: 'item', lower, avg, upper, unitLabel, current }
    }
    return null
  }, [result, stats])

  const rangeNote = useMemo(() => {
    if (!result || !stats) return ''
    if (result.pricePerUnit && stats.unitPrice) {
      const label = result.pricePerUnit.unitLabel
      const same = Math.abs(stats.unitPrice.maxBase - stats.unitPrice.minBase) < 1e-6
      if (same) {
        const factor = label.includes('kg') || label.includes('L') ? 1000 : 1
        const avg = (factor === 1 ? stats.unitPrice.avgBase : stats.unitPrice.avgBase * factor)
        return `Average: ${avg.toFixed(2)} ${label} (insufficient history for range)`
      }
    } else if (stats.itemPrice) {
      const same = Math.abs(stats.itemPrice.max - stats.itemPrice.min) < 1e-6
      if (same) {
        return `Average: ${stats.itemPrice.avg.toFixed(2)} $/item (insufficient history for range)`
      }
    }
    return ''
  }, [result, stats])

  const applyRecentItem = (item: SavedCalculation) => {
    const i = item.input
    setLocation(i.location || '')
    setProductName(item.productName || '')
    setTotalPrice(String(i.totalPrice ?? ''))
    setItemCount(String(i.itemCount ?? '1'))
    setMeasurementPerItem(i.measurementPerItem !== undefined ? String(i.measurementPerItem) : '')
    setUnit((i.unit as any) || 'g')
  }

  // Single-column layout: inputs first, results below
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
      <div style={{ maxWidth: 480, width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>Record Product</h1>
        <p style={{ color: '#cbd5e1', marginBottom: 16, fontSize: 16 }}>Enter the promotion details to see the real value.</p>

        <div style={{ display: 'grid', gap: 12 }}>
          {/* Quick select from recent saved items */}
          <label>
            <span style={{ fontSize: 16 }}>Recent saved (last 10)</span>
            <select
              aria-label="Recent saved items"
              onChange={(e) => {
                const idx = parseInt(e.target.value, 10)
                if (!isNaN(idx) && recentItems[idx]) applyRecentItem(recentItems[idx])
              }}
              style={{ marginTop: 4, padding: 10 }}
            >
              <option value="">Select a recent item…</option>
              {recentItems.map((item, idx) => {
                const i = item.input
                const label = `${i.location || 'Unknown'} • ${item.productName || '(unnamed)'} • $${i.totalPrice} • ${i.itemCount} items`
                return (
                  <option key={idx} value={String(idx)}>{label}</option>
                )
              })}
            </select>
          </label>
          {/* Location above Product Name */}
          <label>
            <span style={{ fontSize: 16 }}>Location</span>
            <input
              id="location"
              placeholder="e.g., Store A"
              value={(location as any) || ''}
              onChange={(e) => setLocation(e.target.value)}
              style={{ width: '100%', marginTop: 4, padding: 10 }}
            />
          </label>

          <label>
            <span style={{ fontSize: 16 }}>Product Name (Optional)</span>
            <input
              id="product-name"
              placeholder="e.g., Brand X Coffee"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              style={{ width: '100%', marginTop: 4, padding: 10 }}
            />
          </label>
          {comparisonHint && (
            <div aria-live="polite" style={{ color: '#e5e7eb', fontSize: 14 }}>{comparisonHint}</div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              <span style={{ fontSize: 16 }}>Total Price ($)</span>
              <input
                id="total-price"
                type="number"
                placeholder="19.90"
                value={totalPrice}
                onChange={(e) => setTotalPrice(e.target.value)}
                style={{ width: '100%', marginTop: 4, padding: 10 }}
              />
            </label>
            <label>
              <span style={{ fontSize: 16 }}>Number of Items</span>
              <input
                id="item-count"
                type="number"
                placeholder="2"
                value={itemCount}
                onChange={(e) => setItemCount(e.target.value)}
                style={{ width: '100%', marginTop: 4, padding: 10 }}
              />
            </label>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>Optional: Add Volume</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label>
                <span style={{ fontSize: 14, color: '#cbd5e1' }}>Volume (per item)</span>
                <input
                  id="measurement-value"
                  type="number"
                  placeholder="750"
                  value={measurementPerItem}
                  onChange={(e) => setMeasurementPerItem(e.target.value)}
                  style={{ width: '100%', marginTop: 4, padding: 10 }}
                />
              </label>
              <label>
                <span style={{ fontSize: 14, color: '#cbd5e1' }}>Unit</span>
                <select
                  id="measurement-unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as any)}
                  style={{ width: '100%', marginTop: 4, padding: 10 }}
                >
                  <option value="">Select</option>
                  <option value="g">Grams (g)</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="ml">Milliliters (ml)</option>
                  <option value="l">Liters (L)</option>
                </select>
              </label>
            </div>
          </div>

          {error && (
            <div role="alert" style={{ color: '#b91c1c' }}>{error}</div>
          )}

          {/* Results below inputs */}
          <div style={{ marginTop: 16, borderTop: '1px solid #e5e7eb', paddingTop: 12 }}>
            <h2 style={{ fontSize: 18, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Results</span>
              <span aria-label="price trend indicator" title="Green: below average, Red: above average" style={{ width: 10, height: 10, borderRadius: '50%', display: 'inline-block', background: resultIndicatorColor }} />
            </h2>
            {!result && (
              <p style={{ color: '#cbd5e1' }}>Enter valid price and item count to see results.</p>
            )}
            {result && (
              <div>
                {rangeDisplay && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 14, color: '#cbd5e1', marginBottom: 4 }}>
                      Historical range for this product
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, textAlign: 'center', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 12, color: '#cbd5e1' }}>Lower</div>
                        <div style={{ fontSize: 16 }}>{rangeDisplay.lower.toFixed(2)}</div>
                        <div style={{ fontSize: 12 }}>{rangeDisplay.unitLabel}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: '#cbd5e1' }}>Current</div>
                        <div style={{ fontSize: 16 }}>{rangeDisplay.current.toFixed(2)}</div>
                        <div style={{ fontSize: 12 }}>{rangeDisplay.unitLabel}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: '#cbd5e1' }}>Upper</div>
                        <div style={{ fontSize: 16 }}>{rangeDisplay.upper.toFixed(2)}</div>
                        <div style={{ fontSize: 12 }}>{rangeDisplay.unitLabel}</div>
                      </div>
                    </div>
                  </div>
                )}
                {!rangeDisplay && rangeNote && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 14, color: '#cbd5e1' }}>{rangeNote}</div>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 6, alignItems: 'center' }}>
                  {/* Price per item */}
                  <div><strong>Price per item</strong></div>
                  <div style={{ textAlign: 'center' }}>{result.pricePerItem.toFixed(2)}</div>
                  <div style={{ textAlign: 'right' }}>$ / item</div>

                  {/* Price per unit (single) */}
                  {result.pricePerUnit && (
                    <div style={{ display: 'contents' }}>
                      <div><strong>Price per unit</strong></div>
                      <div style={{ textAlign: 'center' }}>{result.pricePerUnit.value.toFixed(2)}</div>
                      <div style={{ textAlign: 'right' }}>{result.pricePerUnit.unitLabel}</div>
                    </div>
                  )}

                  {/* Price per unit (all) */}
                  {result.allUnits && result.allUnits.pricePerUnit.map((p, idx) => (
                    <div key={`ppu-${idx}`} style={{ display: 'contents' }}>
                      <div><strong>Price per unit (all)</strong></div>
                      <div style={{ textAlign: 'center' }}>{p.value.toFixed(2)}</div>
                      <div style={{ textAlign: 'right' }}>{p.unitLabel}</div>
                    </div>
                  ))}

                  {/* Measurement per dollar (single) */}
                  {result.measurementPerDollar && (
                    <div style={{ display: 'contents' }}>
                      <div><strong>Measurement per dollar</strong></div>
                      <div style={{ textAlign: 'center' }}>{result.measurementPerDollar.value.toFixed(1)}</div>
                      <div style={{ textAlign: 'right' }}>{result.measurementPerDollar.unitLabel}</div>
                    </div>
                  )}

                  {/* Measurement per dollar (all) */}
                  {result.allUnits && result.allUnits.measurementPerDollar.map((m, idx) => (
                    <div key={`mpd-${idx}`} style={{ display: 'contents' }}>
                      <div><strong>Measurement per dollar (all)</strong></div>
                      <div style={{ textAlign: 'center' }}>{m.value.toFixed(m.unitLabel.includes('kg') || m.unitLabel.includes('L') ? 2 : 1)}</div>
                      <div style={{ textAlign: 'right' }}>{m.unitLabel}</div>
                    </div>
                  ))}
                </div>

                {previous && (
                  <div style={{ marginTop: 12 }}>
                    <h3 style={{ fontSize: 14, marginBottom: 4 }}>Comparison</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <div><strong>Today's Deal</strong></div>
                        <div>${result.pricePerItem.toFixed(2)} per item</div>
                        {result.pricePerUnit && (
                          <div>{result.pricePerUnit.value.toFixed(2)}{result.pricePerUnit.unitLabel}</div>
                        )}
                        {result.measurementPerDollar && (
                          <div>{result.measurementPerDollar.value.toFixed(1)} {result.measurementPerDollar.unitLabel}</div>
                        )}
                      </div>
                      <div>
                        <div><strong>Last Time</strong></div>
                        <div>${previous.pricePerItem.toFixed(2)} per item</div>
                        {previous.pricePerUnit && (
                          <div>{previous.pricePerUnit.value.toFixed(2)}{previous.pricePerUnit.unitLabel}</div>
                        )}
                        {previous.measurementPerDollar && (
                          <div>{previous.measurementPerDollar.value.toFixed(1)} {previous.measurementPerDollar.unitLabel}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={handleSave} style={{ padding: 10, background: '#10b981', color: 'white', border: 'none', borderRadius: 6 }}>Save for later</button>
                  <button onClick={clearAll} style={{ padding: 10, background: '#6b7280', color: 'white', border: 'none', borderRadius: 6 }}>Clear</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}