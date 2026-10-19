import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  Search,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/useAuth";

type AuthMode = "signin" | "signup";

export default function Auth() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError("");
    setMessage("");
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      setError("Enter your email and password.");
      return;
    }
    if (mode === "signup" && password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }
    if (mode === "signup" && password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signin") {
        await signIn(normalizedEmail, password);
      } else {
        const result = await signUp(normalizedEmail, password);
        if (result.needsEmailConfirmation) {
          setMessage(
            "Your account request is in. Check your email for a confirmation link before signing in.",
          );
          setMode("signin");
        } else setMessage("Your account has been created successfully.");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
    setMessage("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[minmax(0,1.08fr)_minmax(430px,0.92fr)]">
      <aside className="relative hidden overflow-hidden bg-slate-50 px-10 py-9 lg:flex lg:flex-col xl:px-16">
        <div className="absolute -left-36 top-1/4 h-96 w-96 rounded-full bg-indigo-100/50 blur-3xl" />
        <div className="relative flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
            <BriefcaseBusiness size={19} />
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            ApplyOS
          </span>
        </div>
        <div className="relative my-auto max-w-xl py-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700">
            <Sparkles size={14} />A calmer way to job search
          </span>
          <h1 className="mt-6 max-w-lg text-4xl font-semibold leading-[1.12] tracking-tight text-slate-900 xl:text-5xl">
            Your job search,
            <br />
            <span className="text-indigo-600">under control.</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-slate-600">
            Keep opportunities, follow-ups, and next steps organized in one
            clear workspace.
          </p>
          <div className="mt-8 space-y-3">
            {[
              "Keep every opportunity in one place",
              "Know what needs attention next",
              "See your pipeline at a glance",
            ].map((item) => (
              <p
                key={item}
                className="flex items-center gap-2.5 text-sm font-medium text-slate-700"
              >
                <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check size={12} strokeWidth={3} />
                </span>
                {item}
              </p>
            ))}
          </div>
          <div
            aria-hidden="true"
            className="mt-10 max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.3)]"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  Your workspace
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  A clear view of what’s next
                </p>
              </div>
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                <BriefcaseBusiness size={14} />
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
              <Search size={13} className="text-slate-400" />
              <span className="text-[10px] text-slate-400">
                Find a company or role
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {["Applications", "Follow-ups", "Pipeline"].map(
                (label, index) => (
                  <div
                    key={label}
                    className="rounded-lg border border-slate-100 p-2.5"
                  >
                    <span
                      className={`mb-2 block h-1.5 w-6 rounded-full ${index === 0 ? "bg-indigo-400" : index === 1 ? "bg-amber-400" : "bg-emerald-400"}`}
                    />
                    <span className="text-[9px] font-medium text-slate-500">
                      {label}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
        <p className="relative text-xs text-slate-400">
          Your personal job search workspace
        </p>
      </aside>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[390px]">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white">
              <BriefcaseBusiness size={19} />
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              ApplyOS
            </span>
          </div>
          <div className="mb-7">
            <h2 className="text-[26px] font-semibold tracking-tight text-slate-900">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {mode === "signin"
                ? "Sign in to pick up where you left off."
                : "Start organizing your job search with ApplyOS."}
            </p>
          </div>
          <form
            onSubmit={(event) => void handleSubmit(event)}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="auth-email"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                Email address
              </label>
              <input
                id="auth-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={loading}
                required
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 disabled:opacity-60"
              />
            </div>
            <div>
              <label
                htmlFor="auth-password"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    mode === "signin" ? "current-password" : "new-password"
                  }
                  placeholder={
                    mode === "signup"
                      ? "At least 8 characters"
                      : "Enter your password"
                  }
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={loading}
                  minLength={mode === "signup" ? 8 : undefined}
                  required
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((show) => !show)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {mode === "signup" && (
              <div>
                <label
                  htmlFor="auth-confirm-password"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Confirm password
                </label>
                <input
                  id="auth-confirm-password"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={loading}
                  required
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 disabled:opacity-60"
                />
              </div>
            )}
            {error && (
              <p
                role="alert"
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700"
              >
                {error}
              </p>
            )}
            {message && (
              <p
                role="status"
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800"
              >
                {message}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <LoaderCircle size={17} className="animate-spin" />}
              {loading
                ? "Please wait…"
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
              <ArrowRight size={16} />
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            {mode === "signin" ? "New to ApplyOS?" : "Already have an account?"}{" "}
            <button
              type="button"
              disabled={loading}
              onClick={() =>
                changeMode(mode === "signin" ? "signup" : "signin")
              }
              className="font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
          <p className="mt-8 text-center text-[11px] leading-5 text-slate-400">
            By continuing, you agree to use ApplyOS to organize your job search.
            Your account is secured with Supabase authentication.
          </p>
        </div>
      </section>
    </main>
  );
}
