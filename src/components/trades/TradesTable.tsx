import { useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  getFilteredRowModel
} from "@tanstack/react-table";
import type { TradeFill, DerivedTrade } from "../../types/trades";
import { formatCurrency, formatNumber, formatPct } from "../../lib/utils/format";

export type TradeTableMode = "fills" | "derived";

type FillRow = TradeFill & { rowType: "fill" };

type DerivedRow = DerivedTrade & { rowType: "derived" };

export function TradesTable({
  fills,
  derived,
  mode,
  search,
  onRowClick
}: {
  fills: TradeFill[];
  derived: DerivedTrade[];
  mode: TradeTableMode;
  search: string;
  onRowClick?: (row: FillRow | DerivedRow) => void;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const data = useMemo(() => {
    return mode === "fills"
      ? fills.map((fill) => ({ ...fill, rowType: "fill" as const }))
      : derived.map((trade) => ({ ...trade, rowType: "derived" as const }));
  }, [fills, derived, mode]);

  const columns = useMemo<ColumnDef<FillRow | DerivedRow>[]>(() => {
    if (mode === "fills") {
      return [
        { accessorKey: "ts", header: "Timestamp" },
        { accessorKey: "symbol", header: "Symbol" },
        { accessorKey: "marketType", header: "Market" },
        { accessorKey: "side", header: "Side" },
        {
          accessorKey: "qty",
          header: "Qty",
          cell: (info) => formatNumber(Number(info.getValue()))
        },
        {
          accessorKey: "price",
          header: "Price",
          cell: (info) => formatCurrency(Number(info.getValue()))
        },
        {
          accessorKey: "fee",
          header: "Fee",
          cell: (info) => formatCurrency(Number(info.getValue()))
        },
        { accessorKey: "orderType", header: "Order" }
      ];
    }

    return [
      { accessorKey: "closeTs", header: "Close" },
      { accessorKey: "symbol", header: "Symbol" },
      { accessorKey: "side", header: "Side" },
      {
        accessorKey: "qty",
        header: "Qty",
        cell: (info) => formatNumber(Number(info.getValue()))
      },
      {
        accessorKey: "pnl",
        header: "PnL",
        cell: (info) => formatCurrency(Number(info.getValue()))
      },
      {
        accessorKey: "returnPct",
        header: "Return",
        cell: (info) => formatPct(Number(info.getValue()))
      },
      {
        accessorKey: "totalFees",
        header: "Fees",
        cell: (info) => formatCurrency(Number(info.getValue()))
      },
      {
        accessorKey: "durationSec",
        header: "Duration",
        cell: (info) => `${Math.round(Number(info.getValue()) / 60)}m`
      }
    ];
  }, [mode]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter: search },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _, value) => {
      const raw = JSON.stringify(row.original).toLowerCase();
      return raw.includes(String(value).toLowerCase());
    }
  });

  return (
    <div className="overflow-x-auto">
      <table className="table-base">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  <button
                    className="flex items-center gap-2"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {{
                      asc: "?",
                      desc: "?"
                    }[header.column.getIsSorted() as string] ?? null}
                  </button>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="cursor-pointer border-t border-slate-800/60 hover:bg-slate-900/60"
              onClick={() => onRowClick?.(row.original)}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
