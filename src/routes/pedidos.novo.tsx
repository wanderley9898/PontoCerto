import { OrderForm } from "@/components/custom/OrderForm";
import { PageHeader } from "@/components/custom/ui";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/pedidos/novo")({
  head: () => ({
    meta: [
      { title: "Novo pedido — Ateliê" },
      { name: "description", content: "Registre uma encomenda com cliente, prazo, valor e sinal." },
      { property: "og:title", content: "Novo pedido — Ateliê" },
      {
        property: "og:description",
        content: "Registre uma encomenda com cliente, prazo, valor e sinal.",
      },
    ],
  }),
  component: () => (
    <>
      <PageHeader title="Novo pedido" />
      <OrderForm />
    </>
  ),
});
