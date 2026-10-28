import { useLiveQuery } from "dexie-react-hooks";
import { db, type Customer, type Order, type Payment } from "./db";

export interface AppData {
  customers: Customer[];
  orders: Order[];
  payments: Payment[];
  customerById: Map<number, Customer>;
}

export function useData(): AppData | undefined {
  return useLiveQuery(async () => {
    const [customers, orders, payments] = await Promise.all([
      db.customers.orderBy("name").toArray(),
      db.orders.orderBy("dueDate").toArray(),
      db.payments.toArray(),
    ]);
    return { customers, orders, payments, customerById: new Map(customers.map((c) => [c.id!, c])) };
  });
}
