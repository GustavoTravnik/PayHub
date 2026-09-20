import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    cpf?: string | null;
    phone?: string | null;
  }

  interface Session {
    user: User & {
      cpf?: string | null;
      phone?: string | null;
      isKycComplete?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    cpf?: string | null;
    phone?: string | null;
  }
}
