import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { METHOD_LABEL, centsToInput, parseMoney, todayISO } from "@/lib/atelie";
import { db, type Order, type OrderStatus, type PaymentMethod } from "@/lib/db";
import { useData } from "@/lib/use-data";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { Camera, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const Opt = () => <span className="font-normal text-muted-foreground"> (opcional)</span>;

async function resizePhoto(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  await new Promise((r, j) => {
    img.onload = r;
    img.onerror = j;
    img.src = url;
  });
  const scale = Math.min(1, 1000 / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = img.width * scale;
  c.height = img.height * scale;
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  URL.revokeObjectURL(url);
  return c.toDataURL("image/jpeg", 0.8);
}

export function OrderForm({ existing }: { existing?: Order }) {
  const data = useData();
  const navigate = useNavigate();
  const [customerId, setCustomerId] = useState<number | null>(existing?.customerId ?? null);
  const [query, setQuery] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [photo, setPhoto] = useState(existing?.photo);
  const [dueDate, setDueDate] = useState(existing?.dueDate ?? "");
  const [fittingDate, setFittingDate] = useState(existing?.fittingDate ?? "");
  const [total, setTotal] = useState(existing ? centsToInput(existing.totalCents) : "");
  const [deposit, setDeposit] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("pix");
  const [status, setStatus] = useState<OrderStatus>(existing?.status ?? "pendente");
  const [errors, setErrors] = useState<
    Partial<
      Record<"customer" | "description" | "dueDate" | "total" | "deposit" | "fittingDate", string>
    >
  >({});
  const [saving, setSaving] = useState(false);

  const selected = customerId ? data?.customerById.get(customerId) : undefined;
  const matches = query.trim()
    ? (data?.customers ?? [])
        .filter(
          (c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.phone?.includes(query),
        )
        .slice(0, 5)
    : [];
  const exact = matches.some((c) => c.name.toLowerCase() === query.trim().toLowerCase());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Partial<
      Record<"customer" | "description" | "dueDate" | "total" | "deposit" | "fittingDate", string>
    > = {};
    const totalCents = parseMoney(total);
    const depositCents = deposit.trim() ? parseMoney(deposit) : 0;
    if (!customerId && !query.trim()) errs.customer = "Escolha ou digite o nome da cliente.";
    if (!description.trim()) errs.description = "Descreva a peça ou serviço.";
    if (!dueDate) errs.dueDate = "Informe a data de entrega.";
    if (totalCents === null) errs.total = "Informe um valor válido.";
    if (depositCents === null) errs.deposit = "Valor inválido.";
    else if (totalCents !== null && depositCents > totalCents)
      errs.deposit = "O sinal não pode passar do valor total.";
    if (fittingDate && dueDate && fittingDate > dueDate)
      errs.fittingDate = "A prova deve ser antes da entrega.";
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error("Confira os campos destacados");
      return;
    }

    setSaving(true);
    let cid = customerId;
    if (!cid)
      cid = await db.customers.add({
        name: query.trim(),
        phone: newPhone.trim() || undefined,
        createdAt: Date.now(),
      });
    const payload = {
      customerId: cid!,
      description: description.trim(),
      notes: notes.trim() || undefined,
      photo,
      dueDate,
      fittingDate: fittingDate || undefined,
      totalCents: totalCents!,
      status,
    };
    let id: number;
    if (existing) {
      id = existing.id!;
      await db.orders.update(id, payload);
      toast.success("Pedido atualizado");
    } else {
      id = await db.orders.add({ ...payload, createdAt: Date.now() });
      if (depositCents)
        await db.payments.add({
          orderId: id,
          amountCents: depositCents,
          paidAt: todayISO(),
          method,
        });
      toast.success("Pedido salvo — já está na agenda e no financeiro");
    }
    navigate({ to: "/pedidos/$id", params: { id: String(id) }, replace: true });
  };

  const err = (k: keyof typeof errors) =>
    errors[k] && <p className="text-sm text-destructive">{errors[k]}</p>;
  const field = "h-12 text-base";

  return (
    <form onSubmit={submit} className="space-y-6 px-5 pb-8">
      <fieldset className="space-y-2 rounded-xl border bg-card p-4 shadow-soft">
        <legend className="px-1 font-display text-lg font-semibold">Cliente</legend>
        {selected ? (
          <div className="flex items-center justify-between rounded-lg bg-accent px-3 py-2.5">
            <div>
              <p className="font-medium text-accent-foreground">{selected.name}</p>
              {selected.phone && <p className="text-sm text-muted-foreground">{selected.phone}</p>}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Trocar cliente"
              onClick={() => setCustomerId(null)}
            >
              <X />
            </Button>
          </div>
        ) : (
          <>
            <Input
              className={field}
              placeholder="Buscar ou digitar novo nome"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-invalid={!!errors.customer}
            />
            {matches.length > 0 && (
              <ul className="divide-y rounded-lg border">
                {matches.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className="w-full px-3 py-2.5 text-left"
                      onClick={() => setCustomerId(c.id!)}
                    >
                      {c.name}{" "}
                      {c.phone && (
                        <span className="text-sm text-muted-foreground">· {c.phone}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {query.trim() && !exact && (
              <div className="space-y-1.5 rounded-lg bg-muted p-3">
                <p className="text-sm">
                  Nova cliente: <strong>{query.trim()}</strong>
                </p>
                <Input
                  className="h-11 bg-card"
                  inputMode="tel"
                  placeholder="Telefone (opcional)"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
              </div>
            )}
            {err("customer")}
          </>
        )}
      </fieldset>

      <fieldset className="space-y-4 rounded-xl border bg-card p-4 shadow-soft">
        <legend className="px-1 font-display text-lg font-semibold">Encomenda</legend>
        <div className="space-y-1.5">
          <Label htmlFor="desc">Peça ou serviço</Label>
          <Input
            id="desc"
            className={field}
            placeholder="Ex.: Ajuste de vestido de festa"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-invalid={!!errors.description}
          />
          {err("description")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notes">
            Observações
            <Opt />
          </Label>
          <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>
        <div>
          <Label>
            Foto
            <Opt />
          </Label>
          {photo ? (
            <div className="relative mt-1.5 w-32">
              <img
                src={photo}
                alt="Referência"
                className="aspect-square w-32 rounded-lg object-cover"
              />
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute -top-2 -right-2 size-7 rounded-full"
                onClick={() => setPhoto(undefined)}
                aria-label="Remover foto"
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <label className="mt-1.5 flex h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed text-sm text-muted-foreground">
              <Camera className="size-4" /> Adicionar foto
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) =>
                  e.target.files?.[0] && setPhoto(await resizePhoto(e.target.files[0]))
                }
              />
            </label>
          )}
        </div>
      </fieldset>

      <fieldset className="grid grid-cols-2 gap-4 rounded-xl border bg-card p-4 shadow-soft">
        <legend className="px-1 font-display text-lg font-semibold">Prazo</legend>
        <div className="space-y-1.5">
          <Label htmlFor="due">Entrega</Label>
          <Input
            id="due"
            type="date"
            className={field}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            aria-invalid={!!errors.dueDate}
          />
          {err("dueDate")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fit">
            Prova
            <Opt />
          </Label>
          <Input
            id="fit"
            type="date"
            className={field}
            value={fittingDate}
            onChange={(e) => setFittingDate(e.target.value)}
          />
          {err("fittingDate")}
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-xl border bg-card p-4 shadow-soft">
        <legend className="px-1 font-display text-lg font-semibold">Valores</legend>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="total">Total (R$)</Label>
            <Input
              id="total"
              inputMode="decimal"
              className={field}
              placeholder="0,00"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              aria-invalid={!!errors.total}
            />
            {err("total")}
          </div>
          {!existing && (
            <div className="space-y-1.5">
              <Label htmlFor="dep">
                Sinal
                <Opt />
              </Label>
              <Input
                id="dep"
                inputMode="decimal"
                className={field}
                placeholder="0,00"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                aria-invalid={!!errors.deposit}
              />
              {err("deposit")}
            </div>
          )}
        </div>
        {!existing && deposit.trim() && (
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(METHOD_LABEL) as PaymentMethod[]).map((m) => (
              <Button
                key={m}
                type="button"
                size="sm"
                variant={method === m ? "default" : "outline"}
                onClick={() => setMethod(m)}
              >
                {METHOD_LABEL[m]}
              </Button>
            ))}
          </div>
        )}
      </fieldset>

      {!existing && (
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
          {(["pendente", "andamento"] as OrderStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={cn(
                "rounded-lg py-2.5 text-sm font-medium",
                status === s ? "bg-card shadow-soft" : "text-muted-foreground",
              )}
            >
              {s === "pendente" ? "Pendente" : "Em andamento"}
            </button>
          ))}
        </div>
      )}

      <Button type="submit" disabled={saving} className="h-14 w-full text-base shadow-fab">
        {existing ? "Salvar alterações" : "Salvar pedido"}
      </Button>
    </form>
  );
}
