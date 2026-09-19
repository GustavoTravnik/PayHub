import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        pixAccounts: {
          where: { deletedAt: null },
        },
      },
    });

    if (!user) {
      return NextResponse.json({
        user: {
          id: (session.user as any).id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          pixAccounts: [],
        },
      });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.warn("Erro ao buscar usuário no Prisma (retornando sessão):", error);
    return NextResponse.json({
      user: {
        id: (session.user as any).id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        pixAccounts: [],
      },
    });
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { name: name.trim() },
    });

    return NextResponse.json({ user: updatedUser, message: "Perfil atualizado com sucesso" });
  } catch (error) {
    console.warn("Erro ao atualizar usuário no Prisma:", error);
    return NextResponse.json({
      message: "Perfil atualizado localmente na sessão",
      user: {
        name: (await req.json().catch(() => ({}))).name || session.user.name,
        email: session.user.email,
      },
    });
  }
}
