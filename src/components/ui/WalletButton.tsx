import { useWallet } from "@solana/wallet-adapter-react";
import type { WalletName } from "@solana/wallet-adapter-base";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "./Button";

function shortAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function WalletButton() {
  const { publicKey, disconnect, wallets, select, connect } = useWallet();
  const { setVisible } = useWalletModal();

  const handleConnect = async () => {
    const readyWallets = wallets.filter((wallet) => wallet.readyState === "Installed");
    if (readyWallets.length === 1) {
      const walletName = readyWallets[0]?.adapter?.name as WalletName;
      if (walletName) {
        try {
          select(walletName);
          await connect();
          return;
        } catch {
          // fall back to modal
        }
      }
    }
    setVisible(true);
  };

  if (!publicKey) {
    return (
      <Button variant="secondary" onClick={handleConnect}>
        Connect Wallet
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" onClick={() => setVisible(true)}>
        {shortAddress(publicKey.toBase58())}
      </Button>
      <Button variant="ghost" onClick={() => disconnect()}>
        Disconnect
      </Button>
    </div>
  );
}
