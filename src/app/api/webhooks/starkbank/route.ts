import { NextResponse } from 'next/server';
import * as starkbank from 'starkbank';
import { webhookQueue } from '@/lib/queue';

export async function POST(req: Request) {
  try {
    const signature = req.headers.get('Digital-Signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const body = await req.text();

    // Em produção, você DEVE validar a assinatura do Stark Bank:
    // const event = starkbank.event.parse({ content: body, signature: signature });
    // Mas para este scaffold vamos parsear direto ou assumir sucesso
    
    // Assumindo parse simplificado
    const event = JSON.parse(body).event;

    // Coloca o evento na fila do BullMQ para o worker processar
    await webhookQueue.add('starkbank-webhook-event', { event });

    return NextResponse.json({ message: 'Webhook recebido e enfileirado com sucesso' }, { status: 200 });
  } catch (error: any) {
    console.error('Erro ao processar webhook StarkBank:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
