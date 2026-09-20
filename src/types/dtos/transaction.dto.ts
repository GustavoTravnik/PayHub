import { TransactionStatus } from "@prisma/client";

export interface TransactionDto {
  id: string;
  userId: string;
  pixAccountId: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: TransactionStatus;
  starkBankInvoiceId: string | null;
  starkBankTransferId: string | null;
  qrCode: string | null;
  brcode: string | null;
  isArchivedByUser: boolean;
  createdAt: Date;
  updatedAt: Date;
}
