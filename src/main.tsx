import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import { AppProviders } from "./app/providers";
import { AppRouter } from "./app/router";

const redirectParam = new URLSearchParams(window.location.search).get("_redirect");
if (redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")) {
  window.history.replaceState(null, "", redirectParam);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders>
      <AppRouter />
    </AppProviders>
  </React.StrictMode>
);
