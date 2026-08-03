import { Router, Request, Response } from "express";
import { N8nWebhookClient } from "@/adapters/n8n/client";
import { WhatsAppCloudClient } from "@/adapters/whatsapp-cloud/client";
import {
  getWhatsAppCloudConfig,
  isWhatsAppCloudConfigured,
} from "@/adapters/whatsapp-cloud/config";
import {
  enrichMetaChangesWithHubMedia,
  extractMetaChangesForN8n,
  inferDepartmentSlugFromText,
  parseInboundWhatsAppWebhook,
  verifyMetaSignature,
  verifyMetaWebhookChallenge,
} from "@/adapters/whatsapp-cloud/webhook";
import { getContainer } from "@/core/composition/container";
import {
  inboundMessageSchema,
  n8nReplySchema,
  toConversationDto,
  toMessageDto,
} from "@/adapters/http/dto";
import { errorToHttp } from "@/adapters/http/error-mapper";

export const webhooksRouter = Router();

/**
 * GET /api/webhooks/whatsapp → verification challenge
 */
webhooksRouter.get("/whatsapp", (req: Request, res: Response) => {
  if (!isWhatsAppCloudConfigured()) {
    res.status(503).send("WhatsApp Cloud API not configured");
    return;
  }

  const challenge = verifyMetaWebhookChallenge({
    mode: (req.query["hub.mode"] as string) ?? null,
    token: (req.query["hub.verify_token"] as string) ?? null,
    challenge: (req.query["hub.challenge"] as string) ?? null,
  });

  if (challenge == null) {
    res.status(403).send("Forbidden");
    return;
  }

  res.status(200).type("text/plain").send(challenge);
});

/**
 * POST /api/webhooks/whatsapp → inbound messages
 */
webhooksRouter.post("/whatsapp", async (req: Request, res: Response) => {
  if (!isWhatsAppCloudConfigured()) {
    res.status(503).json({ error: "not_configured" });
    return;
  }

  const rawBody = (req as Request & { rawBody?: string }).rawBody ?? JSON.stringify(req.body);
  const signature = (req.headers["x-hub-signature-256"] as string | undefined) ?? null;

  if (!verifyMetaSignature(rawBody, signature)) {
    res.status(401).json({ error: "invalid_signature" });
    return;
  }

  const json = req.body;
  const config = getWhatsAppCloudConfig()!;
  const inbound = parseInboundWhatsAppWebhook(json);
  const container = getContainer();
  const client = new WhatsAppCloudClient();
  const n8n = new N8nWebhookClient();
  const accepted: string[] = [];
  const waToHubMessageId = new Map<string, string>();

  if (inbound.length === 0) {
    console.info("[whatsapp webhook] no inbound messages in payload (likely status update)");
    res.json({ ok: true, accepted: 0, reason: "no_inbound_messages" });
    return;
  }

  for (const msg of inbound) {
    const departmentSlug = inferDepartmentSlugFromText(msg.body, config.defaultDepartmentSlug);

    try {
      const result = await container.useCases.receiveInboundMessage.execute({
        waPhone: msg.waPhone,
        body: msg.body,
        departmentSlug,
        waMessageId: msg.waMessageId,
        customerName: msg.customerName,
        intent: departmentSlug,
        type: msg.type,
        mediaId: msg.mediaId,
        mimeType: msg.mimeType,
        caption: msg.caption,
        filename: msg.filename,
      });
      accepted.push(result.message.id);
      waToHubMessageId.set(msg.waMessageId, result.message.id);
      console.info(
        "[whatsapp webhook] ingested",
        msg.waPhone,
        "→",
        departmentSlug,
        msg.type,
        msg.body.slice(0, 80),
      );
      void client.markRead(msg.waMessageId);
    } catch (error) {
      console.error("[whatsapp webhook] failed to ingest", msg.waMessageId, error);
    }
  }

  if (accepted.length > 0) {
    const publicBaseUrl = process.env.APP_PUBLIC_URL?.trim();
    const changes = enrichMetaChangesWithHubMedia(
      extractMetaChangesForN8n(json),
      waToHubMessageId,
      publicBaseUrl,
    );
    n8n.scheduleForwardInbound(changes);
  }

  res.json({ ok: true, accepted: accepted.length });
});

/**
 * POST /api/webhooks/n8n/inbound
 */
webhooksRouter.post("/n8n/inbound", async (req: Request, res: Response) => {
  try {
    const parsed = inboundMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
      return;
    }

    const result = await getContainer().useCases.receiveInboundMessage.execute(parsed.data);
    res.status(result.created ? 201 : 200).json({
      ok: true,
      created: result.created,
      conversation: toConversationDto(result.conversation),
      message: toMessageDto(result.message),
    });
  } catch (error) {
    const errRes = errorToHttp(error);
    const body = await errRes.json();
    res.status(errRes.status).json(body);
  }
});

/**
 * POST /api/webhooks/n8n/reply
 */
webhooksRouter.post("/n8n/reply", async (req: Request, res: Response) => {
  try {
    const parsed = n8nReplySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
      return;
    }

    const result = await getContainer().useCases.sendAiOutboundReply.execute(parsed.data);
    res.status(201).json({
      ok: true,
      conversation: toConversationDto(result.conversation),
      message: toMessageDto(result.message),
      externalId: result.externalId,
    });
  } catch (error) {
    const errRes = errorToHttp(error);
    const body = await errRes.json();
    res.status(errRes.status).json(body);
  }
});
