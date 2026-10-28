import { PaymentDialog } from "@/components/custom/PaymentDialog";
import { EmptyState, Loading, PageHeader, PayBadge } from "@/components/custom/ui";
import { Button } from "@/components/ui/button";
import { PayState, payState, balanceCents, formatCents, paidCents } from "@/lib/atelie";

import { useData } from "@/lib/use-data";
import { cn } from "@/lib/utils";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro — Ateliê" },
      { name: "description", content: "Quem pagou, quem pagou parte e quem ainda deve." },
      { property: "og:title", content: "Financeiro — Ateliê" },
      { property: "og:description", content: "Quem pagou, quem pagou parte e quem ainda deve." },
    ],
  }),
  component: Finance,
});

function Finance() {
  const data = useData();
  const [filter, setFilter] = useState<PayState | "aberto">("aberto");
  if (!data) return <Loading />;
  const rows = data.orders.map((o) => ({
    o,
    state: payState(o, data.payments),
    bal: balanceCents(o, data.payments),
  }));
  const total = rows.reduce((s, r) => s + Math.max(0, r.bal), 0);
  const count = (s: PayState) => rows.filter((r) => r.state === s).length;
  const list = rows.filter((r) => (filter === "aberto" ? r.bal > 0 : r.state === filter));
  const tabs: { id: typeof filter; label: string; n: number }[] = [
    { id: "aberto", label: "A receber", n: rows.filter((r) => r.bal > 0).length },
    { id: "parcial", label: "Parcial", n: count("parcial") },
    { id: "sem", label: "Sem pagamento", n: count("sem") },
    { id: "pago", label: "Pagos", n: count("pago") },
  ];
  return (
    <>
      <PageHeader title="Financeiro" />
      <div className="mx-5 rounded-xl bg-primary p-5 text-primary-foreground shadow-fab">
        <p className="text-sm opacity-90">Total a receber</p>
        <p className="font-display text-4xl font-semibold">{formatCents(total)}</p>
      </div>
      <div className="-mx-0 flex gap-2 overflow-x-auto px-5 py-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-sm",
              filter === t.id ? "border-primary bg-primary text-primary-foreground" : "bg-card",
            )}
          >
            {t.label} · {t.n}
          </button>
        ))}
      </div>
      <div className="space-y-3 px-5">
        {list.length ? (
          list.map(({ o, state, bal }) => (
            <div key={o.id} className="rounded-xl border bg-card p-4 shadow-soft">
              <Link
                to="/pedidos/$id"
                params={{ id: String(o.id) }}
                className="flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {data.customerById.get(o.customerId)?.name}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">{o.description}</p>
                </div>
                <PayBadge state={state} />
              </Link>
              <div className="mt-3 grid grid-cols-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p>{formatCents(o.totalCents)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pago</p>
                  <p>{formatCents(paidCents(o.id!, data.payments))}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Saldo</p>
                  <p className="font-semibold">{formatCents(bal)}</p>
                </div>
              </div>
              {bal > 0 && (
                <PaymentDialog
                  orderId={o.id!}
                  balance={bal}
                  trigger={
                    <Button variant="secondary" className="mt-3 h-11 w-full">
                      Registrar pagamento
                    </Button>
                  }
                />
              )}
            </div>
          ))
        ) : (
          <EmptyState
            icon={Wallet}
            title={filter === "aberto" ? "Nada a receber" : "Nenhum pedido aqui"}
            text={filter === "aberto" ? "Todos os pedidos estão pagos." : undefined}
          />
        )}
      </div>
    </>
  );
}
