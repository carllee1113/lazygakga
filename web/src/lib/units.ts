export type Unit = 'g' | 'kg' | 'ml' | 'l'

export type BaseUnit = 'g' | 'ml'

export interface NormalizedMeasurement {
  baseValue: number
  baseUnit: BaseUnit
}

export interface DisplayMeasurement {
  displayValue: number
  displayUnit: 'g' | 'kg' | 'ml' | 'L'
}

export function normalizeMeasurement(value: number, unit: Unit): NormalizedMeasurement {
  if (unit === 'g') return { baseValue: value, baseUnit: 'g' }
  if (unit === 'kg') return { baseValue: value * 1000, baseUnit: 'g' }
  if (unit === 'ml') return { baseValue: value, baseUnit: 'ml' }
  if (unit === 'l') return { baseValue: value * 1000, baseUnit: 'ml' }
  throw new Error('Unsupported unit')
}

export function toDisplayFromBase(baseValue: number, baseUnit: BaseUnit): DisplayMeasurement {
  if (baseUnit === 'g') {
    if (baseValue >= 1000) return { displayValue: baseValue / 1000, displayUnit: 'kg' }
    return { displayValue: baseValue, displayUnit: 'g' }
  }
  if (baseUnit === 'ml') {
    if (baseValue >= 1000) return { displayValue: baseValue / 1000, displayUnit: 'L' }
    return { displayValue: baseValue, displayUnit: 'ml' }
  }
  // Should not reach
  return { displayValue: baseValue, displayUnit: 'g' }
}

export function pricePerUnit(totalPrice: number, totalBaseValue: number, baseUnit: BaseUnit): { value: number; unitLabel: string } {
  const disp = toDisplayFromBase(totalBaseValue, baseUnit)
  const val = totalPrice / disp.displayValue
  return { value: round(val, 2), unitLabel: `$/${disp.displayUnit}` }
}

export function measurementPerDollar(totalBaseValue: number, totalPrice: number, baseUnit: BaseUnit): { value: number; unitLabel: string } {
  const val = totalBaseValue / totalPrice
  const label = baseUnit === 'g' ? 'g/$' : 'ml/$'
  return { value: round(val, 1), unitLabel: label }
}

export function pricePerAllUnits(totalPrice: number, totalBaseValue: number, baseUnit: BaseUnit): { value: number; unitLabel: string }[] {
  if (baseUnit === 'g') {
    const perG = round(totalPrice / totalBaseValue, 2)
    const perKg = round(totalPrice / (totalBaseValue / 1000), 2)
    return [
      { value: perG, unitLabel: '$/g' },
      { value: perKg, unitLabel: '$/kg' },
    ]
  } else {
    const perMl = round(totalPrice / totalBaseValue, 2)
    const perL = round(totalPrice / (totalBaseValue / 1000), 2)
    return [
      { value: perMl, unitLabel: '$/ml' },
      { value: perL, unitLabel: '$/L' },
    ]
  }
}

export function measurementPerDollarAllUnits(totalBaseValue: number, totalPrice: number, baseUnit: BaseUnit): { value: number; unitLabel: string }[] {
  if (baseUnit === 'g') {
    const gPerDollar = round(totalBaseValue / totalPrice, 1)
    const kgPerDollar = round((totalBaseValue / 1000) / totalPrice, 2)
    return [
      { value: gPerDollar, unitLabel: 'g/$' },
      { value: kgPerDollar, unitLabel: 'kg/$' },
    ]
  } else {
    const mlPerDollar = round(totalBaseValue / totalPrice, 1)
    const lPerDollar = round((totalBaseValue / 1000) / totalPrice, 2)
    return [
      { value: mlPerDollar, unitLabel: 'ml/$' },
      { value: lPerDollar, unitLabel: 'L/$' },
    ]
  }
}

export function round(n: number, digits: number): number {
  const factor = Math.pow(10, digits)
  return Math.round(n * factor) / factor
}