# NDT Calculator — MVP development specification
Version: 0.1 | 2026-10-09 | Status: development baseline

## Product boundary
IN: X-ray radiographic testing (not gamma), UT, VT/VIK, PT/PVK, MT/MK, ultrasonic thickness measurement.
OUT: gamma radiography, radiometric/profile thickness measurement, all welding work. Preserve legacy code; do not delete or alter existing welding/gamma modules in this phase.

## User roles
Admin: users, pricing norms, all calculations.
Manager: quotations and commercial calculations; cost detail hidden by default.
Engineer: technical parameters, resources and cost calculations; commercial permissions configurable.
Server-side authorization required. GitHub Pages alone cannot provide this.

## Two calculation models
A. Volume-based: method, units (joints/metres/exposures/points), volume, diameter, wall thickness, material, access, urgency, scope, method-specific parameters. Explicitly distinguish joint count from exposure count.
B. Resource-based: crew composition, shifts, productive hours, work/travel days, wages and employer contributions, equipment, consumables, accommodation, transport, per diem, overhead.
Combined: compare quoted revenue with resource-based total cost. Never add two models' outputs as costs. Allocate shared mobilization/travel once per job.

## Finance
Base location: Moscow. Default per diem: RUB 700/person/day. Target gross margin on revenue excluding VAT: 25%.
Required price ex VAT = full planned cost / (1 - margin).
Margin = (revenue ex VAT - full planned cost) / revenue ex VAT.
Store currency in integer kopecks or decimal (never floating point for final money). Persist formula version, norm version, source/override for every rate.
VAT rate, salary rates, output norms, equipment rates, overhead allocation, materials and rounding rules: UNAPPROVED INPUTS. Never label estimated seed tariffs as actual costs.

## Functional MVP
1. Create customer and job site.
2. Create quote with one or more eligible NDT methods.
3. Edit technical volumes and production resources.
4. Calculate cost breakdown and target commercial price.
5. Warn on target margin shortfall and missing rate inputs.
6. Save immutable calculation revision with author and timestamp.
7. Export customer PDF without confidential cost lines; internal XLSX with breakdown.
8. Support multiuser authentication and role-based permissions.
9. Integrations with Bitrix24 and map routing behind server-side adapters; mocks only until credentials and mapping are approved.

## Acceptance tests
- Correct 25% margin calculation: RUB 100000 cost -> RUB 133333.33 target price before rounding policy.
- Reject negative quantity, invalid margin >=100%, missing mandatory unit, and invalid money.
- Joint count and exposure count remain distinct.
- Two methods in one job share mobilization expense only once.
- Reopening an old revision preserves rates and computed result after tariff updates.
- Manager cannot fetch hidden cost data via API or exported customer PDF.
- PDF and XLSX totals match the stored calculation revision.
- Every included method passes positive, zero, boundary and invalid-input cases.
- Existing labs and legacy welding pages are not broken by the NDT split.

## Work order for Codex
P0: Audit current branch vs main and published GitHub Pages; run existing tests; record failures.
P1: Extract and test pure NDT calculation engine; exclude gamma/profile radiometry/welding from NDT UI only.
P2: Implement both models and combined comparison; parameterize all unapproved norms.
P3: Backend, database, authorization, versioned calculations.
P4: PDF/XLSX exports, customer/job entities.
P5: Bitrix24 and maps adapters, end-to-end tests, CI.
Deliver audit report, defect register, architecture decision record, test plan and backlog before invasive refactoring.

## Open decisions
- Confirm production hosting and backend stack (GitHub is code hosting).
- Confirm wage/shift rates, productivity norms by method, equipment and consumables.
- Confirm VAT, rounding, minimum job price, overhead allocation and customer-paid travel.
- Confirm data retention, backup, commercial approval thresholds, and sample PDF/XLSX templates.
- Confirm normative applicability by method and customer; do not infer RT exposure schemes from generic coefficients.
