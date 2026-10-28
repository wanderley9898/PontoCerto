import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const formatDisplayDate = (value?: string) => {
  if (!value) return "Selecionar data";

  return format(new Date(value), "dd/MM/yyyy");
};

const formatFullDate = (value?: string) => {
  if (!value) return "-";

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return value;

  const date = new Date(year, month - 1, day);

  return format(date, "EEEE, dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });
};

const parseFilterDate = (value?: string) => {
  if (!value) return undefined;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? undefined : date;
};

function formatDateTimeLocal(value?: string) {
  if (!value) return "";

  const date = new Date(value);

  const pad = (n: number) => String(n).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDateFilter(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const formatter = {
  formatDateFilter,
  formatDateTimeLocal,
  formatDisplayDate,
  formatFullDate,
  parseFilterDate,
};

export { formatter };
