import { EmptyState, Loading, OrderCard, PageHeader, Section } from "@/components/custom/ui";
import { Button } from "@/components/ui/button";
import { formatDate, isLate, todayISO } from "@/lib/atelie";
import { useData } from "@/lib/use-data";
import { cn } from "@/lib/utils";
import { createFileRoute } from "@tanstack/react-router";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda — Ateliê" },
      { name: "description", content: "Calendário de entregas gerado a partir dos pedidos." },
      { property: "og:title", content: "Agenda — Ateliê" },
      {
        property: "og:description",
        content: "Calendário de entregas gerado a partir dos pedidos.",
      },
    ],
  }),
  component: Agenda,
});

const WEEK = ["D", "S", "T", "Q", "Q", "S", "S"];

function Agenda() {
  const data = useData();
  const today = todayISO();
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState(today);
  if (!data) return <Loading />;

  const counts = new Map<string, { n: number; late: boolean }>();
  for (const o of data.orders) {
    if (o.status === "entregue") continue;
    const c = counts.get(o.dueDate) ?? { n: 0, late: false };
    counts.set(o.dueDate, { n: c.n + 1, late: c.late || isLate(o, today) });
  }
  const first = month.getDay();
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (string | null)[] = [...Array(first).fill(null)];
  for (let d = 1; d <= days; d++)
    cells.push(todayISO(new Date(month.getFullYear(), month.getMonth(), d)));

  const dayOrders = data.orders.filter((o) => o.dueDate === selected);
  const upcoming = data.orders
    .filter((o) => o.status !== "entregue" && o.dueDate > selected)
    .slice(0, 8);
  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));

  return (
    <>
      <PageHeader title="Agenda" />
      <div className="mx-5 rounded-xl border bg-card p-3 shadow-soft">
        <div className="mb-2 flex items-center justify-between">
          <Button variant="ghost" size="icon" aria-label="Mês anterior" onClick={() => shift(-1)}>
            <ChevronLeft />
          </Button>
          <p className="font-display text-lg font-semibold capitalize">
            {month.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
          </p>
          <Button variant="ghost" size="icon" aria-label="Próximo mês" onClick={() => shift(1)}>
            <ChevronRight />
          </Button>
        </div>
        <div className="grid grid-cols-7 text-center text-xs text-muted-foreground">
          {WEEK.map((w, i) => (
            <span key={i} className="py-1">
              {w}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((iso, i) => {
            if (!iso) return <span key={i} />;
            const c = counts.get(iso);
            return (
              <button
                key={iso}
                onClick={() => setSelected(iso)}
                className={cn(
                  "relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm",
                  iso === today && "font-bold text-primary",
                  iso === selected && "bg-primary text-primary-foreground",
                  c && c.n > 1 && iso !== selected && "bg-accent",
                )}
              >
                {Number(iso.slice(8))}
                {c && (
                  <span
                    className={cn(
                      "absolute bottom-1 size-1.5 rounded-full",
                      c.late
                        ? "bg-destructive"
                        : iso === selected
                          ? "bg-primary-foreground"
                          : "bg-primary",
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
        <Button
          variant="link"
          size="sm"
          className="w-full"
          onClick={() => {
            const d = new Date();
            setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
            setSelected(today);
          }}
        >
          Hoje
        </Button>
      </div>

      <Section
        title={
          selected === today
            ? "Hoje"
            : formatDate(selected, { weekday: "long", day: "numeric", month: "long" })
        }
      >
        {dayOrders.length ? (
          <div className="space-y-3">
            {dayOrders.map((o) => (
              <OrderCard key={o.id} order={o} data={data} />
            ))}
          </div>
        ) : (
          <EmptyState icon={CalendarDays} title="Nenhuma entrega neste dia" />
        )}
      </Section>
      {upcoming.length > 0 && (
        <Section title="Depois disso">
          <div className="space-y-3">
            {upcoming.map((o) => (
              <OrderCard key={o.id} order={o} data={data} />
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
