export type PaymentCase = {
  conversationId: string;
  contrato: string;
  cliente: string;
  monto: number;
  fecha: string;
  metodo: string;
  estado: "VALIDADO" | "OCR PENDIENTE" | "RECHAZADO";
};

export type WorkOrder = {
  conversationId: string;
  id: string;
  tipo: string;
  direccion: string;
  tecnico: string;
  ventana: string;
  estado: string;
};
