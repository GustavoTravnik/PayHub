"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShieldCheck, Zap, ArrowRight, Lock, CheckCircle2, UserPlus, LogIn } from "lucide-react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Redireciona automaticamente se já estiver autenticado
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (err: any) {
      setErrorMessage("Erro ao iniciar autenticação com Google.");
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage("Por favor, preencha o e-mail.");
      return;
    }
    if (mode === "register" && !name) {
      setErrorMessage("Por favor, informe seu nome.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        name: name || email.split("@")[0],
        isNewUser: mode === "register" ? "true" : "false",
        callbackUrl: "/dashboard",
      });

      if (res?.error) {
        setErrorMessage("Não foi possível autenticar: " + res.error);
        setIsLoading(false);
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setErrorMessage("Erro inesperado ao conectar.");
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (demoEmail: string, demoName: string) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: demoEmail,
        name: demoName,
        callbackUrl: "/dashboard",
      });

      if (!res?.error) {
        router.push("/dashboard");
      } else {
        setErrorMessage("Erro ao entrar como demo.");
        setIsLoading(false);
      }
    } catch (err) {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
          <span>Verificando sessão...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
      {/* Lado Esquerdo: Apresentação da Plataforma */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 border-r border-slate-800/80 relative overflow-hidden">
        {/* Glow de fundo */}
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight text-white">PayHub</span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Stark Bank BaaS
              </span>
            </div>
          </div>
        </div>

        <div className="relative z-10 my-auto max-w-lg space-y-6">
          <h2 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
            Pagamentos e Repasses Pix com <span className="text-emerald-400">Privacidade Total</span> e Escrow.
          </h2>
          <p className="text-base text-slate-400 leading-relaxed">
            Transacione com segurança sem que comprador e vendedor exponham dados pessoais ou bancários. Custódia garantida e liquidação instantânea.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <ShieldCheck className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-slate-200">Identidade Mascarada</h4>
                <p className="text-xs text-slate-400">Nenhum dado sensível como CPF ou dados bancários é exibido entre as partes.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <Lock className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-slate-200">Garantia de Custódia (Escrow)</h4>
                <p className="text-xs text-slate-400">O pagamento fica seguro na plataforma até que o produto ou serviço seja concluído.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-slate-200">Repasse Instantâneo via SPI</h4>
                <p className="text-xs text-slate-400">Conexão direta com a infraestrutura do Banco Central via Stark Bank.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/80 pt-6">
          <span>© 2026 PayHub Payments Inc.</span>
          <span>Ambiente Seguro & Homologado</span>
        </div>
      </div>

      {/* Lado Direito: Formulário de Autenticação */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md space-y-8">
          {/* Header Mobile / Brand */}
          <div className="lg:hidden flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Zap className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">PayHub</span>
          </div>

          <div>
            <div className="inline-flex rounded-lg bg-slate-900 p-1 border border-slate-800 mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMessage("");
                }}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  mode === "login"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <LogIn className="h-3.5 w-3.5" />
                Entrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setErrorMessage("");
                }}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  mode === "register"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <UserPlus className="h-3.5 w-3.5" />
                Criar Conta
              </button>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-white">
              {mode === "login" ? "Bem-vindo de volta" : "Crie sua conta no PayHub"}
            </h2>
            <p className="mt-1.5 text-sm text-slate-400">
              {mode === "login"
                ? "Acesse seu painel para gerenciar cobranças e transferências."
                : "Comece a receber pagamentos com privacidade e split automático."}
            </p>
          </div>

          {errorMessage && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 text-xs text-rose-400 flex items-center gap-2">
              <span className="font-semibold">Erro:</span> {errorMessage}
            </div>
          )}

          <div className="space-y-4">
            {/* Botão Google OAuth Oficial */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-slate-700 bg-slate-900/90 hover:bg-slate-800 text-sm font-semibold text-white transition-all shadow-sm active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.4 8.9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.6 7.2C.6 9.2 0 11.5 0 14s.6 4.8 1.6 6.8l3.7-2.9c0-.4 0-.8 0-1.2z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5.1L1.6 16.1C3.5 19.9 7.4 23 12 23z"
                />
              </svg>
              Continuar com o Google
            </button>

            <div className="relative flex items-center justify-center py-2">
              <div className="w-full border-t border-slate-800"></div>
              <span className="absolute bg-slate-950 px-3 text-xs text-slate-500 uppercase tracking-wider font-medium">
                Ou acesse com e-mail
              </span>
            </div>

            {/* Formulário de Acesso / Cadastro */}
            <form onSubmit={handleEmailAuth} className="space-y-3.5">
              {mode === "register" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Gustavo Silva"
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Endereço de E-mail
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm py-3 px-4 transition-all shadow-lg shadow-emerald-500/10 active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none"
              >
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent"></div>
                ) : (
                  <>
                    <span>{mode === "login" ? "Entrar no PayHub" : "Completar Cadastro"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Atalhos Rápidos para Teste Imediato (Dev Friendly) */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Acesso Rápido de Teste (Dev)
              </span>
              <span className="text-[10px] text-slate-500">1-Clique</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickDemo("gustavo@payhub.dev", "Gustavo Silva")}
                className="flex flex-col items-start p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-all text-xs group"
              >
                <span className="font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">
                  Gustavo Silva
                </span>
                <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                  gustavo@payhub.dev
                </span>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickDemo("vendedor.demo@payhub.dev", "Vendedor Demo")}
                className="flex flex-col items-start p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-all text-xs group"
              >
                <span className="font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">
                  Vendedor Demo
                </span>
                <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                  vendedor@payhub.dev
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
