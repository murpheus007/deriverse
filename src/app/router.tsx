import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppShell } from "./shell";
import { RequireAuth } from "./RequireAuth";
import { DashboardPage } from "../pages/DashboardPage";
import { TradesPage } from "../pages/TradesPage";
import { JournalPage } from "../pages/JournalPage";
import { PortfolioPage } from "../pages/PortfolioPage";
import { SettingsPage } from "../pages/SettingsPage";
import { ConnectWalletPage } from "../pages/ConnectWalletPage";
import { CalendarPage } from "../pages/CalendarPage";

const router = createBrowserRouter([
  {
    path: "/connect",
    element: <ConnectWalletPage />
  },
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "trades", element: <TradesPage /> },
      { path: "journal", element: <JournalPage /> },
      { path: "portfolio", element: <PortfolioPage /> },
      { path: "calendar", element: <CalendarPage /> },
      { path: "settings", element: <SettingsPage /> }
    ]
  }
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}


