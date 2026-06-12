// ==========================================
// TIPOS PRINCIPALES DE LA APLICACIÓN
// Definiciones de la "estructura de la verdad"
// ==========================================

export interface Usuario {
  id: string;
  nombre: string;
  salarioNeto: number;
  porcentajeAporte: number; // Ej: 0.60 para 60%
}

export interface GastoHogar {
  id: string;
  nombre: string;
  monto: number;
  pagado: boolean;
  mes: number; // 1-12
  anio: number;
}

export interface GastoExtra {
  id: string;
  nombre: string;
  monto: number;
  fecha: string; // ISO string
  categoria: string;
}

export interface ItemMercado {
  id: string;
  nombre: string;
  precioEstimado: number;
  comprado: boolean;
  precioReal?: number;
}

export interface GastoPersonal {
  id: string;
  usuarioId: string;
  nombre: string;
  monto: number;
  fecha: string;
}

export interface HistorialCompra {
  id: string;
  fecha: string;
  total: number;
  items: ItemMercado[];
}

export interface ResumenFinanciero {
  totalSalarios: number;
  totalAporteHogar: number;
  totalExtras: number;
  totalMercado: number;
  saldoLibreJonatan: number;
  saldoLibreMarcela: number;
}
