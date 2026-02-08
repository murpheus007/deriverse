import { cn } from "../../lib/utils/tw";

type BadgeVariant = "neutral" | "info" | "positive" | "negative";

export function Badge({
  className,
  children,
  variant = "neutral"
}: {
  className?: string;
  children: React.ReactNode;
  variant?: BadgeVariant;
}) {
  const variantClass =
    variant === "positive"
      ? "badge-positive"
      : variant === "negative"
        ? "badge-negative"
        : variant === "info"
          ? "badge-info"
          : "badge-neutral";

  return <span className={cn("badge", variantClass, className)}>{children}</span>;
}
