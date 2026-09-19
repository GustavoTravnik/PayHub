/**
 * Script utilitário para gerar par de chaves ECDSA (secp256k1)
 * exigido pelo Stark Bank para autenticação de API.
 *
 * Uso: npx tsx scripts/generate-stark-keys.ts
 *
 * Após execução:
 * 1. Copie a CHAVE PÚBLICA e registre no painel do Stark Bank Sandbox
 *    (Menu → Integrações → Novo Projeto → Colar chave pública)
 * 2. Copie a CHAVE PRIVADA e cole no .env como STARK_BANK_PRIVATE_KEY
 *    (substituindo as quebras de linha por \n literal)
 * 3. Copie o Project ID retornado pelo Sandbox e cole no .env como STARK_BANK_PROJECT_ID
 */

import * as starkbank from 'starkbank';

const [privateKey, publicKey] = starkbank.key.create();

console.log('\n' + '='.repeat(70));
console.log('  🔑  CHAVES ECDSA GERADAS COM SUCESSO');
console.log('='.repeat(70));

console.log('\n📋 CHAVE PÚBLICA (registre no Sandbox do Stark Bank):');
console.log('-'.repeat(70));
console.log(publicKey);

console.log('\n🔒 CHAVE PRIVADA (coloque no seu .env como STARK_BANK_PRIVATE_KEY):');
console.log('-'.repeat(70));
console.log(privateKey);

console.log('\n💡 Para usar no .env, substitua as quebras de linha por \\n:');
console.log('-'.repeat(70));
const envFormatted = privateKey.replace(/\n/g, '\\n');
console.log(`STARK_BANK_PRIVATE_KEY="${envFormatted}"`);

console.log('\n' + '='.repeat(70));
console.log('  📝 PRÓXIMOS PASSOS:');
console.log('  1. Acesse https://web.sandbox.starkbank.com');
console.log('  2. Crie um Workspace (se ainda não criou)');
console.log('  3. Vá em Menu → Integrações → Novo Projeto');
console.log('  4. Cole a CHAVE PÚBLICA acima');
console.log('  5. Copie o Project ID retornado');
console.log('  6. Atualize o .env com STARK_BANK_PROJECT_ID e STARK_BANK_PRIVATE_KEY');
console.log('='.repeat(70) + '\n');
