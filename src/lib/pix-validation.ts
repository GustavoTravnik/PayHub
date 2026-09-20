export type PixKeyType = "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "EVP";

export const PIX_KEY_LABELS: Record<PixKeyType, string> = {
  CPF: "CPF",
  CNPJ: "CNPJ",
  PHONE: "Celular / Telefone",
  EMAIL: "E-mail",
  EVP: "Chave Aleatória (EVP)",
};

export const PIX_KEY_PLACEHOLDERS: Record<PixKeyType, string> = {
  CPF: "000.000.000-00",
  CNPJ: "00.000.000/0000-00",
  PHONE: "(11) 98765-4321",
  EMAIL: "seu-email@dominio.com",
  EVP: "123e4567-e89b-12d3-a456-426614174000",
};

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function validateCPF(cpfRaw: string): boolean {
  const cpf = onlyDigits(cpfRaw);
  if (cpf.length !== 11) return false;

  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i), 10) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  const digit1 = rev === 10 || rev === 11 ? 0 : rev;
  if (digit1 !== parseInt(cpf.charAt(9), 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i), 10) * (11 - i);
  }
  rev = 11 - (sum % 11);
  const digit2 = rev === 10 || rev === 11 ? 0 : rev;
  return digit2 === parseInt(cpf.charAt(10), 10);
}

export function validateCNPJ(cnpjRaw: string): boolean {
  const cnpj = onlyDigits(cnpjRaw);
  if (cnpj.length !== 14) return false;

  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpj.charAt(i), 10) * weights1[i];
  }
  let rest = sum % 11;
  const digit1 = rest < 2 ? 0 : 11 - rest;
  if (digit1 !== parseInt(cnpj.charAt(12), 10)) return false;

  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpj.charAt(i), 10) * weights2[i];
  }
  rest = sum % 11;
  const digit2 = rest < 2 ? 0 : 11 - rest;
  return digit2 === parseInt(cnpj.charAt(13), 10);
}

export function validatePhone(phoneRaw: string): boolean {
  const digits = onlyDigits(phoneRaw);
  if (digits.length !== 10 && digits.length !== 11) return false;

  const ddd = parseInt(digits.substring(0, 2), 10);
  if (ddd < 11 || ddd > 99) return false;

  if (digits.length === 11) {
    return digits.charAt(2) === "9";
  }

  return true;
}

export function validateEmail(emailRaw: string): boolean {
  const email = emailRaw.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

export function validateEVP(evpRaw: string): boolean {
  const evp = evpRaw.trim().toLowerCase();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(evp);
}

export function validatePixKey(type: PixKeyType, value: string): { isValid: boolean; message?: string } {
  if (!value || !value.trim()) {
    return { isValid: false, message: "A chave Pix é obrigatória." };
  }

  switch (type) {
    case "CPF":
      if (!validateCPF(value)) {
        return { isValid: false, message: "CPF inválido. Verifique os dígitos digitados." };
      }
      return { isValid: true };

    case "CNPJ":
      if (!validateCNPJ(value)) {
        return { isValid: false, message: "CNPJ inválido. Verifique os números digitados." };
      }
      return { isValid: true };

    case "PHONE":
      if (!validatePhone(value)) {
        return { isValid: false, message: "Telefone inválido. Utilize DDD + 9 dígitos para celular." };
      }
      return { isValid: true };

    case "EMAIL":
      if (!validateEmail(value)) {
        return { isValid: false, message: "Formato de e-mail inválido." };
      }
      return { isValid: true };

    case "EVP":
      if (!validateEVP(value)) {
        return { isValid: false, message: "Chave aleatória inválida. Deve seguir o padrão UUID (ex: 8-4-4-4-12 caracteres)." };
      }
      return { isValid: true };

    default:
      return { isValid: false, message: "Tipo de chave Pix desconhecido." };
  }
}

export function maskPixInput(type: PixKeyType, value: string): string {
  if (!value) return "";

  if (type === "CPF") {
    const digits = onlyDigits(value).slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  if (type === "CNPJ") {
    const digits = onlyDigits(value).slice(0, 14);
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  }

  if (type === "PHONE") {
    const digits = onlyDigits(value).slice(0, 11);
    if (digits.length <= 2) return digits.length > 0 ? `(${digits}` : "";
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  if (type === "EVP") {
    const clean = value.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase().slice(0, 36);
    return clean;
  }

  return value.trim();
}

export function unmaskPixKey(type: PixKeyType, value: string): string {
  if (!value) return "";

  switch (type) {
    case "CPF":
    case "CNPJ":
    case "PHONE":
      return onlyDigits(value);

    case "EMAIL":
    case "EVP":
      return value.trim().toLowerCase();

    default:
      return value.trim();
  }
}

export function formatPixKeyForDisplay(type: PixKeyType, unmaskedValue: string): string {
  if (!unmaskedValue) return "";

  if (type === "CPF" && unmaskedValue.length === 11) {
    return `${unmaskedValue.slice(0, 3)}.${unmaskedValue.slice(3, 6)}.${unmaskedValue.slice(6, 9)}-${unmaskedValue.slice(9)}`;
  }

  if (type === "CNPJ" && unmaskedValue.length === 14) {
    return `${unmaskedValue.slice(0, 2)}.${unmaskedValue.slice(2, 5)}.${unmaskedValue.slice(5, 8)}/${unmaskedValue.slice(8, 12)}-${unmaskedValue.slice(12)}`;
  }

  if (type === "PHONE") {
    if (unmaskedValue.length === 11) {
      return `(${unmaskedValue.slice(0, 2)}) ${unmaskedValue.slice(2, 7)}-${unmaskedValue.slice(7)}`;
    }
    if (unmaskedValue.length === 10) {
      return `(${unmaskedValue.slice(0, 2)}) ${unmaskedValue.slice(2, 6)}-${unmaskedValue.slice(6)}`;
    }
  }

  return unmaskedValue;
}
