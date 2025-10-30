import { useMemo, useState } from 'react'
import type { DealResult } from '../lib/calculation'
import { computeDeal } from '../lib/calculation'
import type { DiscountSpec, DiscountKind } from '../lib/discounts'
import { applyDiscount } from '../lib/discounts'

type Unit = 'g' | 'kg' | 'ml' | 'l' | ''

function DealInputs({ label, onResult }: { label: string; onResult: (r: DealResult | null) => void }) {
  const [originalPrice, setOriginalPrice] = useState<string>('')
  const [measurementPerItem, setMeasurementPerItem] = useState<string>('')
  const [unit, setUnit] = useState<Unit>('')
  const [discountKind, setDiscountKind] = useState<DiscountKind>('none')
  const [percent, setPercent] = useState<string>('')
  const [n, setN] = useState<string>('')
  const [m, setM] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [effSummary, setEffSummary] = useState<{ totalPrice: number; itemCount: number } | null>(null)

  const result = useMemo(() => {
    setError(null)
    try {
      const meas = measurementPerItem ? parseFloat(measurementPerItem) : undefined
      const unitSel = unit || undefined
      const basePrice = originalPrice ? parseFloat(originalPrice) : undefined
      if (!(typeof basePrice === 'number') || !Number.isFinite(basePrice) || basePrice < 0) {
        onResult(null)
        return null
      }

      // Infer item count by discount kind
      let assumedCount = 1
      let spec: DiscountSpec = { kind: 'none' }
      if (discountKind === 'percent_off') {
        const pct = parseFloat(percent || '0')
        spec = { kind: 'percent_off', percent: pct }
      } else if (discountKind === 'buy_n_get_m') {
        const nn = Math.max(1, parseInt(n || '0', 10))
        const mm = Math.max(0, parseInt(m || '0', 10))
        assumedCount = nn + mm
        spec = { kind: 'buy_n_get_m', n: nn, m: mm, baseItemPrice: basePrice }
      } else if (discountKind === 'second_item_percent_off') {
        const pct = parseFloat(percent || '0')
        assumedCount = 2
        spec = { kind: 'second_item_percent_off', percent: pct, baseItemPrice: basePrice }
      }

      // Provide total when needed (none/percent_off use 1 item or assumedCount)
      const providedTotal = (discountKind === 'percent_off' || discountKind === 'none')
        ? basePrice * assumedCount
        : undefined

      const eff = applyDiscount({ totalPrice: providedTotal, itemCount: assumedCount, baseItemPrice: basePrice }, spec)
      setEffSummary({ totalPrice: eff.totalPrice, itemCount: eff.itemCount })
      const res = computeDeal({ totalPrice: eff.totalPrice, itemCount: eff.itemCount, measurementPerItem: meas, unit: unitSel })
      onResult(res)
      return res
    } catch (e: any) {
      onResult(null)
      setError(e.message || 'Failed to calculate')
      return null
    }
  }, [originalPrice, measurementPerItem, unit, discountKind, percent, n, m])

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
      <div style={{ fontSize: 18, marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
          <label>
            <span style={{ fontSize: 14 }}>Original price ($ per item)</span>
            <input type="number" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} placeholder="e.g., 12" style={{ width: '100%', marginTop: 4, padding: 10 }} />
          </label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label>
            <span style={{ fontSize: 14, color: '#cbd5e1' }}>Volume (per item)</span>
            <input type="number" value={measurementPerItem} onChange={(e) => setMeasurementPerItem(e.target.value)} placeholder="e.g., 750" style={{ width: '100%', marginTop: 4, padding: 10 }} />
          </label>
          <label>
            <span style={{ fontSize: 14, color: '#cbd5e1' }}>Unit (short)</span>
            <select value={unit} onChange={(e) => setUnit(e.target.value as Unit)} style={{ width: '100%', marginTop: 4, padding: 10 }}>
              <option value="">Select</option>
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="ml">ml</option>
              <option value="l">l</option>
            </select>
          </label>
        </div>
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
          <div style={{ fontSize: 16, marginBottom: 6 }}>Discount</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              <span style={{ fontSize: 14 }}>Type</span>
              <select value={discountKind} onChange={(e) => setDiscountKind(e.target.value as DiscountKind)} style={{ width: '100%', marginTop: 4, padding: 10 }}>
                <option value="none">None</option>
                <option value="percent_off">Percent off entire purchase</option>
                <option value="buy_n_get_m">Buy N get M free</option>
                <option value="second_item_percent_off">Second item percent off</option>
              </select>
            </label>
          </div>
          {discountKind === 'percent_off' && (
            <label>
              <span style={{ fontSize: 14 }}>Percent off</span>
              <input type="number" value={percent} onChange={(e) => setPercent(e.target.value)} placeholder="e.g., 5" style={{ width: '100%', marginTop: 4, padding: 10 }} />
            </label>
          )}
          {discountKind === 'buy_n_get_m' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label>
                <span style={{ fontSize: 14 }}>Buy N</span>
                <input type="number" value={n} onChange={(e) => setN(e.target.value)} placeholder="e.g., 2" style={{ width: '100%', marginTop: 4, padding: 10 }} />
              </label>
              <label>
                <span style={{ fontSize: 14 }}>Get M free</span>
                <input type="number" value={m} onChange={(e) => setM(e.target.value)} placeholder="e.g., 1" style={{ width: '100%', marginTop: 4, padding: 10 }} />
              </label>
            </div>
          )}
          {discountKind === 'second_item_percent_off' && (
            <label>
              <span style={{ fontSize: 14 }}>Second item percent off</span>
              <input type="number" value={percent} onChange={(e) => setPercent(e.target.value)} placeholder="e.g., 50" style={{ width: '100%', marginTop: 4, padding: 10 }} />
            </label>
          )}
          <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 6 }}>
            Provide the original price per item. Item quantity is inferred based on discount type.
          </div>
          {error && (<div role="alert" style={{ color: '#b91c1c', marginTop: 6 }}>{error}</div>)}
        </div>

        {/* Results */}
        {result && effSummary ? (
          <div style={{ marginTop: 8, borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 6, alignItems: 'center' }}>
              <div><strong>Total price</strong></div>
              <div style={{ textAlign: 'center' }}>{effSummary.totalPrice.toFixed(2)}</div>
              <div style={{ textAlign: 'right' }}>$</div>

              <div style={{ display: 'contents' }}>
                <div><strong>Per item cost</strong></div>
                <div style={{ textAlign: 'center' }}>{result.pricePerItem.toFixed(2)}</div>
                <div style={{ textAlign: 'right' }}>$ / item</div>
              </div>

              <div style={{ display: 'contents' }}>
                <div><strong>Total items received</strong></div>
                <div style={{ textAlign: 'center' }}>{effSummary.itemCount}</div>
                <div style={{ textAlign: 'right' }}>items</div>
              </div>

              {result.pricePerUnit && (
                <div style={{ display: 'contents' }}>
                  <div><strong>Unit price (volume)</strong></div>
                  <div style={{ textAlign: 'center' }}>{result.pricePerUnit.value.toFixed(2)}</div>
                  <div style={{ textAlign: 'right' }}>{result.pricePerUnit.unitLabel}</div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: '#cbd5e1' }}>Enter values to calculate.</div>
        )}
      </div>
    </div>
  )
}

export default function ABCompare() {
  const [resA, setResA] = useState<DealResult | null>(null)
  const [resB, setResB] = useState<DealResult | null>(null)

  const verdict = useMemo(() => {
    if (!resA || !resB) return ''
    // Prefer volume unit cost comparison; require unit data for both
    if (resA.pricePerUnit && resB.pricePerUnit) {
      const a = resA.pricePerUnit.value
      const b = resB.pricePerUnit.value
      const better = a < b ? 'A' : b < a ? 'B' : 'Tie'
      const pct = a === b ? 0 : Math.abs((b - a) / Math.max(a, b)) * 100
      return `${better} is cheaper by ${pct.toFixed(1)}% (volume unit price)`
    }
    return 'Add volume and unit for both deals to compare by unit cost.'
  }, [resA, resB])

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Deal Compare</h1>
      <p style={{ color: '#cbd5e1', marginBottom: 12 }}>Compare two deals for the same product using discount rules.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <DealInputs label="Deal A" onResult={setResA} />
        <DealInputs label="Deal B" onResult={setResB} />
      </div>
      <div style={{ marginTop: 12, borderTop: '1px solid #e5e7eb', paddingTop: 12 }}>
        <div style={{ fontSize: 18, marginBottom: 4 }}>Verdict</div>
        <div style={{ fontSize: 16 }}>{verdict || 'Enter both deals to see which is better.'}</div>
      </div>
    </div>
  )
}