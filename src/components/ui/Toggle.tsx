import { cn } from "../../lib/utils/tw";

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={checked}
      className={cn(
        "toggle flex items-center gap-3 rounded-full px-3 py-1.5 text-xs",
        checked && "toggle-active"
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "toggle-track h-4 w-8 rounded-full transition",
          checked && "toggle-track-active"
        )}
      >
        <span
          className={cn(
            "toggle-thumb block h-4 w-4 rounded-full transition",
            checked && "translate-x-4"
          )}
        />
      </span>
    </button>
  );
}
