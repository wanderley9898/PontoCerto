import Dexie, { type Table } from "dexie";

export type OrderStatus = "pendente" | "andamento" | "pronto" | "entregue";
export type PaymentMethod = "dinheiro" | "pix" | "cartao" | "outra";

export interface Customer {
  id?: number | undefined;
  name: string;
  phone?: string | undefined;
  notes?: string | undefined;
  measurements?: string | undefined;
  createdAt: number;
}

export interface Order {
  id?: number | undefined;
  customerId: number;
  description: string;
  notes?: string | undefined;
  photo?: string | undefined; // data URL
  dueDate: string; // YYYY-MM-DD
  fittingDate?: string | undefined;
  totalCents: number;
  status: OrderStatus;
  createdAt: number;
}

export interface Payment {
  id?: number | undefined;
  orderId: number;
  amountCents: number;
  paidAt: string; // YYYY-MM-DD
  method?: PaymentMethod | undefined;
}

export interface Meta {
  key: string;
  value: string;
}

class AtelieDB extends Dexie {
  customers!: Table<Customer, number>;
  orders!: Table<Order, number>;
  payments!: Table<Payment, number>;
  meta!: Table<Meta, string>;
  constructor() {
    super("atelie");
    this.version(1).stores({
      customers: "++id, name, phone",
      orders: "++id, customerId, dueDate, status, createdAt",
      payments: "++id, orderId, paidAt",
      meta: "key",
    });
  }
}

export const db = new AtelieDB();
export const DB_SCHEMA_VERSION = 1;
