import type { BaseUnit, Unit } from './units'
import { normalizeMeasurement, pricePerUnit, measurementPerDollar, toDisplayFromBase, round, pricePerAllUnits, measurementPerDollarAllUnits } from './units'

export interface DealInput {
  totalPrice: number
  itemCount: number
  measurementPerItem?: number
  unit?: Unit
  productName?: string
  // Add optional location for persistence/display in history
  location?: string
}

export interface DealResult {
  pricePerItem: number
  totalMeasurement?: {
    baseValue: number
    baseUnit: BaseUnit
    displayValue: number
    displayUnit: 'g' | 'kg' | 'ml' | 'L'
  }
  pricePerUnit?: {
    value: number
    unitLabel: string
  }
  measurementPerDollar?: {
    value: number
    unitLabel: string
  }
  allUnits?: {
    pricePerUnit: { value: number; unitLabel: string }[]
    measurementPerDollar: { value: number; unitLabel: string }[]
  }
}

export function computeDeal(input: DealInput): DealResult {
  const { totalPrice, itemCount } = input
  if (!isFinite(totalPrice) || totalPrice <= 0) {
    throw new Error('Total price must be a positive number')
  }
  if (!isFinite(itemCount) || itemCount <= 0) {
    throw new Error('Number of items must be a positive integer')
  }

  const pricePerItemVal = totalPrice / itemCount

  let result: DealResult = {
    pricePerItem: round(pricePerItemVal, 2),
  }

  if (input.measurementPerItem && input.unit) {
    const perItem = normalizeMeasurement(input.measurementPerItem, input.unit)
    const totalBaseValue = perItem.baseValue * itemCount
    const display = toDisplayFromBase(totalBaseValue, perItem.baseUnit)

    result.totalMeasurement = {
      baseValue: totalBaseValue,
      baseUnit: perItem.baseUnit,
      displayValue: round(display.displayValue, 2),
      displayUnit: display.displayUnit,
    }

    result.pricePerUnit = pricePerUnit(totalPrice, totalBaseValue, perItem.baseUnit)
    result.measurementPerDollar = measurementPerDollar(totalBaseValue, totalPrice, perItem.baseUnit)

    // All units breakdown
    result.allUnits = {
      pricePerUnit: pricePerAllUnits(totalPrice, totalBaseValue, perItem.baseUnit),
      measurementPerDollar: measurementPerDollarAllUnits(totalBaseValue, totalPrice, perItem.baseUnit),
    }
  }

  return result
}