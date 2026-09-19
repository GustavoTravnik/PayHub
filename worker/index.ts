import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import * as starkbank from 'starkbank';

const prisma = new PrismaClient();
const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

// ---------------------------------------------------------------------------
// Inicialização do Stark Bank SDK
// ---------------------------------------------------------------------------
const environment = process.env.STARK_BANK_ENVIRONMENT === 'production' ? 'production' : 'sandbox';
const projectId = process.env.STARK_BANK_PROJECT_ID || '';
const privateKey = (process.env.STARK_BANK_PRIVATE_KEY || '').replace(/\\n/g, '\n');

if (projectId && privateKey && privateKey.includes('BEGIN')) {
  starkbank.setUser(new starkbank.Project({
    environment,
    id: projectId,
    privateKey,
  }));
  console.log(`[Worker] ✅ Stark Bank SDK inicializado (${environment})`);
} else {
  console.warn('[Worker] ⚠️ Stark Bank não configurado — repasses não serão executados');
}

// Taxa da plataforma (R$ 1,50 = 150 centavos)
const PLATFORM_FEE_CENTS = 150;

/**
 * Processa um evento de webhook enfileirado pelo BullMQ.
 *
 * Este worker é um fallback assíncrono. O processamento principal
 * acontece diretamente na rota POST /api/webhooks/starkbank.
 */
async function processWebhookJob(job: Job) {
  console.log(`[Worker] Processando job ${job.id}`);
  const { event } = job.data;

  // Processa eventos de Invoice (cash-in)
  if (event.subscription === 'invoice' && event.log?.type === 'credited') {
    const invoiceId = event.log.invoice.id;

    const transaction = await prisma.transaction.findUnique({
      where: { starkBankInvoiceId: invoiceId },
      include: { pixAccount: true, user: true },
    });

    if (!transaction) {
      console.error(`[Worker] Transação não encontrada para Invoice: ${invoiceId}`);
      return;
    }

    if (transaction.status !== 'PENDING') {
      console.log(`[Worker] Transação ${transaction.id} já processada (${transaction.status})`);
      return;
    }

    // Atualiza para PAID
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: 'PAID' },
    });

    // Calcula repasse
    const netAmount = Math.max(transaction.amount - PLATFORM_FEE_CENTS, 0);

    if (netAmount > 0 && privateKey.includes('BEGIN')) {
      try {
        const transfer = await starkbank.transfer.create([
          new starkbank.Transfer({
            amount: netAmount,
            name: transaction.user.name || 'Beneficiário PayHub',
            taxId: transaction.pixAccount.keyType === 'CPF' || transaction.pixAccount.keyType === 'CNPJ'
              ? transaction.pixAccount.pixKey
              : transaction.user.cpf || '00000000000',
            bankCode: '20018183',
            branchCode: '0001',
            accountNumber: '10000-0',
            accountType: 'checking',
            tags: [`transactionId:${transaction.id}`, 'repasse:payhub'],
          }),
        ]);

        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'TRANSFER_PENDING',
            fee: PLATFORM_FEE_CENTS,
            netAmount,
            starkBankTransferId: transfer[0].id,
          },
        });

        console.log(`[Worker] ✅ Repasse criado: ${transfer[0].id}`);
      } catch (err: any) {
        console.error('[Worker] ❌ Erro no repasse:', err?.message);
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: 'FAILED' },
        });
      }
    }
  }

  // Processa eventos de Transfer (cash-out)
  if (event.subscription === 'transfer') {
    const transferId = event.log?.transfer?.id;
    if (!transferId) return;

    const transaction = await prisma.transaction.findUnique({
      where: { starkBankTransferId: transferId },
    });

    if (!transaction) return;

    if (event.log.type === 'success') {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'COMPLETED' },
      });
      console.log(`[Worker] ✅ Transação ${transaction.id} COMPLETADA`);
    } else if (event.log.type === 'failed') {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'FAILED' },
      });
      console.error(`[Worker] ❌ Transfer ${transferId} FALHOU`);
    }
  }
}

const worker = new Worker('starkbank-webhooks', processWebhookJob, { connection: redisOptions });

worker.on('completed', job => {
  console.log(`[Worker] Job ${job.id} concluído`);
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} falhou: ${err.message}`);
});

console.log('🚀 Worker iniciado e escutando fila "starkbank-webhooks"');
