import { useEffect, useMemo, useState } from "react";
import { useFills } from "../lib/storage/hooks";
import { deriveTradesFromFills, symbolBreakdown } from "../lib/analytics";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { formatCurrency, formatPct } from "../lib/utils/format";

export function PortfolioPage() {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const update = () => setIsCompact(media.matches);
    update();
    if ("addEventListener" in media) {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }
    media.addListener(update);
    return () => media.removeListener(update);
  }, []);
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
          {isCompact ? (
            <div className="space-y-3">
              {symbols.map((row) => (
                <div
                  key={row.symbol}
                  className="rounded-lg border border-slate-800/70 p-3 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          row.pnl >= 0 ? "bg-emerald-400" : "bg-rose-400"
                        }`}
                      />
                      <p className="font-semibold text-slate-100">{row.symbol}</p>
                    </div>
                    <div className={row.pnl >= 0 ? "text-profit" : "text-loss"}>
                      {formatCurrency(row.pnl)}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-300">
                    <span>
                      Allocation: {formatPct(totalVolume === 0 ? 0 : row.volume / totalVolume)}
                    </span>
                    <span>Volume: {formatCurrency(row.volume)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="table-scroll">
              <table className="table-base whitespace-nowrap">
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
                      <td className="flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            row.pnl >= 0 ? "bg-emerald-400" : "bg-rose-400"
                          }`}
                        />
                        {row.symbol}
                      </td>
                      <td className={row.pnl >= 0 ? "text-profit" : "text-loss"}>
                        {formatPct(totalVolume === 0 ? 0 : row.volume / totalVolume)}
                      </td>
                      <td>{formatCurrency(row.volume)}</td>
                      <td className={row.pnl >= 0 ? "text-profit" : "text-loss"}>
                        {formatCurrency(row.pnl)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
