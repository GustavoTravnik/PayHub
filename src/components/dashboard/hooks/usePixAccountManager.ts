import { useState, useEffect, useCallback } from "react";
import { PixKeyType, maskPixInput, unmaskPixKey, validatePixKey } from "@/lib/pix-validation";

export interface PixAccount {
  id: string;
  keyType: PixKeyType;
  pixKey: string;
  createdAt: string;
}

export function usePixAccountManager() {
  const [accounts, setAccounts] = useState<PixAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<PixKeyType>("CPF");
  const [inputValue, setInputValue] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/pix-accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAccounts();
  }, [fetchAccounts]);

  const handleTypeChange = (type: PixKeyType) => {
    setSelectedType(type);
    setInputValue("");
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleInputChange = (raw: string) => {
    const masked = maskPixInput(selectedType, raw);
    setInputValue(masked);
    setErrorMessage("");
  };

  const unmaskedPreview = unmaskPixKey(selectedType, inputValue);
  const liveValidation = inputValue ? validatePixKey(selectedType, inputValue) : null;

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
          pixKey: inputValue,
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
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  };

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

      setAccounts((prev) => prev.filter((acc) => acc.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Falha na exclusão.");
    } finally {
      setDeletingId(null);
    }
  };

  return {
    accounts,
    isLoading,
    isSubmitting,
    selectedType,
    inputValue,
    errorMessage,
    successMessage,
    deletingId,
    unmaskedPreview,
    liveValidation,
    handleTypeChange,
    handleInputChange,
    handleCreatePixAccount,
    handleDelete,
  };
}
