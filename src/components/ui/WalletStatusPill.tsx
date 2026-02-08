import { useState } from "react";
import { useAuth } from "../../app/authProvider";

function shortAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function WalletStatusPill() {
  const { primaryWallet } = useAuth();
  const [copied, setCopied] = useState(false);

  const address = primaryWallet?.address;

  const handleCopy = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-800/70 bg-slate-950/70 px-3 py-1 text-xs text-slate-300">
      <span>{address ? shortAddress(address) : "Connect wallet"}</span>
      {address && (
        <button
          onClick={handleCopy}
          className="rounded-full border border-slate-700/70 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-300 hover:bg-slate-800/80"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      )}
    </div>
  );
}
