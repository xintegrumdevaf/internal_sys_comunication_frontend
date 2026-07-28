import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { getWhatsAppPairPayload, type WaLinkedSession } from "@/lib/whatsapp-link";

export function WhatsAppQrCode({
  session,
  size = 256,
}: {
  session: WaLinkedSession;
  size?: number;
}) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    void QRCode.toDataURL(getWhatsAppPairPayload(session), {
      width: size,
      margin: 2,
      color: { dark: "#111b21", light: "#ffffff" },
      errorCorrectionLevel: "M",
    }).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [session.pairingCode, size, session]);

  if (!dataUrl) {
    return (
      <div
        className="bg-white grid place-items-center text-xs text-[#667781]"
        style={{ width: size, height: size }}
      >
        Generando QR…
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt={`Código QR de vinculación ${session.pairingCode}`}
      width={size}
      height={size}
      className="block rounded-sm"
    />
  );
}
