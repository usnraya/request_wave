"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { signIn } from "@/app/auth-actions";

const inputClass =
  "mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3 text-[15px] outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const ok = await signIn(password);
      if (!ok) {
        setError("That password is not correct.");
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("That password is not correct.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mt-7 space-y-5" onSubmit={submit}>
      <label className="block text-[13px] font-medium">
        Team password
        <span className="relative mt-1.5 block">
          <input
            required
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
      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full cursor-pointer rounded-full bg-primary px-4 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-[#108513] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
