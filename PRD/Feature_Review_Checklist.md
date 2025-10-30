# Feature Review Checklist (Lazygakga)

Reference: `PRD/lazygakgaPRD`, `PRD/ROADMAP.md`

Use this checklist for every new feature to ensure alignment with the vision, quality, and release criteria.

## Alignment & Scope
- [ ] Aligns with vision (fast, intuitive supermarket deal clarity).
- [ ] Clear problem statement and success metrics defined.
- [ ] In‑scope for current milestone; non‑goals documented.

## Requirements & UX
- [ ] User story and acceptance criteria documented.
- [ ] Primary flow defined; edge cases enumerated (missing fields, large/small values).
- [ ] Same‑screen updates where possible; minimal navigation.
- [ ] Accessibility: labels, roles, keyboard navigation, contrast (WCAG AA).

## Data Model & Persistence
- [ ] Inputs and outputs modeled explicitly (types/interfaces).
- [ ] Persistence strategy chosen (IndexedDB/localStorage) and schema version noted.
- [ ] Migration path defined for future changes.
- [ ] Delete/update flows considered; duplicate handling specified.

## Calculations & Units (if applicable)
- [ ] Formulas verified; unit normalization rules documented (g↔kg, ml↔L).
- [ ] Rounding rules consistent (prices: 2 decimals; per‑unit: 2; per‑dollar: 1).
- [ ] Edge cases covered (zero/negative, extremely large/small inputs).

## Performance & Reliability
- [ ] Target interactions <100ms on mid‑range devices; no jank.
- [ ] Graceful degradation if APIs/libraries unavailable.
- [ ] Offline behavior defined; error states helpful and non‑blocking.

## Observability & Privacy
- [ ] Optional analytics events (calculate, save, compare) planned with opt‑out.
- [ ] No PII stored; only anonymized metrics.
- [ ] Error logging safe and actionable.

## Internationalization
- [ ] Copy reviewed; units and currency symbols correctly displayed.
- [ ] Localizable strings isolated; default language set.

## Testing
- [ ] Unit tests for core logic (conversions, formulas).
- [ ] Integration tests for flows (input→result, save→history→compare).
- [ ] Accessibility tests (labels, roles, tab order, focus).

## Release Readiness
- [ ] Feature flags/gating plan defined if needed.
- [ ] Docs updated (`ROADMAP.md` section, in‑app hints/tooltips).
- [ ] Rollback plan and monitoring checks in place.
- [ ] Known risks and mitigations listed.

## Post‑Release
- [ ] Capture feedback and metrics; update backlog items.
- [ ] Create follow‑up tasks for polish and bugs.

---

### Quick Links
- PRD: `PRD/lazygakgaPRD`
- Roadmap: `PRD/ROADMAP.md`