import { EmptyState, Loading, OrderCard, Section } from "@/components/custom/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { balanceCents, formatCents } from "@/lib/atelie";
import { Customer, db } from "@/lib/db";

import { useData } from "@/lib/use-data";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Phone, Scissors } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/clientes/$id")({
  head: () => ({
    meta: [
      { title: "Cliente — Ateliê" },
      { name: "description", content: "Contato, medidas e histórico da cliente." },
      { property: "og:title", content: "Cliente — Ateliê" },
      { property: "og:description", content: "Contato, medidas e histórico da cliente." },
    ],
  }),
  component: ClientDetail,
});

function EditForm({ c }: { c: Customer }) {
  const [f, setF] = useState(c);
  useEffect(() => setF(c), [c]);
  const save = async () => {
    if (!f.name.trim()) {
      toast.error("Informe o nome.");
      return;
    }
    await db.customers.update(c.id!, {
      name: f.name.trim(),
      phone: f.phone?.trim() || undefined,
      notes: f.notes?.trim() || undefined,
      measurements: f.measurements?.trim() || undefined,
    });
    toast.success("Dados salvos");
  };
  return (
    <div className="space-y-3 rounded-xl border bg-card p-4 shadow-soft">
      <div className="space-y-1.5">
        <Label>Nome</Label>
        <Input
          className="h-11"
          value={f.name}
          onChange={(e) => setF({ ...f, name: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Telefone</Label>
        <Input
          className="h-11"
          inputMode="tel"
          value={f.phone ?? ""}
          onChange={(e) => setF({ ...f, phone: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Medidas</Label>
        <Textarea
          rows={2}
          placeholder="Busto, cintura, quadril…"
          value={f.measurements ?? ""}
          onChange={(e) => setF({ ...f, measurements: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Observações</Label>
        <Textarea
          rows={2}
          value={f.notes ?? ""}
          onChange={(e) => setF({ ...f, notes: e.target.value })}
        />
      </div>
      <Button variant="secondary" className="h-11 w-full" onClick={save}>
        Salvar dados
      </Button>
    </div>
  );
}

function ClientDetail() {
  const { id } = Route.useParams();
  const data = useData();
  const router = useRouter();
  if (!data) return <Loading />;
  const c = data.customerById.get(Number(id));
  if (!c) return <p className="p-10 text-center">Cliente não encontrada.</p>;
  const orders = data.orders.filter((o) => o.customerId === c.id);
  const open = orders.filter((o) => o.status !== "entregue");
  const past = orders.filter((o) => o.status === "entregue").reverse();
  const owed = orders.reduce((s, o) => s + Math.max(0, balanceCents(o, data.payments)), 0);
  return (
    <div className="pb-6">
      <div className="px-3 pt-4">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Voltar"
          onClick={() => router.history.back()}
        >
          <ArrowLeft />
        </Button>
      </div>
      <div className="px-5">
        <h1 className="text-3xl font-semibold">{c.name}</h1>
        {c.phone && (
          <a href={`tel:${c.phone}`} className="mt-1 inline-flex items-center gap-1 text-primary">
            <Phone className="size-4" /> {c.phone}
          </a>
        )}
        {owed > 0 && (
          <p className="mt-3 rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
            Valor pendente: <strong>{formatCents(owed)}</strong>
          </p>
        )}
      </div>
      <Section title="Em andamento">
        {open.length ? (
          <div className="space-y-3">
            {open.map((o) => (
              <OrderCard key={o.id} order={o} data={data} />
            ))}
          </div>
        ) : (
          <EmptyState icon={Scissors} title="Nenhum pedido em aberto" />
        )}
      </Section>
      {past.length > 0 && (
        <Section title="Pedidos anteriores">
          <div className="space-y-3">
            {past.map((o) => (
              <OrderCard key={o.id} order={o} data={data} />
            ))}
          </div>
        </Section>
      )}
      <Section title="Dados">
        <EditForm c={c} />
      </Section>
    </div>
  );
}
