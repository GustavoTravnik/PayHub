import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "payhub-super-secret-key-32-chars-long-development",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    // Provider Google OAuth Principal
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),

    // Provider de Credenciais (E-mail e Senha) e Acesso Demo
    CredentialsProvider({
      id: "credentials",
      name: "E-mail e Senha",
      credentials: {
        email: { label: "E-mail", type: "email", placeholder: "usuario@exemplo.com" },
        password: { label: "Senha", type: "password" },
        name: { label: "Nome", type: "text" },
        cpf: { label: "CPF", type: "text" },
        phone: { label: "Telefone", type: "text" },
        isDemo: { label: "Demo", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          throw new Error("E-mail é obrigatório.");
        }

        const email = credentials.email.toLowerCase().trim();

        // 1. Caso seja Acesso Rápido de Teste (Demo)
        if (credentials.isDemo === "true") {
          const name = credentials.name || email.split("@")[0];
          return {
            id: `usr_${Buffer.from(email).toString("hex").slice(0, 10)}`,
            email,
            name,
            image: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
            cpf: credentials.cpf || "52998224725",
            phone: credentials.phone || "11987654321",
          } as any;
        }

        // 2. Login com Senha Normal
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
            email: user.email,
            name: user.name,
            image: user.image,
            cpf: user.cpf,
            phone: user.phone,
          } as any;
        } catch (dbError: any) {
          // Se for erro de validação lançado por nós, relança
          if (dbError.message && !dbError.message.includes("PrismaClient")) {
            throw dbError;
          }

          console.warn("Prisma indisponível ao autenticar, usando fallback em dev:", dbError);
          return {
            id: `usr_${Date.now()}`,
            email,
            name: credentials.name || email.split("@")[0],
            image: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
            cpf: credentials.cpf || "52998224725",
            phone: credentials.phone || "11987654321",
          } as any;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          if (user.email) {
            const existingUser = await prisma.user.findUnique({
              where: { email: user.email },
            });

            if (!existingUser) {
              const newUser = await prisma.user.create({
                data: {
                  email: user.email,
                  name: user.name || "Usuário PayHub",
                  image: user.image || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.email)}`,
                },
              });
              user.id = newUser.id;
            } else {
              user.id = existingUser.id;
              (user as any).cpf = existingUser.cpf;
              (user as any).phone = existingUser.phone;
            }
          }
        } catch (error) {
          console.warn("Sincronização Prisma no Google Login falhou:", error);
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        token.cpf = (user as any).cpf || null;
        token.phone = (user as any).phone || null;
      }
      // Permite atualizar os dados KYC via session.update()
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.cpf) token.cpf = session.cpf;
        if (session.phone) token.phone = session.phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.picture as string;
        (session.user as any).cpf = token.cpf as string | null;
        (session.user as any).phone = token.phone as string | null;
        (session.user as any).isKycComplete = Boolean(token.cpf && token.phone);
      }
      return session;
    },
  },
};
