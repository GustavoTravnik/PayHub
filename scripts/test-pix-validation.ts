import {
  validateCPF,
  validateCNPJ,
  validatePhone,
  validateEmail,
  validateEVP,
  maskPixInput,
  unmaskPixKey,
} from "../src/lib/pix-validation";

console.log("--- TESTES DE VALIDAÇÃO PIX ---");

// Teste CPF (Algoritmo Oficial)
const validCPF = "52998224725"; // CPF com dígitos verificadores matematicamente válidos
const invalidCPF = "11111111111"; // Sequência repetida inválida
const wrongDigitCPF = "52998224720"; // Dígito verificador incorreto

console.log("CPF Válido (52998224725):", validateCPF(validCPF));
console.log("CPF Inválido repetido (11111111111):", validateCPF(invalidCPF));
console.log("CPF Dígito errado (52998224720):", validateCPF(wrongDigitCPF));

// Teste CNPJ (Algoritmo Oficial)
const validCNPJ = "11222333000181"; // CNPJ matematicamente válido
const wrongCNPJ = "11222333000100";
console.log("CNPJ Válido (11222333000181):", validateCNPJ(validCNPJ));
console.log("CNPJ Inválido (11222333000100):", validateCNPJ(wrongCNPJ));

// Teste Telefone Celular
console.log("Telefone Celular SP válido ((11) 98765-4321):", validatePhone("(11) 98765-4321"));
console.log("Telefone sem 9 dígitos (11 8765-4321 celular):", validatePhone("1187654321"));

// Teste Sanitização Sem Máscara (Regra de Banco)
console.log("\n--- TESTE DE DESMASCARAMENTO (GRAVAÇÃO NO BANCO) ---");
console.log("CPF Desmascarado:", unmaskPixKey("CPF", "529.982.247-25"), "-> Tamanho:", unmaskPixKey("CPF", "529.982.247-25").length);
console.log("CNPJ Desmascarado:", unmaskPixKey("CNPJ", "11.222.333/0001-81"), "-> Tamanho:", unmaskPixKey("CNPJ", "11.222.333/0001-81").length);
console.log("Telefone Desmascarado:", unmaskPixKey("PHONE", "(11) 98765-4321"), "-> Tamanho:", unmaskPixKey("PHONE", "(11) 98765-4321").length);
console.log("E-mail Desmascarado:", unmaskPixKey("EMAIL", "  User.TEST@Dominio.COM  "));
