/**
 * Hexagonal architecture map for NetOps Core.
 *
 * Layers:
 * - core/modules/{module}/domain      → entities and business rules (no frameworks)
 * - core/modules/{module}/application → use cases and ports (interfaces)
 * - core/composition                  → wires ports to adapters
 * - adapters                          → persistence, n8n, HTTP, UI bridges
 * - routes                            → TanStack UI and HTTP driving adapters
 *
 * External flow (API as hub):
 * Meta → POST /api/webhooks/whatsapp → Core (persist + UI) → POST n8n webhook (Meta change value[])
 * n8n → POST /api/webhooks/n8n/reply → Core → WhatsApp Cloud (AI reply)
 * n8n → POST /api/webhooks/n8n/inbound → ReceiveInboundMessageUseCase (optional enrich/ingest)
 */
export {};
