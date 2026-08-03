import { Router, Request, Response } from "express";
import { WhatsAppCloudClient } from "@/adapters/whatsapp-cloud/client";
import { isWhatsAppCloudConfigured } from "@/adapters/whatsapp-cloud/config";
import { getContainer } from "@/core/composition/container";
import { asMessageId } from "@/core/shared/domain/ids";

export const mediaRouter = Router();

/**
 * GET /api/media/:messageId
 * Resolves stored mediaId → Graph temporary URL → binary stream.
 */
mediaRouter.get("/:messageId", async (req: Request, res: Response) => {
  if (!isWhatsAppCloudConfigured()) {
    res.status(503).json({ error: "not_configured" });
    return;
  }

  const messageId = (req.params.messageId as string | undefined)?.trim();
  if (!messageId) {
    res.status(400).json({ error: "missing_message_id" });
    return;
  }

  const message = await getContainer().messages.findById(asMessageId(messageId));
  if (!message?.mediaId) {
    res.status(404).json({ error: "media_not_found" });
    return;
  }

  const client = new WhatsAppCloudClient();
  try {
    const meta = await client.getMediaUrl(message.mediaId);
    const file = await client.downloadMedia(meta.url);
    const contentType = message.mimeType || meta.mimeType || file.contentType;

    res.status(200).set({
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=300",
    }).send(Buffer.from(file.bytes));
  } catch (error) {
    console.error("[api/media] download failed", messageId, error);
    const msg = error instanceof Error ? error.message : "media_download_failed";
    const status = /not found|404/i.test(msg) ? 404 : 502;
    res.status(status).json({ error: msg });
  }
});
