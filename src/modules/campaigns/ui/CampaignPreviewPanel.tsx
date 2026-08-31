import React from 'react';
import { CheckCheck, Phone, Video, Eye } from 'lucide-react';

type CampaignPreviewPanelProps = {
  messageText: string;
  name?: string;
};

export const CampaignPreviewPanel: React.FC<CampaignPreviewPanelProps> = ({
  messageText,
  name,
}) => {
  const formatWhatsAppText = (text: string): React.ReactNode[] => {
    if (!text || !text.trim()) {
      return [
        <span key="empty" className="text-slate-400 italic">
          Tu mensaje aparecerá aquí.
        </span>,
      ];
    }

    const processed = text
      .replace(/\{\{name\}\}/gi, 'Carlos Pérez')
      .replace(/\{\{nombre\}\}/gi, 'Carlos Pérez')
      .replace(/\{\{number\}\}/gi, '+57 300 123 4567')
      .replace(/\{\{telefono\}\}/gi, '+57 300 123 4567')
      .replace(/\{\{celular\}\}/gi, '+57 300 123 4567');

    const lines = processed.split('\n');
    return lines.map((line, lineIdx) => {
      const parts = line.split(/(\*[^*]+\*|_[^_]+_|~[^~]+~)/g);
      return (
        <React.Fragment key={lineIdx}>
          {parts.map((part, partIdx) => {
            if (part.startsWith('*') && part.endsWith('*')) {
              return <strong key={partIdx}>{part.slice(1, -1)}</strong>;
            }
            if (part.startsWith('_') && part.endsWith('_')) {
              return <em key={partIdx}>{part.slice(1, -1)}</em>;
            }
            if (part.startsWith('~') && part.endsWith('~')) {
              return <del key={partIdx}>{part.slice(1, -1)}</del>;
            }
            return part;
          })}
          {lineIdx < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  const currentTime = new Date().toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div className="flex flex-col h-full rounded-2xl border border-border/80 bg-[#0b141a] overflow-hidden shadow-xl select-none font-sans">
      {/* Header bar matching Whaticket screenshot */}
      <div className="bg-[#128c7e] text-white px-3.5 py-2.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-700/80 border border-white/20 flex items-center justify-center font-bold text-xs text-white">
            <span className="text-white">C</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold leading-tight text-white">Contacto de ejemplo</span>
            <span className="text-[10px] text-emerald-100 font-medium">en línea</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-white/80">
          <Video className="w-4 h-4 cursor-pointer hover:text-white" />
          <Phone className="w-4 h-4 cursor-pointer hover:text-white" />
        </div>
      </div>

      {/* Title preview badge */}
      <div className="bg-[#1f2c34] px-3 py-1.5 border-b border-white/5 flex items-center gap-1.5 text-[11px] text-[#8696a0]">
        <Eye className="w-3.5 h-3.5 text-emerald-400" />
        <span className="font-semibold uppercase tracking-wider text-[10px]">Vista previa</span>
        {name && <span className="truncate text-slate-300 ml-1">({name})</span>}
      </div>

      {/* Chat Canvas with WhatsApp Wallpaper */}
      <div
        className="flex-1 p-4 flex flex-col justify-end min-h-[280px] relative"
        style={{
          backgroundColor: '#0b141a',
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 0)',
          backgroundSize: '16px 16px',
        }}
      >
        {/* Date separator pill */}
        <div className="self-center my-2 px-3 py-0.5 rounded-md bg-[#182229] text-[10px] text-[#8696a0] font-medium shadow-sm border border-white/5">
          Hoy
        </div>

        {/* Outgoing Message Bubble */}
        <div className="max-w-[88%] self-end bg-[#005c4b] text-slate-100 rounded-lg rounded-tr-none p-3 text-xs leading-relaxed shadow-md relative border border-emerald-400/20">
          <div className="whitespace-pre-wrap break-words text-[12.5px] text-slate-50">
            {formatWhatsAppText(messageText)}
          </div>
          <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-emerald-200/70 font-mono">
            <span>{currentTime}</span>
            <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
          </div>
        </div>
      </div>

      {/* Footnote caption matching Whaticket */}
      <div className="bg-[#1f2c34] p-2.5 text-[10px] text-[#8696a0] text-center border-t border-white/5 leading-tight">
        Las variables aparecen como marcadores; el valor real se sustituye en el momento del envío.
      </div>
    </div>
  );
};
