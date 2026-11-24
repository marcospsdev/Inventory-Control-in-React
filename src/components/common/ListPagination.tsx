import { TablePagination } from "@mui/material";

interface ListPaginationProps {
  total: number;
  page: number;
  limit: number;
  limitOptions: number[];
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export const ListPagination = ({ total, page, limit, limitOptions, onPageChange, onLimitChange }: ListPaginationProps) => (
  <TablePagination
    component="div"
    count={total}
    page={page}
    rowsPerPage={limit}
    rowsPerPageOptions={limitOptions}
    onPageChange={(_, value) => onPageChange(value)}
    onRowsPerPageChange={(event) => onLimitChange(Number(event.target.value))}
    labelRowsPerPage="Itens por página"
    labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
    getItemAriaLabel={(type) => (type === "next" ? "Próxima página" : type === "previous" ? "Página anterior" : type === "first" ? "Primeira página" : "Última página")}
  />
);
