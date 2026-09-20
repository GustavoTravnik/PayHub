import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import * as starkbank from 'starkbank';
import { privateKey } from './starkbank-setup';

const prisma = new PrismaClient();
const PLATFORM_FEE_CENTS = 150;

export async function processWebhookJob(job: Job) {
  const { event } = job.data;

  if (event.subscription === 'invoice' && event.log?.type === 'credited') {
    const invoiceId = event.log.invoice.id;

    const transaction = await prisma.transaction.findUnique({
      where: { starkBankInvoiceId: invoiceId },
      include: { pixAccount: true, user: true },
    });

    if (!transaction) return;
    if (transaction.status !== 'PENDING') return;

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: 'PAID' },
    });

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
      } catch {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: 'FAILED' },
        });
      }
    }
  }

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
    } else if (event.log.type === 'failed') {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'FAILED' },
      });
    }
  }
}
