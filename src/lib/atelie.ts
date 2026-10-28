import { OrderStatus, PaymentMethod, Payment, Order } from "./db";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pendente: "Pendente",
  andamento: "Em andamento",
  pronto: "Pronto",
  entregue: "Entregue",
};
export const STATUS_FLOW: OrderStatus[] = ["pendente", "andamento", "pronto", "entregue"];
export const METHOD_LABEL: Record<PaymentMethod, string> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  cartao: "Cartão",
  outra: "Outra",
};

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const formatCents = (c: number) => brl.format(c / 100);

/** "1.234,56" | "150" | "150,5" -> cents; null when invalid */
export function parseMoney(input: string): number | null {
  const s = input.replace(/[R$\s]/g, "").trim();
  if (!s) return null;
  let norm = s;
  if (s.includes(",")) norm = s.replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(norm)) return null;
  return Math.round(parseFloat(norm) * 100);
}
export const centsToInput = (c: number) => (c / 100).toFixed(2).replace(".", ",");

export function todayISO(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
export function formatDate(
  iso: string,
  opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" },
) {
  const [y = 0, m = 1, d = 1] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", opts);
}

export function paidCents(orderId: number, payments: Payment[]) {
  return payments.filter((p) => p.orderId === orderId).reduce((s, p) => s + p.amountCents, 0);
}
export function balanceCents(order: Order, payments: Payment[]) {
  return order.totalCents - paidCents(order.id!, payments);
}
export type PayState = "pago" | "parcial" | "sem";
export function payState(order: Order, payments: Payment[]): PayState {
  const paid = paidCents(order.id!, payments);
  if (paid >= order.totalCents) return "pago";
  if (paid > 0) return "parcial";
  return "sem";
}
export const PAY_LABEL: Record<PayState, string> = {
  pago: "Pago",
  parcial: "Parcial",
  sem: "Sem pagamento",
};

export function isLate(order: Order, today = todayISO()) {
  return order.status !== "entregue" && order.dueDate < today;
}

/** Returns an error message or null. Payments cannot exceed remaining balance. */
export function validatePayment(amountCents: number | null, balance: number): string | null {
  if (amountCents === null || amountCents <= 0) return "Informe um valor válido.";
  if (amountCents > balance) return `O valor passa do saldo restante (${formatCents(balance)}).`;
  return null;
}
