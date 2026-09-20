import { Account, User, Session } from "next-auth";
import { JWT } from "next-auth/jwt";
import prisma from "@/lib/prisma";

export const signInCallback = async ({ user, account }: { user: User; account: Account | null }) => {
  if (account?.provider === "google") {
    try {
      if (user.email) {
        const normalizedEmail = user.email.toLowerCase().trim();
        const existingUser = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        let dbUserId = "";

        if (!existingUser) {
          const newUser = await prisma.user.create({
            data: {
              email: normalizedEmail,
              name: user.name || "Usuário PayHub",
              image: user.image || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(normalizedEmail)}`,
            },
          });
          dbUserId = newUser.id;
          user.id = newUser.id;
        } else {
          dbUserId = existingUser.id;
          user.id = existingUser.id;
          user.cpf = existingUser.cpf;
          user.phone = existingUser.phone;
        }

        if (account.providerAccountId && dbUserId) {
          const existingAccount = await prisma.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
          });

          if (!existingAccount) {
            await prisma.account.create({
              data: {
                userId: dbUserId,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                expires_at: account.expires_at ?? null,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
              },
            });
          }
        }
      }
    } catch (error) {
      console.warn("Sincronização Prisma no Google Login falhou:", error);
    }
  }
  return true;
};

export const jwtCallback = async ({ token, user, trigger, session }: { token: JWT; user: User | null; trigger?: "signIn" | "signUp" | "update"; session?: unknown }) => {
  if (user) {
    token.id = user.id;
    token.email = user.email?.toLowerCase().trim();
    token.name = user.name;
    token.picture = user.image;
    token.cpf = user.cpf || null;
    token.phone = user.phone || null;
  }

  if (token.email && (!token.cpf || !token.phone || !token.id)) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { email: token.email as string },
        select: { id: true, name: true, image: true, cpf: true, phone: true },
      });

      if (dbUser) {
        token.id = dbUser.id;
        token.cpf = dbUser.cpf;
        token.phone = dbUser.phone;
        if (dbUser.name) token.name = dbUser.name;
      }
    } catch {
      // Ignore
    }
  }

  if (trigger === "update" && session) {
    if (session.name) token.name = session.name;
    if (session.cpf) token.cpf = session.cpf;
    if (session.phone) token.phone = session.phone;
  }
  return token;
};

export const sessionCallback = async ({ session, token }: { session: Session; token: JWT }) => {
  if (session.user) {
    session.user.id = token.id as string;
    session.user.name = token.name as string;
    session.user.email = token.email as string;
    session.user.image = token.picture as string | null;
    session.user.cpf = token.cpf as string | null;
    session.user.phone = token.phone as string | null;
    session.user.isKycComplete = Boolean(token.cpf && token.phone);
  }
  return session;
};
