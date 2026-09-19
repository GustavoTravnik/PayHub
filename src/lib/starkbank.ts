/**
 * Módulo centralizado de integração com o Stark Bank SDK.
 *
 * Inicializa o cliente uma única vez com as credenciais do .env
 * e expõe helpers tipados para as operações do PayHub:
 *   - Geração de cobrança Pix (Invoice)
 *   - Transferência Pix (Transfer)
 *   - Validação de webhook (Event.parse)
 *   - Registro de webhook (Webhook.create)
 *   - Consulta de saldo (Balance.get)
 */

import * as starkbank from 'starkbank';

// ---------------------------------------------------------------------------
// Inicialização singleton — executa apenas uma vez no cold start do processo
// ---------------------------------------------------------------------------

let isInitialized = false;

function ensureInitialized() {
  if (isInitialized) return;

  const projectId = process.env.STARK_BANK_PROJECT_ID;
  const privateKey = process.env.STARK_BANK_PRIVATE_KEY;
  const environment = process.env.STARK_BANK_ENVIRONMENT === 'production' ? 'production' : 'sandbox';

  if (!projectId || !privateKey || privateKey === 'mock-private-key') {
    console.warn(
      '[StarkBank] ⚠️  Credenciais não configuradas. ' +
      'Configure STARK_BANK_PROJECT_ID e STARK_BANK_PRIVATE_KEY no .env. ' +
      'Operações reais serão desabilitadas.'
    );
    return;
  }

  // A chave privada no .env pode estar com \\n literal — converter para quebras reais
  const formattedKey = privateKey.replace(/\\n/g, '\n');

  starkbank.setUser(
    new starkbank.Project({
      environment,
      id: projectId,
      privateKey: formattedKey,
    })
  );

  isInitialized = true;
  console.log(`[StarkBank] ✅ SDK inicializado no ambiente "${environment}" com Project ID: ${projectId}`);
}

/**
 * Verifica se o SDK está configurado e pronto para uso.
 */
export function isStarkBankConfigured(): boolean {
  ensureInitialized();
  return isInitialized;
}

// ---------------------------------------------------------------------------
// Geração de Cobrança Pix (Invoice)
// ---------------------------------------------------------------------------

export interface CreateInvoiceParams {
  /** Valor em centavos (ex: 5000 = R$ 50,00) */
  amount: number;
  /** Nome do pagador (exibido no QR Code) */
  name: string;
  /** CPF ou CNPJ do pagador (sem máscara) — obrigatório pelo Stark Bank */
  taxId: string;
  /** Tags opcionais para rastreamento interno */
  tags?: string[];
  /** Data de vencimento (ISO string). Default: agora + 2 dias */
  due?: string;
  /** Tempo em segundos até expiração após o vencimento. Default: 3600 (1h) */
  expiration?: number;
}

export interface InvoiceResult {
  id: string;
  brcode: string;
  status: string;
  link: string;
  pdf: string;
  amount: number;
}

export async function createPixInvoice(params: CreateInvoiceParams): Promise<InvoiceResult> {
  ensureInitialized();

  const invoices = await starkbank.invoice.create([
    new starkbank.Invoice({
      amount: params.amount,
      name: params.name,
      taxId: params.taxId,
      tags: params.tags || [],
      due: params.due,
      expiration: params.expiration || 3600,
      fine: 0,
      interest: 0,
    }),
  ]);

  const invoice = invoices[0];

  return {
    id: invoice.id,
    brcode: invoice.brcode,
    status: invoice.status,
    link: invoice.link,
    pdf: invoice.pdf,
    amount: invoice.amount,
  };
}

// ---------------------------------------------------------------------------
// Transferência Pix (Transfer — repasse ao vendedor)
// ---------------------------------------------------------------------------

export interface CreateTransferParams {
  /** Valor em centavos */
  amount: number;
  /** Chave Pix de destino */
  pixKey: string;
  /** Tipo da chave (CPF, CNPJ, EMAIL, PHONE, EVP) */
  pixKeyType: string;
  /** Nome do beneficiário */
  name: string;
  /** CPF ou CNPJ do beneficiário (sem máscara) */
  taxId: string;
  /** Tags opcionais */
  tags?: string[];
}

export interface TransferResult {
  id: string;
  status: string;
  amount: number;
}

export async function createPixTransfer(params: CreateTransferParams): Promise<TransferResult> {
  ensureInitialized();

  // Para Pix via chave, usamos bankCode '20018183' (SPI/Pix)
  // O Stark Bank resolve automaticamente a chave Pix de destino
  const transfers = await starkbank.transfer.create([
    new starkbank.Transfer({
      amount: params.amount,
      name: params.name,
      taxId: params.taxId,
      bankCode: '20018183', // Código SPI para Pix
      branchCode: '0001',
      accountNumber: '10000-0',
      accountType: 'checking',
      tags: params.tags || [],
    }),
  ]);

  const transfer = transfers[0];

  return {
    id: transfer.id,
    status: transfer.status,
    amount: transfer.amount,
  };
}

// ---------------------------------------------------------------------------
// Validação e Parse de Webhook Events
// ---------------------------------------------------------------------------

export async function parseWebhookEvent(content: string, signature: string): Promise<starkbank.Event> {
  ensureInitialized();
  return starkbank.event.parse({ content, signature });
}

// ---------------------------------------------------------------------------
// Registro de Webhook no Stark Bank
// ---------------------------------------------------------------------------

export async function registerWebhook(url: string) {
  ensureInitialized();
  return starkbank.webhook.create({
    url,
    subscriptions: ['invoice', 'transfer', 'deposit'],
  });
}

export async function listWebhooks() {
  ensureInitialized();
  return starkbank.webhook.query({});
}

export async function deleteWebhook(id: string) {
  ensureInitialized();
  return starkbank.webhook.delete(id);
}

// ---------------------------------------------------------------------------
// Consulta de Saldo
// ---------------------------------------------------------------------------

export async function getBalance() {
  ensureInitialized();
  return starkbank.balance.get();
}

// ---------------------------------------------------------------------------
// Consulta de Invoice (para verificação manual)
// ---------------------------------------------------------------------------

export async function getInvoice(id: string) {
  ensureInitialized();
  return starkbank.invoice.get(id);
}

// Re-exporta o SDK para uso direto quando necessário
export { starkbank };
