"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Zap,
  ArrowRight,
  Lock,
  CheckCircle2,
  UserPlus,
  LogIn,
  Eye,
  EyeOff,
  Fingerprint,
  Smartphone,
  AlertCircle,
  Database,
} from "lucide-react";
import {
  validateCPF,
  validatePhone,
  maskPixInput,
  unmaskPixKey,
} from "@/lib/pix-validation";

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Redireciona se já estiver autenticado
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskPixInput("CPF", e.target.value);
    setCpf(masked);
    setErrorMessage("");
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskPixInput("PHONE", e.target.value);
    setPhone(masked);
    setErrorMessage("");
  };

  const isCpfValid = cpf ? validateCPF(cpf) : null;
  const isPhoneValid = phone ? validatePhone(phone) : null;

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      setErrorMessage("Erro ao iniciar autenticação com Google.");
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email || !password) {
      setErrorMessage("E-mail e senha são obrigatórios.");
      return;
    }

    if (mode === "register") {
      if (!name || !cpf || !phone) {
        setErrorMessage("Por favor, preencha todos os campos obrigatórios para o cadastro.");
        return;
      }

      if (!validateCPF(cpf)) {
        setErrorMessage("CPF inválido. Verifique os números digitados.");
        return;
      }

      if (!validatePhone(phone)) {
        setErrorMessage("Telefone celular inválido. Digite DDD + 9 dígitos.");
        return;
      }

      if (password.length < 6) {
        setErrorMessage("A senha deve conter no mínimo 6 caracteres.");
        return;
      }

      setIsLoading(true);

      try {
        // 1. Cria usuário na API de cadastro (salvando CPF e Telefone sem máscara)
        const registerRes = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            password,
            cpf,   // O backend aplica unmaskPixKey/onlyDigits
            phone, // O backend aplica unmaskPixKey/onlyDigits
          }),
        });

        const registerData = await registerRes.json();

        if (!registerRes.ok) {
          throw new Error(registerData.error || "Erro ao realizar cadastro.");
        }

        setSuccessMessage("Conta criada com sucesso! Conectando...");

        // 2. Faz login automático
        const loginRes = await signIn("credentials", {
          redirect: false,
          email,
          password,
          callbackUrl: "/dashboard",
        });

        if (loginRes?.error) {
          throw new Error(loginRes.error);
        }

        router.push("/dashboard");
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Falha ao registrar conta.");
        setIsLoading(false);
      }
    } else {
      // Modo Login
      setIsLoading(true);
      try {
        const loginRes = await signIn("credentials", {
          redirect: false,
          email,
          password,
          callbackUrl: "/dashboard",
        });

        if (loginRes?.error) {
          setErrorMessage(loginRes.error || "Credenciais inválidas.");
          setIsLoading(false);
        } else {
          router.push("/dashboard");
        }
      } catch {
        setErrorMessage("Erro inesperado ao conectar.");
        setIsLoading(false);
      }
    }
  };

  const handleQuickDemo = async (demoEmail: string, demoName: string, demoCpf: string) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: demoEmail,
        name: demoName,
        cpf: demoCpf,
        phone: "11987654321",
        isDemo: "true",
        callbackUrl: "/dashboard",
      });

      if (!res?.error) {
        router.push("/dashboard");
      } else {
        setErrorMessage("Erro ao entrar como demo.");
        setIsLoading(false);
      }
    } catch {
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
      {/* Lado Esquerdo: Pitch & Compliance Stark Bank */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 border-r border-slate-800/80 relative overflow-hidden">
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
            Cadastro Completo para <span className="text-emerald-400">Operações Financeiras</span> Homologadas.
          </h2>
          <p className="text-base text-slate-400 leading-relaxed">
            Para garantir total conformidade com a regulamentação do Banco Central e emissão de Pix direto pela Stark Bank, coletamos e validamos sua documentação com segurança e criptografia.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <ShieldCheck className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-slate-200">KYC e Compliance Obrigatório</h4>
                <p className="text-xs text-slate-400">Nome e CPF são necessários para gerar faturas e liquidar repasses bancários reais.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <Lock className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-slate-200">Privacidade entre as Pontas</h4>
                <p className="text-xs text-slate-400">Seus dados são conhecidos apenas pelo PayHub e pela Stark Bank; o outro usuário nunca vê seu CPF.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-slate-200">Armazenamento Canônico Sem Máscara</h4>
                <p className="text-xs text-slate-400">Todos os documentos são sanitizados e guardados em conformidade bancária.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/80 pt-6">
          <span>© 2026 PayHub Payments Inc.</span>
          <span>Ambiente Criptografado & Conforme LGPD</span>
        </div>
      </div>

      {/* Lado Direito: Formulário */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24 overflow-y-auto">
        <div className="mx-auto w-full max-w-md space-y-6">
          {/* Header Mobile */}
          <div className="lg:hidden flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Zap className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">PayHub</span>
          </div>

          <div>
            <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800 mb-5">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
                  setSuccessMessage("");
                }}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === "register"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <UserPlus className="h-3.5 w-3.5" />
                Criar Conta Completa
              </button>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-white">
              {mode === "login" ? "Acesse sua conta" : "Criar Conta Homologada"}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {mode === "login"
                ? "Entre com seu e-mail e senha cadastrados ou via Google."
                : "Preencha seus dados para habilitar pagamentos e repasses via Stark Bank."}
            </p>
          </div>

          {errorMessage && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 text-xs text-rose-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Botão Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-slate-700 bg-slate-900/90 hover:bg-slate-800 text-sm font-semibold text-white transition-all shadow-sm active:scale-[0.99] disabled:opacity-60"
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
              <span>{mode === "login" ? "Continuar com o Google" : "Cadastrar com o Google"}</span>
            </button>

            <div className="relative flex items-center justify-center py-1">
              <div className="w-full border-t border-slate-800"></div>
              <span className="absolute bg-slate-950 px-3 text-[11px] text-slate-500 uppercase tracking-wider font-medium">
                Ou preencha com e-mail
              </span>
            </div>

            {/* Formulário Principal */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === "register" && (
                <>
                  {/* Nome Completo */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nome Completo (Exigido pelo Stark Bank)
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

                  {/* CPF com Máscara e Validação */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-300">
                        CPF (Para emissão e repasses)
                      </label>
                      {cpf && (
                        <span
                          className={`text-[11px] font-semibold ${
                            isCpfValid ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {isCpfValid ? "✓ CPF Válido" : "✗ CPF Inválido"}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={cpf}
                        onChange={handleCpfChange}
                        placeholder="000.000.000-00"
                        className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors font-mono"
                      />
                      <Fingerprint className="absolute right-3 top-3 h-4 w-4 text-slate-500" />
                    </div>
                    {cpf && (
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500">
                        <Database className="h-3 w-3 text-emerald-400" />
                        <span>Salvo no banco sem máscara: <code className="text-emerald-400 font-mono">{unmaskPixKey("CPF", cpf)}</code></span>
                      </div>
                    )}
                  </div>

                  {/* Celular / Telefone */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Celular (com DDD)
                      </label>
                      {phone && (
                        <span
                          className={`text-[11px] font-semibold ${
                            isPhoneValid ? "text-emerald-400" : "text-amber-400"
                          }`}
                        >
                          {isPhoneValid ? "✓ Válido" : "Incompleto"}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={handlePhoneChange}
                        placeholder="(11) 98765-4321"
                        className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors font-mono"
                      />
                      <Smartphone className="absolute right-3 top-3 h-4 w-4 text-slate-500" />
                    </div>
                  </div>
                </>
              )}

              {/* E-mail */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
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

              {/* Senha */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Senha de Acesso
                  </label>
                  {mode === "register" && (
                    <span className="text-[10px] text-slate-500">Mínimo 6 caracteres</span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm py-3 px-4 transition-all shadow-lg shadow-emerald-500/10 active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none mt-2"
              >
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent"></div>
                ) : (
                  <>
                    <span>{mode === "login" ? "Entrar na Conta" : "Finalizar Cadastro Homologado"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Atalho Rápido de Teste (Dev) */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Acesso Rápido de Teste (Dev com CPF)
              </span>
              <span className="text-[10px] text-slate-500">1-Clique</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickDemo("gustavo@payhub.dev", "Gustavo Silva", "52998224725")}
                className="flex flex-col items-start p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-all text-xs group"
              >
                <span className="font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">
                  Gustavo Silva
                </span>
                <span className="text-[10px] text-slate-400">CPF Homologado</span>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickDemo("vendedor.demo@payhub.dev", "Vendedor Demo", "36450624004")}
                className="flex flex-col items-start p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-all text-xs group"
              >
                <span className="font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">
                  Vendedor Demo
                </span>
                <span className="text-[10px] text-slate-400">CPF Homologado</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
