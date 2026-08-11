# ui-ux-design-principles.md

Guía concreta para este producto (consola operativa de atención WhatsApp para un ISP, tipo Whaticket/Chatwoot). No es una lista genérica de "buenas prácticas de UI" — son decisiones tomadas y el porqué, para que el próximo cambio sea consistente.

## 1. Esto es una herramienta de trabajo de alta frecuencia, no un sitio de marketing

Los agentes viven en `/bandeja` 8 horas. Cada decisión de diseño se evalúa contra: **¿esto le ahorra un click/segundo a alguien que lo hace 200 veces al día?**

- Densidad de información alta y texto pequeño (`text-[11px]`, `text-xs`) es intencional en tablas/listas — no es descuido, es la convención de este proyecto (ver `StatCard`, filas de `EscalationsBoard`). No "mejorar" subiendo el tamaño de fuente sin que te lo pidan.
- Nada de modales de confirmación para acciones frecuentes y reversibles (enviar mensaje, seleccionar conversación). Sí para acciones destructivas o poco frecuentes (cancelar caso).

## 2. Semántica de color = estado del sistema, no decoración

Esta paleta ya está fijada por `tone` en `StatCard`/badges — reutilízala, no inventes combinaciones nuevas:

| Color | Significa | Ejemplos reales |
|---|---|---|
| `primary` | Normal, saludable, IA activa | Automatización activa, depto. `shared` |
| `warning` | Requiere atención pronto, no urgente | Escalado pendiente, depto. `restricted`, SSE reconectando |
| `danger` | Bloqueante o requiere acción inmediata | Reclamar caso, cancelar caso, sin agentes activos |
| `muted-foreground` | Informativo, no accionable | Metadatos, timestamps |

Nunca uses rojo para algo que no bloquea al agente, ni verde para "todo bien" si en realidad hay una escalación pendiente sin resolver.

## 3. Tiempo real: mostrar el estado de la conexión, no solo los datos

Un agente que ve una bandeja "vacía" no puede distinguir "no hay conversaciones" de "el SSE se cayó" sin una señal explícita. Por eso:

- El punto verde/gris junto al avatar del agente (`AppShell`) y el ícono `Wifi`/`WifiOff` en `OperationalInbox` **siempre** están visibles, no solo cuando hay un problema.
- Las notificaciones nuevas se resaltan (contador rojo en la campana) pero **nunca bloquean** con un modal — el agente decide cuándo mirarlas.

## 4. El resumen de escalación es para decidir en 10 segundos, no para leer un informe

`CaseSummaryDialog` ordena la información por lo que un agente necesita para decidir si reclama el caso, en este orden: problema → departamento/estado → razón de escalación → pasos ya completados (para no repetir preguntas al cliente) → resultados → acción pendiente → línea de tiempo (colapsable, es lo menos importante). El texto generado por IA (`readableSummary`) va arriba pero visualmente diferenciado (fondo tenue + nota "no reemplaza los datos de abajo") — nunca se presenta como si fuera el dato estructurado.

## 5. Estados vacíos y de error son parte del diseño, no un afterthought

Cada lista de este proyecto tiene un mensaje de estado vacío específico al contexto (no un genérico "No hay datos"):

- Bandeja sin conversaciones: "No hay conversaciones abiertas para este filtro" (sugiere que es el filtro, no que el sistema está roto).
- `/usuarios` sin agentes: sugiere explícitamente correr `npm run seed` — un mensaje accionable, no solo descriptivo.
- Catálogo n8n vacío: explica cómo se llena (migraciones o el propio panel).

Regla: todo estado vacío debe responder "¿por qué está vacío y qué hago al respecto?", no solo "está vacío".

## 6. Nunca simules una capacidad que no existe

Si un endpoint no existe (crear agentes, algoritmo de auto-asignación), la UI lo dice explícitamente (banner + tooltip + referencia a `docs/spec/06_BACKEND_GAPS.md`) en vez de deshabilitar silenciosamente o, peor, simular que funcionó. Esto es una decisión de UX deliberada: un agente que cree que guardó algo que no se guardó pierde confianza en toda la herramienta.

## 7. Mensajería: replicar los patrones mentales de WhatsApp, no reinventarlos

Los agentes ya conocen WhatsApp. `OperationalInbox` reutiliza deliberadamente sus convenciones: burbujas alineadas por remitente (cliente izquierda, agente/IA derecha), doble check para mensajes salientes, hora en formato reloj de 24h en la esquina de la burbuja. No introducir un patrón de chat distinto "porque se ve mejor" — la familiaridad reduce la curva de aprendizaje a cero.

## 8. Accesibilidad mínima no negociable

- Todo botón icon-only lleva `aria-label` (ver `NotificationBell`).
- Los estados `disabled` siempre van acompañados de una razón visible (texto, `title`) cuando la razón no es obvia por contexto — nunca un botón deshabilitado sin explicación.
- Contraste: usar los tokens de `styles.css` (`text-muted-foreground`, `text-danger`, etc.), no colores hardcodeados nuevos que puedan romper el contraste en modo oscuro (si se agrega más adelante).
