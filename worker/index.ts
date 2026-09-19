import { Worker, Job } from 'bullmq';
import * as starkbank from 'starkbank';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

const environment = process.env.STARK_BANK_ENVIRONMENT === 'sandbox' ? 'sandbox' : 'production';
starkbank.setUser(new starkbank.Project({
  environment,
  id: process.env.STARK_BANK_PROJECT_ID || '',
  privateKey: process.env.STARK_BANK_PRIVATE_KEY || '',
}));

// A taxa da plataforma será fixada em R$ 1,50 (150 centavos) provisoriamente
const PLATFORM_FEE_CENTS = 150; 

async function processWebhookJob(job: Job) {
  console.log(`Processando job de webhook ${job.id}`);
  const { event } = job.data;
  
  if (event.log.type !== 'credited') {
    console.log('Fatura gerada ou outro evento ignorado no repasse');
    return;
  }
  
  const invoiceId = event.log.invoice.id;

  try {
    const transaction = await prisma.transaction.findUnique({
      where: { starkBankInvoiceId: invoiceId },
      include: { pixAccount: true }
    });

    if (!transaction) {
      console.error(`Transação não encontrada para Invoice ID: ${invoiceId}`);
      return;
    }

    if (transaction.status !== 'PENDING') {
      console.log(`Transação ${transaction.id} não está pendente`);
      return;
    }

    // 1. Atualiza pra PAID
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: 'PAID' }
    });

    // 2. Calcula taxa e líquido
    const amount = transaction.amount;
    let netAmount = amount - PLATFORM_FEE_CENTS;
    if (netAmount < 0) netAmount = 0; // Prevenção de saldo negativo

    // 3. Efetua repasse Stark Bank
    // Nota: A API real da Stark Bank para PIX via chave pode requerer resolução prévia no DICT
    // Aqui usamos o mock do SDK 'transfer.create' para ilustrar a arquitetura.
    const transfer = await starkbank.transfer.create([
      new starkbank.Transfer({
        amount: netAmount,
        name: 'Repasse PayHub', 
        taxId: transaction.pixAccount.keyType === 'CPF' || transaction.pixAccount.keyType === 'CNPJ' ? transaction.pixAccount.pixKey : '00000000000', // Mock
        bankCode: '20018183', // Codigo Banco
        branchCode: '0001',
        accountNumber: '12345-6',
        accountType: 'checking',
        tags: [`transactionId:${transaction.id}`]
      })
    ]);

    const createdTransfer = transfer[0];

    // 4. Atualiza banco para TRANSFER_PENDING / COMPLETED 
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'TRANSFER_PENDING',
        fee: PLATFORM_FEE_CENTS,
        netAmount: netAmount,
        starkBankTransferId: createdTransfer.id
      }
    });

    console.log(`Repasse enfileirado/gerado com sucesso para transação ${transaction.id}`);

  } catch (err) {
    console.error('Erro ao processar repasse:', err);
    throw err; // Força retry no BullMQ
  }
}

const worker = new Worker('starkbank-webhooks', processWebhookJob, { connection: redisOptions });

worker.on('completed', job => {
  console.log(`Job ${job.id} concluído com sucesso`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} falhou com o erro ${err.message}`);
});

console.log('🚀 Worker iniciado e escutando fila "starkbank-webhooks"');
