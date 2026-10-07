"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { signIn, signInAsViewer } from "@/app/auth-actions";

const inputClass =
  "mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3 text-[15px] outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20";
const primaryButton =
  "h-11 w-full cursor-pointer rounded-full bg-primary px-4 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-[#108513] disabled:cursor-not-allowed disabled:opacity-60";

export function LoginForm() {
  const router = useRouter();
  const [adminMode, setAdminMode] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function run(attempt: () => Promise<boolean>, failure: string) {
    setError("");
    setPending(true);
    try {
      if (!(await attempt())) {
        setError(failure);
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError(failure);
    } finally {
      setPending(false);
    }
  }

  function submitAdmin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(() => signIn(password), "That password is not correct.");
  }

  if (!adminMode) {
    return (
      <div className="mt-7 space-y-4">
        <button
          type="button"
          disabled={pending}
          onClick={() => void run(signInAsViewer, "Could not sign in. Please try again.")}
          className={primaryButton}
        >
          {pending ? "Signing in…" : "Continue as viewer"}
        </button>
        {error && <p className="text-center text-[13px] text-destructive" role="alert">{error}</p>}
        <button
          type="button"
          onClick={() => { setAdminMode(true); setError(""); }}
          className="block w-full cursor-pointer text-center text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          Admin? Sign in with password
        </button>
      </div>
    );
  }

  return (
    <form className="mt-7 space-y-5" onSubmit={submitAdmin}>
      <label className="block text-[13px] font-medium">
        Admin password
        <span className="relative mt-1.5 block">
          <input
            required
            autoFocus
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={`${inputClass} pr-11`}
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((visible) => !visible)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </span>
      </label>
      {error && <p className="text-[13px] text-destructive" role="alert">{error}</p>}
      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Signing in…" : "Sign in as admin"}
      </button>
      <button
        type="button"
        onClick={() => { setAdminMode(false); setError(""); setPassword(""); }}
        className="block w-full cursor-pointer text-center text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        Back to viewer sign in
      </button>
    </form>
  );
}
