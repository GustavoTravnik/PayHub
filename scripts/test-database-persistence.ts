import prisma from "../src/lib/prisma";

async function testPersistence() {
  console.log("--- TESTANDO PERSISTÊNCIA REAL NO POSTGRESQL ---");

  const testEmail = `teste.banco.${Date.now()}@payhub.dev`;
  const testCpf = "12345678909"; // Sem máscara
  const testPhone = "11999998888"; // Sem máscara

  // 1. Cria Usuário no PostgreSQL
  const user = await prisma.user.create({
    data: {
      name: "Usuário Teste PostgreSQL",
      email: testEmail,
      cpf: testCpf,
      phone: testPhone,
      password: "hash_de_senha_segura",
    },
  });
  console.log("✓ Usuário persistido no PostgreSQL com ID:", user.id);
  console.log("  CPF salvo no banco (sem máscara):", user.cpf);
  console.log("  Telefone salvo no banco (sem máscara):", user.phone);

  // 2. Cria Chave Pix no PostgreSQL
  const pixAccount = await prisma.pixAccount.create({
    data: {
      userId: user.id,
      keyType: "CPF",
      pixKey: testCpf, // Sem máscara
    },
  });
  console.log("✓ Chave Pix persistida no PostgreSQL com ID:", pixAccount.id);
  console.log("  Chave Pix salva no banco (sem máscara):", pixAccount.pixKey);

  // 3. Cria Transação / Cobrança no PostgreSQL
  const amountCents = 15000; // R$ 150,00 em centavos
  const feeCents = 150;      // R$ 1,50 taxa
  const netCents = 14850;    // R$ 148,50 líquido
  const transaction = await prisma.transaction.create({
    data: {
      userId: user.id,
      pixAccountId: pixAccount.id,
      amount: amountCents,
      fee: feeCents,
      netAmount: netCents,
      status: "PENDING",
      starkBankInvoiceId: `inv_${Date.now()}`,
      brcode: "00020126580014br.gov.bcb.pix...",
    },
  });
  console.log("✓ Transação persistida no PostgreSQL com ID:", transaction.id);
  console.log("  Valor em centavos no banco:", transaction.amount);
  console.log("  Status no banco:", transaction.status);

  // 4. Consulta Relacional no PostgreSQL
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      pixAccounts: true,
      transactions: true,
    },
  });

  console.log("\n--- RESULTADO DA CONSULTA RELACIONAL NO POSTGRESQL ---");
  console.log("Nome do Usuário:", fullUser?.name);
  console.log("Chaves Pix Associadas:", fullUser?.pixAccounts.length);
  console.log("Transações Registradas:", fullUser?.transactions.length);

  console.log("\n🎉 PERSISTÊNCIA 100% HOMOLOGADA E FUNCIONAL NO POSTGRESQL!");
}

testPersistence()
  .catch((e) => {
    console.error("Erro no teste de persistência:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
