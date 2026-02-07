import { Card, CardBody, CardHeader } from "../ui/Card";
import { formatCurrency, formatPct } from "../../lib/utils/format";
export function SymbolTable({ rows }: { rows: { symbol: string; pnl: number; winRate: number; volume: number; fees: number; trades: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <p className="section-title">Symbol Performance</p>
          <p className="text-xs text-slate-400">Sortable breakdown</p>
        </div>
      </CardHeader>
      <CardBody>
        <table className="table-base">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>PnL</th>
              <th>Win Rate</th>
              <th>Volume</th>
              <th>Fees</th>
              <th>Trades</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.symbol} className="border-t border-slate-800/60">
                <td>{row.symbol}</td>
                <td className={row.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}>
                  {formatCurrency(row.pnl)}
                </td>
                <td>{formatPct(row.winRate)}</td>
                <td>{formatCurrency(row.volume)}</td>
                <td>{formatCurrency(row.fees)}</td>
                <td>{row.trades}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardBody>
    </Card>
  );
}
