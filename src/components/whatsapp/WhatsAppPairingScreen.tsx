import { Laptop, RefreshCw, Smartphone } from "lucide-react";
import {
  completeWhatsAppPairing,
  refreshPairingCode,
  startWhatsAppPairing,
  type WaLinkedSession,
} from "@/lib/whatsapp-link";
import { WhatsAppQrCode } from "./WhatsAppQrCode";

export function WhatsAppPairingScreen({
  session,
  onLinked,
}: {
  session: WaLinkedSession;
  onLinked?: () => void;
}) {
  const waiting = session.status === "waiting_scan" || session.status === "unlinked";

  return (
    <div className="min-h-[720px] rounded-xl overflow-hidden border border-[#d1d7db] bg-[#f0f2f5] flex flex-col shadow-sm">
      <header className="h-16 bg-[#00a884] text-white flex items-center px-6 gap-3 shrink-0">
        <div className="size-9 rounded-full bg-white/20 grid place-items-center">
          <Laptop className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-wide">WhatsApp Web · NetOps</p>
          <p className="text-[11px] text-white/80">Vincula tu número con el código QR</p>
        </div>
      </header>

      <div className="flex-1 grid lg:grid-cols-2 gap-0">
        <div className="p-8 lg:p-12 flex flex-col justify-center gap-6 border-b lg:border-b-0 lg:border-r border-[#d1d7db] bg-white">
          <div>
            <h2 className="text-2xl font-light text-[#41525d]">Pasos para vincular</h2>
            <ol className="mt-5 space-y-4 text-sm text-[#3b4a54]">
              <li className="flex gap-3">
                <span className="size-6 rounded-full bg-[#00a884] text-white text-xs grid place-items-center font-bold shrink-0">
                  1
                </span>
                Abre WhatsApp en tu teléfono.
              </li>
              <li className="flex gap-3">
                <span className="size-6 rounded-full bg-[#00a884] text-white text-xs grid place-items-center font-bold shrink-0">
                  2
                </span>
                Toca Menú (Android) o Ajustes (iPhone) y selecciona{" "}
                <strong>Dispositivos vinculados</strong>.
              </li>
              <li className="flex gap-3">
                <span className="size-6 rounded-full bg-[#00a884] text-white text-xs grid place-items-center font-bold shrink-0">
                  3
                </span>
                Toca <strong>Vincular un dispositivo</strong> y apunta al QR.
              </li>
            </ol>
          </div>

          <div className="rounded-lg bg-[#f0f2f5] p-4 text-[12px] text-[#667781] leading-relaxed">
            Simulación operativa: el QR contiene un código de emparejamiento NetOps. En producción
            este challenge lo emite el proveedor (Meta / BSP) y n8n confirma el webhook.
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => startWhatsAppPairing()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00a884] text-white text-xs font-semibold hover:bg-[#008f72]"
            >
              <Smartphone className="size-3.5" />
              Mostrar QR
            </button>
            <button
              type="button"
              onClick={() => refreshPairingCode()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#d1d7db] text-[#3b4a54] text-xs font-semibold hover:bg-[#f0f2f5]"
            >
              <RefreshCw className="size-3.5" />
              Renovar código
            </button>
          </div>
        </div>

        <div className="p-8 lg:p-12 flex flex-col items-center justify-center gap-5 bg-[#e5ddd5]/[background-image:radial-gradient(#0000000d_1px,transparent_1px)] [background-size:18px_18px]">
          <div className="bg-white p-4 rounded-lg shadow-md relative">
            <WhatsAppQrCode session={session} size={240} />
            {!waiting && null}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#111b21] text-white text-[10px] font-mono tracking-widest">
              {session.pairingCode}
            </div>
          </div>

          <p className="text-xs text-[#667781] text-center max-w-xs mt-2">
            Escanea este código con WhatsApp para vincular{" "}
            <span className="font-semibold text-[#111b21]">la línea operativa</span>.
          </p>

          <button
            type="button"
            onClick={() => {
              completeWhatsAppPairing();
              onLinked?.();
            }}
            className="mt-2 px-5 py-2.5 rounded-full bg-[#008069] text-white text-sm font-semibold shadow hover:bg-[#006e5a]"
          >
            Simular escaneo del teléfono
          </button>
        </div>
      </div>
    </div>
  );
}
