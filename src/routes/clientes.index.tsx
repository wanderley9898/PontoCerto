import { EmptyState, Loading, PageHeader } from "@/components/custom/ui";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { balanceCents, formatCents } from "@/lib/atelie";
import { db } from "@/lib/db";
import { useData } from "@/lib/use-data";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus, Search, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/clientes/")({
  head: () => ({
    meta: [
      { title: "Clientes — Ateliê" },
      { name: "description", content: "Clientes, contatos e histórico de pedidos." },
      { property: "og:title", content: "Clientes — Ateliê" },
      { property: "og:description", content: "Clientes, contatos e histórico de pedidos." },
    ],
  }),
  component: Clients,
});

function NewClient() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const save = async () => {
    if (!name.trim()) return setError("Informe o nome.");
    const id = await db.customers.add({
      name: name.trim(),
      phone: phone.trim() || undefined,
      createdAt: Date.now(),
    });
    toast.success("Cliente cadastrada");
    navigate({ to: "/clientes/$id", params: { id: String(id) } });
  };
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="icon" aria-label="Nova cliente">
          <Plus />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Nova cliente</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cn">Nome</Label>
            <Input
              id="cn"
              className="h-12"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp">
              Telefone <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="cp"
              className="h-12"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <Button className="h-12 w-full" onClick={save}>
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Clients() {
  const data = useData();
  const [q, setQ] = useState("");
  if (!data) return <Loading />;
  const t = q.trim().toLowerCase();
  const list = data.customers.filter(
    (c) => !t || c.name.toLowerCase().includes(t) || c.phone?.includes(t),
  );
  return (
    <>
      <PageHeader title="Clientes" action={<NewClient />} />
      <div className="px-5">
        <div className="relative mb-3">
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-12 pl-10 text-base"
            placeholder="Buscar por nome ou telefone"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        {list.length ? (
          <ul className="divide-y rounded-xl border bg-card shadow-soft">
            {list.map((c) => {
              const orders = data.orders.filter((o) => o.customerId === c.id);
              const owed = orders.reduce(
                (s, o) => s + Math.max(0, balanceCents(o, data.payments)),
                0,
              );
              return (
                <li key={c.id}>
                  <Link
                    to="/clientes/$id"
                    params={{ id: String(c.id) }}
                    className="flex items-center justify-between px-4 py-3.5"
                  >
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {c.phone || "Sem telefone"} · {orders.length} pedido(s)
                      </p>
                    </div>
                    {owed > 0 && (
                      <span className="text-sm font-medium text-accent-foreground">
                        {formatCents(owed)}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            icon={t ? Search : Users}
            title={t ? "Nenhum resultado" : "Nenhuma cliente ainda"}
            text={t ? undefined : "Você também pode cadastrar a cliente direto no novo pedido."}
          />
        )}
      </div>
    </>
  );
}
