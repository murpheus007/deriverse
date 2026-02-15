import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../app/authProvider";
import { Button } from "./Button";

function shortAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function WalletStatusPill() {
  const { primaryWallet } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const address = primaryWallet?.address;

  const handleCopy = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  if (!address) {
    return (
      <Button onClick={() => navigate("/connect")} className="px-4 py-2">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 7h16v10H4z" />
          <path d="M7 10h.01" />
          <path d="M16 10h.01" />
          <path d="M2 7h2" />
          <path d="M20 7h2" />
          <path d="M6 17h12" />
        </svg>
        Connect Wallet
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-800/70 bg-slate-950/70 px-3 py-1 text-xs text-slate-300">
      <span className="inline-flex items-center gap-1.5">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 7h16v10H4z" />
          <path d="M7 10h.01" />
          <path d="M16 10h.01" />
        </svg>
        {shortAddress(address)}
      </span>
      <button
        onClick={handleCopy}
        className="rounded-full border border-slate-700/70 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-300 hover:bg-slate-800/80"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
