import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { authorizeCredentials } from "./auth/credentials";
import { signInCallback, jwtCallback, sessionCallback } from "./auth/callbacks";

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "payhub-super-secret-key-32-chars-long-development",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
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
      authorize: authorizeCredentials,
    }),
  ],
  callbacks: {
    signIn: signInCallback,
    jwt: jwtCallback,
    session: sessionCallback,
  },
};
