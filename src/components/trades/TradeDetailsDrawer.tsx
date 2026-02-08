import { useEffect, useMemo, useState } from "react";
import { Drawer } from "../ui/Drawer";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Badge } from "../ui/Badge";
import type { TradeFill, DerivedTrade } from "../../types/trades";
import { formatDateTime } from "../../lib/utils/dates";

export function TradeDetailsDrawer({
  open,
  onClose,
  trade,
  annotation,
  onSave
}: {
  open: boolean;
  onClose: () => void;
  trade: TradeFill | DerivedTrade | null;
  annotation: { notes: string; tags: string[] } | null;
  onSave: (notes: string, tags: string[]) => void;
}) {
  const [notes, setNotes] = useState(annotation?.notes ?? "");
  const [tags, setTags] = useState(annotation?.tags.join(", ") ?? "");

  useEffect(() => {
    setNotes(annotation?.notes ?? "");
    setTags(annotation?.tags.join(", ") ?? "");
  }, [annotation, trade]);

  const derivedTitle = useMemo(() => {
    if (!trade) return "Trade";
    const symbol = "symbol" in trade ? trade.symbol : "Trade";
    return `${symbol} Annotation`;
  }, [trade]);

  if (!trade) return null;
  const isFill = "ts" in trade;
  const title = isFill ? `${trade.symbol} Fill` : `${trade.symbol} Trade`;

  return (
    <Drawer open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-sm">
          {isFill ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <p className="text-slate-400">Timestamp</p>
                <p>{formatDateTime(trade.ts)}</p>
              </div>
              <div>
                <p className="text-slate-400">Market</p>
                <p className="capitalize">{trade.marketType}</p>
              </div>
              <div>
                <p className="text-slate-400">Side</p>
                <p className="uppercase">{trade.side}</p>
              </div>
              <div>
                <p className="text-slate-400">Price</p>
                <p>{trade.price.toFixed(2)}</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <p className="text-slate-400">Open</p>
                <p>{formatDateTime(trade.openTs)}</p>
              </div>
              <div>
                <p className="text-slate-400">Close</p>
                <p>{formatDateTime(trade.closeTs)}</p>
              </div>
              <div>
                <p className="text-slate-400">Entry / Exit</p>
                <p>{trade.entryPrice.toFixed(2)} → {trade.exitPrice.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-slate-400">PnL</p>
                <p className={trade.pnl >= 0 ? "text-profit" : "text-loss"}>
                  {trade.pnl.toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </div>
        {isFill && (
          <>
            <div>
              <p className="label">Notes</p>
              <textarea
                className="input min-h-[120px]"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
            <div>
              <p className="label">Tags (comma separated)</p>
              <Input value={tags} onChange={(event) => setTags(event.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              {tags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean)
                .map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
            </div>
            <Button
              onClick={() =>
                onSave(notes, tags.split(",").map((tag) => tag.trim()).filter(Boolean))
              }
            >
              Save Annotation
            </Button>
          </>
        )}
      </div>
    </Drawer>
  );
}
