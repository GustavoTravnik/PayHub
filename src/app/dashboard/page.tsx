"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Zap,
  LogOut,
  User,
  KeyRound,
  QrCode,
  History,
  ShieldCheck,
  Check,
  AlertCircle,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { PixAccountManager } from "@/components/dashboard/PixAccountManager";
import { PixChargeGenerator } from "@/components/dashboard/PixChargeGenerator";
import { KycCompletionModal } from "@/components/dashboard/KycCompletionModal";
import { formatPixKeyForDisplay } from "@/lib/pix-validation";

export default function DashboardPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  // Estados locais
  const [activeTab, setActiveTab] = useState<"overview" | "profile" | "pix" | "charges">("overview");
  const [nameInput, setNameInput] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccessMessage, setProfileSuccessMessage] = useState("");
  const [profileErrorMessage, setProfileErrorMessage] = useState("");

  // Proteção da rota logada
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.name) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNameInput(session.user.name);
    }
  }, [status, session, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    setIsUpdatingProfile(true);
    setProfileSuccessMessage("");
    setProfileErrorMessage("");

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput.trim() }),
      });

      if (!res.ok) {
        throw new Error("Falha ao salvar dados.");
      }

      // Atualiza a sessão no client
      await update({ name: nameInput.trim() });
      setProfileSuccessMessage("Perfil atualizado com sucesso!");
      setTimeout(() => setProfileSuccessMessage(""), 3000);
    } catch (err) {
      setProfileErrorMessage(err instanceof Error ? err.message : "Erro ao atualizar perfil.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
          <span className="text-sm font-medium">Carregando área protegida...</span>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const user = session.user as { name?: string | null; email?: string | null; image?: string | null; cpf?: string | null; phone?: string | null };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white">PayHub</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Área Autenticada
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Stark Bank Sandbox</span>
            </div>

            {/* Menu Perfil / Logout */}
            <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
              <div className="flex items-center gap-2.5">
                <img
                  src={
                    user.image ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.email || "user")}`
                  }
                  alt={user.name || "Avatar"}
                  className="h-8 w-8 rounded-full border border-slate-700 bg-slate-800 object-cover"
                />
                <div className="hidden md:block text-left">
                  <p className="text-xs font-semibold text-white leading-tight">{user.name || "Usuário"}</p>
                  <p className="text-[10px] text-slate-400 leading-tight truncate max-w-[150px]">{user.email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                title="Sair da Conta"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Banner de Boas-Vindas */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-8 shadow-xl">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Sessão Ativa & Protegida</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Olá, {user.name || "Usuário"}! 👋
              </h1>
              <p className="mt-1 text-sm text-slate-400 max-w-xl">
                Seu hub de pagamentos intermediados com garantia escrow e mascaramento de dados está pronto para operar.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-white transition-all"
              >
                <User className="h-3.5 w-3.5 text-emerald-400" />
                Editar Perfil
              </button>
            </div>
          </div>
        </div>

        {/* Alerta / Modal de Complementação de Cadastro para Stark Bank se faltar CPF ou Telefone */}
        {(!user.cpf || !user.phone) && (
          <KycCompletionModal onComplete={() => router.refresh()} />
        )}

        {/* Abas de Navegação */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "overview"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            Visão Geral
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "profile"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <User className="h-4 w-4" />
            Dados do Perfil
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("pix")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "pix"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <KeyRound className="h-4 w-4" />
            Chaves Pix
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("charges")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "charges"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <QrCode className="h-4 w-4" />
            Cobranças & QR Code
          </button>
        </div>

        {/* Conteúdo da Aba: Visão Geral */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1 */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-medium">Saldo Retido em Escrow</span>
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <Wallet className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-bold text-white">R$ 0,00</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">Aguardando confirmação de entrega</p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-medium">Repasses Efetuados</span>
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-bold text-white">R$ 0,00</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">Liquidados via Stark Bank PixOut</p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-medium">Contas Pix Vinculadas</span>
                  <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <KeyRound className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-bold text-white">Prontas para Receber</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">Configure na aba Chaves Pix</p>
                </div>
              </div>
            </div>

            {/* Banner de Próxima Etapa */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-white">Módulos Prontos para Uso</h3>
                <p className="text-xs text-slate-400">
                  Você já pode vincular chaves Pix para receber repasses ou gerar novas cobranças instantâneas com QR Code.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("pix")}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-all"
                >
                  Cadastrar Chave
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("charges")}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/10"
                >
                  Criar Cobrança
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo da Aba: Dados do Perfil */}
        {activeTab === "profile" && (
          <div className="max-w-2xl space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
              <div className="flex items-center gap-4">
                <img
                  src={
                    user.image ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.email || "user")}`
                  }
                  alt={user.name || "Avatar"}
                  className="h-16 w-16 rounded-2xl border-2 border-emerald-500/30 bg-slate-800 object-cover shadow-md"
                />
                <div>
                  <h3 className="text-lg font-bold text-white">{user.name}</h3>
                  <p className="text-xs text-slate-400">{user.email}</p>
                  <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    <ShieldCheck className="h-3 w-3" /> Conta Verificada
                  </span>
                </div>
              </div>

              {profileSuccessMessage && (
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-xs text-emerald-400 flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>{profileSuccessMessage}</span>
                </div>
              )}

              {profileErrorMessage && (
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 text-xs text-rose-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{profileErrorMessage}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nome de Exibição
                  </label>
                  <input
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Este é o identificador que aparecerá no seu painel.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Endereço de E-mail
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user.email || ""}
                    className="w-full rounded-xl bg-slate-950/50 border border-slate-800/60 px-3.5 py-2.5 text-sm text-slate-400 cursor-not-allowed"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    O e-mail está vinculado à sua conta de autenticação e não pode ser alterado diretamente.
                  </p>
                </div>

                {/* CPF Homologado */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      CPF Homologado (Stark Bank)
                    </label>
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      ✓ BACEN / SPI Aprovado
                    </span>
                  </div>
                  <input
                    type="text"
                    disabled
                    value={user.cpf ? formatPixKeyForDisplay("CPF", user.cpf) : "Pendente de homologação"}
                    className="w-full rounded-xl bg-slate-950/50 border border-slate-800/60 px-3.5 py-2.5 text-sm font-mono text-slate-300 cursor-not-allowed"
                  />
                  <p className="mt-1 text-[10px] text-slate-500 font-mono">
                    No banco: {user.cpf || "não cadastrado"} (gravado estritamente sem máscara)
                  </p>
                </div>

                {/* Celular Homologado */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Celular de Contato
                    </label>
                  </div>
                  <input
                    type="text"
                    disabled
                    value={user.phone ? formatPixKeyForDisplay("PHONE", user.phone) : "Pendente de homologação"}
                    className="w-full rounded-xl bg-slate-950/50 border border-slate-800/60 px-3.5 py-2.5 text-sm font-mono text-slate-300 cursor-not-allowed"
                  />
                  <p className="mt-1 text-[10px] text-slate-500 font-mono">
                    No banco: {user.phone || "não cadastrado"} (gravado estritamente sem máscara)
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs py-2.5 px-5 transition-all shadow-md shadow-emerald-500/10 disabled:opacity-60"
                  >
                    {isUpdatingProfile ? (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent"></div>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Salvar Alterações</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Conteúdo da Aba: Chaves Pix */}
        {activeTab === "pix" && <PixAccountManager />}

        {/* Conteúdo da Aba: Cobranças */}
        {activeTab === "charges" && (
          <PixChargeGenerator onNavigateToPix={() => setActiveTab("pix")} />
        )}
      </div>
    </div>
  );
}
