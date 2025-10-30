import type { DealInput, DealResult } from './calculation'
import { computeDeal } from './calculation'

export type DiscountKind = 'none' | 'percent_off' | 'buy_n_get_m' | 'second_item_percent_off'

export type DiscountSpec =
  | { kind: 'none' }
  | { kind: 'percent_off'; percent: number }
  | { kind: 'buy_n_get_m'; n: number; m: number; /** optional when total provided */ baseItemPrice?: number }
  | { kind: 'second_item_percent_off'; percent: number; /** optional when total provided */ baseItemPrice?: number }

// Type guard: check for a finite number value
const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/**
 * Apply discount to infer effective total price and item count.
 * If `totalPrice` is not provided, some discount kinds allow using `baseItemPrice`.
 */
export function applyDiscount(
  base: { totalPrice?: number; itemCount?: number; baseItemPrice?: number },
  spec: DiscountSpec
): { totalPrice: number; itemCount: number } {
  const providedTotal = base.totalPrice
  const providedCount = base.itemCount
  const basePrice = base.baseItemPrice

  if (spec.kind === 'none') {
    if (!isFiniteNumber(providedTotal) || !isFiniteNumber(providedCount)) {
      throw new Error('Provide total price and item count for no discount')
    }
    return { totalPrice: providedTotal, itemCount: providedCount }
  }

  if (spec.kind === 'percent_off') {
    if (!isFiniteNumber(providedTotal) || !isFiniteNumber(providedCount)) {
      throw new Error('Percent off requires total price and item count')
    }
    const pct = Math.max(0, Math.min(100, spec.percent))
    return { totalPrice: providedTotal * (1 - pct / 100), itemCount: providedCount }
  }

  if (spec.kind === 'buy_n_get_m') {
    const n = Math.max(1, Math.floor(spec.n))
    const m = Math.max(0, Math.floor(spec.m))
    const count = n + m
    let total: number | undefined = isFiniteNumber(providedTotal) ? providedTotal : undefined
    if (total === undefined) {
      const candidate = isFiniteNumber(spec.baseItemPrice)
        ? spec.baseItemPrice
        : isFiniteNumber(basePrice)
          ? basePrice
          : undefined
      if (candidate !== undefined) {
        total = candidate * n
      }
    }
    if (total === undefined) {
      throw new Error('Buy N get M requires total price for N items or base item price')
    }
    return { totalPrice: total, itemCount: count }
  }

  if (spec.kind === 'second_item_percent_off') {
    const pct = Math.max(0, Math.min(100, spec.percent))
    const count = 2
    let total: number | undefined = isFiniteNumber(providedTotal) ? providedTotal : undefined
    if (total === undefined) {
      const candidate = isFiniteNumber(spec.baseItemPrice)
        ? spec.baseItemPrice
        : isFiniteNumber(basePrice)
          ? basePrice
          : undefined
      if (candidate !== undefined) {
        const p = candidate
        total = p * (1 + (1 - pct / 100))
      }
    }
    if (total === undefined) {
      throw new Error('Second item % off requires total price or base item price')
    }
    return { totalPrice: total, itemCount: count }
  }

  // fallback
  throw new Error('Unsupported discount kind')
}

/**
 * Compute a deal with discount applied. Leaves measurement fields intact.
 */
export function computeDealWithDiscount(input: DealInput, spec: DiscountSpec): DealResult {
  const { totalPrice, itemCount } = applyDiscount(
    { totalPrice: input.totalPrice, itemCount: input.itemCount },
    spec
  )
  return computeDeal({ ...input, totalPrice, itemCount })
}