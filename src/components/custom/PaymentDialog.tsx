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
import {
  METHOD_LABEL,
  centsToInput,
  formatCents,
  parseMoney,
  todayISO,
  validatePayment,
} from "@/lib/atelie";
import { db, type PaymentMethod } from "@/lib/db";
import { useState } from "react";
import { toast } from "sonner";

export function PaymentDialog({
  orderId,
  balance,
  trigger,
}: {
  orderId: number;
  balance: number;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [method, setMethod] = useState<PaymentMethod | undefined>("pix");
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const cents = parseMoney(amount);
    const err = validatePayment(cents, balance) ?? (date ? null : "Informe a data.");
    if (err) return setError(err);
    await db.payments.add({ orderId, amountCents: cents!, paidAt: date, method });
    toast.success(`Pagamento de ${formatCents(cents!)} registrado`);
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setAmount(centsToInput(balance));
          setDate(todayISO());
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Registrar pagamento</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Saldo restante: {formatCents(balance)}</p>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pv">Valor recebido (R$)</Label>
            <Input
              id="pv"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-12 text-lg"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pd">Data</Label>
            <Input
              id="pd"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-12"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Forma (opcional)</Label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(METHOD_LABEL) as PaymentMethod[]).map((m) => (
                <Button
                  key={m}
                  type="button"
                  variant={method === m ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMethod(method === m ? undefined : m)}
                >
                  {METHOD_LABEL[m]}
                </Button>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="h-12 w-full text-base" onClick={save}>
            Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
