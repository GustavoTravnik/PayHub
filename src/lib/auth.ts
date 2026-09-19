import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
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

    // Provider de Acesso Rápido / Demonstração (Permite testar cadastro e login imediatamente)
    CredentialsProvider({
      id: "credentials",
      name: "Acesso Rápido / Demonstração",
      credentials: {
        email: { label: "E-mail", type: "email", placeholder: "usuario@exemplo.com" },
        name: { label: "Nome", type: "text", placeholder: "Seu Nome" },
        isNewUser: { label: "Novo Usuário", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          throw new Error("E-mail é obrigatório.");
        }

        const email = credentials.email.toLowerCase().trim();
        const name = credentials.name?.trim() || email.split("@")[0];

        try {
          // Tenta persistir ou buscar no Prisma se o banco estiver conectado
          let user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                email,
                name,
                image: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
              },
            });
          } else if (credentials.name && user.name !== credentials.name) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { name: credentials.name },
            });
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (dbError) {
          console.warn("Aviso: Banco de dados não respondeu, autenticando via sessão JWT fallback:", dbError);
          // Fallback para desenvolvimento sem Postgres rodando ainda
          return {
            id: `usr_${Buffer.from(email).toString("hex").slice(0, 12)}`,
            email: email,
            name: name,
            image: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
          };
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
            }
          }
        } catch (error) {
          console.warn("Aviso: Sincronização Prisma no Google Login falhou (usando id gerado):", error);
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
      }
      // Permite atualizar os dados do perfil dinamicamente via session.update()
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.image) token.picture = session.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
};
