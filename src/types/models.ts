// ==========================================
// MODELOS DE DATOS REALES DE LA APLICACIÓN
// Reflejan exactamente la estructura que se guarda en Firestore/LocalStorage
// ==========================================

export type Persona = 'marcela' | 'jonatan';

export interface Salarios {
  marcela: number;
  jonatan: number;
}

export interface FamilyExpense {
  id: string;
  label: string;
  icon: string;
  budget: number;
  marcela: number;
  jonatan: number;
  active: boolean;
  disableNext: boolean;
}

export interface PersonalExpense {
  id: number;
  desc: string;
  amount: number;
  day: number | null;
  paid: boolean;
  icon: string;
  active?: boolean;
  disableNext?: boolean;
}

export interface Extra {
  id: string;
  person: Persona;
  amount: number;
  category: string;
  desc: string;
  date: string;
}

export interface MonthData {
  key: string;
  year: number;
  month: number;
  salaries: Salarios;
  familyExpenses: FamilyExpense[];
  personalExpenses: {
    marcela: PersonalExpense[];
    jonatan: PersonalExpense[];
  };
  extras: Extra[];
}

export interface ItemMercado {
  id: string;
  name: string;
  pricePer: number;
  unit: string;
  supermarket: string;
  category: string;
}

export interface Compra {
  id: string;
  itemId: string;
  itemName: string;
  qty: number;
  unit: string;
  pricePer: number;
  total: number;
  supermarket: string;
  date: string;
  notes: string;
  marcelaAmount: number;
  jonatanAmount: number;
}

export interface Mercado {
  items: ItemMercado[];
  compras: Compra[];
}

export interface AppData {
  months: Record<string, MonthData>;
  currentKey: string;
  mercado: Mercado;
}

// ==========================================
// TIPOS PARA LOS RESULTADOS DE CÁLCULOS
// ==========================================

export interface ResumenFinanciero {
  ratio: { marcela: number; jonatan: number };
  totalNeto: number;
  netoMarcela: number;
  netoJonatan: number;
  personalTotalMarcela: number;
  personalTotalJonatan: number;
  extrasTotalMarcela: number;
  extrasTotalJonatan: number;
  totalFamilyBudget: number;
  totalFamilyPaid: number;
  totalFamilyPending: number;
  totalFamilyPaidMarcela: number;
  totalFamilyPaidJonatan: number;
  aporteFamiliarMarcela: number;
  aporteFamiliarJonatan: number;
  aportePagadoIdealMarcela: number;
  aportePagadoIdealJonatan: number;
  saldoMarcela: number;
  saldoJonatan: number;
  diffMarcela: number;
  diffJonatan: number;
}

export interface MercadoTotals {
  marcela: number;
  jonatan: number;
}
