import { useState, FormEvent } from "react";
import { 
  HeartPulse, 
  User as UserIcon, 
  Lock, 
  Mail, 
  ArrowRight, 
  Info, 
  Loader2, 
  KeyRound,
  ShieldAlert
} from "lucide-react";
import { motion } from "motion/react";

interface AuthViewProps {
  onLogin: (username: string, password: string) => Promise<void>;
  onRegister: (username: string, email: string, password: string) => Promise<void>;
}

export function AuthView({ onLogin, onRegister }: AuthViewProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!username || !password) {
      setErrorMsg("Please complete all required fields.");
      return;
    }

    if (!isLogin && !email) {
      setErrorMsg("Please provide a valid email address.");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await onLogin(username.trim(), password);
      } else {
        await onRegister(username.trim(), email.trim(), password);
        setSuccessMsg("Registration successful! You can now log in using your newly generated credentials.");
        setIsLogin(true);
        setPassword("");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  const fillQuickCredentials = () => {
    setErrorMsg("");
    setSuccessMsg("");
    setUsername("john_doe");
    setPassword("john123");
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-teal-50/20 px-4 py-12 font-sans selection:bg-teal-600 selection:text-white" id="auth-root-container">
      <div className="w-full max-w-md space-y-6">
        
        {/* Logo and title */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-100">
            <HeartPulse className="h-7 w-7" id="auth-logo-icon" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-black tracking-tight text-gray-950">
              PsoriCare <span className="text-teal-600 font-extrabold">AI</span>
            </h1>
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-600 font-mono">
              Clinical Assessment Companion
            </p>
          </div>
        </div>

        {/* Card wrapper */}
        <motion.div 
          layout
          className="rounded-3xl border border-teal-50 bg-white p-8 shadow-xl shadow-teal-950/5 relative overflow-hidden"
          id="auth-form-card"
        >
          {/* Top banner accent */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-teal-600" />

          <h2 className="font-display text-lg font-bold text-gray-950">
            {isLogin ? "Patient Login" : "Patient Registration"}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {isLogin 
              ? "Access your dermatological screening tools, daily logs, and AI consults." 
              : "Register to track your flare-ups, calculate PASI, and run AI analyses."}
          </p>

          {/* Messages Alert */}
          {errorMsg && (
            <div className="mt-4 rounded-lg bg-red-50 border border-red-100 p-3 text-xs text-red-700 font-semibold" id="auth-error">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mt-4 rounded-lg bg-teal-50 border border-teal-100 p-3 text-xs text-teal-700 font-semibold" id="auth-success">
              {successMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4" id="auth-login-register-form">
            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative rounded-lg bg-teal-50/30 border border-teal-100/50 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 transition">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-600/70" />
                <input
                  type="text"
                  placeholder="e.g. john_doe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-lg bg-transparent py-2.5 pl-10 pr-3.5 text-xs text-gray-800 focus:outline-none"
                  required
                  id="auth-username-input"
                />
              </div>
            </div>

            {/* Email (only on Register) */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative rounded-lg bg-teal-50/30 border border-teal-100/50 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 transition">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-600/70" />
                  <input
                    type="email"
                    placeholder="e.g. john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg bg-transparent py-2.5 pl-10 pr-3.5 text-xs text-gray-800 focus:outline-none"
                    required
                    id="auth-email-input"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative rounded-lg bg-teal-50/30 border border-teal-100/50 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 transition">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-600/70" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg bg-transparent py-2.5 pl-10 pr-3.5 text-xs text-gray-800 focus:outline-none"
                  required
                  id="auth-password-input"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-teal-600/10 hover:bg-teal-700 active:scale-98 transition disabled:opacity-50"
              id="btn-auth-submit"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Authenticating Session...
                </>
              ) : (
                <>
                  <span>{isLogin ? "Sign In" : "Register Patient Profile"}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick-Fill Credentials Box (Developer Experience Booster!) */}
          {isLogin && (
            <div className="mt-5 rounded-xl border border-teal-50 bg-teal-50/20 p-4">
              <div className="flex items-center gap-1.5 text-teal-800">
                <KeyRound className="h-3.5 w-3.5 text-teal-600" />
                <span className="font-mono text-[9px] font-bold text-teal-700 uppercase tracking-widest">
                  Demonstration Account
                </span>
              </div>
              <p className="text-[10px] text-teal-800/70 mt-1">
                Log in as a pre-populated skin-assessment patient to review historical clinical charts and logs.
              </p>
              <button
                type="button"
                onClick={fillQuickCredentials}
                className="mt-3 w-full rounded-lg border border-teal-100 bg-white px-3 py-2 text-[11px] font-bold text-teal-800 hover:bg-teal-50 active:scale-95 transition text-left flex items-center justify-between"
                id="btn-quick-fill-john"
              >
                <div>
                  <span className="block text-teal-500 uppercase text-[8px] font-mono leading-none">Demonstration Patient</span>
                  <span className="block mt-1 font-semibold text-teal-900">Patient: john_doe</span>
                </div>
                <span className="text-[10px] text-teal-500 bg-teal-50 px-1.5 py-0.5 rounded font-mono font-medium">Auto Fill</span>
              </button>
            </div>
          )}

          {/* Switch toggle link */}
          <div className="mt-5 pt-4 border-t border-gray-100 text-center text-xs">
            <span className="text-gray-400">
              {isLogin ? "Don't have an account?" : "Already registered?"}
            </span>{" "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className="font-bold text-teal-600 hover:underline hover:text-teal-700 transition"
              id="btn-auth-switch"
            >
              {isLogin ? "Register patient profile" : "Sign in to patient workspace"}
            </button>
          </div>
        </motion.div>

        {/* Legal medical disclaimer */}
        <div className="text-center rounded-xl border border-dashed border-teal-200 bg-transparent p-4 flex items-start gap-2.5">
          <ShieldAlert className="h-4.5 w-4.5 text-teal-600 shrink-0 mt-0.5" />
          <p className="text-[10px] text-teal-800 leading-relaxed text-left">
            <strong>Clinical Safety Notice:</strong> PsoriCare AI is an experimental AI-assisted screening platform designed to support personal skin education and symptom logs. It is not an FDA-approved diagnostic tool and must not be used to replace direct diagnostic consulting or medical treatment with a qualified healthcare specialist.
          </p>
        </div>
      </div>
    </div>
  );
}
