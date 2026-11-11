import { ChevronDown, ChevronUp, ExternalLink, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TelegramOnboardingGuideProps {
  showGuide: boolean;
  onToggle: () => void;
}

export function TelegramOnboardingGuide({ showGuide, onToggle }: TelegramOnboardingGuideProps) {
  return (
    <div className="border border-sky-200 dark:border-sky-900/60 rounded-xl overflow-hidden bg-sky-50/40 dark:bg-sky-950/20 shadow-xs">
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-sky-50/80 dark:hover:bg-sky-950/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-400 rounded-lg">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              Guía Rápida: ¿Cómo obtener el Token, Chat ID y testear Telegram?
              <Badge
                variant="outline"
                className="text-[10px] bg-background text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800"
              >
                Paso a Paso
              </Badge>
            </h4>
            <p className="text-xs text-muted-foreground">
              Hacé clic para ver el tutorial directo: crear el bot en @BotFather, vincular el grupo
              directivo y probar la conexión.
            </p>
          </div>
        </div>
        {showGuide ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {showGuide && (
        <div className="p-4 pt-2 border-t border-sky-100 dark:border-sky-900/40 bg-background/80 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-lg border bg-muted/20 space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-white text-[10px] font-bold">
                  1
                </span>
                <h5 className="font-semibold text-foreground">Crear el Bot (@BotFather)</h5>
              </div>
              <ol className="list-disc list-inside space-y-1.5 text-muted-foreground text-[11px] leading-relaxed">
                <li>
                  Abrí Telegram y buscá a{" "}
                  <a
                    href="https://t.me/BotFather"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-600 font-semibold hover:underline inline-flex items-center gap-0.5"
                  >
                    @BotFather <ExternalLink className="h-3 w-3" />
                  </a>
                  .
                </li>
                <li>
                  Escribile el comando <code>/newbot</code>.
                </li>
                <li>
                  Elegí un nombre visible (ej: <code>Centinela ISP</code>) y luego un username único
                  que termine en <code>bot</code> (ej: <code>CentinelaIsp_bot</code>).
                </li>
                <li>
                  BotFather te responderá con el <b>Token HTTP API</b> (ej:{" "}
                  <code>7123456789:AAEj_...</code>). Copialo y pegalo en el campo <b>Bot Token</b>{" "}
                  abajo.
                </li>
              </ol>
            </div>

            <div className="p-3.5 rounded-lg border bg-muted/20 space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-white text-[10px] font-bold">
                  2
                </span>
                <h5 className="font-semibold text-foreground">Crear Grupo y obtener Chat ID</h5>
              </div>
              <ol className="list-disc list-inside space-y-1.5 text-muted-foreground text-[11px] leading-relaxed">
                <li>Creá un grupo en Telegram con tus gerentes/admins.</li>
                <li>
                  <b>Sumá a tu propio bot al grupo:</b> Tocá el botón{" "}
                  <b>&quot;Añadir miembros&quot;</b> arriba en el chat (o tocá el nombre del grupo
                  arriba → <i>Añadir participantes</i>). <b>Buscá el username de tu bot</b>,
                  seleccionalo y dale al tilde de confirmación. Luego dale permisos de
                  administrador.
                </li>
                <li>
                  <b>Cómo obtener el Chat ID (3 formas):</b>
                  <ul className="list-circle list-inside pl-2 pt-0.5 space-y-1">
                    <li>
                      <b>Detección Automática (Recomendado):</b> Escribí cualquier mensaje en el
                      grupo (ej. <code>hola</code>) y presioná el botón{" "}
                      <b>&quot;Detectar Grupo&quot;</b> abajo. ¡El sistema lo rellena solo!
                    </li>
                    <li>
                      <b>Vía Telegram Web:</b> Abrí el grupo en{" "}
                      <a
                        href="https://web.telegram.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-600 hover:underline"
                      >
                        web.telegram.org
                      </a>
                      ; la URL del navegador termina en <code>#-1002345678901</code>.
                    </li>
                    <li>
                      <b>Vía bot auxiliar:</b> Buscá a <code>@myidbot</code>, sumalo al grupo y
                      enviá <code>/getgroupid</code> (no uses RawDataBot ya que tiene bloqueada la
                      entrada a grupos).
                    </li>
                  </ul>
                </li>
              </ol>
            </div>

            <div className="p-3.5 rounded-lg border bg-muted/20 space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-white text-[10px] font-bold">
                  3
                </span>
                <h5 className="font-semibold text-foreground">Testear la Integración en Vivo</h5>
              </div>
              <ol className="list-disc list-inside space-y-1.5 text-muted-foreground text-[11px] leading-relaxed">
                <li>
                  Activá el switch superior <b>&quot;Centinela Activo&quot;</b>.
                </li>
                <li>
                  Dejá encendido el switch <b>&quot;Enviar mensaje de muestra al chat&quot;</b>.
                </li>
                <li>
                  Hacé clic en el botón <b>&quot;Probar Bot (getMe)&quot;</b>: el backend validará
                  las credenciales y el bot enviará un mensaje de bienvenida real a tu grupo de
                  Telegram.
                </li>
                <li>
                  Al confirmar que llegó el mensaje, hacé clic en <b>&quot;Guardar Cambios&quot;</b>{" "}
                  o <b>&quot;Guardar Configuración de Telegram&quot;</b>.
                </li>
              </ol>
            </div>

            <div className="p-3.5 rounded-lg border bg-muted/20 space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-white text-[10px] font-bold">
                  4
                </span>
                <h5 className="font-semibold text-foreground">Temas (Forum Topics) Opcionales</h5>
              </div>
              <ol className="list-disc list-inside space-y-1.5 text-muted-foreground text-[11px] leading-relaxed">
                <li>
                  Si en tu grupo activaste la opción <b>Temas</b> (Foros) para separar alertas:
                </li>
                <li>
                  Para saber el <code>thread_id</code> de un tema: hacé clic derecho en cualquier
                  mensaje de ese tema → <b>Copiar enlace del mensaje</b>. El enlace es{" "}
                  <code>
                    t.me/c/12345/<b>15</b>/20
                  </code>
                  ; el número del medio (<code>15</code>) es el <b>ID del Hilo</b>.
                </li>
                <li>
                  Podés crear un tema para SLA, otro para Caídas OLT y otro para Pulso Diario. Si no
                  usás temas, dejalo en Modo Chat Único y todo irá al chat general.
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
