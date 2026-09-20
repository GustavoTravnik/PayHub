import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { UserSessionDto } from "@/types/dtos/user-session.dto";

export const authorizeCredentials = async (
  credentials: Record<"email" | "password" | "name" | "cpf" | "phone" | "isDemo", string> | undefined
): Promise<UserSessionDto | null> => {
  if (!credentials?.email) {
    throw new Error("E-mail é obrigatório.");
  }

  const email = credentials.email.toLowerCase().trim();

  if (credentials.isDemo === "true") {
    const name = credentials.name || email.split("@")[0];
    return {
      id: `usr_${Buffer.from(email).toString("hex").slice(0, 10)}`,
      email,
      name,
      image: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
      cpf: credentials.cpf || "52998224725",
      phone: credentials.phone || "11987654321",
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("Credenciais inválidas. Verifique o e-mail e senha.");
    }

    if (!user.password) {
      throw new Error("Esta conta foi criada com Google. Faça login clicando em 'Continuar com o Google'.");
    }

    if (!credentials.password) {
      throw new Error("Por favor, digite sua senha.");
    }

    const passwordMatches = await bcrypt.compare(credentials.password, user.password);
    if (!passwordMatches) {
      throw new Error("Credenciais inválidas. Verifique a senha digitada.");
    }

    return {
      id: user.id,
      email: user.email!,
      name: user.name,
      image: user.image,
      cpf: user.cpf,
      phone: user.phone,
    };
  } catch (dbError: unknown) {
    if (dbError instanceof Error && !dbError.message.includes("PrismaClient")) {
      throw dbError;
    }

    return {
      id: `usr_${Date.now()}`,
      email,
      name: credentials.name || email.split("@")[0],
      image: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
      cpf: credentials.cpf || "52998224725",
      phone: credentials.phone || "11987654321",
    };
  }
};
