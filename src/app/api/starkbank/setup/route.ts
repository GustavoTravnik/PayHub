import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  isStarkBankConfigured,
  registerWebhook,
  listWebhooks,
  deleteWebhook,
} from '@/lib/starkbank';

/**
 * GET /api/starkbank/setup — Lista os webhooks registrados no Stark Bank
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
    const webhooks = await listWebhooks();
    const list = [];
    for await (const wh of webhooks) {
      list.push({
        id: wh.id,
        url: wh.url,
        subscriptions: wh.subscriptions,
      });
    }
    return NextResponse.json({ webhooks: list });
  } catch {
    console.error('[StarkBank/Setup] Erro ao listar webhooks:', error?.message);
    return NextResponse.json({ error: error?.message || 'Erro ao listar webhooks' }, { status: 500 });
  }
}

/**
 * POST /api/starkbank/setup — Registra um webhook no Stark Bank
 *
 * Body (opcional):
 *   { "url": "https://meu-dominio.com/api/webhooks/starkbank" }
 *
 * Se não fornecer URL, usa a variável STARK_BANK_WEBHOOK_URL do .env
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  if (!isStarkBankConfigured()) {
    return NextResponse.json({ error: 'Stark Bank não configurado' }, { status: 503 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const url = body.url || process.env.STARK_BANK_WEBHOOK_URL;

    if (!url) {
      return NextResponse.json(
        { error: 'URL do webhook não fornecida. Passe no body ou configure STARK_BANK_WEBHOOK_URL no .env' },
        { status: 400 }
      );
    }

    const webhook = await registerWebhook(url);
    console.log(`[StarkBank/Setup] ✅ Webhook registrado: ${webhook.id} → ${webhook.url}`);

    return NextResponse.json({
      message: 'Webhook registrado com sucesso',
      webhook: {
        id: webhook.id,
        url: webhook.url,
        subscriptions: webhook.subscriptions,
      },
    });
  } catch {
    console.error('[StarkBank/Setup] Erro ao registrar webhook:', error?.message);
    return NextResponse.json({ error: error?.message || 'Erro ao registrar webhook' }, { status: 500 });
  }
}

/**
 * DELETE /api/starkbank/setup — Remove um webhook do Stark Bank
 *
 * Body: { "id": "5656565656565656" }
 */
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  if (!isStarkBankConfigured()) {
    return NextResponse.json({ error: 'Stark Bank não configurado' }, { status: 503 });
  }

  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: 'ID do webhook é obrigatório' }, { status: 400 });
    }

    const deleted = await deleteWebhook(body.id);
    console.log(`[StarkBank/Setup] 🗑️ Webhook removido: ${deleted.id}`);

    return NextResponse.json({ message: 'Webhook removido com sucesso', id: deleted.id });
  } catch {
    console.error('[StarkBank/Setup] Erro ao remover webhook:', error?.message);
    return NextResponse.json({ error: error?.message || 'Erro ao remover webhook' }, { status: 500 });
  }
}
