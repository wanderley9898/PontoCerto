import { Loading, PageHeader, OrderCard, EmptyState } from "@/components/custom/ui";
import { Input } from "@/components/ui/input";
import { isLate } from "@/lib/atelie";
import { useData } from "@/lib/use-data";
import { cn } from "@/lib/utils";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Scissors, Search } from "lucide-react";
import { useState } from "react";

const FILTERS = [
  { id: "todos", label: "Todos" },
  { id: "pendente", label: "Pendentes" },
  { id: "andamento", label: "Em andamento" },
  { id: "pronto", label: "Prontos" },
  { id: "entregue", label: "Entregues" },
  { id: "atrasados", label: "Atrasados" },
] as const;
type F = (typeof FILTERS)[number]["id"];

export const Route = createFileRoute("/pedidos/")({
  validateSearch: (s: Record<string, unknown>): { f?: F | undefined } => ({
    f: FILTERS.some((x) => x.id === s["f"]) ? (s["f"] as F) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Pedidos — Ateliê" },
      { name: "description", content: "Todas as encomendas com busca e filtros por situação." },
      { property: "og:title", content: "Pedidos — Ateliê" },
      {
        property: "og:description",
        content: "Todas as encomendas com busca e filtros por situação.",
      },
    ],
  }),
  component: Orders,
});

function Orders() {
  const data = useData();
  const { f = "todos" } = Route.useSearch();
  const [q, setQ] = useState("");
  if (!data) return <Loading />;
  const term = q.trim().toLowerCase();
  const list = data.orders.filter((o) => {
    if (f === "atrasados" ? !isLate(o) : f !== "todos" && o.status !== f) return false;
    if (!term) return true;
    return (
      o.description.toLowerCase().includes(term) ||
      data.customerById.get(o.customerId)?.name.toLowerCase().includes(term)
    );
  });
  if (f === "entregue") list.reverse();

  return (
    <>
      <PageHeader title="Pedidos" />
      <div className="sticky top-0 z-30 space-y-3 bg-background/95 px-5 pb-3 backdrop-blur">
        <div className="relative">
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-12 pl-10 text-base"
            placeholder="Buscar cliente ou peça"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
          {FILTERS.map((x) => (
            <Link
              key={x.id}
              to="/pedidos"
              search={x.id === "todos" ? {} : { f: x.id }}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-sm",
                f === x.id ? "border-primary bg-primary text-primary-foreground" : "bg-card",
              )}
            >
              {x.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="space-y-3 px-5">
        {list.length ? (
          list.map((o) => <OrderCard key={o.id} order={o} data={data} />)
        ) : term ? (
          <EmptyState
            icon={Search}
            title="Nenhum resultado"
            text={`Nada encontrado para “${q}”.`}
          />
        ) : (
          <EmptyState
            icon={Scissors}
            title="Nenhum pedido aqui"
            text="Quando houver pedidos nesta situação, eles aparecem nesta lista."
          />
        )}
      </div>
      <Link
        to="/pedidos/novo"
        aria-label="Novo pedido"
        className="fixed right-5 bottom-24 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-fab"
      >
        <Plus className="size-6" />
      </Link>
    </>
  );
}
