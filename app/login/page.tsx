import Image from "next/image";
import { LoginForm } from "@/components/auth/login-form";
import cobee from "@/cobee/Cobee 02.png";
import timedoorLogo from "@/timedoor-academy-2022-black-green.png";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center overflow-x-hidden bg-background px-4 py-8">
      <div className="relative w-full max-w-md pt-24 sm:pt-28">
        <div className="cobee-wave pointer-events-none absolute left-1/2 top-0 z-0 w-36 sm:w-48">
          <Image
            src={cobee}
            alt=""
            sizes="(min-width: 640px) 192px, 144px"
            className="block h-auto w-full"
          />
        </div>
        <section className="relative z-10 w-full rounded-2xl border border-border bg-card p-6 shadow-lg shadow-[#2e263d]/[0.05] sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <span className="rounded-md bg-white px-1.5 py-1">
              <Image src={timedoorLogo} alt="Timedoor Academy" sizes="120px" className="h-auto w-28 max-w-full object-contain" />
            </span>
            <span className="pt-2 text-sm font-semibold tracking-tight">Request Wave</span>
          </div>
          <h1 className="mt-10 text-center text-3xl font-medium tracking-tight">Welcome back</h1>
          <p className="mt-2 text-center text-[15px] text-muted-foreground">Sign in to review creative team&apos;s activity.</p>
          <LoginForm />
        </section>
      </div>
    </main>
  );
}

export const metadata = { title: "Sign in | Request Wave" };
