import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Play, Pause, Loader2, User, Bot, UserCheck } from "lucide-react";
import type { MessageAuthor } from "@/modules/conversations/domain/conversation";

type WhatsAppAudioPlayerProps = {
  mediaUrl: string;
  messageId?: string;
  author?: MessageAuthor;
  senderName?: string;
  avatarUrl?: string;
  className?: string;
};

/**
 * Formatea segundos a cadenas de tiempo m:ss (ej: 0:15, 1:04)
 */
function formatAudioTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Genera un conjunto determinista de barras de forma de onda (waveform) basándose en una semilla.
 * Garantiza un aspecto visual idéntico al de notas de voz reales de WhatsApp al instante.
 */
function generateDeterministicPeaks(seed: string, count: number = 34): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }

  const peaks: number[] = [];
  for (let i = 0; i < count; i++) {
    // Generar una envolvente natural de voz (curva suave con variaciones dinámicas)
    const normalizedPos = i / (count - 1);
    const envelope = Math.sin(normalizedPos * Math.PI); // Arco de volumen en voz
    const pseudoRand = Math.abs(Math.sin((hash + i * 37) * 9999));
    const heightRatio = 0.2 + 0.8 * (0.35 * envelope + 0.65 * pseudoRand);
    peaks.push(Number(heightRatio.toFixed(2)));
  }
  return peaks;
}

/**
 * Intenta extraer los picos reales del archivo de audio usando Web Audio API.
 */
async function extractAudioPeaks(url: string, count: number = 34): Promise<number[] | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;

    const audioCtx = new AudioContextClass();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0);
    const blockSize = Math.floor(channelData.length / count);
    const peaks: number[] = [];

    for (let i = 0; i < count; i++) {
      const start = i * blockSize;
      let max = 0;
      for (let j = 0; j < blockSize; j += 12) {
        const val = Math.abs(channelData[start + j] || 0);
        if (val > max) max = val;
      }
      peaks.push(max);
    }

    const maxPeak = Math.max(...peaks, 0.01);
    const normalized = peaks.map((p) => Math.max(0.18, Math.min(1.0, p / maxPeak)));
    await audioCtx.close();
    return normalized;
  } catch {
    return null;
  }
}

export function WhatsAppAudioPlayer({
  mediaUrl,
  messageId = "",
  author = "customer",
  senderName,
  avatarUrl,
  className = "",
}: WhatsAppAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);
  const [isSeeking, setIsSeeking] = useState(false);

  const barCount = 34;
  const [realPeaks, setRealPeaks] = useState<number[] | null>(null);

  // Semilla de waveform previa determinista
  const defaultPeaks = useMemo(
    () => generateDeterministicPeaks(messageId || mediaUrl || "audio", barCount),
    [messageId, mediaUrl],
  );

  const peaks = realPeaks || defaultPeaks;

  // Intento de extracción de forma de onda real vía WebAudio
  useEffect(() => {
    let isCancelled = false;
    if (mediaUrl) {
      extractAudioPeaks(mediaUrl, barCount).then((extracted) => {
        if (!isCancelled && extracted && extracted.length === barCount) {
          setRealPeaks(extracted);
        }
      });
    }
    return () => {
      isCancelled = true;
    };
  }, [mediaUrl]);

  // Detener este audio si se reproduce otro audio en la app (comportamiento WhatsApp)
  useEffect(() => {
    const handleGlobalAudioPlay = (e: Event) => {
      const customEvent = e as CustomEvent<{ mediaUrl: string }>;
      if (customEvent.detail?.mediaUrl !== mediaUrl && isPlaying) {
        audioRef.current?.pause();
      }
    };

    window.addEventListener("whatsapp-audio-play", handleGlobalAudioPlay);
    return () => {
      window.removeEventListener("whatsapp-audio-play", handleGlobalAudioPlay);
    };
  }, [mediaUrl, isPlaying]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      setIsLoading(true);
      window.dispatchEvent(
        new CustomEvent("whatsapp-audio-play", { detail: { mediaUrl } }),
      );
      audioRef.current
        .play()
        .then(() => {
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Error reproduciendo audio, reintentando...", err);
          if (audioRef.current) {
            audioRef.current.load();
            audioRef.current.play().catch(() => {
              setIsLoading(false);
            });
          } else {
            setIsLoading(false);
          }
        });
    }
  }, [isPlaying, mediaUrl]);

  const handleSpeedToggle = useCallback(() => {
    const rates: (1 | 1.5 | 2)[] = [1, 1.5, 2];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length]!;
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  }, [playbackRate]);

  // Manejador de arrastre / clic en la pista de audio (waveform seeker)
  const handleSeekFromEvent = useCallback(
    (clientX: number) => {
      if (!trackRef.current || !duration) return;
      const rect = trackRef.current.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const ratio = clickX / rect.width;
      const targetTime = ratio * duration;

      setCurrentTime(targetTime);
      if (audioRef.current) {
        audioRef.current.currentTime = targetTime;
      }
    },
    [duration],
  );

  const handleMouseDownTrack = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsSeeking(true);
    handleSeekFromEvent(e.clientX);
  };

  useEffect(() => {
    if (!isSeeking) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleSeekFromEvent(e.clientX);
    };

    const handleMouseUp = () => {
      setIsSeeking(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isSeeking, handleSeekFromEvent]);

  // Cálculos de progreso para resaltado de barras
  const progressRatio = duration > 0 ? currentTime / duration : 0;
  const activeBarIndex = Math.floor(progressRatio * peaks.length);

  // Distinguir estilos según remitente (cliente vs agente/IA)
  const isOutgoing = author === "agent" || author === "ai";

  return (
    <div
      className={`relative flex items-center gap-2.5 p-2 rounded-2xl select-none transition-all ${
        isOutgoing
          ? "bg-emerald-950/20 text-emerald-950 dark:bg-emerald-500/10 dark:text-emerald-100"
          : "bg-muted/60 text-foreground"
      } ${className}`}
    >
      <audio
        ref={audioRef}
        src={mediaUrl}
        preload="metadata"
        onLoadedMetadata={() => {
          if (audioRef.current && isFinite(audioRef.current.duration)) {
            setDuration(audioRef.current.duration);
          }
        }}
        onDurationChange={() => {
          if (audioRef.current && isFinite(audioRef.current.duration)) {
            setDuration(audioRef.current.duration);
          }
        }}
        onTimeUpdate={() => {
          if (!isSeeking && audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onPlay={() => {
          setIsPlaying(true);
          setIsLoading(false);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
          if (audioRef.current) audioRef.current.currentTime = 0;
        }}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setIsPlaying(false);
        }}
      />

      {/* 1. Avatar con badge de Micrófono (Estilo WhatsApp) */}
      <div className="relative shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={senderName || "Usuario"}
            className="size-10 rounded-full object-cover shadow-xs border border-border/40"
          />
        ) : (
          <div
            className={`size-10 rounded-full grid place-items-center font-bold text-xs shadow-xs ${
              author === "customer"
                ? "bg-primary/15 text-primary"
                : author === "agent"
                  ? "bg-emerald-600/20 text-emerald-700 dark:text-emerald-300"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
            }`}
          >
            {author === "customer" ? (
              <User className="size-5" />
            ) : author === "agent" ? (
              <UserCheck className="size-5" />
            ) : (
              <Bot className="size-5" />
            )}
          </div>
        )}
      </div>

      {/* 2. Botón de reproducción / pausa siempre activo (Sin icono de descarga) */}
      <button
        type="button"
        onClick={togglePlay}
        className={`size-9.5 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-xs cursor-pointer ${
          isOutgoing
            ? "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        }`}
        aria-label={isPlaying ? "Pausar audio" : "Reproducir audio"}
      >
        {isLoading ? (
          <Loader2 className="size-4.5 animate-spin" />
        ) : isPlaying ? (
          <Pause className="size-4.5 fill-current" />
        ) : (
          <Play className="size-4.5 fill-current ml-0.5" />
        )}
      </button>

      {/* 3. Seeker de Forma de Onda (Waveform Track) & Información de tiempo */}
      <div className="flex-1 min-w-[140px] max-w-[220px] sm:max-w-[260px] flex flex-col gap-1 justify-center">
        {/* Pista interactiva de barras de audio */}
        <div
          ref={trackRef}
          onMouseDown={handleMouseDownTrack}
          className="h-7 flex items-center gap-[2.5px] cursor-pointer py-1 group touch-none select-none"
          title="Haz clic o arrastra para desplazarte"
        >
          {peaks.map((heightRatio, idx) => {
            const isActive = idx <= activeBarIndex;
            const barHeightPct = Math.max(18, Math.round(heightRatio * 100));

            return (
              <div
                key={idx}
                style={{ height: `${barHeightPct}%` }}
                className={`w-[3px] rounded-full transition-all duration-100 ${
                  isActive
                    ? isOutgoing
                      ? "bg-emerald-700 dark:bg-emerald-400 scale-y-[1.08]"
                      : "bg-primary dark:bg-emerald-400 scale-y-[1.08]"
                    : isOutgoing
                      ? "bg-emerald-900/30 dark:bg-emerald-200/30 group-hover:bg-emerald-900/40"
                      : "bg-muted-foreground/35 dark:bg-muted-foreground/45 group-hover:bg-muted-foreground/60"
                }`}
              />
            );
          })}
        </div>

        {/* Fila inferior: Tiempo transcurrido / Duración total y Selector de Velocidad (1x, 1.5x, 2x) */}
        <div className="flex items-center justify-between text-[11px] tabular-nums leading-none">
          <span className="font-medium text-muted-foreground/90">
            {isPlaying || currentTime > 0
              ? formatAudioTime(currentTime)
              : formatAudioTime(duration)}
          </span>

          <button
            type="button"
            onClick={handleSpeedToggle}
            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full transition-colors cursor-pointer ${
              playbackRate !== 1
                ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-extrabold"
                : "bg-foreground/5 hover:bg-foreground/10 text-muted-foreground"
            }`}
            title="Cambiar velocidad de reproducción"
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
}
