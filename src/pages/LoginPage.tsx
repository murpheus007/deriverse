import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../app/authProvider";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Toast } from "../components/ui/Toast";

export function LoginPage() {
  const { signInWithOtp, isAuthenticated, authEnabled } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!authEnabled) {
    return <Navigate to="/" replace />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async () => {
    setError(null);
    setMessage(null);
    setIsLoading(true);
    const result = await signInWithOtp(email);
    setIsLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setMessage("Magic link sent. Check your email to continue.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div>
            <p className="section-title">Sign in</p>
            <p className="text-xs text-slate-400">Use an email magic link to access Deriverse Analytics.</p>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <p className="label">Email</p>
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <Button className="w-full" onClick={handleSubmit} disabled={!email || isLoading}>
            {isLoading ? "Sending..." : "Send Magic Link"}
          </Button>
          {message && <Toast variant="success" message={message} onClose={() => setMessage(null)} />}
          {error && <Toast variant="error" message={error} onClose={() => setError(null)} />}
        </CardBody>
      </Card>
    </div>
  );
}
