import { describe, expect, it } from "vitest";
import { balanceCents, isLate, parseMoney, payState, validatePayment } from "./atelie";
import { Order } from "./db";

const order: Order = {
  id: 1,
  customerId: 1,
  description: "Vestido",
  dueDate: "2026-01-10",
  totalCents: 20000,
  status: "entregue",
  createdAt: 0,
};

describe("regras do ateliê", () => {
  it("saldo = total - soma dos pagamentos", () => {
    expect(
      balanceCents(order, [
        { orderId: 1, amountCents: 5000, paidAt: "x" },
        { orderId: 1, amountCents: 3000, paidAt: "x" },
      ]),
    ).toBe(12000);
  });
  it("entregue não significa pago", () => {
    expect(payState(order, [])).toBe("sem");
  });
  it("pago quando saldo é zero", () => {
    expect(payState(order, [{ orderId: 1, amountCents: 20000, paidAt: "x" }])).toBe("pago");
  });
  it("não permite pagar acima do saldo", () => {
    expect(validatePayment(12001, 12000)).not.toBeNull();
    expect(validatePayment(12000, 12000)).toBeNull();
  });
  it("valores convertidos para centavos", () => {
    expect(parseMoney("1.234,56")).toBe(123456);
    expect(parseMoney("150")).toBe(15000);
  });
  it("atrasado só se não entregue e prazo passou", () => {
    expect(isLate({ ...order, status: "pronto" }, "2026-01-11")).toBe(true);
    expect(isLate(order, "2026-01-11")).toBe(false);
  });
});
