import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "../components/ui";
import { Mail, Lock, AlertCircle, LogIn, Heart } from "lucide-react";

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login(email, password);
      navigate("/admin/dashboard");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "שגיאה בהתחברות. בדוק אימייל וסיסמה.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#111827] flex items-center justify-center p-4 relative overflow-hidden font-sans"
    >
      {}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#c9a84c]/5 rounded-full blur-[120px] pointer-events-none"></div>

      <section className="bg-[#0d1b2a]/80 backdrop-blur-xl border border-[#c9a84c]/20 rounded-3xl shadow-2xl shadow-[#c9a84c]/5 w-full max-w-md p-8 sm:p-10 relative z-10 animate-in zoom-in-95 duration-500">
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/30 mb-5 shadow-[0_0_20px_rgba(201,168,76,0.15)]">
            <Heart className="text-[#c9a84c]" size={28} />
          </div>
          <h1 className="text-3xl font-serif text-[#faf6ef] mb-2">
            כניסת <em className="text-[#c9a84c] italic">מנהל</em>
          </h1>
          <p className="text-sm text-white/50 tracking-wide">
            ניהול מוזמנים והזמנות לחתונה
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label
              htmlFor="email"
              className="block text-[11px] uppercase tracking-wider text-white/50 mb-1.5 font-semibold"
            >
              אימייל
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                <Mail size={18} className="text-white/30" />
              </div>
              <input
                id="email"
                type="email"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pr-11 pl-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c] transition-all"
                placeholder="admin@wedding.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                dir="ltr"
                required
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-[11px] uppercase tracking-wider text-white/50 mb-1.5 font-semibold"
            >
              סיסמה
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                <Lock size={18} className="text-white/30" />
              </div>
              <input
                id="password"
                type="password"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pr-11 pl-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c] transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                dir="ltr"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <div
              className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-sm flex items-center gap-2 animate-in slide-in-from-top-2"
              role="alert"
            >
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#c9a84c] to-[#e8c97e] text-[#0d1b2a] py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-[#c9a84c]/20 hover:shadow-[#c9a84c]/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
            >
              {isLoading ? <Spinner size="sm" /> : <LogIn size={20} />}
              {isLoading ? "מתחבר..." : "כניסה למערכת"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
};
