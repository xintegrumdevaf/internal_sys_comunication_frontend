import type { DepartmentCase } from "@/modules/identity/domain/department";

export const MOCK_FACTURACION_CASES: DepartmentCase[] = [
  {
    id: "mock-case-1",
    label: "Ajuste tarifario no autorizado",
    description:
      "- Subieron la tarifa sin avisar - no acepté el incremento - por qué ahora pago más - reviertan el incremento - nadie me notificó el alza",
    handlingMode: "human_direct",
    workflowType: "GENERAL_INQUIRY",
    active: true,
  },
  {
    id: "mock-case-2",
    label: "Alegación de fraude financiero",
    description:
      "- Usaron mi identidad para contratar - clonaron mis datos - suplantación en cuenta - yo no contraté eso, es fraude - alguien abrió un servicio a mi nombre",
    handlingMode: "human_direct",
    workflowType: "GENERAL_INQUIRY",
    active: true,
  },
  {
    id: "mock-case-3",
    label: "Amenaza de acción judicial",
    description:
      "- Voy a demandarlos - esto es indebido - los voy a demandar - hablaré con mi abogado - iré a juicio - ustedes están violando mis derechos",
    handlingMode: "human_direct",
    workflowType: "GENERAL_INQUIRY",
    active: true,
  },
  {
    id: "mock-case-4",
    label: "Amenaza de denuncia ante regulador",
    description:
      "- Voy a reclamar a ARCOTEL - quiero un reclamo formal - los denuncio ante la autoridad - necesito un número de caso - voy a la superintendencia",
    handlingMode: "human_direct",
    workflowType: "GENERAL_INQUIRY",
    active: true,
  },
  {
    id: "mock-case-5",
    label: "Aprobación pendiente del área financiera",
    description:
      "- Mi jefe aún no autoriza pago - denme unos días - mi jefe no autoriza aún el pago - falta la aprobación de finanzas - denos unos días - estamos en trámite interno",
    handlingMode: "human_direct",
    workflowType: "GENERAL_INQUIRY",
    active: true,
  },
  {
    id: "mock-case-6",
    label: "Aviso de suspensión recibido",
    description:
      "- Me llegó un SMS de corte - me van a suspender - qué hago - me llegó un mensaje de corte - dice que me van a suspender - qué hago con este aviso",
    handlingMode: "ai_assisted",
    workflowType: "GENERAL_INQUIRY",
    active: true,
  },
  {
    id: "mock-case-7",
    label: "Baja por cambio de ciudad",
    description:
      "- Me mudo a Loja - allá no llegan - no quiero deudas - no quiero quedar con deuda - me voy de ciudad - qué hago con mi contrato",
    handlingMode: "ai_assisted",
    workflowType: "GENERAL_INQUIRY",
    active: true,
  },
  {
    id: "mock-case-8",
    label: "Baja por mal servicio",
    description:
      "- Doy de baja porque falla - no pagaré este mes - el servicio no funciona, cancelen - me voy por las fallas - quiero cancelar por mal servicio",
    handlingMode: "human_direct",
    workflowType: "GENERAL_INQUIRY",
    active: true,
  },
  {
    id: "mock-case-9",
    label: "Bloqueo de facturas en portal proveedores",
    description:
      "- Su factura no está cargada - carguen antes de cobrar - la factura no está en el portal de proveedores - suban la factura al portal - sin carga no se puede pagar",
    handlingMode: "human_direct",
    workflowType: "GENERAL_INQUIRY",
    active: true,
  },
  {
    id: "mock-case-10",
    label: "Bloqueo parcial o portal de pago",
    description:
      "- Solo me sale pantalla de pago - el servicio está limitado - no puedo navegar, me aparece el portal - cómo quito el bloqueo - sale una página para pagar y nada más",
    handlingMode: "ai_assisted",
    workflowType: "GENERAL_INQUIRY",
    active: true,
  },
  {
    id: "mock-case-11",
    label: "Botón de pago",
    description:
      "- Enlace para pagar - dónde está botón de pago - no veo el portal de cobro - dónde está el botón de pago - mándame el link para pagar - no me abre la página de pago",
    handlingMode: "ai_assisted",
    workflowType: "GENERAL_INQUIRY",
    active: true,
  },
  {
    id: "mock-case-12",
    label: "Cambio de ciclo solicitado",
    description:
      "- Me pagan a fin de mes - cámbienme el día de vencimiento - quiero cambiar mi fecha de pago - puedo pagar después del 30 - muevan mi vencimiento",
    handlingMode: "ai_assisted",
    workflowType: "GENERAL_INQUIRY",
    active: true,
  },
  {
    id: "mock-case-13",
    label: "Cambio de fecha de promesa",
    description:
      "- No puedo cumplir mañana - pásame para el lunes - necesito mover mi compromiso - no voy a poder pagar mañana - pásame el pago para el lunes - necesito mover la fecha",
    handlingMode: "human_direct",
    workflowType: "GENERAL_INQUIRY",
    active: true,
  },
  {
    id: "mock-case-14",
    label: "Cambio de razón social en facturas",
    description:
      "- Nos fusionamos - actualicen razón social para pagar - actualicen la razón social - la factura debe salir con el nuevo nombre - cambiaron el nombre de la empresa",
    handlingMode: "human_direct",
    workflowType: "GENERAL_INQUIRY",
    active: true,
  },
  {
    id: "mock-case-15",
    label: "Cambio de titular pendiente por venta de inmueble",
    description:
      "- Vendí casa pero factura sigue a mi nombre - vendí la casa y la factura sigue a mi nombre - ya no vivo ahí - cambien el titular al nuevo dueño",
    handlingMode: "human_direct",
    workflowType: "GENERAL_INQUIRY",
    active: true,
  },
  {
    id: "mock-case-16",
    label: "Cambio de titular y cobros anteriores",
    description:
      "- Asumí el contrato hoy - me exigen deuda de antiguo dueño - me cobran la deuda del dueño anterior - esa deuda no es mía - soy nuevo titular y me cobran lo anterior",
    handlingMode: "human_direct",
    workflowType: "GENERAL_INQUIRY",
    active: true,
  },
  {
    id: "mock-case-17",
    label: "Cancelación pedida pero no procesada",
    description:
      "- Solicité baja el mes pasado y aún facturan - pedí la baja el mes pasado - todavía me facturan - ya cancelé y me siguen cobrando - no procesaron mi cancelación",
    handlingMode: "human_direct",
    workflowType: "GENERAL_INQUIRY",
    active: true,
  },
  {
    id: "mock-case-18",
    label: "Cancelación solicitada por chat",
    description:
      "- Quiero dar de baja hoy - confirmen cancelación y saldo - quiero cancelar hoy - confírmenme la cancelación - quiero dar de baja mi servicio - cuánto debo para cancelar",
    handlingMode: "human_direct",
    workflowType: "GENERAL_INQUIRY",
    active: true,
  },
  {
    id: "mock-case-19",
    label: "Cargo de instalación no anunciado",
    description:
      "- Me cargaron instalación gratis - dijeron que no se pagaba - me cargaron la instalación - dijeron que era gratis - por qué cobran instalación - no me avisaron del costo",
    handlingMode: "human_direct",
    workflowType: "GENERAL_INQUIRY",
    active: true,
  },
  {
    id: "mock-case-20",
    label: "Cargo de IPTV o servicio adicional",
    description:
      "- Me facturaron televisión - yo pedí solo internet - yo solo pedí internet - no contraté IPTV - quiten el servicio adicional - por qué sale un adicional",
    handlingMode: "human_direct",
    workflowType: "GENERAL_INQUIRY",
    active: true,
  },
  {
    id: "mock-case-21",
    label: "Cargo por activación o habilitación",
    description:
      "- Por qué me cobran activación si era gratis - me cobran la activación - dijeron que era gratis - por qué cobran habilitación - no debería pagar por activar",
    handlingMode: "human_direct",
    workflowType: "GENERAL_INQUIRY",
    active: true,
  },
  {
    id: "mock-case-22",
    label: "Cargo por reconexión cuestionado",
    description:
      "- Por qué cobran reconexión - ya pagué y me añaden otro valor - por qué me cobran la reconexión - ya pagué y me suman otro valor - cuánto cuesta reconectar",
    handlingMode: "ai_assisted",
    workflowType: "GENERAL_INQUIRY",
    active: true,
  },
  {
    id: "mock-case-23",
    label: "Cargo por repetidor de Wi-Fi",
    description:
      "- Ese extensor no lo compré - me cobraron repetidor - me cobraron repetidor - yo no compré ese extensor - no instalaron ningún repetidor",
    handlingMode: "human_direct",
    workflowType: "GENERAL_INQUIRY",
    active: true,
  },
  {
    id: "mock-case-24",
    label: "Cliente afirma hostigamiento por múltiples contactos",
    description:
      "- Me escriben veinte veces al día - basta de acoso - esto es acoso - paren de hostigarme - me tienen cansado - los voy a denunciar por acoso",
    handlingMode: "human_direct",
    workflowType: "GENERAL_INQUIRY",
    active: true,
  },
  {
    id: "mock-case-25",
    label: "Cliente amenaza cambio de proveedor por mora",
    description:
      "- Si me presionan me cambio - ya busqué otra empresa - si me siguen presionando me cambio - me voy con otro proveedor - no me importa que me corten",
    handlingMode: "human_direct",
    workflowType: "GENERAL_INQUIRY",
    active: true,
  },
  {
    id: "mock-case-26",
    label: "Cliente amenaza demanda",
    description:
      "- Voy a denunciarlos - les pondré juicio - voy a reclamar ante autoridad - los voy a denunciar - les pongo una demanda - voy a ir a la defensoría",
    handlingMode: "human_direct",
    workflowType: "GENERAL_INQUIRY",
    active: true,
  },
  {
    id: "mock-case-27",
    label: "Cliente cambia fecha repetidamente",
    description:
      "- El martes no pude - mejor viernes - la otra semana - el martes no pude, pago el viernes - mejor la otra semana - se me complicó, la próxima",
    handlingMode: "human_direct",
    workflowType: "GENERAL_INQUIRY",
    active: true,
  },
  {
    id: "mock-case-28",
    label: "Cliente cancela transferencia antes de liquidación",
    description:
      "- Hice el pago pero lo reversé - se canceló transacción - se canceló la transacción - cancelé la transferencia - el pago se revirtió",
    handlingMode: "human_direct",
    workflowType: "GENERAL_INQUIRY",
    active: true,
  },
  {
    id: "mock-case-29",
    label: "Cliente compara precio con competidor",
    description:
      "- Otra operadora cobra menos - voy a dejarles de pagar - otra empresa cobra menos - me voy con la competencia - en otro lado pagan menos",
    handlingMode: "ai_assisted",
    workflowType: "GENERAL_INQUIRY",
    active: true,
  },
  {
    id: "mock-case-30",
    label: "Cliente comparte tarjeta completa o clave",
    description:
      "- Aquí está mi clave - esta es la foto de tarjeta - le mando la foto de mi tarjeta - este es el código que me llegó - mi contraseña es",
    handlingMode: "human_direct",
    workflowType: "GENERAL_INQUIRY",
    active: true,
  },
  {
    id: "mock-case-31",
    label: "Cliente condiciona pago a disculpa o supervisor",
    description:
      "- Quiero hablar con gerente antes de pagar - quiero hablar con el gerente - pásenme a un supervisor - no pago hasta que me pidan disculpas",
    handlingMode: "human_direct",
    workflowType: "GENERAL_INQUIRY",
    active: true,
  },
  {
    id: "mock-case-32",
    label: "Cliente confunde abono con cancelación total",
    description:
      "- Ya aboné diez dólares, ya no debo nada - ya aboné diez dólares - con eso ya no debo nada - ya pagué algo, estoy al día",
    handlingMode: "ai_assisted",
    workflowType: "GENERAL_INQUIRY",
    active: true,
  },
  {
    id: "mock-case-33",
    label: "Cliente consulta si un acuerdo genera interés",
    description:
      "- Si difiero, me cobran un interés adicional - si pago después me cobran interés - hay recargo si difiero - cuánto interés me cobran",
    handlingMode: "ai_assisted",
    workflowType: "GENERAL_INQUIRY",
    active: true,
  },
];
