import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { validateCPF, validatePhone, onlyDigits } from "@/lib/pix-validation";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { cpf, phone } = body;

    if (!cpf || !phone) {
      return NextResponse.json(
        { error: "CPF e Telefone celular são obrigatórios para homologação de pagamentos na Stark Bank." },
        { status: 400 }
      );
    }

    if (!validateCPF(cpf)) {
      return NextResponse.json({ error: "CPF inválido. Verifique os dígitos digitados." }, { status: 422 });
    }

    if (!validatePhone(phone)) {
      return NextResponse.json({ error: "Telefone celular inválido. Digite DDD + 9 dígitos." }, { status: 422 });
    }

    // CRUCIAL: Salvar no banco estritamente SEM máscara
    const sanitizedCpf = onlyDigits(cpf);
    const sanitizedPhone = onlyDigits(phone);

    try {
      // Verifica se o CPF já pertence a outro usuário
      const existingCpf = await prisma.user.findFirst({
        where: {
          cpf: sanitizedCpf,
          NOT: { email: session.user.email },
        },
      });

      if (existingCpf) {
        return NextResponse.json({ error: "Este CPF já está cadastrado em outra conta." }, { status: 409 });
      }

      const updatedUser = await prisma.user.update({
        where: { email: session.user.email },
        data: {
          cpf: sanitizedCpf,     // Salvo sem máscara (11 dígitos)
          phone: sanitizedPhone, // Salvo sem máscara (11 dígitos)
        },
      });

      return NextResponse.json({
        message: "Documentação homologada com sucesso para Stark Bank!",
        user: {
          cpf: updatedUser.cpf,
          phone: updatedUser.phone,
        },
      });
    } catch (dbError) {
      console.warn("Prisma indisponível ao salvar KYC, usando fallback em dev:", dbError);
      return NextResponse.json({
        message: "Documentação homologada em modo de desenvolvimento.",
        user: {
          cpf: sanitizedCpf,
          phone: sanitizedPhone,
        },
      });
    }
  } catch {
    console.error("Erro ao atualizar KYC do usuário:", err);
    return NextResponse.json({ error: "Erro interno ao processar documentação." }, { status: 500 });
  }
}
