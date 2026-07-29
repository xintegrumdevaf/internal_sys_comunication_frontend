import { createFileRoute } from "@tanstack/react-router";
import { getContainer } from "@/core/composition/container";
import { n8nReplySchema, toConversationDto, toMessageDto } from "@/adapters/http/dto";
import { errorToHttp } from "@/adapters/http/error-mapper";

/**
 * Driving adapter: n8n → Core → WhatsApp
 * POST /api/webhooks/n8n/reply
 *
 * Automated AI replies that continue the conversation flow.
 */
export const Route = createFileRoute("/api/webhooks/n8n/reply")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const json = await request.json();
          const parsed = n8nReplySchema.safeParse(json);
          if (!parsed.success) {
            return Response.json(
              { error: "Invalid payload", details: parsed.error.flatten() },
              { status: 400 },
            );
          }

          const result = await getContainer().useCases.sendAiOutboundReply.execute(
            parsed.data,
          );

          return Response.json(
            {
              ok: true,
              conversation: toConversationDto(result.conversation),
              message: toMessageDto(result.message),
              externalId: result.externalId,
            },
            { status: 201 },
          );
        } catch (error) {
          return errorToHttp(error);
        }
      },
    },
  },
});
