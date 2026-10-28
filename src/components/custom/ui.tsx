import {
  PAY_LABEL,
  STATUS_LABEL,
  balanceCents,
  formatCents,
  formatDate,
  isLate,
  payState,
  type PayState,
} from "@/lib/atelie";
import type { Order, OrderStatus, Payment } from "@/lib/db";
import type { AppData } from "@/lib/use-data";
import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import { cva } from "class-variance-authority";
import {
  CalendarDays,
  Home,
  Scissors,
  Users,
  Wallet,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

const NAV: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/", label: "Início", icon: Home },
  { to: "/pedidos", label: "Pedidos", icon: Scissors },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/financeiro", label: "Financeiro", icon: Wallet },
];

function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const u = () => setOnline(navigator.onLine);
    u();
    window.addEventListener("online", u);
    window.addEventListener("offline", u);
    return () => {
      window.removeEventListener("online", u);
      window.removeEventListener("offline", u);
    };
  }, []);
  return online;
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const online = useOnline();
  return (
    <div className="mx-auto min-h-screen max-w-xl pb-28">
      {!online && (
        <div className="flex items-center justify-center gap-2 bg-muted px-4 py-1.5 text-xs text-muted-foreground">
          <WifiOff className="size-3.5" /> Sem internet — tudo continua funcionando neste aparelho
        </div>
      )}
      {children}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur">
        <ul className="mx-auto grid max-w-xl grid-cols-5">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? path === "/" || path === "/ajustes" : path.startsWith(to);
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={cn(
                    "flex flex-col items-center gap-1 pt-2.5 pb-1 text-[11px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "rounded-full px-4 py-1 transition-colors",
                      active && "bg-accent",
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-end justify-between gap-3 px-5 pt-7 pb-4">
      <div>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        <h1 className="text-3xl font-semibold">{title}</h1>
      </div>
      {action}
    </header>
  );
}

const pill = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      tone: {
        pendente: "bg-muted text-muted-foreground",
        andamento: "bg-info/15 text-info",
        pronto: "bg-secondary text-secondary-foreground",
        entregue: "bg-success/15 text-success",
        late: "bg-destructive/12 text-destructive",
        pago: "bg-success/15 text-success",
        parcial: "bg-warning/25 text-warning-foreground",
        sem: "bg-accent text-accent-foreground",
      },
    },
  },
);

export const StatusBadge = ({ status }: { status: OrderStatus }) => (
  <span className={pill({ tone: status })}>{STATUS_LABEL[status]}</span>
);
export const PayBadge = ({ state }: { state: PayState }) => (
  <span className={pill({ tone: state })}>{PAY_LABEL[state]}</span>
);
export const LateBadge = () => <span className={pill({ tone: "late" })}>Atrasado</span>;

export function OrderCard({ order, data }: { order: Order; data: AppData }) {
  const late = isLate(order);
  const balance = balanceCents(order, data.payments);
  return (
    <Link
      to="/pedidos/$id"
      params={{ id: String(order.id) }}
      className={cn(
        "block rounded-xl border bg-card p-4 shadow-soft transition active:scale-[0.99]",
        late && "border-l-4 border-l-destructive",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">
            {data.customerById.get(order.customerId)?.name ?? "Cliente"}
          </p>
          <p className="truncate text-sm text-muted-foreground">{order.description}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {late ? <LateBadge /> : <StatusBadge status={order.status} />}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className={cn("text-muted-foreground", late && "font-medium text-destructive")}>
          Entrega {formatDate(order.dueDate, { day: "2-digit", month: "short" })}
        </span>
        {balance > 0 ? (
          <span className="font-medium text-accent-foreground">Falta {formatCents(balance)}</span>
        ) : (
          <PayBadge state={payState(order, data.payments)} />
        )}
      </div>
    </Link>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  text,
  children,
}: {
  icon: LucideIcon;
  title: string;
  text?: string | undefined;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed px-6 py-10 text-center">
      <span className="mb-3 rounded-full bg-accent p-3 text-accent-foreground">
        <Icon className="size-6" />
      </span>
      <p className="font-medium">{title}</p>
      {text && <p className="mt-1 text-sm text-muted-foreground">{text}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export const Loading = () => (
  <div className="p-10 text-center text-sm text-muted-foreground">Carregando…</div>
);

export function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="px-5 pt-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export type { Payment };
