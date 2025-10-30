import { describe, it, expect } from 'vitest'
import { computeDeal } from '../calculation'

describe('computeDeal', () => {
  it('calculates price per item and per kg from grams', () => {
    const res = computeDeal({
      totalPrice: 22,
      itemCount: 2,
      measurementPerItem: 750,
      unit: 'g',
    })

    expect(res.pricePerItem).toBe(11)
    expect(res.pricePerUnit).toBeDefined()
    expect(res.pricePerUnit!.unitLabel).toBe('$/kg')
    expect(res.pricePerUnit!.value).toBeCloseTo(14.67, 2)

    expect(res.measurementPerDollar).toBeDefined()
    expect(res.measurementPerDollar!.unitLabel).toBe('g/$')
    expect(res.measurementPerDollar!.value).toBeCloseTo(68.2, 1)
  })

  it('calculates price per L from ml and shows all units', () => {
    const res = computeDeal({
      totalPrice: 10,
      itemCount: 5,
      measurementPerItem: 300,
      unit: 'ml',
    })
    // total ml = 1500 -> 1.5 L
    expect(res.pricePerUnit!.unitLabel).toBe('$/L')
    expect(res.pricePerUnit!.value).toBeCloseTo(6.67, 2)
    expect(res.measurementPerDollar!.unitLabel).toBe('ml/$')
    expect(res.measurementPerDollar!.value).toBeCloseTo(150, 0)

    // All units present
    expect(res.allUnits).toBeDefined()
    expect(res.allUnits!.pricePerUnit.map(p => p.unitLabel)).toEqual(['$/ml', '$/L'])
    expect(res.allUnits!.measurementPerDollar.map(m => m.unitLabel)).toEqual(['ml/$', 'L/$'])
  })

  it('throws when price or item count invalid', () => {
    expect(() => computeDeal({ totalPrice: 0, itemCount: 1 })).toThrow()
    expect(() => computeDeal({ totalPrice: 10, itemCount: 0 })).toThrow()
  })
})