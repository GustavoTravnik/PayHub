import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  isStarkBankConfigured,
  parseWebhookEvent,
  createPixTransfer,
} from '@/lib/starkbank';

// Taxa fixa da plataforma (R$ 1,50 = 150 centavos)
const PLATFORM_FEE_CENTS = 150;

export async function POST(req: Request) {
  try {
    const signature = req.headers.get('Digital-Signature');
    const body = await req.text();

    console.log('[Webhook] Recebido evento do Stark Bank');

    // ------------------------------------------------------------------
    // Parse e validação do evento
    // ------------------------------------------------------------------
    let event: unknown;

    if (isStarkBankConfigured() && signature) {
      // Validação real da assinatura ECDSA com a chave pública do Stark Bank
      try {
        event = await parseWebhookEvent(body, signature);
        console.log(`[Webhook] Evento validado: ${event.subscription} / ${event.log.type}`);
      } catch {
        console.error('[Webhook] Assinatura inválida:', parseError?.message);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } else {
      // Fallback sem validação (desenvolvimento local)
      console.warn('[Webhook] ⚠️ Processando sem validação de assinatura (dev mode)');
      try {
        const parsed = JSON.parse(body);
        event = parsed.event || parsed;
      } catch {
        return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
      }
    }

    // ------------------------------------------------------------------
    // Processar evento de Invoice (Cobrança Pix recebida)
    // ------------------------------------------------------------------
    if (event.subscription === 'invoice') {
      await handleInvoiceEvent(event);
    }

    // ------------------------------------------------------------------
    // Processar evento de Transfer (Repasse Pix concluído)
    // ------------------------------------------------------------------
    if (event.subscription === 'transfer') {
      await handleTransferEvent(event);
    }

    return NextResponse.json({ message: 'Webhook processado com sucesso' }, { status: 200 });
  } catch {
    console.error('[Webhook] Erro ao processar:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ===========================================================================
// Handler: Invoice Events (cash-in — comprador pagou o QR Code)
// ===========================================================================
async function handleInvoiceEvent(event: unknown) {
  const logType = event.log?.type;
  const invoice = event.log?.invoice;

  if (!invoice?.id) {
    console.warn('[Webhook/Invoice] Evento sem invoice.id, ignorando');
    return;
  }

  console.log(`[Webhook/Invoice] Evento "${logType}" para Invoice: ${invoice.id}`);

  // Só processa eventos de pagamento confirmado
  if (logType !== 'credited') {
    console.log(`[Webhook/Invoice] Tipo "${logType}" ignorado (apenas "credited" dispara repasse)`);
    return;
  }

  // Busca a transação no banco de dados pelo ID da Invoice
  const transaction = await prisma.transaction.findUnique({
    where: { starkBankInvoiceId: invoice.id },
    include: { pixAccount: true, user: true },
  });

  if (!transaction) {
    console.error(`[Webhook/Invoice] Transação não encontrada para Invoice: ${invoice.id}`);
    return;
  }

  if (transaction.status !== 'PENDING') {
    console.log(`[Webhook/Invoice] Transação ${transaction.id} já processada (status: ${transaction.status})`);
    return;
  }

  // 1. Atualiza status para PAID
  await prisma.transaction.update({
    where: { id: transaction.id },
    data: { status: 'PAID' },
  });

  console.log(`[Webhook/Invoice] ✅ Transação ${transaction.id} marcada como PAID`);

  // 2. Calcula valor líquido do repasse
  const netAmount = Math.max(transaction.amount - PLATFORM_FEE_CENTS, 0);

  // 3. Dispara repasse Pix ao vendedor
  if (isStarkBankConfigured() && netAmount > 0) {
    try {
      const pixAccount = transaction.pixAccount;
      const user = transaction.user;

      const transfer = await createPixTransfer({
        amount: netAmount,
        pixKey: pixAccount.pixKey,
        pixKeyType: pixAccount.keyType,
        name: user.name || 'Beneficiário PayHub',
        taxId: pixAccount.keyType === 'CPF' || pixAccount.keyType === 'CNPJ'
          ? pixAccount.pixKey
          : user.cpf || '00000000000',
        tags: [`transactionId:${transaction.id}`, 'repasse:payhub'],
      });

      // 4. Atualiza para TRANSFER_PENDING
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'TRANSFER_PENDING',
          fee: PLATFORM_FEE_CENTS,
          netAmount,
          starkBankTransferId: transfer.id,
        },
      });

      console.log(`[Webhook/Invoice] 📤 Repasse criado: Transfer ID ${transfer.id} | Valor: R$ ${(netAmount / 100).toFixed(2)}`);
    } catch {
      console.error(`[Webhook/Invoice] ❌ Erro ao criar repasse:`, transferError?.message || transferError);

      // Marca como FAILED para reprocessamento manual
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'FAILED' },
      });
    }
  } else {
    console.warn('[Webhook/Invoice] Stark Bank não configurado ou valor líquido zerado. Repasse não executado.');
  }
}

// ===========================================================================
// Handler: Transfer Events (cash-out — repasse Pix confirmado)
// ===========================================================================
async function handleTransferEvent(event: unknown) {
  const logType = event.log?.type;
  const transfer = event.log?.transfer;

  if (!transfer?.id) {
    console.warn('[Webhook/Transfer] Evento sem transfer.id, ignorando');
    return;
  }

  console.log(`[Webhook/Transfer] Evento "${logType}" para Transfer: ${transfer.id}`);

  // Busca a transação pelo ID da transfer
  const transaction = await prisma.transaction.findUnique({
    where: { starkBankTransferId: transfer.id },
  });

  if (!transaction) {
    console.log(`[Webhook/Transfer] Transação não encontrada para Transfer: ${transfer.id}`);
    return;
  }

  if (logType === 'success') {
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: 'COMPLETED' },
    });
    console.log(`[Webhook/Transfer] ✅ Transação ${transaction.id} COMPLETADA com sucesso`);
  } else if (logType === 'failed') {
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: 'FAILED' },
    });
    console.error(`[Webhook/Transfer] ❌ Transfer ${transfer.id} FALHOU`);
  }
}
