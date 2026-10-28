import { PageHeader } from "@/components/custom/ui";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DB_SCHEMA_VERSION, db } from "@/lib/db";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, Download, Smartphone, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/ajustes")({
  head: () => ({
    meta: [
      { title: "Ajustes e backup — Ateliê" },
      { name: "description", content: "Exporte e restaure o backup dos dados do ateliê." },
      { property: "og:title", content: "Ajustes e backup — Ateliê" },
      { property: "og:description", content: "Exporte e restaure o backup dos dados do ateliê." },
    ],
  }),
  component: Settings,
});

const APP_VERSION = "1.0.0";
const opt = z.string().optional();
const BackupSchema = z.object({
  app: z.literal("atelie"),
  version: z.number().int().max(DB_SCHEMA_VERSION),
  customers: z.array(
    z.object({
      id: z.number(),
      name: z.string().min(1),
      phone: opt,
      notes: opt,
      measurements: opt,
      createdAt: z.number(),
    }),
  ),
  orders: z.array(
    z.object({
      id: z.number(),
      customerId: z.number(),
      description: z.string(),
      notes: opt,
      photo: opt,
      dueDate: z.string(),
      fittingDate: opt,
      totalCents: z.number().int().nonnegative(),
      status: z.enum(["pendente", "andamento", "pronto", "entregue"]),
      createdAt: z.number(),
    }),
  ),
  payments: z.array(
    z.object({
      id: z.number(),
      orderId: z.number(),
      amountCents: z.number().int().positive(),
      paidAt: z.string(),
      method: z.enum(["dinheiro", "pix", "cartao", "outra"]).optional(),
    }),
  ),
});
type Backup = z.infer<typeof BackupSchema>;

function Settings() {
  const router = useRouter();
  const lastBackup = useLiveQuery(() => db.meta.get("lastBackup"));
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Backup | null>(null);

  const exportBackup = async () => {
    const payload = {
      app: "atelie",
      version: DB_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      customers: await db.customers.toArray(),
      orders: await db.orders.toArray(),
      payments: await db.payments.toArray(),
    };
    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `atelie-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    await db.meta.put({ key: "lastBackup", value: new Date().toISOString() });
    toast.success("Backup exportado");
  };

  const pick = async (file: File) => {
    try {
      const parsed = BackupSchema.safeParse(JSON.parse(await file.text()));
      if (!parsed.success) throw new Error();
      const b = parsed.data;
      const cids = new Set(b.customers.map((c) => c.id));
      const oids = new Set(b.orders.map((o) => o.id));
      if (
        b.orders.some((o) => !cids.has(o.customerId)) ||
        b.payments.some((p) => !oids.has(p.orderId))
      )
        throw new Error();
      setPending(b);
    } catch {
      toast.error("Não foi possível restaurar: arquivo inválido ou de outra versão.");
    }
  };

  const restore = async () => {
    if (!pending) return;
    await db.transaction("rw", db.customers, db.orders, db.payments, async () => {
      await Promise.all([db.customers.clear(), db.orders.clear(), db.payments.clear()]);
      await db.customers.bulkAdd(pending.customers);
      await db.orders.bulkAdd(pending.orders);
      await db.payments.bulkAdd(pending.payments);
    });
    setPending(null);
    toast.success("Backup restaurado");
  };

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
      <PageHeader title="Ajustes e backup" />
      <div className="space-y-4 px-5">
        <div className="flex gap-3 rounded-xl bg-secondary p-4 text-sm text-secondary-foreground">
          <Smartphone className="size-5 shrink-0" />
          <p>
            Seus dados ficam guardados apenas neste aparelho. Não há sincronização com outros
            celulares — faça backups regularmente.
          </p>
        </div>
        <div className="space-y-3 rounded-xl border bg-card p-4 shadow-soft">
          <p className="text-sm text-muted-foreground">
            Último backup:{" "}
            {lastBackup ? new Date(lastBackup.value).toLocaleString("pt-BR") : "nenhum ainda"}
          </p>
          <Button className="h-12 w-full" onClick={exportBackup}>
            <Download /> Exportar backup
          </Button>
          <Button
            variant="outline"
            className="h-12 w-full"
            onClick={() => fileRef.current?.click()}
          >
            <Upload /> Restaurar backup
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) pick(f);
              e.target.value = "";
            }}
          />
        </div>
        <p className="text-center text-xs text-muted-foreground">Ateliê versão {APP_VERSION}</p>
      </div>
      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Substituir os dados atuais?</AlertDialogTitle>
            <AlertDialogDescription>
              O backup tem {pending?.customers.length} cliente(s), {pending?.orders.length}{" "}
              pedido(s) e {pending?.payments.length} pagamento(s). Os dados atuais deste aparelho
              serão apagados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={restore}>Restaurar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
