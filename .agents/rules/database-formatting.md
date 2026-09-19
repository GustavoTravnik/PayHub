# Regras de Persistência de Dados no Banco de Dados

## Padronização: Valores Sem Máscara
Todos os valores formatados, sensíveis ou identificadores persistidos no banco de dados (PostgreSQL/Prisma) **DEVEM SER SALVOS ESTRITAMENTE SEM MÁSCARA**, contendo apenas caracteres canônicos limpos.

### Diretrizes Obrigatórias:
1. **Chaves Pix & Documentos:**
   - **CPF:** Salvar exclusivamente 11 dígitos numéricos (ex: `12345678901`, nunca `123.456.789-01`).
   - **CNPJ:** Salvar exclusivamente 14 dígitos numéricos (ex: `12345678000195`, nunca `12.345.678/0001-95`).
   - **Telefone:** Salvar exclusivamente os dígitos numéricos incluindo DDD e opcionalmente DDI (ex: `11999999999` ou `5511999999999`, nunca `(11) 99999-9999`).
   - **E-mail:** Salvar em minúsculas (lowercase) e sem espaços ao redor (`trim()`).
   - **EVP (Chave Aleatória):** Salvar em formato UUID padrão canônico (minúsculo, sem espaços adicionais).
2. **Valores Monetários:**
   - Devem ser armazenados em centavos como inteiros (`Int` no Prisma) para prevenir imprecisão de ponto flutuante (ex: R$ 50,00 -> `5000`).
3. **Camada de Apresentação:**
   - As máscaras e formatações visuais devem ser aplicadas **exclusivamente na interface do usuário (front-end)** para exibição e durante a digitação nos inputs.
