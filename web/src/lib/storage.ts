import type { DealInput, DealResult } from './calculation'
import { computeDeal } from './calculation'
import type { BaseUnit } from './units'
import { supabase, isSupabaseConfigured, TABLE_CALCULATIONS } from './supabase'

export interface SavedCalculation {
  productName: string
  timestamp: number
  input: DealInput
  result: DealResult
}

const KEY = 'saved_calculations'

// --- Supabase helpers ---
async function supabaseLoad(): Promise<SavedCalculation[]> {
  if (!isSupabaseConfigured) return load()
  try {
    const { data, error } = await supabase
      .from(TABLE_CALCULATIONS)
      .select('product_name, timestamp, input, result')
      .order('timestamp', { ascending: false })
    if (error) {
      console.warn('Supabase load error', error)
      return load()
    }
    const items: SavedCalculation[] = (data || []).map((row: any) => ({
      productName: row.product_name,
      timestamp: row.timestamp,
      input: row.input,
      result: row.result,
    }))
    return items
  } catch (e) {
    console.warn('Supabase load failed', e)
    return load()
  }
}

async function supabaseInsert(record: SavedCalculation): Promise<void> {
  if (!isSupabaseConfigured) return
  try {
    const { error } = await supabase.from(TABLE_CALCULATIONS).insert({
      product_name: record.productName,
      timestamp: record.timestamp,
      input: record.input,
      result: record.result,
    })
    if (error) console.warn('Supabase insert error', error)
  } catch (e) {
    console.warn('Supabase insert failed', e)
  }
}

async function supabaseUpdate(ts: number, record: SavedCalculation): Promise<void> {
  if (!isSupabaseConfigured) return
  try {
    const { error } = await supabase
      .from(TABLE_CALCULATIONS)
      .update({
        product_name: record.productName,
        input: record.input,
        result: record.result,
      })
      .eq('timestamp', ts)
    if (error) console.warn('Supabase update error', error)
  } catch (e) {
    console.warn('Supabase update failed', e)
  }
}

function load(): SavedCalculation[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    return arr
  } catch (e) {
    console.warn('Failed to load saved calculations', e)
    return []
  }
}

function saveAll(items: SavedCalculation[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items))
  } catch (e) {
    console.warn('Failed to save calculations', e)
  }
}

// Normalize product name for matching across variations (case/whitespace-insensitive)
function nameKey(name: string): string {
  return (name || '').trim().toLowerCase().replace(/\s+/g, '')
}

export function saveCalculation(productName: string, input: DealInput, result: DealResult): SavedCalculation {
  const items = load()
  const now = Date.now()
  const normalizedName = productName.trim()
  const record: SavedCalculation = { productName: normalizedName, timestamp: now, input, result }

  // Append new record for this product, keeping historical entries for averages/ranges
  items.push(record)
  saveAll(items)
  // Best-effort insert to Supabase (non-blocking)
  supabaseInsert(record)
  return record
}

export function getHistory(): SavedCalculation[] {
  return load().sort((a, b) => b.timestamp - a.timestamp)
}

// Async variants using Supabase when configured
export async function getHistoryAsync(): Promise<SavedCalculation[]> {
  if (isSupabaseConfigured) {
    const remote = await supabaseLoad()
    return remote.sort((a, b) => b.timestamp - a.timestamp)
  }
  return getHistory()
}

// Return the latest record per normalized product name, sorted by recency.
export function getLatestPerProduct(limit?: number): SavedCalculation[] {
  const items = load().sort((a, b) => b.timestamp - a.timestamp)
  const seen = new Set<string>()
  const result: SavedCalculation[] = []
  for (const it of items) {
    const key = nameKey(it.productName)
    if (!seen.has(key)) {
      seen.add(key)
      result.push(it)
      if (limit && result.length >= limit) break
    }
  }
  return result
}

export function findLastByProductName(name: string): SavedCalculation | undefined {
  const normalizedName = nameKey(name)
  const items = load()
  return items
    .filter((i) => nameKey(i.productName) === normalizedName)
    .sort((a, b) => b.timestamp - a.timestamp)[0]
}

export async function findLastByProductNameAsync(name: string): Promise<SavedCalculation | undefined> {
  if (isSupabaseConfigured) {
    const normalizedName = nameKey(name)
    const items = await supabaseLoad()
    return items
      .filter((i) => nameKey(i.productName) === normalizedName)
      .sort((a, b) => b.timestamp - a.timestamp)[0]
  }
  return findLastByProductName(name)
}

// Update a specific record by its timestamp (used when editing an entry)
export function updateByTimestamp(ts: number, updated: SavedCalculation): void {
  const items = load()
  const idx = items.findIndex((i) => i.timestamp === ts)
  if (idx >= 0) {
    items[idx] = updated
    saveAll(items)
  }
  // Best-effort remote update
  supabaseUpdate(ts, updated)
}

export interface ProductStats {
  count: number
  itemPrice?: { avg: number; min: number; max: number }
  unitPrice?: { baseUnit: BaseUnit; avgBase: number; minBase: number; maxBase: number }
}

// Extract $ per base unit (g or ml) from a result, converting if needed
function getPricePerBaseUnit(res: DealResult): { baseUnit: BaseUnit; valuePerBase: number } | null {
  if (!res.pricePerUnit && !res.allUnits) return null
  // Prefer explicit base price from allUnits if available
  if (res.allUnits && res.allUnits.pricePerUnit.length) {
    const per = res.allUnits.pricePerUnit[0] // '$/g' or '$/ml'
    if (per.unitLabel === '$/g') return { baseUnit: 'g', valuePerBase: per.value }
    if (per.unitLabel === '$/ml') return { baseUnit: 'ml', valuePerBase: per.value }
  }
  // Fallback to single pricePerUnit and convert
  if (res.pricePerUnit) {
    const label = res.pricePerUnit.unitLabel
    const v = res.pricePerUnit.value
    if (label === '$/g') return { baseUnit: 'g', valuePerBase: v }
    if (label === '$/kg') return { baseUnit: 'g', valuePerBase: v / 1000 }
    if (label === '$/ml') return { baseUnit: 'ml', valuePerBase: v }
    if (label === '$/L') return { baseUnit: 'ml', valuePerBase: v / 1000 }
  }
  return null
}

export function getProductStats(name: string): ProductStats | null {
  const normalizedName = nameKey(name)
  if (!normalizedName) return null
  const items = load().filter((i) => nameKey(i.productName) === normalizedName)
  if (items.length === 0) return null

  const itemPrices: number[] = []
  const unitPricesG: number[] = []
  const unitPricesMl: number[] = []

  for (const it of items) {
    const r = it.result
    if (isFinite(r.pricePerItem)) itemPrices.push(r.pricePerItem)
    const base = getPricePerBaseUnit(r)
    if (base) {
      if (base.baseUnit === 'g') unitPricesG.push(base.valuePerBase)
      else unitPricesMl.push(base.valuePerBase)
    }
  }

  const stats: ProductStats = { count: items.length }
  if (itemPrices.length) {
    const sum = itemPrices.reduce((a, b) => a + b, 0)
    stats.itemPrice = {
      avg: sum / itemPrices.length,
      min: Math.min(...itemPrices),
      max: Math.max(...itemPrices),
    }
  }
  if (unitPricesG.length) {
    const sum = unitPricesG.reduce((a, b) => a + b, 0)
    stats.unitPrice = {
      baseUnit: 'g',
      avgBase: sum / unitPricesG.length,
      minBase: Math.min(...unitPricesG),
      maxBase: Math.max(...unitPricesG),
    }
  } else if (unitPricesMl.length) {
    const sum = unitPricesMl.reduce((a, b) => a + b, 0)
    stats.unitPrice = {
      baseUnit: 'ml',
      avgBase: sum / unitPricesMl.length,
      minBase: Math.min(...unitPricesMl),
      maxBase: Math.max(...unitPricesMl),
    }
  }
  return stats
}

export async function getProductStatsAsync(name: string): Promise<ProductStats | null> {
  if (isSupabaseConfigured) {
    const normalizedName = nameKey(name)
    if (!normalizedName) return null
    const items = (await supabaseLoad()).filter((i) => nameKey(i.productName) === normalizedName)
    if (items.length === 0) return null

    const itemPrices: number[] = []
    const unitPricesG: number[] = []
    const unitPricesMl: number[] = []

    for (const it of items) {
      const r = it.result
      if (isFinite(r.pricePerItem)) itemPrices.push(r.pricePerItem)
      const base = getPricePerBaseUnit(r)
      if (base) {
        if (base.baseUnit === 'g') unitPricesG.push(base.valuePerBase)
        else unitPricesMl.push(base.valuePerBase)
      }
    }

    const stats: ProductStats = { count: items.length }
    if (itemPrices.length) {
      const sum = itemPrices.reduce((a, b) => a + b, 0)
      stats.itemPrice = {
        avg: sum / itemPrices.length,
        min: Math.min(...itemPrices),
        max: Math.max(...itemPrices),
      }
    }
    if (unitPricesG.length) {
      const sum = unitPricesG.reduce((a, b) => a + b, 0)
      stats.unitPrice = {
        baseUnit: 'g',
        avgBase: sum / unitPricesG.length,
        minBase: Math.min(...unitPricesG),
        maxBase: Math.max(...unitPricesG),
      }
    } else if (unitPricesMl.length) {
      const sum = unitPricesMl.reduce((a, b) => a + b, 0)
      stats.unitPrice = {
        baseUnit: 'ml',
        avgBase: sum / unitPricesMl.length,
        minBase: Math.min(...unitPricesMl),
        maxBase: Math.max(...unitPricesMl),
      }
    }
    return stats
  }
  return getProductStats(name)
}

// --- Utilities for clearing and seeding local storage ---
export function clearHistory(): void {
  try {
    localStorage.removeItem(KEY)
  } catch (e) {
    console.warn('Failed to clear calculations', e)
  }
}

function parseYYMMDD(dateStr: string): number | null {
  const s = String(dateStr || '').trim()
  if (!/^\d{6}$/.test(s)) return null
  const yy = parseInt(s.slice(0, 2), 10)
  const mm = parseInt(s.slice(2, 4), 10)
  const dd = parseInt(s.slice(4, 6), 10)
  if (!isFinite(yy) || !isFinite(mm) || !isFinite(dd)) return null
  const year = 2000 + yy
  const dt = new Date(year, mm - 1, dd, 12, 0, 0)
  return dt.getTime()
}

export function seedFromFormattedLines(lines: string[]): SavedCalculation[] {
  const out: SavedCalculation[] = []
  for (const line of lines) {
    const parts = String(line).split('-')
    if (parts.length < 3) {
      console.warn('Skipping malformed seed line:', line)
      continue
    }
    const location = parts[0].trim()
    const productName = parts[1].trim()
    const dateStr = parts[parts.length - 1].trim()
    const ts = parseYYMMDD(dateStr)
    if (ts === null) {
      console.warn('Skipping seed line with bad date:', line)
      continue
    }
    // middle tokens may contain empty fields (e.g., ---)
    const rest = parts.slice(2, -1).filter((p) => p.trim() !== '')
    let totalPrice: number | undefined
    let itemCount: number | undefined
    let measurementPerItem: number | undefined
    let unit: any | undefined

    if (rest.length >= 2) {
      const tp = parseFloat(rest[0])
      const ic = parseInt(rest[1], 10)
      if (isFinite(tp) && tp > 0) totalPrice = tp
      if (isFinite(ic) && ic > 0) itemCount = ic
    }
    if (rest.length >= 4) {
      const mv = parseFloat(rest[2])
      const u = rest[3].toLowerCase()
      if (isFinite(mv) && mv > 0) measurementPerItem = mv
      if (['g', 'kg', 'ml', 'l', 'L'].includes(u)) unit = u === 'L' ? 'l' : u
    }

    if (!isFinite(totalPrice as any) || !isFinite(itemCount as any)) {
      console.warn('Skipping seed line due to missing price/item count:', line)
      continue
    }

    const input: DealInput = {
      totalPrice: totalPrice!,
      itemCount: itemCount!,
      measurementPerItem,
      unit,
      productName,
      location,
    }
    try {
      const result = computeDeal(input)
      out.push({ productName, timestamp: ts, input, result })
    } catch (e) {
      console.warn('Failed to compute deal for seed line:', line, e)
    }
  }
  saveAll(out)
  // Also seed remote when configured (best effort)
  out.forEach((r) => supabaseInsert(r))
  return out
}

// Async variant mirroring getLatestPerProduct but using Supabase
export async function getLatestPerProductAsync(limit?: number): Promise<SavedCalculation[]> {
  const items = await getHistoryAsync()
  const seen = new Set<string>()
  const result: SavedCalculation[] = []
  for (const it of items) {
    const key = nameKey(it.productName)
    if (!seen.has(key)) {
      seen.add(key)
      result.push(it)
      if (limit && result.length >= limit) break
    }
  }
  return result
}