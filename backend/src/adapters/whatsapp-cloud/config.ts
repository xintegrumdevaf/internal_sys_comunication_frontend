export type WhatsAppCloudConfig = {
  accessToken: string;
  phoneNumberId: string;
  verifyToken: string;
  appSecret?: string;
  graphVersion: string;
  defaultDepartmentSlug: string;
  apiBase: string;
};

export function getWhatsAppCloudConfig(): WhatsAppCloudConfig | null {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN?.trim();

  if (!accessToken || !phoneNumberId || !verifyToken) {
    return null;
  }

  const graphVersion = process.env.WHATSAPP_GRAPH_VERSION?.trim() || "v21.0";

  return {
    accessToken,
    phoneNumberId,
    verifyToken,
    appSecret: process.env.WHATSAPP_APP_SECRET?.trim() || undefined,
    graphVersion,
    defaultDepartmentSlug:
      process.env.WHATSAPP_DEFAULT_DEPARTMENT_SLUG?.trim() || "soporte",
    apiBase: `https://graph.facebook.com/${graphVersion}`,
  };
}

export function isWhatsAppCloudConfigured(): boolean {
  return getWhatsAppCloudConfig() !== null;
}

/** E.164 / display → digits only for Graph API `to` field. */
export function toWhatsAppDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}
