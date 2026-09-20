import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isStarkBankConfigured, getBalance } from '@/lib/starkbank';

/**
 * GET /api/starkbank/balance — Consulta o saldo da conta PayHub no Stark Bank
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  if (!isStarkBankConfigured()) {
    return NextResponse.json({ error: 'Stark Bank não configurado' }, { status: 503 });
  }

  try {
    const balance = await getBalance();

    return NextResponse.json({
      balance: {
        amount: balance.amount, // Em centavos
        amountFormatted: `R$ ${(balance.amount / 100).toFixed(2)}`,
        currency: balance.currency,
        updated: balance.updated,
      },
    });
  } catch {
    console.error('[StarkBank/Balance] Erro ao consultar saldo:', error?.message);
    return NextResponse.json({ error: error?.message || 'Erro ao consultar saldo' }, { status: 500 });
  }
}
