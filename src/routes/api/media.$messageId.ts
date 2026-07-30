import { createFileRoute } from "@tanstack/react-router";
import { WhatsAppCloudClient } from "@/adapters/whatsapp-cloud/client";
import { isWhatsAppCloudConfigured } from "@/adapters/whatsapp-cloud/config";
import { getContainer } from "@/core/composition/container";
import { asMessageId } from "@/core/shared/domain/ids";

/**
 * Proxy on-demand: GET /api/media/:messageId
 * Resolves stored mediaId → Graph temporary URL → binary stream.
 */
export const Route = createFileRoute("/api/media/$messageId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        if (!isWhatsAppCloudConfigured()) {
          return Response.json({ error: "not_configured" }, { status: 503 });
        }

        const messageId = params.messageId?.trim();
        if (!messageId) {
          return Response.json({ error: "missing_message_id" }, { status: 400 });
        }

        const message = await getContainer().messages.findById(
          asMessageId(messageId),
        );
        if (!message?.mediaId) {
          return Response.json({ error: "media_not_found" }, { status: 404 });
        }

        const client = new WhatsAppCloudClient();
        try {
          const meta = await client.getMediaUrl(message.mediaId);
          const file = await client.downloadMedia(meta.url);
          const contentType =
            message.mimeType || meta.mimeType || file.contentType;

          return new Response(file.bytes, {
            status: 200,
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "private, max-age=300",
            },
          });
        } catch (error) {
          console.error("[api/media] download failed", messageId, error);
          const msg =
            error instanceof Error ? error.message : "media_download_failed";
          const status = /not found|404/i.test(msg) ? 404 : 502;
          return Response.json({ error: msg }, { status });
        }
      },
    },
  },
});
