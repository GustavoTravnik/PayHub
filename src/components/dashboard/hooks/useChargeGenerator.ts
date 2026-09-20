import { useState, useEffect } from "react";
import { PixKeyType } from "@/lib/pix-validation";
import { TransactionDto } from "@/types/dtos/transaction.dto";

interface PixAccount {
  id: string;
  keyType: PixKeyType;
  pixKey: string;
}

const MIN_VALUE = 20;
const MAX_VALUE = 2000;
const PLATFORM_FEE = 1.5;

export function useChargeGenerator() {
  const [pixAccounts, setPixAccounts] = useState<PixAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [rawAmountInput, setRawAmountInput] = useState("50,00");
  const [numericValue, setNumericValue] = useState<number>(50);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [generatedCharge, setGeneratedCharge] = useState<TransactionDto | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadAccounts() {
      try {
        setIsLoadingAccounts(true);
        const res = await fetch("/api/pix-accounts");
        if (res.ok) {
          const data = await res.json();
          const accounts: PixAccount[] = data.accounts || [];
          setPixAccounts(accounts);
          if (accounts.length > 0) {
            setSelectedAccountId(accounts[0].id);
          }
        }
      } catch {
        // Ignored
      } finally {
        setIsLoadingAccounts(false);
      }
    }
    loadAccounts();
  }, []);

  const handleAmountChange = (valInput: string) => {
    const val = valInput.replace(/\D/g, "");
    if (!val) {
      setRawAmountInput("");
      setNumericValue(0);
      return;
    }

    const cents = parseInt(val, 10);
    const floatVal = cents / 100;
    setNumericValue(floatVal);
    setRawAmountInput(
      floatVal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
    setErrorMessage("");
  };

  const handleQuickSelect = (val: number) => {
    setNumericValue(val);
    setRawAmountInput(
      val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
    setErrorMessage("");
  };

  const isBelowMin = numericValue < MIN_VALUE;
  const isAboveMax = numericValue > MAX_VALUE;
  const isValidAmount = numericValue >= MIN_VALUE && numericValue <= MAX_VALUE;
  const netAmount = isValidAmount ? Math.max(0, numericValue - PLATFORM_FEE) : 0;

  const handleCreateCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!selectedAccountId) {
      setErrorMessage("Por favor, selecione uma chave Pix de destino para receber o repasse.");
      return;
    }

    if (isBelowMin) {
      setErrorMessage(`O valor mínimo permitido é de R$ ${MIN_VALUE},00.`);
      return;
    }

    if (isAboveMax) {
      setErrorMessage(`O valor máximo permitido é de R$ ${MAX_VALUE.toLocaleString("pt-BR")},00.`);
      return;
    }

    const amountInCents = Math.round(numericValue * 100);

    try {
      setIsGenerating(true);
      const res = await fetch("/api/charges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pixAccountId: selectedAccountId,
          amountInCents,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao gerar cobrança Pix.");
      }

      setGeneratedCharge(data.transaction);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Falha inesperada ao comunicar com o servidor.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyBrcode = () => {
    if (!generatedCharge?.brcode) return;
    navigator.clipboard.writeText(generatedCharge.brcode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleReset = () => {
    setGeneratedCharge(null);
    setCopied(false);
    setErrorMessage("");
  };

  return {
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
  };
}
