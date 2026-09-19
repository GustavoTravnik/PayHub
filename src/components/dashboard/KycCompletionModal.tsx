"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Fingerprint,
  Smartphone,
  Check,
  Database,
  Lock,
} from "lucide-react";
import {
  validateCPF,
  validatePhone,
  maskPixInput,
  unmaskPixKey,
} from "@/lib/pix-validation";

export function KycCompletionModal({ onComplete }: { onComplete?: () => void }) {
  const { data: session, update } = useSession();

  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(maskPixInput("CPF", e.target.value));
    setErrorMessage("");
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(maskPixInput("PHONE", e.target.value));
    setErrorMessage("");
  };

  const isCpfValid = cpf ? validateCPF(cpf) : null;
  const isPhoneValid = phone ? validatePhone(phone) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!validateCPF(cpf)) {
      setErrorMessage("CPF inválido. Verifique os números digitados.");
      return;
    }

    if (!validatePhone(phone)) {
      setErrorMessage("Celular inválido. Digite DDD + 9 dígitos.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/user/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cpf,   // O backend aplica onlyDigits/unmaskPixKey
          phone, // O backend aplica onlyDigits/unmaskPixKey
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar documentação.");
      }

      setSuccessMessage("Documentação homologada com sucesso!");

      // Atualiza a sessão NextAuth do cliente
      await update({
        cpf: unmaskPixKey("CPF", cpf),
        phone: unmaskPixKey("PHONE", phone),
      });

      if (onComplete) {
        setTimeout(onComplete, 1500);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erro inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Requisito Obrigatório Stark Bank
            </span>
            <h3 className="text-lg font-bold text-white mt-1">Homologue seu CPF e Telefone</h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Lock className="h-4 w-4 text-emerald-400" />
          <span>Privacidade Garantida</span>
        </div>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
        Como você se conectou com sua conta Google, precisamos apenas que confirme seu <b>CPF</b> e <b>Celular</b> para autorizar a criação de cobranças Pix e o recebimento de repasses com custódia garantida.
      </p>

      {errorMessage && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* CPF */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Seu CPF:
            </label>
            {cpf && (
              <span
                className={`text-[10px] font-semibold ${
                  isCpfValid ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {isCpfValid ? "✓ CPF Válido" : "✗ Dígitos Inválidos"}
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
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors font-mono"
            />
            <Fingerprint className="absolute right-3 top-3 h-4 w-4 text-slate-500" />
          </div>
          {cpf && (
            <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500 font-mono">
              <Database className="h-3 w-3 text-emerald-400" />
              <span>Sem máscara: {unmaskPixKey("CPF", cpf)}</span>
            </div>
          )}
        </div>

        {/* Telefone */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Celular com DDD:
            </label>
            {phone && (
              <span
                className={`text-[10px] font-semibold ${
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
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors font-mono"
            />
            <Smartphone className="absolute right-3 top-3 h-4 w-4 text-slate-500" />
          </div>
        </div>

        <div className="sm:col-span-2 flex items-center justify-between pt-2">
          <span className="text-[11px] text-slate-500">
            * Seus dados são salvos em conformidade estrita com o BACEN e Stark Bank.
          </span>
          <button
            type="submit"
            disabled={isSubmitting || !isCpfValid || !isPhoneValid}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs py-2.5 px-5 transition-all shadow-md shadow-emerald-500/10 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent"></div>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Salvar e Homologar Conta</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
