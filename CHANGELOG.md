# Changelog

All notable changes to this project will be documented in this file.

## [0.2.12] - 2026-11-06

### Fixed & Code Quality

- **Estandarización de formato y resolución de errores bloqueantes de ESLint (`npm run format`, `npm run lint`)**:
  - _Contexto y Problema_: La ejecución de `npm run lint` (`eslint .`) fallaba con código de salida 1 reportando 50 errores, todos correspondientes a la regla `prettier/prettier`. Esto provocaba el fallo automático del pipeline de CI/CD (`.github/workflows/deploy.yml` -> job `test-and-lint`) antes de cualquier despliegue a los entornos de staging o producción.
  - _Causa Raíz_: La configuración del linter (`eslint.config.js`) incluye el plugin `eslint-plugin-prettier/recommended`, el cual promueve cualquier divergencia de estilo respecto a `.prettierrc` (indentación, saltos de línea, espaciado en llaves de importación, wrapping de operadores ternarios o líneas vacías al final de archivo) a nivel de error crítico (`error`). Con las últimas modificaciones en módulos de casos, chat interno, calidad, métricas y bandeja, se acumuló una discrepancia de formato en 17 archivos.
  - _Resolución_:
    1. Se ejecutó `npm run format` (`prettier --write .`) en todo el proyecto, reformateando los 17 archivos afectados bajo la configuración oficial y unificada de Prettier sin alterar ninguna regla de negocio ni tipos.
    2. Se verificó que `npm run lint` ahora finalice exitosamente con código de salida 0 (0 errores, 242 advertencias informativas no bloqueantes de límites de líneas y variables en desarrollo).
    3. Se verificó que el chequeo estático de TypeScript (`npm run typecheck` / `tsc --noEmit`) se mantenga limpio sin errores de tipo (0 errores).
    4. Se verificó que la suite completa de pruebas unitarias (`npm test` / Vitest) pase al 100% (74 archivos de prueba y 425 pruebas unitarias exitosas).
  - _Archivos normalizados_:
    - `src/modules/cases/ui/CasePanel.tsx`
    - `src/modules/cases/ui/CaseSummaryDialog.tsx`
    - `src/modules/conversations/ui/ChatHeader.tsx`
    - `src/modules/conversations/ui/ChatMessageItem.tsx`
    - `src/modules/conversations/ui/ChatSearchBar.tsx`
    - `src/modules/conversations/ui/OperationalInbox.tsx`
    - `src/modules/conversations/ui/use-preserved-list-scroll.test.tsx`
    - `src/modules/dashboard/ui/CircularGauge.tsx`
    - `src/modules/escalations/ui/EscalationsMetrics.tsx`
    - `src/modules/identity/ui/DepartmentsDirectoryPanel.tsx`
    - `src/modules/internal-chat/ui/QualityQuoteCard.tsx`
    - `src/modules/quality/infrastructure/quality.gateway.ts`
    - `src/modules/quality/ui/QualityFiltersBar.tsx`
    - `src/modules/quality/ui/QualityReviewDetail.tsx`
    - `src/modules/quality/ui/QualityReviewsTable.tsx`
    - `src/modules/quality/ui/QualityTimelineMessage.test.ts`
    - `src/modules/quality/ui/QualityTimelineMessage.tsx`
    - `docs/spec/04_ASSIGNMENT_MANAGEMENT.md`

## [0.2.11] - 2026-11-05

### Added

- **Mesa de Triaje y Rescate SLA (`EscalationsBoard.tsx`, `EscalationsMetrics.tsx`, `EscalationsTable.tsx`, `EscalationRowItem.tsx`, `use-escalations.ts`, `escalation.gateway.ts`, `escalation.ts`)**:
  - _Context_: The legacy escalations screen was a passive listing table that offered little operational value and lacked urgency cues or real-time distribution capabilities.
  - _Resolution_:
    1. **1-Click Auto-Drain / Paced Dispatch**: Added "⚡ Auto-distribuir cola" action button triggering `POST /api/escalations/drain`, evenly distributing queued escalations to available connected agents up to their concurrency limits.
    2. **Real-time SLA Alert Semaphores**: Embedded dynamic countdown badges for pending cases: `< 5m` Green (En SLA), `5-15m` Amber (Riesgo SLA), and `> 15m` Red pulsing (SLA Vencido).
    3. **AI Triage Isolation**: Added prominent visual badges and a dedicated 1-click filter button for cases where AI could not classify the customer's intent or area (`departmentId === null`).
    4. **Direct Row Actions**: Added instant "Atender" (claim case), direct deep-link to chat ("Chat" linking to `/bandeja?conversationId=...`), and AI diagnosis inspection ("Diagnóstico" opening `CaseSummaryDialog`).
    5. **Live Search & Pagination**: Integrated immediate multi-field search (customer name, phone, or reason) and configurable pagination (10, 20, 50 items per page).
    6. **Clean Code Decomposition**: Refactored the monolithic view into modular single-responsibility components (`EscalationsMetrics`, `EscalationsTable`, `EscalationRowItem`, `EscalationsBoard`), with all files under 170 lines (strict limit < 400).

- **Analytics Dashboard Overhaul for Non-Technical Managers (`BurnRateTrendChart.tsx`, `FcrQualityCard.tsx`, `RootCausesChart.tsx`, `AgentPerformanceTable.tsx`, `AgentPerformanceTableRow.tsx`)**:
  - _Context_: Managers reported chart clutter on date filters $\ge 30$ days, unreadable acronyms (FCR, FRT, AHT), duration bugs (378,946 seconds in average queue wait), lack of root cause drill-downs, and table overflowing without pagination.
  - _Resolution_:
    1. `BurnRateTrendChart`: Added view mode toggle (Area vs. Bars), auto-smoothing when filter range exceeds 14 days, and smart date interval spacing.
    2. `FcrQualityCard`: Replaced technical acronyms with clear business terminology ("Resolución al Primer Contacto y Reincidencias", "Tiempo Promedio de Cierre"). Replaced raw seconds with human-readable formats (`seg`, `min`, `h`, `días`).
    3. `RootCausesChart`: Removed internal scrollbar, and added interactive category drill-down: clicking an area bar dynamically isolates and breaks down that area's specific sub-reasons with local percentages.
    4. `AgentPerformanceTable`: Added live search, column sorting (`1ª Respuesta`, `Duración Media`, `Efectividad 48h`, `Cordialidad`), sanitized durations (`< 1 min`, `< 10s`), and client-side pagination (5/8/15/30 per page).

- **Dashboard Operational Upgrades (`CircularGauge.tsx`, `DepartmentSaturationGrid.tsx`, `AgentWorkloadMonitor.tsx`, `AgentWorkloadTableRow.tsx`, `OperationalKpiPulse.tsx`)**:
  - Replaced linear saturation bars with high-precision SVG circular gauges.
  - Added URL parameter preservation on department and queue shortcuts (`/bandeja?departmentId=...&status=QUEUED`) so filters persist after page reloads.
  - Added pagination and workload-based sorting to the advisor workload monitor.

### Changed

- **Removed Redundant "Carga de trabajo" (`access-control.ts`, `asignaciones.tsx`)**:
  - Removed `{ label: "Carga de trabajo", to: "/asignaciones" }` from the sidebar menu to eliminate confusion and redundancy with the Dashboard (`/`) and Bandeja (`/bandeja`).
  - Implemented `<Navigate to="/" replace />` in `src/routes/asignaciones.tsx` for seamless backward-compatible redirection.

## [0.2.10] - 2026-11-05

### Added

- **Unified Deep Search in Inbox: Customer Name & Historical Message Snippets (`OperationalInbox.tsx`, `ConversationListItem.tsx`, `conversation.ts`, `conversation.gateway.ts`, `use-operational-inbox.ts`)**:
  - _Context_: In the conversational inbox, typing a customer's name or surname (e.g. "PEREZ SIGUA") returned 0 results because the filter evaluated only `c.waPhone` and `c.lastMessagePreview.body`. Furthermore, searching for historical messages from past days or resolved cases was impossible without searching directly against the database.
  - _Resolution_:
    1. Implemented normalized in-memory search (`matchesConversationSearch`) matching diacritic-insensitively across customer name (`customerName`), WhatsApp profile name (`waProfileName`), display name, formatted/unformatted phone numbers (including Ecuador local `09...`), last message body, and assigned/attended agent.
    2. Connected a debounced (350ms) server query calling `GET /api/conversations/search` when the search query has 3 or more characters, surfacing conversations matching historical messages in PostgreSQL via the trigram GIN index.
    3. In `ConversationListItem.tsx`: displays an intuitive snippet badge (`🔍 Mensaje: "{body}"`) whenever a conversation matches on a message.
    4. In `use-operational-inbox.ts`: automatically loads and selects conversations found via deep search even if they were not initially present in the in-memory tab.

- **Visual Traceability for Case Closures (`CasePanel.tsx`, `ChatHeader.tsx`, `ConversationListItem.tsx`, `ChatComposer.tsx`)**:
  - _Context_: When inspecting resolved conversations, advisors and supervisors could not visually determine who closed the case, when it was closed, or what resolution notes were logged.
  - _Resolution_:
    1. In `CasePanel.tsx`: for terminal cases, displays explicit rows for "Cerrado por", "Motivo de cierre", "Fecha de cierre" (formatted local time), and "Nota de cierre".
    2. In `ChatHeader.tsx`: replaced ambiguous "Atendió {name}" badge with "Cerró {name}" when inspecting resolved conversations.
    3. In `ConversationListItem.tsx`: updated badge in resolved/closed lists to read "Cerró: {name}".
    4. In `ChatComposer.tsx`: disabled placeholder updated to "Caso completado por {name}".

- **Department Concurrent Capacity Configuration (`DepartmentsDirectoryPanel.tsx`, `types/department.ts`)**:
  - _Context_: Paced dispatch requires a configurable workload cap per department to prevent agent burnout when queued cases are drained.
  - _Resolution_: Added `maxConcurrentCases` field (number, range 1–50, default 6) to `Department`, `CreateDepartmentPayload`, and `UpdateDepartmentPayload`. Updated `DepartmentsDirectoryPanel` with an input field in the department creation/edit modal and an explicit "Capacidad" column in the directory table showing `{maxConcurrentCases} chats/asesor`.

## [0.2.9] - 2026-11-05

### Fixed

- **Inbox list jumped to the top when a new chat arrived (`OperationalInbox.tsx`, `use-preserved-list-scroll.ts`)**:
  - _Damage_: An agent scrolled down the conversation list and opened a chat. As soon as another chat arrived, the list snapped back to the first row. The open thread stayed put, but the agent had to search again for the row they were on.
  - _Root Cause_: Every inbound message reloads the inbox and reorders the list (newest first). The browser then drops the list's scroll offset to 0, so the viewport returns to the start of the queue.
  - _Resolution_: The list anchors to the first row that was actually visible. After a reload it restores that row to the same place. If the agent was already at the top, the list stays there so the new chat remains visible. Do not remove `data-conversation-id` from the row or `[overflow-anchor:none]` on the scroller; without them the browser and the anchor fight each other. See `docs/spec/02_MODULES.md` §7.

## [0.2.8] - 2026-11-05

### Fixed

- **Inbox chat column overflowed its card on narrow layouts (`OperationalInbox.tsx`, `ChatHeader.tsx`, `ChatMessageItem.tsx`, `WhatsAppAudioPlayer.tsx`, `MessageMediaBody.tsx`, `ChatComposer.tsx`, `AppShell.tsx`)**:
  - _Damage_: With a conversation open, the thread did not stay inside the chat card. Message bubbles, the voice-note waveform, the `1x` speed control and the side avatars painted past the right border. In the header, "Editar contacto" overlapped "Atendido por {agente}".
  - _Root Cause_: The inbox is a 12-column grid. Opening the details panel makes the thread `lg:col-span-5`, so on a laptop the column is about 300–450px while the viewport is still wide enough for `sm:` / `md:` styles. Those breakpoints follow the window, not the column, so the header kept the long labels. The voice-note player also reserved a hard width (`min-w-[140px]` plus 34 bars of `w-[3px]`), and grid/flex items default to `min-width: auto`, so the column grew to fit that content and spilled out of the card.
  - _Resolution_: The chat column is now a named container (`@container/chat`) and the grid items use `min-w-0`, so the column can shrink to its track. Header labels follow that container width: a narrow column shows the short agent name and an icon-only edit button, and the action row wraps instead of overlapping. Bubbles, media and the composer use `min-w-0` / `max-w-full` and long text breaks. The waveform is a 34-column grid (`minmax(0, 1fr)`) capped at 260px, so the bars shrink with the bubble. The shell content area also refuses horizontal overflow. Do not put those labels back on viewport `sm:` breakpoints or restore the fixed waveform width. See `docs/spec/02_MODULES.md` §6.

## [0.2.7] - 2026-11-05

### Fixed

- **WhatsApp voice notes only played after opening DevTools (`WhatsAppAudioPlayer.tsx`)**:
  - _Damage_: In the inbox, a voice note ignored repeated clicks on play. Nothing appeared to happen. As soon as the browser console was opened, the same note started and the Network panel showed a successful `GET /api/media?url=...`.
  - _Root Cause_: The API returns the whole file as `206 Partial Content` (`Content-Range` covering every byte, `Content-Type: audio/ogg`) with `Cache-Control: public, max-age=31536000, immutable`. CORS is valid. Chrome's media element requests that URL with a `Range` header, stores the 206, and later rejects `play()` with `NotSupportedError: The element has no supported sources` without issuing a new request. Opening DevTools disables the HTTP cache, so the next load hits the network and plays. A second bug made retries useless: on failure the player called `load()` and `play()` in the same turn, and every extra click aborted the reload that was in progress. A parallel `fetch` of the same URL (waveform peaks, without the session cookie) could also poison that cache entry.
  - _Resolution_: The player downloads the note itself with `fetch` (`credentials: "include"`, `cache: "no-store"`), builds an `audio/*` `Blob`, and plays a local `blob:` URL. The `<audio>` element no longer points at `/api/media` and no longer sends `crossOrigin`. Waveform peaks are decoded from that same blob. Extra clicks while a play attempt is in flight no longer call `load()`. Covered by `WhatsAppAudioPlayer.test.tsx`. Do not point `<audio src>` at the media API again; the cached 206 is what breaks playback. See `docs/spec/02_MODULES.md` §5.

## [0.2.6] - 2026-11-04

### Added

- **Multi-Contract Interactive Selector in Case Panel (`CasePanel.tsx`)**:
  - _Context & Damage_: When a client with multiple contracts (e.g. 2 services discovered via national ID in MikroTik/OLT) had a case open, the side panel (`CasePanel.tsx`) only displayed the contract selector if `customerContracts` existed on the PostgreSQL `Customer` entity. If contracts were discovered dynamically during workflow disambiguation (`pendingContracts` / `availableContracts`), selecting an option erased the candidate list, leaving the human agent without any button to view or toggle to Contract 2 when the client clarified _"No es el 2"_.
  - _Root Cause_: `CasePanel.tsx` only looked at `customerContracts` from the customer record, ignoring `availableContracts` and `pendingContracts` stored in the case context, and didn't fall back to context-discovered contracts when rendering the interactive pills.
  - _Resolution_: Implemented `effectiveContracts` in `CasePanel.tsx`, merging `customerContracts` with `caseDto.context.data.availableContracts` and `pendingContracts`. When multiple contracts are found in either customer data or workflow context, the interactive pill buttons (`#Contrato`, `Sector`) are rendered. Clicking any contract pill updates `activeContract` and immediately recalculates all displayed technical metadata (OLT, PON, Serial, Sector, MikroTik status).
- **Exact 12-Hour WhatsApp-Style Timestamps & Outbound Message Delivery Status (`datetime.ts`, `ConversationListItem.tsx`, `InternalChatShell.tsx`)**:
  - _Context & Damage_: Conversation lists displayed relative times (e.g. `1m`, `2h`, `1d`), preventing agents from knowing the exact time of messages at a glance, unlike WhatsApp Web which displays exact times (e.g. `3:30 p.m.`, `Ayer`, `Lunes`).
  - _Resolution_: Implemented `formatConversationTimestamp` in `src/shared/datetime.ts` with comprehensive unit tests (`datetime.test.ts`), and integrated it into `ConversationListItem.tsx` and `InternalChatShell.tsx` along with double-check icons (`CheckCheck`) for outbound message previews.

## [0.2.5] - 2026-11-04

### Added

- **Traffic Light (Semáforo) Score Filter (`QualityFiltersBar.tsx`)**:
  - Replaced the binary "Solo críticos" button with a 4-state visual traffic-light control:
    - `Todos`: Clears score bounds (`minScore: ""`, `maxScore: ""`).
    - `≥70 Cordiales`: Highlights high-performing cordial cases (`minScore: "70"`, `maxScore: ""`) with emerald badge.
    - `40–69 Atención`: Filters interactions requiring coaching or with delay observations (`minScore: "40"`, `maxScore: "69"`) with amber badge.
    - `<40 Críticos`: Isolates critical violations (`minScore: ""`, `maxScore: "39"`) with crimson badge and badge counter.
- **Timeline Multi-Agent Scope Isolation & Transfer Chips (`QualityReviewDetail.tsx`, `QualityTimelineMessage.tsx`)**:
  - _System & Transfer Event Chips_: System handover notices (e.g. `Caso transferido al área Traslados...`) are now rendered as centered system pills (`— Caso transferido ... —`) with `ArrowRightLeft` iconography, ending the confusion of transfer logs appearing as outgoing agent bubbles to the customer.
  - _Audited Agent vs Full Conversation Scope_: Added a toggle in the timeline header (`Solo [Agente Auditado]` vs `Conversación completa`) allowing supervisors to review solely the audited agent's interaction or inspect full multi-agent context.
  - _Distinct Styling for Secondary Agents & AI Bot_: Messages from previous/subsequent human agents are now styled with muted backgrounds and clear headers (`[Otro agente: Nombre] · Fuera del tramo auditado`), and bot messages are badged with `[Asistente IA]`.
  - _SLA Latency Visual Separators_: Time gaps between interactions exceeding 20 minutes now render a subtle chronological elapsed notice (`⏱ Transcurrieron 2h 58m`), visually separating response delay from message politeness.
  - _Nuanced Finding Highlights_: Inefficiency and delay findings now highlight with subtle amber borders rather than aggressive crimson red, reserving high-severity red highlights strictly for actual discourtesy, aggression, or misinformation.

## [0.2.4] - 2026-11-04

### Added

- **Quality Supervision UX & Modular Architecture (`QualityBoard.tsx`, `QualityReviewDetail.tsx`)**:
  - _Dynamic Loading State_: Integrated animated skeleton loaders in `StatCard` (`AppShell.tsx`), ranking table rows, and review table rows, replacing static `--` and blank screens with responsive loading state feedback.
  - _Unified UI Select Dropdowns_: Replaced native HTML `<select>` elements with customized Radix UI `Select` components (`QualityFiltersBar.tsx`) for Agent, Area, and Status filters with dark theme borders and chevrons.
  - _Direct Filter for Critical Chats_: Added a dedicated "Solo críticos" quick toggle button (`maxScore: 39`) with active badge counter, allowing supervisors to isolate critical conversations with 1 click.
  - _Bounded Scrolling & Client-Side Pagination_: Added container with bounded height (`max-h-[580px]`), sticky header, and client-side pagination (20 chats per page) with page navigation controls, preventing infinite scrolling over 370+ rows.
  - _Actionable Audit Column_: Transformed the empty dash `—` in the "Acción" column into an explicit "Auditar" button (`Eye` icon) that directly opens the conversation review.
  - _Structured Detail View_: Extracted `QualitySummaryCard.tsx` featuring prominent Critical Infraction Alert Banners, context media highlights, formatted pedagogical coaching recommendations, and deduplicated efficiency cards.
  - _Clean Code Decomposition_: Decomposed the 465-line `QualityBoard.tsx` into 4 focused subcomponents (`QualityStatsCards.tsx`, `QualityFiltersBar.tsx`, `QualityRankingTable.tsx`, `QualityReviewsTable.tsx`), with each file under 260 lines.
- **Clean Code & Modular Decomposition of Operational Inbox (`OperationalInbox.tsx`)**:
  - _Context_: `OperationalInbox.tsx` had grown into a 2,772-line monolithic component violating Clean Code standards (target 300–400 lines max per module) and mixing rendering concerns of tabs, list items, headers, messages, composer, and search bars.
  - _Refactoring_: Decomposed into 7 focused, single-responsibility subcomponents located under `src/modules/conversations/ui/`:
    - `InboxStatusTabs.tsx` (214 lines): Category status filters with tooltips and glossary popover.
    - `ConversationListItem.tsx` (248 lines): Sidebar conversation item rendering, SLA timers, WhatsApp-style unread badges.
    - `ChatHeader.tsx` (247 lines): Active conversation header, customer metadata, contact details toggle, manual agent claim/transfer triggers.
    - `ChatSearchBar.tsx` (90 lines): In-chat message keyword search bar with match counter and navigation.
    - `ChatMessageItem.tsx` (177 lines): WhatsApp-styled message bubbles with author avatar, media content, delivery status ticks, and 24h Meta error handling.
    - `ChatComposer.tsx` (365 lines): WhatsApp-like auto-expanding message composer, clip popover attachment menu, emoji picker, and circular send button.
    - `ConversationAvatars.tsx` (72 lines) & `delivery-error.ts` (41 lines): Avatar initials generator and error code formatting helper.
  - _Result_: Shrunk `OperationalInbox.tsx` by over 1,020 lines (down to 1,746 lines) with identical visual fidelity and user experience, passing 71 test files (394 tests) and production Vite build with 0 TypeScript errors.
- **Strict ESLint Clean Code Governance (`eslint.config.js`)**:
  - Configured rules to uphold architectural discipline across all modules:
    - `max-lines`: Warns on files exceeding 400 lines (ignoring comments/whitespace), identifying refactoring targets.
    - `@typescript-eslint/no-explicit-any`: Enforces type safety across application components.
    - `@typescript-eslint/no-unused-vars`: Eliminates dead code and unused imports.
    - `@typescript-eslint/consistent-type-imports`: Enforces explicit `type` imports for cleaner bundler optimization.
    - `no-console`, `no-debugger`, `no-duplicate-imports`: Prohibits stray debuggers, console logs, and duplicate import statements.

## [0.2.3] - 2026-11-04

### Added

- **Dropdown UI Component Standardization (`OperationalInbox.tsx`)**:
  - Replaced native HTML `<select>` elements for Área and Agente with Shadcn / Radix UI `Select` components (`SelectTrigger`, `SelectContent`, `SelectItem`), providing unified borders, chevron icons, and popover rendering consistent with `NetworkSettingsCard.tsx`.
- **Status Tabs Tooltips & Interactive Status Guide (`OperationalInbox.tsx`)**:
  - Added Radix Tooltips with contextual hints and descriptions to all 6 filter tabs (`Abiertas`, `En cola`, `Demoradas`, `En espera`, `Resueltas`, `Cerradas`).
  - Added an interactive `(i)` Popover guide button explaining conversation progression across states and clarifying the operational difference between `Resuelta` (resolved by agent, pending client confirmation, re-activatable on client reply) and `Cerrada` (definitively archived).
- **WhatsApp-Style Unread Conversation Indicators (`OperationalInbox.tsx`, `AppShell.tsx`)**:
  - Redesigned unread conversation markers in the operational inbox to match WhatsApp Web layout and aesthetics.
  - Removed overlapping red badges from customer avatars, keeping avatar circles clean and uncluttered.
  - Positioned the unread badge on the right column beneath the timestamp, styled in iconic WhatsApp green (`#25D366` / `#00a884`) with white bold typography in a rounded pill/circle.
  - Highlights timestamp in WhatsApp green and renders the latest message preview in bolder, high-contrast typography when unread messages are pending.
  - Updated the "Conversaciones" sidebar navigation badge to WhatsApp green for visual consistency.
- **WhatsApp Web Search Bar & Unified Header Strip (`OperationalInbox.tsx`)**:
  - Repositioned conversation search input from the global top header directly into the conversation list column, perfectly sized to the sidebar (~380px) with dedicated clear button (`X`), matching WhatsApp Web.
  - Consolidated the top filter bar into a single streamlined row for category tabs and operational filters (Área, Agente, SLA alerts, WhatsApp Sync), eliminating awkward stretching on wide screens and freeing up vertical real estate for chats.

### Fixed

- **Redundant "En vivo" Realtime Indicator in List Header (`OperationalInbox.tsx`)**:
  - _Damage_: The interface displayed two identical "En vivo" badges simultaneously (one in the global AppShell header and one in the conversation list header), causing confusion.
  - _Root Cause_: Both components independently rendered positive connection status badges from `useRealtimeConnected()`.
  - _Resolution_: Removed the duplicate badge from `OperationalInbox.tsx`, keeping the global indicator in `AppShell.tsx` and displaying only an amber reconnecting warning (`Reconectando…`) when offline.
- **Unread Badge Displaying 99+ for Low-Volume Inboxes (`unread.state.ts`, `use-operational-inbox.ts`, `use-realtime.ts`)**:
  - _Damage_: The sidebar badge and operational inbox displayed `99+` even when only 2 or 3 conversations were pending.
  - _Root Cause_: The badge was calculating `reduce((acc, c) => acc + c.unreadCount, 0)`, summing all historical unread message bubbles across conversations, and `use-realtime` incremented by +1 for every raw incoming message.
  - _Resolution_: Migrated unread tracking to a reactive Set of unique open conversation IDs (`Set<string>`), properly counting conversations awaiting response without inflating on multiple messages per chat.
  - Added comprehensive test suite in `unread.state.test.ts` (5 unit tests).

## [0.2.2] - 2026-10-30

### Added

- **WhatsApp Web Chat Input Redesign & UX Optimization (`OperationalInbox.tsx`, `EmojiPickerPopover.tsx`)**:
  - Replaced the wide text pill button (`Enviar`) with WhatsApp's iconic circular emerald send button (`#00a884`) featuring `SendHorizontal`, saving horizontal real estate.
  - Standardized all chat action buttons (Paperclip, Emoji picker, and Send) to uniform 40px × 40px circular touch targets with matching 20px icons (`size-5`), creating visual harmony and alignment.
  - Consolidated scattered action buttons into a sleek popover menu triggered by a WhatsApp-style clip icon (`Paperclip`), keeping only the Clip and Sticker/Emoji selectors in the main bar while neatly grouping "Plantilla de WhatsApp" and "Respuestas rápidas" inside the popover.
  - Implemented reactive auto-expanding textarea (`min-h-[40px] max-h-[140px]`, 14px typography, `leading-5`) that dynamically calculates content height and keeps `overflow-y: hidden` until max height is exceeded, completely eliminating accidental scrollbars while preserving multiline readability.
  - Set concise, clear placeholder with quick replies autocomplete indicator: `"Escribe un mensaje... o '/' para respuestas rápidas"`.
  - Added click-outside listener to automatically dismiss the clip popover menu when clicking anywhere else.
- **In-Chat Message Search & History Pagination (`OperationalInbox.tsx`, `use-operational-inbox.ts`)**:
  - Integrated interactive in-chat search bar triggered via `Ctrl+F` / `Cmd+F` or search icon, featuring match counter (`X / Y`), up/down navigation, and auto-scrolling to matched bubbles.
  - Implemented cursor-based backward message pagination (`loadOlderMessages`, `MESSAGES_PAGE_SIZE = 50`) and deep-search resolution (`loadUntilFound`) to seamlessly retrieve historical messages on demand.
- **Direct Case Transfer by Department & Agent (`CasePanel.tsx`, `use-case-actions.ts`, `case.gateway.ts`)**:
  - Extended case transfer workflow allowing operators to reassign a ticket directly to a specific target agent (`toAgentId`) alongside the destination department.
  - Updated transfer API gateway payload and hook signatures to support optional `toAgentId`.
- **Individual Agent Attribution & Inline System Event Chips (`OperationalInbox.tsx`, `conversation.ts`)**:
  - Added per-message agent attribution (`messageAgentName`) to message bubbles and avatars, distinguishing between AI assistant responses and specific human staff members.
  - Implemented centered inline system event pills (`Info` icon) for tracking case lifecycle milestones (reassignments, transfers, state transitions) directly in the chat feed.
- **Resizable Quick Reply Modal (`QuickReplyFormModal.tsx`)**:
  - Added interactive drag-to-resize handle (`GripHorizontal`) and expand/minimize toggle (`Maximize2` / `Minimize2`) for convenient editing of long templates.
- **Error Diagnostics & WhatsApp Channel Testing (`__root.tsx`, `WhatsAppChannelsCard.tsx`, `settings.api.ts`)**:
  - Enriched global `ErrorComponent` with a monospaced diagnostics panel displaying `error.name`, `error.message`, and full scrollable stack traces.
  - Added fallback detection for `targetAccountId` when validating WhatsApp channel connections.
  - Hardened `settings.api.ts` with strict TypeScript return typing and error propagation for network topology import/export.
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
