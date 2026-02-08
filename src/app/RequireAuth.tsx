import { useAuth } from "./authProvider";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-300">
        Loading session...
      </div>
    );
  }

  return <>{children}</>;
}
