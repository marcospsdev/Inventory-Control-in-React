export const formatCurrency = (value: string | number) => {
  const number = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number.isFinite(number) ? number : 0,
  );
};

export const initialsOf = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
