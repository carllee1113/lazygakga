import { useMemo, useState } from 'react'

interface LineItem {
  name: string
  price: string // price per item ($)
  count: string // number of items
}

export default function DiscountCalculator() {
  const emptyItem: LineItem = { name: '', price: '', count: '' }
  const [items, setItems] = useState<LineItem[]>([
    { ...emptyItem },
    { ...emptyItem },
    { ...emptyItem },
    { ...emptyItem },
    { ...emptyItem },
  ])

  type DiscountKind = 'none' | 'percent_off' | 'amount_off'
  const [discountKind, setDiscountKind] = useState<DiscountKind>('none')
  const [percent, setPercent] = useState<string>('')
  const [amountOff, setAmountOff] = useState<string>('')

  const total = useMemo(() => {
    return items.reduce((sum, it) => {
      const p = parseFloat(it.price)
      const c = parseInt(it.count || '0', 10)
      if (!Number.isFinite(p) || !Number.isFinite(c) || c <= 0 || p < 0) return sum
      return sum + p * c
    }, 0)
  }, [items])

  const discountedTotal = useMemo(() => {
    if (discountKind === 'percent_off') {
      const pct = Math.max(0, Math.min(100, parseFloat(percent || '0')))
      return total * (1 - pct / 100)
    }
    if (discountKind === 'amount_off') {
      const amt = Math.max(0, parseFloat(amountOff || '0'))
      return Math.max(0, total - (Number.isFinite(amt) ? amt : 0))
    }
    return total
  }, [total, discountKind, percent, amountOff])

  const updateItem = (idx: number, next: Partial<LineItem>) => {
    setItems((prev) => {
      const arr = [...prev]
      arr[idx] = { ...arr[idx], ...next }
      return arr
    })
  }

  const addItem = () => setItems((prev) => [...prev, { ...emptyItem }])

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Cal‑D — Cumulative Total</h1>
      <p style={{ color: '#cbd5e1', marginBottom: 12 }}>Enter up to five items, then use “+ Add item” if you need more. This tab sums the total cost across all items.</p>

      <div style={{ maxWidth: 720, margin: '0 auto', border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
        <div style={{ display: 'grid', gap: 12 }}>
          {items.map((it, idx) => (
            <div key={idx} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 16 }}>Item {idx + 1}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
                <label>
                  <span style={{ fontSize: 14 }}>Product Name (optional)</span>
                  <input value={it.name} onChange={(e) => updateItem(idx, { name: e.target.value })} style={{ width: '100%', marginTop: 4, padding: 10 }} />
                </label>
                <label>
                  <span style={{ fontSize: 14 }}>Price per item ($)</span>
                  <input type="number" value={it.price} onChange={(e) => updateItem(idx, { price: e.target.value })} placeholder="e.g., 12" style={{ width: '100%', marginTop: 4, padding: 10 }} />
                </label>
                <label>
                  <span style={{ fontSize: 14 }}>Number of items</span>
                  <input type="number" value={it.count} onChange={(e) => updateItem(idx, { count: e.target.value })} placeholder="e.g., 2" style={{ width: '100%', marginTop: 4, padding: 10 }} />
                </label>
              </div>
            </div>
          ))}

          <div>
            <button onClick={addItem} style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', background: '#374151', color: 'white' }}>+ Add item</button>
          </div>

          <div style={{ marginTop: 8, borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 6, alignItems: 'center' }}>
              <div><strong>Cumulative total cost</strong></div>
              <div style={{ textAlign: 'center' }}>{total.toFixed(2)}</div>
              <div style={{ textAlign: 'right' }}>$</div>
            </div>
          </div>

          {/* Discount section */}
          <div style={{ marginTop: 8, borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
            <div style={{ fontSize: 16, marginBottom: 6 }}>Discount</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label>
                <span style={{ fontSize: 14 }}>Type</span>
                <select value={discountKind} onChange={(e) => setDiscountKind(e.target.value as DiscountKind)} style={{ width: '100%', marginTop: 4, padding: 10 }}>
                  <option value="none">None</option>
                  <option value="percent_off">Percent off entire total</option>
                  <option value="amount_off">Amount off (coupon)</option>
                </select>
              </label>
              {discountKind === 'percent_off' && (
                <label>
                  <span style={{ fontSize: 14 }}>Percent off (%)</span>
                  <input type="number" value={percent} onChange={(e) => setPercent(e.target.value)} placeholder="e.g., 10" style={{ width: '100%', marginTop: 4, padding: 10 }} />
                </label>
              )}
              {discountKind === 'amount_off' && (
                <label>
                  <span style={{ fontSize: 14 }}>Amount off ($)</span>
                  <input type="number" value={amountOff} onChange={(e) => setAmountOff(e.target.value)} placeholder="e.g., 5" style={{ width: '100%', marginTop: 4, padding: 10 }} />
                </label>
              )}
            </div>

            {/* Discounted total */}
            <div style={{ marginTop: 8, borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 6, alignItems: 'center' }}>
                <div><strong>Discounted total cost</strong></div>
                <div style={{ textAlign: 'center' }}>{discountedTotal.toFixed(2)}</div>
                <div style={{ textAlign: 'right' }}>$</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}