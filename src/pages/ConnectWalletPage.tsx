import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Toast } from "../components/ui/Toast";
import { useAuth } from "../app/authProvider";

function shortAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function toBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

export function ConnectWalletPage() {
  const navigate = useNavigate();
  const { publicKey, signMessage, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const { linkedWallets, createNonce, verifyWalletLink, refreshLinkedWallets, isLoading } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);

  const walletAddress = useMemo(() => publicKey?.toBase58() ?? null, [publicKey]);

  useEffect(() => {
    if (!isLoading && linkedWallets.length > 0) {
      navigate("/");
    }
  }, [isLoading, linkedWallets.length, navigate]);

  const handleConnect = () => {
    setVisible(true);
  };

  const handleSign = async () => {
    if (!walletAddress) {
      setError("Connect a wallet to continue.");
      return;
    }
    if (!signMessage) {
      setError("This wallet does not support message signing.");
      return;
    }

    setIsSigning(true);
    setError(null);
    setStatus("Requesting nonce...");
    try {
      const { nonce, message } = await createNonce(walletAddress);
      const encoded = new TextEncoder().encode(message);
      const signature = await signMessage(encoded);
      const signatureBase64 = toBase64(signature);
      setStatus("Verifying signature...");
      await verifyWalletLink({ walletAddress, nonce, message, signature: signatureBase64 });
      await refreshLinkedWallets();
      setStatus("Wallet linked. Redirecting...");
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to link wallet.");
      setStatus(null);
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950/95 text-slate-100">
      <div className="container-app flex min-h-screen items-center justify-center py-12">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <div>
              <p className="section-title">Connect wallet</p>
              <p className="text-xs text-slate-400">
                Connect a Solana wallet and sign a message to activate your account.
              </p>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="rounded-xl border border-slate-800/70 bg-slate-950/60 px-4 py-3 text-sm text-slate-300">
              {walletAddress ? (
                <div className="flex items-center justify-between">
                  <span>Connected: {shortAddress(walletAddress)}</span>
                  <Button variant="ghost" onClick={() => disconnect()}>
                    Disconnect
                  </Button>
                </div>
              ) : (
                <span>No wallet connected</span>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleConnect}>Connect wallet</Button>
              <Button variant="secondary" onClick={handleSign} disabled={!walletAddress || isSigning}>
                {isSigning ? "Signing..." : "Sign message to continue"}
              </Button>
            </div>
            <p className="text-xs text-slate-400">
              We never ask for your seed phrase or private keys. Signing proves wallet ownership only.
            </p>
            {status && <Toast variant="info" message={status} onClose={() => setStatus(null)} />}
            {error && <Toast variant="error" message={error} onClose={() => setError(null)} />}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}


