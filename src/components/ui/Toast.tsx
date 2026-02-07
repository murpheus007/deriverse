import { cn } from "../../lib/utils/tw";

export function Toast({
  message,
  variant = "info",
  onClose
}: {
  message: string;
  variant?: "info" | "success" | "error";
  onClose?: () => void;
}) {
  const styles = {
    info: "border-slate-300/60 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200",
    success:
      "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
    error: "border-rose-500/40 bg-rose-500/10 text-rose-900 dark:text-rose-100"
  };

  return (
    <div className={cn("rounded-xl border p-3 text-xs", styles[variant])}>
      <div className="flex items-center justify-between gap-3">
        <span>{message}</span>
        {onClose && (
          <button type="button" className="text-xs text-slate-300" onClick={onClose}>
            Close
          </button>
        )}
      </div>
    </div>
  );
}
