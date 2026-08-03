import assert from "node:assert/strict";

process.env.VITE_API_BASE_URL = "http://localhost:3000/";

const { resolveWhatsAppWebhookUrl } = await import("./whatsapp-webhook-url.ts");

const webhookPath = "/api/webhooks/whatsapp";

assert.equal(
  resolveWhatsAppWebhookUrl({
    publicWebhookUrl: "https://public.example/api/webhooks/whatsapp",
    appPublicUrl: "https://ignored.example",
    webhookPath,
  }),
  "https://public.example/api/webhooks/whatsapp",
);
assert.equal(
  resolveWhatsAppWebhookUrl({
    publicWebhookUrl: null,
    appPublicUrl: "https://tunnel.example/",
    webhookPath,
  }),
  "https://tunnel.example/api/webhooks/whatsapp",
);
assert.equal(
  resolveWhatsAppWebhookUrl({
    publicWebhookUrl: null,
    appPublicUrl: null,
    webhookPath,
  }),
  "http://localhost:3000/api/webhooks/whatsapp",
);

console.log("whatsapp webhook URL checks passed");
