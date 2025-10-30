import { useEffect, useMemo, useState } from 'react'
import './App.css'
import Calculator from './components/Calculator'
import PriceHistory from './components/PriceHistory'
import ABCompare from './components/ABCompare'
import DiscountCalculator from './components/DiscountCalculator'
import type { SavedCalculation } from './lib/storage'
import { clearHistory, seedFromFormattedLines } from './lib/storage'

function App() {
  const [tab, setTab] = useState<'calculator' | 'history' | 'compare' | 'discount'>('calculator')
  const [menuOpen, setMenuOpen] = useState(false)
  const [prefill, setPrefill] = useState<SavedCalculation | null>(null)

  // Seed requested sample data once
  useEffect(() => {
    const FLAG = 'seed_20251028'
    if (!localStorage.getItem(FLAG)) {
      clearHistory()
      seedFromFormattedLines([
        '惠康-地捫番茄汁-16-2-300-g-250607',
        '惠康-嘉頓漢堡飽-14.9-1-220-g-250912',
        '百佳-明輝印尼蝦片-20-2-200-g-251015',
        '百佳-卡夫獨立芝士-57-24---250923',
        '759阿信屋-Cleanwrap食物保鮮袋---251019',
      ])
      localStorage.setItem(FLAG, '1')
    }
  }, [])
  const currentTitle = useMemo(() => {
    switch (tab) {
      case 'calculator': return 'Record Product'
      case 'history': return 'Price History'
      case 'compare': return 'Deal Compare'
      case 'discount': return 'Cal‑D'
      default: return ''
    }
  }, [tab])
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top menu header */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          padding: 12,
          borderBottom: '1px solid #e5e7eb',
          background: 'rgba(36,36,36,0.9)',
          backdropFilter: 'saturate(180%) blur(6px)'
        }}
      >
        <button
          aria-label="Open menu"
          onClick={() => setMenuOpen((v) => !v)}
          style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', background: '#374151', color: 'white' }}
        >
          Menu
        </button>
        <div style={{ color: '#e5e7eb', fontSize: 16 }}>{currentTitle}</div>
        <div style={{ width: 72 }} />
      </div>
      {/* Menu overlay */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)' }}
        >
          <div
            role="menu"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: 64,
              left: 12,
              right: 12,
              background: '#1f2937',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: 12,
              display: 'grid',
              gap: 8
            }}
          >
            <button
              onClick={() => { setTab('calculator'); setMenuOpen(false) }}
              style={{ padding: 12, borderRadius: 8, border: '1px solid #e5e7eb', background: tab==='calculator'?'#10b981':'#374151', color: 'white', textAlign: 'left' }}
            >
              Record Product
            </button>
            <button
              onClick={() => { setTab('history'); setMenuOpen(false) }}
              style={{ padding: 12, borderRadius: 8, border: '1px solid #e5e7eb', background: tab==='history'?'#10b981':'#374151', color: 'white', textAlign: 'left' }}
            >
              Price History
            </button>
            <button
              onClick={() => { setTab('compare'); setMenuOpen(false) }}
              style={{ padding: 12, borderRadius: 8, border: '1px solid #e5e7eb', background: tab==='compare'?'#10b981':'#374151', color: 'white', textAlign: 'left' }}
            >
              Deal Compare
            </button>
            <button
              onClick={() => { setTab('discount'); setMenuOpen(false) }}
              style={{ padding: 12, borderRadius: 8, border: '1px solid #e5e7eb', background: tab==='discount'?'#10b981':'#374151', color: 'white', textAlign: 'left' }}
            >
              Cal‑D
            </button>
          </div>
        </div>
      )}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', paddingTop: 72 }}>
        {tab === 'calculator' && (<Calculator prefill={prefill || undefined} />)}
        {tab === 'history' && (<PriceHistory onEdit={(item) => { setPrefill(item); setTab('calculator') }} />)}
        {tab === 'compare' && (<ABCompare />)}
        {tab === 'discount' && (<DiscountCalculator />)}
      </div>
    </div>
  )
}

export default App
