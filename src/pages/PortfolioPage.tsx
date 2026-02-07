import { useMemo } from "react";
import { useFills } from "../lib/storage/hooks";
import { deriveTradesFromFills, symbolBreakdown } from "../lib/analytics";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { formatCurrency, formatPct } from "../lib/utils/format";

export function PortfolioPage() {
  const { data: fills = [] } = useFills({ limit: 10000 });
  const trades = useMemo(() => deriveTradesFromFills(fills), [fills]);
  const symbols = symbolBreakdown(trades);
  const totalVolume = symbols.reduce((sum, row) => sum + row.volume, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div>
            <p className="section-title">Portfolio Overview</p>
            <p className="text-xs text-slate-400">Allocation derived from historical fills</p>
          </div>
        </CardHeader>
        <CardBody>
          <table className="table-base">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Allocation</th>
                <th>Volume</th>
                <th>PnL</th>
              </tr>
            </thead>
            <tbody>
              {symbols.map((row) => (
                <tr key={row.symbol} className="border-t border-slate-800/60">
                  <td>{row.symbol}</td>
                  <td>{formatPct(totalVolume === 0 ? 0 : row.volume / totalVolume)}</td>
                  <td>{formatCurrency(row.volume)}</td>
                  <td className={row.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}>
                    {formatCurrency(row.pnl)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
