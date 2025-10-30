# Lazygakga Feature Roadmap (MVP → Post‑MVP)

Source PRD: `PRD/lazygakgaPRD`

## Context & Goal
- Vision: fastest, most intuitive calculator for supermarket deals.
- Core focus: instant per‑item and per‑unit value, with simple comparison.
- MVP scope: Universal Deal Calculator + Save/History + Auto comparison.

## Guiding Principles
- Clarity first: minimal inputs, immediate results on same screen.
- Local‑first storage, zero signup, fast interactions (<100ms calc/update).
- Honest math: correct unit conversions, consistent rounding rules.
- Accessibility: keyboard friendly, screen‑reader labels, high contrast.

## Milestone 1 — Universal Deal Calculator (Core)
Deliver a single screen with inputs and computed results.

Implementation
- Inputs: `Total Price` (required), `Number of Items` (required, default 1), `Weight/Volume per Item` (optional), `Unit` (optional: g/kg/ml/L), `Product Name` (optional).
- Calculations:
  - Price per item = `Total Price / Number of Items`.
  - Total weight/volume = `Number of Items * Weight per Item`.
  - Price per unit = `Total Price / Total weight` (normalized to base unit).
  - Measurement per dollar = `Total weight / Total Price`.
- Unit normalization:
  - g↔kg, ml↔L (auto‑convert to kg/L for per‑unit display when total ≥ 1000 g/ml).
- Rounding/display rules:
  - Prices: 2 decimals (e.g., $11.00).
  - Per‑unit: 2 decimals (e.g., $14.67/kg) with correct unit.
  - Per‑dollar: 1 decimal (e.g., 68.2 g/$) unless very small/large.
- UX:
  - Single page; inputs on top, results panel below; prominent `Calculate`.
  - `Clear` resets inputs; results panel animates on update.
  - Validation messages are inline, non‑blocking until `Calculate`.

Acceptance Criteria
- Required inputs validated; helpful messages for missing/invalid values.
- Correct unit conversion and result formatting across g/kg/ml/L.
- Results update within the same screen; no navigation required.
- Works offline; page refresh preserves nothing unless saved.
- Keyboard accessible: tab order, labels, and button roles correct.

Testing
- Unit tests: conversion utilities, rounding, calculation formulas.
- Integration: input→result flows including edge cases (no weight, large numbers).
- Accessibility checks: labels, roles, focus states.

## Milestone 2 — Save, History, and Comparison
Persist calculations and compare against past entries by product name.

Implementation
- Save flow: `Save for later` stores calculation with `Product Name`, timestamp, raw inputs and computed outputs.
- History list: simple searchable list of saved products with last saved summary.
- Comparison: when typing a `Product Name` that exists, show last saved results alongside current results; add red/green indicators for better/worse value.
- Storage: local‑first (`IndexedDB` preferred, fallback `localStorage`).
- Matching: case‑insensitive exact match; future: fuzzy match opt‑in.

Acceptance Criteria
- Saves include all fields needed to reproduce outputs.
- History shows items sorted by last saved; clicking a row loads inputs.
- Auto‑comparison appears on product name match; indicators shown for all metrics.
- No duplicate records on repeated saves unless inputs change.

Testing
- Persistence: save/load/delete flows; schema migrations guarded.
- Comparison correctness across price, per‑unit, per‑dollar metrics.
- Edge cases: missing weight, unit changes, large/small values.

## Milestone 3 — UX Polish & Accessibility
Refine experience to feel fast, friendly, and inclusive.

Implementation
- Auto‑unit selection hint (e.g., 1500g → show kg automatically).
- Autocomplete on product name from history.
- Consistent empty‑state messages and helpful defaults.
- Visual polish: arrows, colors, spacing, card layout.

Acceptance Criteria
- WCAG AA color contrast; keyboard‑only flows possible.
- Clear states: empty, calculating, saved, compared.
- On slow devices, no noticeable jank during input and save.

## Milestone 4 — Instrumentation & Beta Rollout

Implementation
- Optional anonymous telemetry (events: calculate, save, compare) respecting privacy.
- Feedback link in history page; lightweight error logs (non‑PII).

Acceptance Criteria
- Metrics visible to team; opt‑out toggle.
- Beta release with small group; capture top issues.

## Milestone 5 — Post‑MVP: OCR Capture (Spike → Feature)

Implementation Plan
- Spike: evaluate client‑side OCR libraries (e.g., Tesseract.js) and accuracy on supermarket labels.
- Parsing pipeline: detect price, quantity, weight; map to inputs with confidence scores.
- UX: camera button → capture → preview extracted fields → apply to calculator.

Acceptance Criteria (for the eventual feature)
- ≥90% extraction accuracy on common tags; graceful manual correction.
- Fast enough on mid‑range devices (<2s for parse on single image).

## Risks & Mitigations
- Inconsistent store labels → robust unit detection and manual overrides.
- Local storage limits → compact records; consider cleanup and export.
- Product name collisions → show last N saves and allow selection.

## Suggested Timeline (indicative)
- Week 1: Milestone 1 core calculator, tests.
- Week 2: Milestone 2 save/history/comparison.
- Week 3: Milestone 3 polish + accessibility; beta.
- Weeks 4–5: Milestone 5 OCR spike, feasibility report.

## Deliverables
- Calculator screen with accurate results and validations.
- Conversion utilities with tests.
- Local persistence with history and comparison.
- Roadmap and checklist docs kept up‑to‑date.