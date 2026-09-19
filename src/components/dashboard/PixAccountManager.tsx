"use client";

import { useState, useEffect } from "react";
import {
  KeyRound,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Database,
  Smartphone,
  Mail,
  Fingerprint,
  Building2,
  Binary,
} from "lucide-react";
import {
  PixKeyType,
  PIX_KEY_LABELS,
  PIX_KEY_PLACEHOLDERS,
  maskPixInput,
  unmaskPixKey,
  validatePixKey,
  formatPixKeyForDisplay,
} from "@/lib/pix-validation";

interface PixAccount {
  id: string;
  keyType: PixKeyType;
  pixKey: string;
  createdAt: string;
}

export function PixAccountManager() {
  const [accounts, setAccounts] = useState<PixAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<PixKeyType>("CPF");
  const [inputValue, setInputValue] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Carrega as chaves ao montar
  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/pix-accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch (err) {
      console.error("Erro ao buscar contas Pix:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Quando o tipo selecionado muda, limpa o input e mensagens
  const handleTypeChange = (type: PixKeyType) => {
    setSelectedType(type);
    setInputValue("");
    setErrorMessage("");
    setSuccessMessage("");
  };

  // Aplica máscara dinamicamente enquanto digita
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const masked = maskPixInput(selectedType, raw);
    setInputValue(masked);
    setErrorMessage("");
  };

  // Preview de como será persistido no banco (sem máscara)
  const unmaskedPreview = unmaskPixKey(selectedType, inputValue);
  const liveValidation = inputValue ? validatePixKey(selectedType, inputValue) : null;

  // Submissão
  const handleCreatePixAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const validation = validatePixKey(selectedType, inputValue);
    if (!validation.isValid) {
      setErrorMessage(validation.message || "Chave Pix inválida.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/pix-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyType: selectedType,
          pixKey: inputValue, // O backend também aplicará unmaskPixKey garantindo integridade
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao cadastrar chave Pix.");
      }

      setSuccessMessage("Chave Pix cadastrada com sucesso e salva sem máscara!");
      setInputValue("");
      await fetchAccounts();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Erro inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Exclusão Lógica
  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja desativar esta chave Pix?")) return;

    try {
      setDeletingId(id);
      const res = await fetch(`/api/pix-accounts?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Erro ao excluir conta Pix.");
      }

      // Remove da listagem visual (já que foi soft-deleted)
      setAccounts((prev) => prev.filter((acc) => acc.id !== id));
    } catch (err: any) {
      alert(err.message || "Falha na exclusão.");
    } finally {
      setDeletingId(null);
    }
  };

  const getTypeIcon = (type: PixKeyType) => {
    switch (type) {
      case "CPF":
        return <Fingerprint className="h-4 w-4" />;
      case "CNPJ":
        return <Building2 className="h-4 w-4" />;
      case "PHONE":
        return <Smartphone className="h-4 w-4" />;
      case "EMAIL":
        return <Mail className="h-4 w-4" />;
      case "EVP":
        return <Binary className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Formulário de Cadastro */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Cadastrar Nova Chave Pix</h2>
              <p className="text-xs text-slate-400">
                Selecione o tipo, valide os dados e vincule sua conta de repasse.
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-[11px] text-emerald-400 font-medium">
            <Database className="h-3.5 w-3.5" />
            <span>Persistência estrita sem máscara</span>
          </div>
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

        <form onSubmit={handleCreatePixAccount} className="space-y-6">
          {/* Seletor de Tipo de Chave */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Escolha o Tipo de Chave Pix:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {(["CPF", "CNPJ", "PHONE", "EMAIL", "EVP"] as PixKeyType[]).map((type) => {
                const isSelected = selectedType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleTypeChange(type)}
                    className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-sm shadow-emerald-500/5"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                    }`}
                  >
                    {getTypeIcon(type)}
                    <span>{PIX_KEY_LABELS[type].split("/")[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Campo de Entrada com Máscara e Validação */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Valor da Chave ({PIX_KEY_LABELS[selectedType]}):
              </label>
              {liveValidation && (
                <span
                  className={`text-[11px] flex items-center gap-1 font-medium ${
                    liveValidation.isValid ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {liveValidation.isValid ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" /> Chave válida
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3" /> Formato incompleto ou inválido
                    </>
                  )}
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type={selectedType === "EMAIL" ? "email" : "text"}
                value={inputValue}
                onChange={handleInputChange}
                placeholder={PIX_KEY_PLACEHOLDERS[selectedType]}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors font-mono"
              />
              <div className="absolute right-3 top-3.5 text-slate-500">
                {getTypeIcon(selectedType)}
              </div>
            </div>

            {/* Preview de gravação no banco sem máscara */}
            {inputValue && (
              <div className="mt-2.5 flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs">
                <Database className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="text-slate-400">Gravado no banco sem máscara:</span>
                <code className="text-emerald-400 font-mono font-semibold">{unmaskedPreview}</code>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !inputValue}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs py-3 px-6 transition-all shadow-md shadow-emerald-500/10 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent"></div>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Cadastrar Chave Pix</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Listagem de Chaves Pix Cadastradas */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white">Chaves Pix Cadastradas</h3>
            <p className="text-xs text-slate-400">
              Contas aptas a receber ordens de transferência (PixOut) após liquidação do escrow.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
            {accounts.length} {accounts.length === 1 ? "chave ativa" : "chaves ativas"}
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
            <span className="text-xs">Carregando chaves cadastradas...</span>
          </div>
        ) : accounts.length === 0 ? (
          <div className="py-12 text-center space-y-2 border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
            <ShieldCheck className="h-8 w-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">Nenhuma chave Pix cadastrada</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Cadastre sua primeira chave Pix no formulário acima para habilitar o recebimento dos seus repasses.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 shrink-0">
                    {getTypeIcon(account.keyType)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {account.keyType}
                      </span>
                      <span className="text-sm font-mono font-semibold text-white">
                        {formatPixKeyForDisplay(account.keyType, account.pixKey)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-mono">
                      <span>No Banco: {account.pixKey}</span>
                      <span>•</span>
                      <span>Cadastrada em {new Date(account.createdAt).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    disabled={deletingId === account.id}
                    onClick={() => handleDelete(account.id)}
                    title="Excluir logicamente"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all disabled:opacity-50"
                  >
                    {deletingId === account.id ? (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-rose-400 border-t-transparent"></div>
                    ) : (
                      <>
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Desativar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
