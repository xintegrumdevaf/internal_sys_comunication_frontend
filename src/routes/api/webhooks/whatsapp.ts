import { createFileRoute } from "@tanstack/react-router";
import { N8nWebhookClient } from "@/adapters/n8n/client";
import { WhatsAppCloudClient } from "@/adapters/whatsapp-cloud/client";
import {
  getWhatsAppCloudConfig,
  isWhatsAppCloudConfigured,
} from "@/adapters/whatsapp-cloud/config";
import {
  extractMetaChangesForN8n,
  inferDepartmentSlugFromText,
  parseInboundWhatsAppWebhook,
  verifyMetaSignature,
  verifyMetaWebhookChallenge,
} from "@/adapters/whatsapp-cloud/webhook";
import { getContainer } from "@/core/composition/container";

/**
 * Meta WhatsApp Cloud API webhook
 * GET  /api/webhooks/whatsapp  → verification challenge
 * POST /api/webhooks/whatsapp  → inbound messages
 */
export const Route = createFileRoute("/api/webhooks/whatsapp")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isWhatsAppCloudConfigured()) {
          return new Response("WhatsApp Cloud API not configured", { status: 503 });
        }

        const url = new URL(request.url);
        const challenge = verifyMetaWebhookChallenge({
          mode: url.searchParams.get("hub.mode"),
          token: url.searchParams.get("hub.verify_token"),
          challenge: url.searchParams.get("hub.challenge"),
        });

        if (challenge == null) {
          return new Response("Forbidden", { status: 403 });
        }

        return new Response(challenge, {
          status: 200,
          headers: { "Content-Type": "text/plain" },
        });
      },

      POST: async ({ request }) => {
        if (!isWhatsAppCloudConfigured()) {
          return Response.json({ error: "not_configured" }, { status: 503 });
        }

        const rawBody = await request.text();
        const signature = request.headers.get("x-hub-signature-256");
        if (!verifyMetaSignature(rawBody, signature)) {
          return Response.json({ error: "invalid_signature" }, { status: 401 });
        }

        let json: unknown;
        try {
          json = JSON.parse(rawBody);
        } catch {
          return Response.json({ error: "invalid_json" }, { status: 400 });
        }

        const config = getWhatsAppCloudConfig()!;
        const inbound = parseInboundWhatsAppWebhook(json);
        const container = getContainer();
        const client = new WhatsAppCloudClient();
        const n8n = new N8nWebhookClient();
        const accepted: string[] = [];

        // Meta also POSTs delivery/read statuses under field "messages" without `messages[]`.
        if (inbound.length === 0) {
          console.info(
            "[whatsapp webhook] no inbound messages in payload (likely status update)",
          );
          return Response.json({ ok: true, accepted: 0, reason: "no_inbound_messages" });
        }

        for (const msg of inbound) {
          const departmentSlug = inferDepartmentSlugFromText(
            msg.body,
            config.defaultDepartmentSlug,
          );

          try {
            const result = await container.useCases.receiveInboundMessage.execute({
              waPhone: msg.waPhone,
              body: msg.body,
              departmentSlug,
              waMessageId: msg.waMessageId,
              customerName: msg.customerName,
              intent: departmentSlug,
            });
            accepted.push(result.message.id);
            console.info(
              "[whatsapp webhook] ingested",
              msg.waPhone,
              "→",
              departmentSlug,
              msg.body.slice(0, 80),
            );
            void client.markRead(msg.waMessageId);
          } catch (error) {
            console.error("[whatsapp webhook] failed to ingest", msg.waMessageId, error);
          }
        }

        // Hub → n8n: forward Meta-shaped changes (not Hub-normalized events)
        if (accepted.length > 0) {
          n8n.scheduleForwardInbound(extractMetaChangesForN8n(json));
        }

        return Response.json({ ok: true, accepted: accepted.length });
      },
    },
  },
});
