import { cn } from "../../lib/utils/tw";

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={cn("badge", className)}>{children}</span>;
}
