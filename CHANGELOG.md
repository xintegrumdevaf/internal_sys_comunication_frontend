# Changelog

All notable changes to this project will be documented in this file.

## [0.2.1] - 2026-10-29

### Added
- **Network Topology Bulk Import (`NetworkSettingsCard.tsx`)**: File picker allowing administrators to upload JSON topology configurations directly to the backend with automated syntax validation, toast feedback, and table refresh.
- **Network Topology Backup Export (`NetworkSettingsCard.tsx`)**: One-click JSON backup export button downloading current router and OLT network topology with decrypted vault credentials for cross-environment portability.
- **HTTP Client Methods (`settings.api.ts`)**: Added `importNetworkTopology` and `exportNetworkTopology` API integration methods.

## [0.2.0] - 2026-10-28

### Added
- **Multi-Queue Availability Popover (`AppShell.tsx`)**: Replaced basic status switch with an interactive popover featuring a master switch for automatic case assignment and independent toggles for each associated department queue (`[Principal]` vs `[Suplente]`). Robust fallback support for global administrators with `primary_department_id: null`.
- **Contract Selector & Enrichment (`CasePanel.tsx`)**: Added an interactive contract switcher dropdown (`#5279 (Sector)`) allowing agents handling customers with multiple contracts to toggle between subscriptions in real time, updating sector, neighborhood, and telemetry instantly.
- **On-Demand Live Balance Sync (`CasePanel.tsx`)**: Added 'Actualizar saldo' action button with loading spinners, triggering backend re-queries to ERP/Excel workflows (`CHECK_BALANCE`) without reopening or restarting cases.
- **Expandable OLT Diagnostic History & CLI Viewer (`CaseSummaryDialog.tsx`, `OperationalInboxView.tsx`)**: Visual timeline with expandable telemetry cards, optical power measurements (Rx/Tx dBm), and CLI trace blocks with monospace styling and one-click clipboard copying.
- **Network Topology Vault Card (`NetworkSettingsCard.tsx`)**: Built administrative management interface under `/configuracion` allowing operators to add, edit, test, and delete encrypted MikroTik routers and OLTs.

### Fixed
- **Admin Availability Crash (`TypeError: null`)**:
  - *Damage*: Administrators attempting to open the availability toggle crashed the web application with a blank screen.
  - *Root Cause*: `AppShell.tsx` and availability normalization logic assumed `primary_department_id` is always a non-null string, failing when `null` for global admins.
  - *Resolution*: Added defensive null-safe guards and normalized empty fallback queues.
- **Frozen Balance Snapshot**:
  - *Damage*: Case balance remained frozen at initial intake values in the frontend.
  - *Resolution*: Subscribed to `case:updated` WebSocket events and integrated on-demand balance refresh.
- **Blind Diagnostic Error Banners**:
  - *Damage*: Diagnostic failures only rendered generic red error alerts without technical context.
  - *Resolution*: Implemented expandable milestone cards displaying optical telemetry, failed step descriptions, and OLT CLI traces.
- **Strict TypeScript Compliance & Zero Any Policy**:
  - *Damage*: 11 ESLint `no-explicit-any` errors in case panels and timelines blocked CI/CD pipelines.
  - *Resolution*: Replaced all `any` usages with discriminated unions, `ContractDto`, and `ExtendedContractCardItem`.

## [0.1.2] - 2026-10-16

### Added

- **AI Provider Settings UI**: Dynamic model selection dropdowns for Google Gemini and Ollama with cost and power tiers (Ultra Económico, Recomendado, Máxima Potencia).
- **Symmetric 2x2 Form Layout**: Harmonized layout across Gemini and Ollama with synchronized vector dimensions, badges, and manual input fallbacks.
- **API Key Security**: Masked credential input and live catalog fetching without plain-text exposure.
