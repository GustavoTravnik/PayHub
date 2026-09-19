import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isStarkBankConfigured, createPixInvoice } from "@/lib/starkbank";
import QRCode from "qrcode";

// Taxa fixa da plataforma (R$ 1,50 = 150 centavos)
const PLATFORM_FEE_CENTS = 150;
const MIN_AMOUNT_CENTS = 2000;   // R$ 20,00
const MAX_AMOUNT_CENTS = 200000; // R$ 2.000,00

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (dbUser) {
      const transactions = await prisma.transaction.findMany({
        where: {
          userId: dbUser.id,
          isArchivedByUser: false,
        },
        include: {
          pixAccount: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ transactions });
    }
  } catch (error) {
    console.warn("Prisma indisponível ao listar transações:", error);
  }

  return NextResponse.json({ transactions: [] });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { pixAccountId, amountInCents } = body;

    if (!pixAccountId) {
      return NextResponse.json({ error: "Selecione uma chave Pix de destino para o repasse." }, { status: 400 });
    }

    const amount = parseInt(amountInCents, 10);
    if (isNaN(amount)) {
      return NextResponse.json({ error: "Valor inválido." }, { status: 400 });
    }

    // Validação de valor mínimo e máximo
    if (amount < MIN_AMOUNT_CENTS) {
      return NextResponse.json({ error: "O valor mínimo para cobrança é de R$ 20,00." }, { status: 400 });
    }

    if (amount > MAX_AMOUNT_CENTS) {
      return NextResponse.json({ error: "O valor máximo para cobrança é de R$ 2.000,00." }, { status: 400 });
    }

    const fee = PLATFORM_FEE_CENTS;
    const netAmount = amount - fee;

    // Busca o usuário e verifica a chave Pix no banco
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    const pixAccount = await prisma.pixAccount.findFirst({
      where: {
        id: pixAccountId,
        userId: dbUser.id,
        deletedAt: null,
      },
    });

    if (!pixAccount) {
      return NextResponse.json({ error: "Chave Pix não encontrada ou desativada." }, { status: 404 });
    }

    let starkBankInvoiceId = "";
    let brcode = "";
    let invoiceLink = "";

    // -----------------------------------------------------------------------
    // Integração real com Stark Bank SDK (Sandbox ou Produção)
    // -----------------------------------------------------------------------
    if (isStarkBankConfigured()) {
      try {
        const invoice = await createPixInvoice({
          amount,
          name: dbUser.name || "Pagador PayHub",
          taxId: dbUser.cpf || "00000000000",
          tags: [
            `userId:${dbUser.id}`,
            `pixAccountId:${pixAccountId}`,
            `transactionType:escrow`,
          ],
          expiration: 3600, // 1 hora para pagar
        });

        starkBankInvoiceId = invoice.id;
        brcode = invoice.brcode;
        invoiceLink = invoice.link;

        console.log(`[StarkBank] Invoice criada: ${invoice.id} | Status: ${invoice.status}`);
      } catch (starkError: any) {
        console.error("[StarkBank] Erro ao criar Invoice:", starkError?.message || starkError);
        return NextResponse.json(
          { error: "Erro ao gerar cobrança Pix no Stark Bank. Verifique as credenciais." },
          { status: 502 }
        );
      }
    } else {
      // -----------------------------------------------------------------------
      // Fallback: mock local quando Stark Bank não está configurado
      // -----------------------------------------------------------------------
      starkBankInvoiceId = `mock_inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const formattedValue = (amount / 100).toFixed(2);
      brcode = `00020126580014br.gov.bcb.pix0136${starkBankInvoiceId}520400005303986540${formattedValue.length < 10 ? "0" + formattedValue.length : formattedValue}${formattedValue}5802BR5915PayHub Escrow6009Sao Paulo62070503***6304`;
      console.warn("[StarkBank] ⚠️ Usando mock local — configure STARK_BANK_PROJECT_ID e STARK_BANK_PRIVATE_KEY no .env");
    }

    // Gera o DataURL da imagem do QR Code a partir do brcode
    const qrCodeDataUrl = await QRCode.toDataURL(brcode, {
      margin: 1,
      width: 320,
      color: {
        dark: "#020617",
        light: "#ffffff",
      },
    });

    // Salva a transação no banco de dados
    const transaction = await prisma.transaction.create({
      data: {
        userId: dbUser.id,
        pixAccountId: pixAccount.id,
        amount, // Inteiro em centavos sem máscara
        fee,    // Inteiro em centavos sem máscara
        netAmount, // Inteiro em centavos sem máscara
        status: "PENDING",
        starkBankInvoiceId,
        brcode,
        qrCode: qrCodeDataUrl,
      },
      include: {
        pixAccount: true,
      },
    });

    return NextResponse.json({
      transaction,
      invoiceLink, // Link público do Stark Bank para pagamento
    });
  } catch (error: any) {
    console.error("Erro ao gerar cobrança Pix:", error);
    return NextResponse.json({ error: "Erro interno ao gerar cobrança Pix." }, { status: 500 });
  }
}
