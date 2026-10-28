import { EmptyState, Loading, OrderCard, PageHeader, Section } from "@/components/custom/ui";
import { Button } from "@/components/ui/button";
import { balanceCents, formatCents, isLate, todayISO } from "@/lib/atelie";
import { useData } from "@/lib/use-data";
import { cn } from "@/lib/utils";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, CalendarCheck, PackageCheck, Plus, Settings, Shirt, Sun } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ateliê — Sua rotina de costura" },
      {
        name: "description",
        content: "Entregas do dia, atrasos e valores a receber do seu ateliê, mesmo sem internet.",
      },
      { property: "og:title", content: "Ateliê — Sua rotina de costura" },
      {
        property: "og:description",
        content: "Entregas do dia, atrasos e valores a receber do seu ateliê.",
      },
    ],
  }),
  component: Dashboard,
});

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

function Dashboard() {
  const data = useData();
  if (!data) return <Loading />;
  const today = todayISO();
  const open = data.orders.filter((o) => o.status !== "entregue");
  const dueToday = open.filter((o) => o.dueDate === today);
  const late = open.filter((o) => isLate(o, today));
  const working = open.filter((o) => o.status === "andamento");
  const ready = open.filter((o) => o.status === "pronto");
  const pending = data.orders.reduce((s, o) => s + Math.max(0, balanceCents(o, data.payments)), 0);
  const upcoming = open.filter((o) => o.dueDate >= today).slice(0, 5);

  const stats = [
    {
      label: "Entregas hoje",
      value: dueToday.length,
      icon: CalendarCheck,
      to: "/agenda",
      search: {},
    },
    {
      label: "Atrasados",
      value: late.length,
      icon: AlertCircle,
      to: "/pedidos",
      search: { f: "atrasados" },
      alert: late.length > 0,
    },
    {
      label: "Em andamento",
      value: working.length,
      icon: Shirt,
      to: "/pedidos",
      search: { f: "andamento" },
    },
    {
      label: "Prontos",
      value: ready.length,
      icon: PackageCheck,
      to: "/pedidos",
      search: { f: "pronto" },
    },
  ] as const;

  return (
    <>
      <PageHeader
        subtitle={new Date().toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
        title={greeting()}
        action={
          <Button asChild variant="ghost" size="icon" aria-label="Ajustes e backup">
            <Link to="/ajustes">
              <Settings />
            </Link>
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-3 px-5">
        {stats.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            search={s.search}
            className={cn(
              "rounded-xl border bg-card p-4 shadow-soft",
              "alert" in s && s.alert && "border-destructive/40 bg-destructive/5",
            )}
          >
            <s.icon
              className={cn(
                "size-5 text-muted-foreground",
                "alert" in s && s.alert && "text-destructive",
              )}
            />
            <p className="mt-2 font-display text-3xl font-semibold">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </Link>
        ))}
        <Link
          to="/financeiro"
          className="col-span-2 flex items-center justify-between rounded-xl bg-primary p-4 text-primary-foreground shadow-fab"
        >
          <span className="text-sm opacity-90">A receber</span>
          <span className="font-display text-2xl font-semibold">{formatCents(pending)}</span>
        </Link>
      </div>

      {late.length > 0 && (
        <Section title="Precisa de atenção">
          <div className="space-y-3">
            {late.map((o) => (
              <OrderCard key={o.id} order={o} data={data} />
            ))}
          </div>
        </Section>
      )}

      <Section
        title="Próximas entregas"
        action={
          <Link to="/agenda" className="text-sm font-medium text-primary">
            Ver agenda
          </Link>
        }
      >
        {upcoming.length ? (
          <div className="space-y-3">
            {upcoming.map((o) => (
              <OrderCard key={o.id} order={o} data={data} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Sun}
            title={
              data.orders.length ? "Nenhuma entrega pela frente" : "Comece pelo primeiro pedido"
            }
            text="Os pedidos aparecem aqui, na agenda e no financeiro automaticamente."
          />
        )}
      </Section>

      <Link
        to="/pedidos/novo"
        aria-label="Novo pedido"
        className="fixed right-5 bottom-24 z-40 flex h-14 items-center gap-2 rounded-full bg-primary px-5 font-medium text-primary-foreground shadow-fab"
      >
        <Plus className="size-5" /> Novo pedido
      </Link>
    </>
  );
}
