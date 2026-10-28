import { PaymentDialog } from "@/components/custom/PaymentDialog";
import { LateBadge, Loading, PayBadge, StatusBadge } from "@/components/custom/ui";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  balanceCents,
  formatCents,
  formatDate,
  isLate,
  METHOD_LABEL,
  paidCents,
  payState,
  STATUS_FLOW,
  STATUS_LABEL,
} from "@/lib/atelie";
import { db } from "@/lib/db";
import { useData } from "@/lib/use-data";
import { cn } from "@/lib/utils";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";

import { ArrowLeft, Pencil, Phone, Trash2 } from "lucide-react";

import { toast } from "sonner";

export const Route = createFileRoute("/pedidos/$id")({
  head: () => ({
    meta: [
      { title: "Detalhes do pedido — Ateliê" },
      { name: "description", content: "Prazo, pagamentos, saldo e situação da encomenda." },
      { property: "og:title", content: "Detalhes do pedido — Ateliê" },
      { property: "og:description", content: "Prazo, pagamentos, saldo e situação da encomenda." },
    ],
  }),
  component: Detail,
});

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(strong && "text-base font-semibold")}>{value}</span>
    </div>
  );
}

function Detail() {
  const { id } = Route.useParams();
  const data = useData();
  const navigate = useNavigate();
  const router = useRouter();
  if (!data) return <Loading />;
  const order = data.orders.find((o) => o.id === Number(id));
  if (!order) return <p className="p-10 text-center">Pedido não encontrado.</p>;
  const customer = data.customerById.get(order.customerId);
  const pays = data.payments
    .filter((p) => p.orderId === order.id)
    .sort((a, b) => a.paidAt.localeCompare(b.paidAt));
  const balance = balanceCents(order, data.payments);
  const late = isLate(order);

  const setStatus = async (s: typeof order.status) => {
    await db.orders.update(order.id!, { status: s });
    toast.success(`Marcado como ${STATUS_LABEL[s].toLowerCase()}`);
  };
  const remove = async () => {
    await db.transaction("rw", db.orders, db.payments, async () => {
      await db.payments.where("orderId").equals(order.id!).delete();
      await db.orders.delete(order.id!);
    });
    toast.success("Pedido excluído");
    navigate({ to: "/pedidos", replace: true });
  };

  return (
    <div className="pb-6">
      <div className="flex items-center justify-between px-3 pt-4">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Voltar"
          onClick={() => router.history.back()}
        >
          <ArrowLeft />
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link to="/editar/$id" params={{ id }}>
            <Pencil /> Editar
          </Link>
        </Button>
      </div>
      <div className="px-5">
        <div className="flex flex-wrap gap-2">
          {late && <LateBadge />}
          <StatusBadge status={order.status} />
          <PayBadge state={payState(order, data.payments)} />
        </div>
        <h1 className="mt-2 text-3xl font-semibold">{order.description}</h1>
        {customer && (
          <Link
            to="/clientes/$id"
            params={{ id: String(customer.id) }}
            className="mt-1 inline-flex items-center gap-2 text-primary"
          >
            {customer.name}
          </Link>
        )}
        {customer?.phone && (
          <a
            href={`tel:${customer.phone}`}
            className="ml-3 inline-flex items-center gap-1 text-sm text-muted-foreground"
          >
            <Phone className="size-3.5" /> {customer.phone}
          </a>
        )}
      </div>

      <div className="mt-5 px-5">
        <p className="mb-2 text-sm font-medium text-muted-foreground">Produção</p>
        <div className="grid grid-cols-4 gap-1 rounded-xl bg-muted p-1">
          {STATUS_FLOW.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                "rounded-lg px-1 py-2.5 text-xs font-medium",
                order.status === s
                  ? "bg-card text-foreground shadow-soft"
                  : "text-muted-foreground",
              )}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-5 mt-5 rounded-xl border bg-card p-4 shadow-soft">
        <Row
          label="Entrega"
          value={
            <span className={cn(late && "font-medium text-destructive")}>
              {formatDate(order.dueDate)}
            </span>
          }
        />
        {order.fittingDate && <Row label="Prova" value={formatDate(order.fittingDate)} />}
        <Row label="Criado em" value={new Date(order.createdAt).toLocaleDateString("pt-BR")} />
        {order.notes && (
          <p className="mt-2 border-t pt-3 text-sm whitespace-pre-wrap">{order.notes}</p>
        )}
        {order.photo && (
          <img src={order.photo} alt="Foto da peça" className="mt-3 w-full rounded-lg" />
        )}
      </div>

      <div className="mx-5 mt-4 rounded-xl border bg-card p-4 shadow-soft">
        <Row label="Valor total" value={formatCents(order.totalCents)} />
        <Row label="Pago" value={formatCents(paidCents(order.id!, data.payments))} />
        <Row
          label="Saldo restante"
          value={
            <span className={cn(balance > 0 ? "text-accent-foreground" : "text-success")}>
              {formatCents(balance)}
            </span>
          }
          strong
        />
        {pays.length > 0 && (
          <ul className="mt-3 space-y-1 border-t pt-3 text-sm">
            {pays.map((p) => (
              <li key={p.id} className="flex justify-between">
                <span className="text-muted-foreground">
                  {formatDate(p.paidAt)}
                  {p.method && ` · ${METHOD_LABEL[p.method]}`}
                </span>
                <span>{formatCents(p.amountCents)}</span>
              </li>
            ))}
          </ul>
        )}
        {balance > 0 && (
          <PaymentDialog
            orderId={order.id!}
            balance={balance}
            trigger={<Button className="mt-4 h-12 w-full">Registrar pagamento</Button>}
          />
        )}
      </div>

      <div className="mt-4 space-y-2 px-5">
        {order.status !== "pronto" && order.status !== "entregue" && (
          <Button variant="secondary" className="h-12 w-full" onClick={() => setStatus("pronto")}>
            Marcar como pronto
          </Button>
        )}
        {order.status !== "entregue" && (
          <Button variant="outline" className="h-12 w-full" onClick={() => setStatus("entregue")}>
            Marcar como entregue
          </Button>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="h-12 w-full text-destructive">
              <Trash2 /> Excluir pedido
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir este pedido?</AlertDialogTitle>
              <AlertDialogDescription>
                {pays.length
                  ? `Os ${pays.length} pagamento(s) registrados nele também serão apagados. `
                  : ""}
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={remove}
                className="bg-destructive text-destructive-foreground"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
