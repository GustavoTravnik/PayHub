# Simulações Financeiras e Precificação PayHub

Este documento apresenta simulações financeiras detalhadas para a operação do PayHub, com base nos custos oficiais do Stark Bank e estimativas tributárias do governo brasileiro.

---

## 1. Custo Total do Fluxo Simples (Ponta a Ponta)

O fluxo principal da plataforma consiste em:
1. Gerar cobrança Pix (QR Code + Copia e Cola)
2. Receber o pagamento na conta PJ PayHub
3. Notificar via webhook (gratuito)
4. Repassar o valor para a conta (física ou jurídica) do recebedor via Pix.

### Composição de Custos (Stark Bank)
- **Emissão e Liquidação do Pix de Entrada:** R$ 0,65 (R$ 0,15 processamento + R$ 0,50 recebimento)
- **Transferência Pix de Saída (Repasse):** R$ 0,50
- **Total do Fluxo (por ciclo):** **R$ 1,15**

> **Observação:** O valor transacionado pelo cliente (seja R$ 20,00 ou R$ 2.000,00) **não altera** o custo cobrado pelo Stark Bank, que é fixo.

---

## 2. Ponto de Equilíbrio (Break-even) e Valor Mínimo

Para que a transação não gere prejuízo, a taxa cobrada pelo PayHub deve cobrir o custo do Stark Bank (R$ 1,15) mais os impostos sobre o serviço.

Assumindo que o PayHub opere sob o **Simples Nacional (Anexo III - Serviços de Intermediação)**, a alíquota inicial é de **6%** sobre o faturamento bruto (a taxa que você cobra, não o volume da transação).

### Cálculo do Ponto de Equilíbrio
- **Custo Fixo:** R$ 1,15
- **Imposto:** 6% sobre a taxa cobrada
- **Taxa de Break-even:** `R$ 1,15 / (1 - 0,06)` = **R$ 1,22**

Para evitar operar no zero a zero e ter uma margem de segurança operacional, o **valor mínimo sugerido a ser cobrado do usuário por transação é de R$ 1,50 a R$ 2,00**. 
Dessa forma, você garante lucro em absolutamente todas as transações, independentemente do valor transacionado.

---

## 3. Simulações de Cenários de Saque (Lucro Acumulado)

Abaixo simulamos o cenário em que o PayHub tem valores acumulados na conta provenientes apenas das taxas arrecadadas, e deseja realizar o "saque" (distribuição de lucros).
Consideramos o pagamento do imposto do Simples Nacional (6% inicial) sobre esse montante (Receita Bruta). No Brasil, a distribuição de lucros aos sócios, após o pagamento dos impostos da empresa, é **isenta de Imposto de Renda**.

| Faturamento Acumulado (Receita do PayHub) | Imposto Estimado (Simples Nacional - 6%) | Lucro Líquido Disponível para Saque do Sócio | Margem |
| :--- | :--- | :--- | :--- |
| **R$ 5.000,00** | R$ 300,00 | **R$ 4.700,00** | 94% |
| **R$ 10.000,00** | R$ 600,00 | **R$ 9.400,00** | 94% |
| **R$ 25.000,00** | R$ 1.500,00 | **R$ 23.500,00** | 94% |
| **R$ 50.000,00** | R$ 3.000,00 | **R$ 47.000,00** | 94% |

*(Obs: Quando o faturamento anual ultrapassa R$ 180.000,00, a alíquota efetiva do Simples Nacional começa a subir progressivamente).*

### Volume Necessário para Alcançar essas Metas
Se a plataforma tiver um lucro líquido de **R$ 1,00 por transação** (após pagar Stark Bank e impostos), seriam necessárias:
- 5.000 transações para faturar R$ 5.000 líquidos
- 10.000 transações para faturar R$ 10.000 líquidos, etc.

---

## 4. Metodologias de Cobrança e Simulação de Lucros

Existem diversas formas de tarifar o usuário final para garantir a rentabilidade do sistema. Seguem algumas metodologias e a simulação de lucro em uma transação de **R$ 500,00**.

### Metodologia 1: Taxa Fixa (Ideal para previsibilidade)
Você cobra um valor fixo por transação, não importando o valor transferido.
- **Tarifa cobrada:** R$ 3,00 por transação
- **Custo Stark Bank:** R$ 1,15
- **Imposto (6% de R$ 3,00):** R$ 0,18
- **Lucro Líquido:** **R$ 1,67 (55,6% de margem sobre a receita)**

### Metodologia 2: Taxa Percentual (Ideal para maximizar lucro em tickets altos)
Você cobra um percentual sobre o valor da transação.
- **Tarifa cobrada:** 1% do valor da transferência
- **Exemplo em transação de R$ 500,00:** R$ 5,00
- **Custo Stark Bank:** R$ 1,15
- **Imposto (6% de R$ 5,00):** R$ 0,30
- **Lucro Líquido:** **R$ 3,55 (71% de margem sobre a receita)**

### Metodologia 3: Modelo Híbrido (Percentual + Fixo - Ideal para segurança)
Garante o custo operacional com o fixo e lucra com o volume através do percentual.
- **Tarifa cobrada:** 0,5% + R$ 1,50
- **Exemplo em transação de R$ 500,00:** R$ 2,50 + R$ 1,50 = R$ 4,00
- **Custo Stark Bank:** R$ 1,15
- **Imposto (6% de R$ 4,00):** R$ 0,24
- **Lucro Líquido:** **R$ 2,61 (65% de margem sobre a receita)**

### Metodologia 4: Tabela Progressiva (Sugerida para o PayHub)
Tornar atrativo para baixos valores e maximizar lucro nos altos:
- **De R$ 20,00 a R$ 100,00:** Taxa Fixa de R$ 2,00 (Lucro de ~R$ 0,73)
- **De R$ 100,01 a R$ 500,00:** Taxa Fixa de R$ 3,50 (Lucro de ~R$ 2,14)
- **Acima de R$ 500,01 a R$ 2.000,00:** 1% do valor (Lucro de R$ 3,55 a R$ 17,65)

## Conclusão de Precificação

Como a API da Stark Bank possui tarifa 100% **FIXA**, cada real adicional no ticket médio das transações gera receita limpa para o PayHub caso um modelo **percentual** ou **progressivo** seja utilizado. O modelo de **1% + R$ 1,00** é um excelente ponto de partida para transações com um teto de R$ 2.000,00, gerando alta percepção de valor e extrema rentabilidade operacional.
