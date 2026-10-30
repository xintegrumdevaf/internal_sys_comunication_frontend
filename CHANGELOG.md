# Changelog

All notable changes to this project will be documented in this file.

## [0.2.2] - 2026-10-30

### Added

- **WhatsApp Web Chat Input Redesign & UX Optimization (`OperationalInbox.tsx`, `EmojiPickerPopover.tsx`)**:
  - Replaced the wide text pill button (`Enviar`) with WhatsApp's iconic circular emerald send button (`#00a884`) featuring `SendHorizontal`, saving horizontal real estate.
  - Standardized all chat action buttons (Paperclip, Emoji picker, and Send) to uniform 40px × 40px circular touch targets with matching 20px icons (`size-5`), creating visual harmony and alignment.
  - Consolidated scattered action buttons into a sleek popover menu triggered by a WhatsApp-style clip icon (`Paperclip`), keeping only the Clip and Sticker/Emoji selectors in the main bar while neatly grouping "Plantilla de WhatsApp" and "Respuestas rápidas" inside the popover.
  - Implemented reactive auto-expanding textarea (`min-h-[40px] max-h-[140px]`, 14px typography, `leading-5`) that dynamically calculates content height and keeps `overflow-y: hidden` until max height is exceeded, completely eliminating accidental scrollbars while preserving multiline readability.
  - Set concise, clear placeholder with quick replies autocomplete indicator: `"Escribe un mensaje... o '/' para respuestas rápidas"`.
  - Added click-outside listener to automatically dismiss the clip popover menu when clicking anywhere else.
- **Native WhatsApp Video Playback & Media Viewer (`MessageMediaBody.tsx`)**:
  - Built-in inline HTML5 `<video controls playsInline preload="metadata">` player styled to match WhatsApp Web with dark backdrop, aspect-ratio constraint, and rounded corners.
  - Action bar with direct download/open action button and filename metadata.
  - Video caption rendering with automatic filtering of synthetic placeholders (e.g. `[video]`).
  - Added unit test suite in `MessageMediaBody.test.tsx` (6 passing tests).

### Fixed

- **WhatsApp Video Messages Displaying as "Archivo adjunto"**:
  - _Damage_: Video files sent by customers (such as router/cable status clips) displayed a generic fallback card `📄 Archivo adjunto` instead of playing or previewing in the chat.
  - _Root Cause_: `MessageMediaBody.tsx` completely lacked an `isVideo` branch, and `MessageType` in `conversation.ts` omitted `"video"`. When videos arrived, they were either claimed by the document branch (if a filename was present) or fell through to the attachment placeholder.
  - _Resolution_:
    - Added `"video"` to `MessageType` domain definition in `conversation.ts`.
    - Implemented explicit `isVideo` detection prioritizing video MIME types (`video/mp4`, `video/webm`, etc.) and extensions (`.mp4`, `.mov`, `.webm`, `.3gp`, `.mkv`).
    - Excluded video files from being hijacked by generic document / PDF checks.
    - Enhanced `buildMediaUrl` to preserve relative endpoints like `/api/v1/whatsapp/media/...` and route them cleanly through `/api/media?url=...`.

- **Multi-line Support & Line-break Preservation in Chat Composer & Quick Replies**:
  - _Damage_: Quick replies with multiple paragraphs, bullet points, and contract terms (e.g. equipment return instructions, payment accounts) were collapsed into a single continuous line without line breaks, rendering important instructions unreadable.
  - _Root Cause_:
    - The chat composer in `OperationalInbox.tsx` used a single-line HTML `<input>` element instead of a `<textarea>`, causing the browser to strip all carriage returns and line feeds (`\r`, `\n`) upon inserting or editing drafts.
    - Quick reply template modal did not normalize Windows CRLF and literal `\n` escape sequences.
  - _Resolution_:
    - Upgraded the chat composer in `OperationalInbox.tsx` from an `<input>` to an auto-expanding, multi-line `<textarea>` (supporting `Shift+Enter` for line breaks, `Enter` to send, and auto-resizing between 36px and 140px).
    - Updated `useEmojiInsertion` and `useQuickReplyAutocomplete` to target `HTMLTextAreaElement` and normalize line breaks upon insertion.
    - Enhanced `MessageMediaBody.tsx` to unescape literal `\n` sequences into native line breaks with CSS `whitespace-pre-wrap`.
    - Sanitized single-line preview in `QuickReplyDropdown.tsx` so multiline templates render cleanly in autocomplete suggestions.

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
  - _Damage_: Administrators attempting to open the availability toggle crashed the web application with a blank screen.
  - _Root Cause_: `AppShell.tsx` and availability normalization logic assumed `primary_department_id` is always a non-null string, failing when `null` for global admins.
  - _Resolution_: Added defensive null-safe guards and normalized empty fallback queues.
- **Frozen Balance Snapshot**:
  - _Damage_: Case balance remained frozen at initial intake values in the frontend.
  - _Resolution_: Subscribed to `case:updated` WebSocket events and integrated on-demand balance refresh.
- **Blind Diagnostic Error Banners**:
  - _Damage_: Diagnostic failures only rendered generic red error alerts without technical context.
  - _Resolution_: Implemented expandable milestone cards displaying optical telemetry, failed step descriptions, and OLT CLI traces.
- **Strict TypeScript Compliance & Zero Any Policy**:
  - _Damage_: 11 ESLint `no-explicit-any` errors in case panels and timelines blocked CI/CD pipelines.
  - _Resolution_: Replaced all `any` usages with discriminated unions, `ContractDto`, and `ExtendedContractCardItem`.

## [0.1.2] - 2026-10-16

### Added

- **AI Provider Settings UI**: Dynamic model selection dropdowns for Google Gemini and Ollama with cost and power tiers (Ultra Económico, Recomendado, Máxima Potencia).
- **Symmetric 2x2 Form Layout**: Harmonized layout across Gemini and Ollama with synchronized vector dimensions, badges, and manual input fallbacks.
- **API Key Security**: Masked credential input and live catalog fetching without plain-text exposure.
