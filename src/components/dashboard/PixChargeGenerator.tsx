"use client";

import {
  QrCode,
  Copy,
  Check,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  Info,
  Clock,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { formatPixKeyForDisplay } from "@/lib/pix-validation";
import { useChargeGenerator } from "./hooks/useChargeGenerator";

export function PixChargeGenerator({ onNavigateToPix }: { onNavigateToPix?: () => void }) {
  const {
    pixAccounts,
    selectedAccountId,
    setSelectedAccountId,
    rawAmountInput,
    numericValue,
    isLoadingAccounts,
    isGenerating,
    errorMessage,
    generatedCharge,
    copied,
    handleAmountChange,
    handleQuickSelect,
    handleCreateCharge,
    handleCopyBrcode,
    handleReset,
    netAmount,
  } = useChargeGenerator();

  const MIN_VALUE = 20;
  const MAX_VALUE = 2000;
  const PLATFORM_FEE = 1.5;

  const isBelowMin = numericValue < MIN_VALUE;
  const isAboveMax = numericValue > MAX_VALUE;
  const isValidAmount = numericValue >= MIN_VALUE && numericValue <= MAX_VALUE;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {generatedCharge ? (
        <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-10 shadow-2xl space-y-8 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <QrCode className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Stark Bank Dynamic Pix
                </span>
                <h2 className="text-xl font-bold text-white mt-1">Cobrança Gerada com Sucesso!</h2>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold border border-amber-500/20">
              <Clock className="h-3.5 w-3.5 animate-pulse" />
              Aguardando Pagamento
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white border border-slate-200 shadow-xl">
              <img
                src={generatedCharge.qrCode ?? undefined}
                alt="QR Code Pix"
                className="h-60 w-60 object-contain rounded-lg"
              />
              <p className="mt-3 text-xs font-medium text-slate-600 text-center">
                Aponte a câmera do aplicativo do seu banco para pagar
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-xs font-medium text-slate-400">Valor Total a Pagar</p>
                <p className="text-3xl font-extrabold text-white tracking-tight mt-0.5">
                  R$ {(generatedCharge.amount / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Taxa da Plataforma PayHub:</span>
                  <span className="text-slate-300 font-mono">
                    - R$ {(generatedCharge.fee / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between font-semibold border-t border-slate-800/80 pt-2 text-slate-200">
                  <span>Valor Líquido do Repasse:</span>
                  <span className="text-emerald-400 font-mono text-sm">
                    R$ {(generatedCharge.netAmount / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 pt-1 text-[11px]">
                  <span>ID Stark Bank:</span>
                  <span className="font-mono text-slate-500 truncate max-w-[150px]">
                    {generatedCharge.starkBankInvoiceId}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  Código Pix &quot;Copia e Cola&quot;:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedCharge.brcode ?? ""}
                    className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-xs text-slate-400 font-mono focus:outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyBrcode}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md ${
                      copied
                        ? "bg-emerald-500 text-slate-950 shadow-emerald-500/20"
                        : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800 pt-6">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Garantia de Custódia Escrow ativa até confirmação</span>
            </div>

            <button
               type="button"
               onClick={handleReset}
               className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-all"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Emitir Outra Cobrança</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-10 backdrop-blur-sm shadow-xl space-y-8">
          <div className="flex items-center gap-3.5 border-b border-slate-800 pb-6">
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <QrCode className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Criar Nova Cobrança Pix</h2>
              <p className="text-xs text-slate-400">
                Gere um Pix dinâmico com QR Code e código copia e cola com garantia de custódia.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 text-xs text-rose-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!isLoadingAccounts && pixAccounts.length === 0 ? (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-6 text-center space-y-4">
              <KeyRound className="h-8 w-8 text-amber-400 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Nenhuma chave Pix cadastrada</h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  Para gerar cobranças e receber seus repasses automáticos com segurança, você precisa primeiro cadastrar uma chave Pix.
                </p>
              </div>
              <button
                type="button"
                onClick={onNavigateToPix}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/10"
              >
                <span>Cadastrar Minha Primeira Chave</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateCharge} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  1. Selecione a Chave Pix de Destino (Recebedor do Repasse):
                </label>

                {isLoadingAccounts ? (
                  <div className="h-12 w-full rounded-xl bg-slate-950 animate-pulse border border-slate-800"></div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {pixAccounts.map((account) => {
                      const isSelected = selectedAccountId === account.id;
                      return (
                        <button
                          key={account.id}
                          type="button"
                          onClick={() => setSelectedAccountId(account.id)}
                          className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                            isSelected
                              ? "bg-emerald-500/10 border-emerald-500/50 text-white shadow-sm shadow-emerald-500/5"
                              : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                              {account.keyType}
                            </span>
                            <span className="text-xs font-mono text-slate-200 font-medium">
                              {formatPixKeyForDisplay(account.keyType, account.pixKey)}
                            </span>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-emerald-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300">
                    2. Digite o Valor da Cobrança:
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Mínimo: <b className="text-slate-200 font-mono">R$ 20,00</b> • Máximo:{" "}
                    <b className="text-slate-200 font-mono">R$ 2.000,00</b>
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-base font-bold text-slate-400">
                    R$
                  </span>
                  <input
                    type="text"
                    required
                    value={rawAmountInput}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0,00"
                    className={`w-full rounded-2xl bg-slate-950 border px-12 py-3 text-2xl font-bold text-white font-mono placeholder-slate-600 focus:outline-none transition-colors ${
                      isBelowMin || isAboveMax
                        ? "border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                        : "border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    }`}
                  />
                </div>

                {isBelowMin && (
                  <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1 font-medium">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Valor abaixo do mínimo permitido (R$ 20,00).
                  </p>
                )}
                {isAboveMax && (
                  <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1 font-medium">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Valor acima do máximo permitido (R$ 2.000,00).
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mt-3">
                  {[20, 50, 100, 250, 500, 1000, 2000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleQuickSelect(val)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                        numericValue === val
                          ? "bg-emerald-500 text-slate-950"
                          : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                      }`}
                    >
                      R$ {val.toLocaleString("pt-BR")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  Simulação de Repasse & Retenção
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Valor cobrado do comprador:</span>
                    <span className="font-mono text-slate-200 font-semibold">
                      R$ {numericValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span className="flex items-center gap-1">
                      Taxa de Intermediação & BaaS:
                      <Info className="h-3 w-3 text-slate-500" />
                    </span>
                    <span className="font-mono text-rose-400">
                      - R$ {PLATFORM_FEE.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="border-t border-slate-800 pt-2.5 flex justify-between items-center text-sm font-bold">
                    <span className="text-white">Valor Líquido a Receber:</span>
                    <span className="text-emerald-400 font-mono text-base">
                      R$ {netAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>
                    O valor é guardado em garantia (escrow) e repassado automaticamente via Pix para a sua chave após liquidação.
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isGenerating || !isValidAmount || !selectedAccountId}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm py-4 px-6 transition-all shadow-lg shadow-emerald-500/10 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
              >
                {isGenerating ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent"></div>
                ) : (
                  <>
                    <QrCode className="h-5 w-5" />
                    <span>Gerar QR Code Pix Dinâmico</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
