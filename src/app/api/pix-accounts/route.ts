import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { validatePixKey, unmaskPixKey, PixKeyType } from "@/lib/pix-validation";

// Cache em memória para fallback caso o Postgres local ainda não tenha sido iniciado via docker
const memoryPixAccounts = new Map<string, Array<{ id: string; userId: string; keyType: PixKeyType; pixKey: string; createdAt: Date; deletedAt: Date | null }>>();

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const userId = (session.user as any).id || session.user.email;

  try {
    // 1. Busca usuário
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (dbUser) {
      const accounts = await prisma.pixAccount.findMany({
        where: {
          userId: dbUser.id,
          deletedAt: null, // Apenas registros ativos (soft-delete)
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ accounts });
    }
  } catch (error) {
    console.warn("Prisma indisponível ao listar chaves Pix, usando fallback em memória:", error);
  }

  // Fallback em memória
  const userMemoryList = (memoryPixAccounts.get(userId) || []).filter((acc) => acc.deletedAt === null);
  return NextResponse.json({ accounts: userMemoryList });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const userId = (session.user as any).id || session.user.email;

  try {
    const body = await req.json();
    const { keyType, pixKey: rawPixKey } = body as { keyType: PixKeyType; pixKey: string };

    if (!keyType || !rawPixKey) {
      return NextResponse.json({ error: "Tipo e chave Pix são obrigatórios." }, { status: 400 });
    }

    // 1. Validação estrita do tipo e dígitos
    const validation = validatePixKey(keyType, rawPixKey);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.message || "Chave Pix inválida." }, { status: 422 });
    }

    // 2. CRUCIAL: Remover máscara antes de persistir no Banco de Dados
    const sanitizedPixKey = unmaskPixKey(keyType, rawPixKey);

    // 3. Persistência no Prisma
    try {
      let dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            email: session.user.email,
            name: session.user.name || "Usuário PayHub",
            image: session.user.image,
          },
        });
      }

      // Verifica se a mesma chave desmascarada já existe e está ativa para este usuário
      const existingAccount = await prisma.pixAccount.findFirst({
        where: {
          userId: dbUser.id,
          pixKey: sanitizedPixKey,
          deletedAt: null,
        },
      });

      if (existingAccount) {
        return NextResponse.json(
          { error: "Esta chave Pix já está cadastrada na sua conta." },
          { status: 409 }
        );
      }

      const newAccount = await prisma.pixAccount.create({
        data: {
          userId: dbUser.id,
          keyType,
          pixKey: sanitizedPixKey, // Salvo estritamente SEM máscara
        },
      });

      return NextResponse.json({
        message: "Chave Pix cadastrada com sucesso (salva sem máscara).",
        account: newAccount,
      });
    } catch (dbError) {
      console.warn("Prisma indisponível ao criar chave Pix, usando fallback em memória:", dbError);

      // Fallback em memória
      const currentList = memoryPixAccounts.get(userId) || [];
      const duplicate = currentList.find((acc) => acc.pixKey === sanitizedPixKey && acc.deletedAt === null);

      if (duplicate) {
        return NextResponse.json(
          { error: "Esta chave Pix já está cadastrada na sua conta." },
          { status: 409 }
        );
      }

      const mockAccount = {
        id: `pix_${Date.now()}`,
        userId,
        keyType,
        pixKey: sanitizedPixKey, // Salvo estritamente SEM máscara
        createdAt: new Date(),
        deletedAt: null,
      };

      currentList.unshift(mockAccount);
      memoryPixAccounts.set(userId, currentList);

      return NextResponse.json({
        message: "Chave Pix cadastrada com sucesso no ambiente de desenvolvimento.",
        account: mockAccount,
      });
    }
  } catch (error: any) {
    console.error("Erro ao cadastrar chave Pix:", error);
    return NextResponse.json({ error: "Erro interno ao processar a chave Pix." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const userId = (session.user as any).id || session.user.email;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID da conta Pix é obrigatório." }, { status: 400 });
    }

    // Exclusão LÓGICA (Soft-Delete)
    try {
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      if (dbUser) {
        await prisma.pixAccount.updateMany({
          where: {
            id,
            userId: dbUser.id,
          },
          data: {
            deletedAt: new Date(), // Soft-delete
          },
        });

        return NextResponse.json({ message: "Chave Pix excluída logicamente com sucesso." });
      }
    } catch (dbError) {
      console.warn("Prisma indisponível no soft delete, atualizando fallback em memória:", dbError);
    }

    // Fallback em memória
    const currentList = memoryPixAccounts.get(userId) || [];
    const item = currentList.find((acc) => acc.id === id);
    if (item) {
      item.deletedAt = new Date();
    }

    return NextResponse.json({ message: "Chave Pix excluída logicamente com sucesso." });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao excluir chave Pix." }, { status: 500 });
  }
}
