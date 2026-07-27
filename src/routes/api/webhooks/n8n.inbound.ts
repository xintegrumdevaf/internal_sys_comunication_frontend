import { createFileRoute } from "@tanstack/react-router";
import { getContainer } from "@/core/composition/container";
import { inboundMessageSchema, toConversationDto, toMessageDto } from "@/adapters/http/dto";
import { errorToHttp } from "@/adapters/http/error-mapper";

/**
 * Driving adapter: n8n → Core
 * POST /api/webhooks/n8n/inbound
 */
export const Route = createFileRoute("/api/webhooks/n8n/inbound")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const json = await request.json();
          const parsed = inboundMessageSchema.safeParse(json);
          if (!parsed.success) {
            return Response.json(
              { error: "Invalid payload", details: parsed.error.flatten() },
              { status: 400 },
            );
          }

          const result = await getContainer().useCases.receiveInboundMessage.execute(
            parsed.data,
          );

          return Response.json(
            {
              ok: true,
              created: result.created,
              conversation: toConversationDto(result.conversation),
              message: toMessageDto(result.message),
            },
            { status: result.created ? 201 : 200 },
          );
        } catch (error) {
          return errorToHttp(error);
        }
      },
    },
  },
});
