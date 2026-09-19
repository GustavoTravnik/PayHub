import Link from "next/link";
import { Zap, ArrowRight, ShieldCheck, Lock, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-100 p-6 font-sans selection:bg-emerald-500 selection:text-slate-950">
      <div className="max-w-2xl w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-8 backdrop-blur-xl">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xl shadow-inner">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">PayHub</h1>
              <p className="text-xs text-slate-400">Hub Intermediador de Pagamentos & Escrow Pix</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/60 px-3.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Sistema Online
          </span>
        </div>

        {/* Hero Pitch */}
        <div className="space-y-3 text-center sm:text-left">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Transações Pix com custódia segura e <span className="text-emerald-400">anonimato mútuo</span>.
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Plataforma que viabiliza compras e repasses entre usuários com retenção temporária (escrow) e integração direta com o Stark Bank.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/login"
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm py-3.5 px-6 transition-all shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.99]"
          >
            <span>Acessar / Criar Conta</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 rounded-2xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-semibold text-sm py-3.5 px-6 transition-all"
          >
            <span>Área Logada</span>
          </Link>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Autenticação</span>
            </div>
            <p className="text-sm font-semibold text-white mt-1.5">NextAuth + Google</p>
            <p className="text-[11px] text-emerald-400 mt-1">✓ Ativo & Validado</p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
              <Lock className="h-4 w-4 text-emerald-400" />
              <span>Custódia Escrow</span>
            </div>
            <p className="text-sm font-semibold text-white mt-1.5">BullMQ + Redis</p>
            <p className="text-[11px] text-emerald-400 mt-1">✓ Fila Pronta</p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Liquidação Pix</span>
            </div>
            <p className="text-sm font-semibold text-white mt-1.5">Stark Bank SDK</p>
            <p className="text-[11px] text-emerald-400 mt-1">✓ Integrado</p>
          </div>
        </div>
      </div>
    </div>
  );
}
