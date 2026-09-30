import type { ReactNode } from "react";

interface TableProps {
  children: ReactNode;
  className?: string;
}

interface TableCellProps {
  children: ReactNode;
  // true renderiza <th>, false renderiza <td>.
  isHeader?: boolean;
  className?: string;
}

const Table = ({ children, className = "" }: TableProps) => {
  return <table className={`min-w-full ${className}`}>{children}</table>;
};

const TableHeader = ({ children, className }: TableProps) => {
  return <thead className={className}>{children}</thead>;
};

const TableBody = ({ children, className }: TableProps) => {
  return <tbody className={className}>{children}</tbody>;
};

const TableRow = ({ children, className }: TableProps) => {
  return <tr className={className}>{children}</tr>;
};

const TableCell = ({
  children,
  isHeader = false,
  className = "",
}: TableCellProps) => {
  const CellTag = isHeader ? "th" : "td";
  return <CellTag className={className}>{children}</CellTag>;
};

export { Table, TableHeader, TableBody, TableRow, TableCell };
