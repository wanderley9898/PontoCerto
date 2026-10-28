import { OrderForm } from "@/components/custom/OrderForm";
import { Loading, PageHeader } from "@/components/custom/ui";
import { useData } from "@/lib/use-data";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/editar/$id")({
  head: () => ({
    meta: [
      { title: "Editar pedido — Ateliê" },
      { name: "description", content: "Altere os dados de uma encomenda." },
      { property: "og:title", content: "Editar pedido — Ateliê" },
      { property: "og:description", content: "Altere os dados de uma encomenda." },
    ],
  }),
  component: Edit,
});

function Edit() {
  const { id } = Route.useParams();
  const data = useData();
  if (!data) return <Loading />;
  const order = data.orders.find((o) => o.id === Number(id));
  if (!order) return <p className="p-10 text-center">Pedido não encontrado.</p>;
  return (
    <>
      <PageHeader title="Editar pedido" />
      <OrderForm existing={order} />
    </>
  );
}
