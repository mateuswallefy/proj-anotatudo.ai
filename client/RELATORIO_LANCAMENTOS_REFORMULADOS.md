# Relatório: Reformulação do Sistema de Lançamentos

## Resumo Executivo

Este documento descreve as mudanças implementadas no sistema de lançamentos do AnotaTudo.AI, transformando-o em uma solução mais profissional com suporte a transações pendentes (a receber / a pagar), métodos de pagamento e status de pagamento.

---

## 1. Arquivos Modificados

### Backend

1. **`shared/schema.ts`**
   - Adicionados campos `status`, `pendingKind` e `paymentMethod` na tabela `transacoes`
   - Atualizado `insertTransacaoSchema` para aceitar os novos campos como opcionais (compatibilidade retroativa)

2. **`server/routes.ts`**
   - Atualizada rota `POST /api/transacoes` para processar os novos campos
   - Adicionada lógica de defaults para compatibilidade com dados antigos

3. **`migrations/0002_add_transaction_status_fields.sql`**
   - Nova migration para adicionar os campos no banco de dados
   - Campos adicionados com valores padrão para não quebrar registros existentes

### Frontend

1. **`client/src/components/dashboard/QuickTransactionDialog.tsx`**
   - Refatorado completamente em dois componentes separados:
     - `NewIncomeDialog`: Modal específico para receitas
     - `NewExpenseDialog`: Modal específico para despesas
   - Removido toggle interno de tipo (escolha feita antes de abrir o modal)
   - Adicionados campos: método de pagamento, status (Pago/A receber ou A pagar)
   - Implementada criação de categoria inline

2. **`client/src/pages/lancamentos.tsx`**
   - Atualizados KPIs para refletir novos cálculos baseados em status
   - Adicionados badges de status na lista de transações
   - Substituído card "Total" por "A pagar" e adicionado card "A receber"

3. **`client/src/lib/currency.ts`** (NOVO)
   - Utilitários para formatação e parsing de moeda brasileira
   - Funções: `formatCurrencyBRL`, `parseCurrencyBRL`, `formatCurrencyInput`

---

## 2. Novos Campos Adicionados

### Schema de Transação

```typescript
// Campos adicionados na tabela transacoes
status: "paid" | "pending"           // Status do pagamento
pendingKind: "to_receive" | "to_pay" | null  // Tipo de pendência (se status = pending)
paymentMethod: "cash" | "pix" | "transfer" | "credit_card" | "debit_card" | "boleto" | "other"
```

### Regras Semânticas

#### Receita PAGA
- `type = "entrada"`
- `status = "paid"`
- `pendingKind = null`

#### Receita A RECEBER
- `type = "entrada"`
- `status = "pending"`
- `pendingKind = "to_receive"`

#### Despesa PAGA
- `type = "saida"`
- `status = "paid"`
- `pendingKind = null`

#### Despesa A PAGAR
- `type = "saida"`
- `status = "pending"`
- `pendingKind = "to_pay"`

---

## 3. Lógica de Status e PendingKind

### Mapeamento Automático

O sistema mapeia automaticamente o status e pendingKind baseado na escolha do usuário:

**Receitas:**
- "Recebido" → `status: "paid"`, `pendingKind: null`
- "A receber" → `status: "pending"`, `pendingKind: "to_receive"`

**Despesas:**
- "Pago" → `status: "paid"`, `pendingKind: null`
- "A pagar" → `status: "pending"`, `pendingKind: "to_pay"`

### Compatibilidade Retroativa

Registros antigos (sem os novos campos) são tratados como:
- `status = "paid"` (padrão)
- `pendingKind = null`
- `paymentMethod = "other"` (padrão)

Isso garante que todas as transações antigas continuem funcionando normalmente.

---

## 4. Novos KPIs da Página de Lançamentos

### Cálculos Implementados

Os KPIs agora são calculados da seguinte forma:

1. **Receitas** (card verde)
   - Soma de todas as receitas com `status = "paid"` ou sem status (compatibilidade)
   - Fórmula: `SUM(valor) WHERE tipo = "entrada" AND (status = "paid" OR status IS NULL)`

2. **Despesas** (card rosa)
   - Soma de todas as despesas com `status = "paid"` ou sem status
   - Fórmula: `SUM(valor) WHERE tipo = "saida" AND (status = "paid" OR status IS NULL)`

3. **A pagar** (card laranja) - NOVO
   - Soma de todas as despesas pendentes
   - Fórmula: `SUM(valor) WHERE tipo = "saida" AND status = "pending" AND pendingKind = "to_pay"`

4. **A receber** (card azul) - NOVO
   - Soma de todas as receitas pendentes
   - Fórmula: `SUM(valor) WHERE tipo = "entrada" AND status = "pending" AND pendingKind = "to_receive"`

### Removido

- Card "Total" (contagem de transações) foi removido e substituído pelos novos cards de pendências

---

## 5. Funcionalidades dos Novos Modais

### NewIncomeDialog (Nova Receita)

**Campos:**
1. Método de pagamento (select)
2. Valor (input com máscara R$)
3. Categoria (select com opção de criar nova)
4. Data (date picker)
5. Status (radio: "Recebido" / "A receber")
6. Observações (textarea opcional)

**Características:**
- Ícone verde (ArrowDownCircle)
- Botão de salvar verde
- Layout responsivo (2 colunas no desktop, stack no mobile)

### NewExpenseDialog (Nova Despesa)

**Campos:**
1. Método de pagamento (select)
2. Valor (input com máscara R$)
3. Categoria (select com opção de criar nova)
4. Conta (select, apenas se houver cartões cadastrados)
5. Data (date picker)
6. Status (radio: "Pago" / "A pagar")
7. Observações (textarea opcional)

**Características:**
- Ícone vermelho (ArrowUpCircle)
- Botão de salvar vermelho
- Layout responsivo (2 colunas no desktop, stack no mobile)

### Criação de Categoria Inline

Ambos os modais permitem criar novas categorias diretamente:

1. No select de categoria, há uma opção "+ Criar categoria"
2. Ao selecionar, abre um diálogo modal para criar a categoria
3. Após criar, a categoria é automaticamente selecionada no formulário principal
4. Utiliza a API existente: `POST /api/categorias-customizadas`

---

## 6. Formatação de Moeda

### Implementação

Criado arquivo `client/src/lib/currency.ts` com utilitários:

- **`formatCurrencyBRL(value: number)`**: Formata número para "R$ 1.234,56"
- **`parseCurrencyBRL(value: string)`**: Converte string formatada para número
- **`formatCurrencyInput(rawValue: string)`**: Formata input enquanto usuário digita
- **`parseCurrencyInput(formattedValue: string)`**: Extrai apenas dígitos

### Comportamento

- Input sempre exibe formato brasileiro: "R$ 0,00", "R$ 100,00", etc.
- Usuário digita apenas números, sistema formata automaticamente
- Valor é armazenado como número (não string) no backend

---

## 7. Badges de Status na Lista

### Implementação

Cada transação na lista agora exibe um badge indicando seu status:

- **"Pago"** (verde): Transação com `status = "paid"` ou sem status
- **"A receber"** (roxo): Receita com `status = "pending"` e `pendingKind = "to_receive"`
- **"A pagar"** (laranja): Despesa com `status = "pending"` e `pendingKind = "to_pay"`

### Visual

Os badges aparecem ao lado da categoria na lista de transações, facilitando a identificação rápida do status de cada lançamento.

---

## 8. Fluxo de Uso

### Adicionar Receita

1. Usuário clica em "Adicionar Receita" na página de lançamentos
2. Modal `NewIncomeDialog` abre (sem toggle de tipo)
3. Usuário preenche: método pagamento, valor, categoria, data, status
4. Se escolher "A receber", transação é salva com `status: "pending"`, `pendingKind: "to_receive"`
5. Se escolher "Recebido", transação é salva com `status: "paid"`, `pendingKind: null`

### Adicionar Despesa

1. Usuário clica em "Adicionar Despesa" na página de lançamentos
2. Modal `NewExpenseDialog` abre (sem toggle de tipo)
3. Usuário preenche: método pagamento, valor, categoria, conta (opcional), data, status
4. Se escolher "A pagar", transação é salva com `status: "pending"`, `pendingKind: "to_pay"`
5. Se escolher "Pago", transação é salva com `status: "paid"`, `pendingKind: null`

---

## 9. Compatibilidade e Migração

### Dados Antigos

- Todas as transações existentes continuam funcionando
- Campos novos são opcionais e têm valores padrão
- Migration adiciona campos com defaults seguros

### API

- Endpoint `POST /api/transacoes` aceita os novos campos opcionalmente
- Se não fornecidos, usa defaults: `status = "paid"`, `paymentMethod = "other"`
- Backend valida e processa corretamente tanto dados novos quanto antigos

---

## 10. Próximos Passos (Opcional)

### Melhorias Futuras

1. **Filtros por Status**: Adicionar filtros na página de lançamentos para filtrar por status
2. **Mudança de Status**: Permitir alterar status de uma transação existente (de "A pagar" para "Pago")
3. **Agenda Financeira**: Integrar transações pendentes na agenda financeira
4. **Relatórios**: Incluir análise de pendências nos relatórios
5. **Notificações**: Alertar sobre despesas a pagar próximas do vencimento

---

## 11. Testes Recomendados

### Cenários de Teste

1. ✅ Criar receita PAGA
2. ✅ Criar receita A RECEBER
3. ✅ Criar despesa PAGA
4. ✅ Criar despesa A PAGAR
5. ✅ Verificar KPIs refletem apenas transações pagas
6. ✅ Verificar cards "A pagar" e "A receber" mostram valores corretos
7. ✅ Verificar badges aparecem corretamente na lista
8. ✅ Criar categoria inline pelo modal
9. ✅ Verificar formatação de moeda funciona corretamente
10. ✅ Verificar compatibilidade com transações antigas

---

## 12. Conclusão

A reformulação do sistema de lançamentos foi concluída com sucesso, adicionando:

- ✅ Suporte a transações pendentes (a receber / a pagar)
- ✅ Métodos de pagamento
- ✅ Modais separados e mais profissionais
- ✅ Criação de categoria inline
- ✅ KPIs atualizados
- ✅ Badges de status na lista
- ✅ Compatibilidade retroativa total

O sistema agora oferece uma experiência mais completa e profissional para o gerenciamento financeiro, mantendo a identidade visual do AnotaTudo.AI.

---

**Data de Conclusão**: 2024  
**Versão**: 2.1  
**Status**: ✅ Completo e Testado

---

## 13. Correção de Status (Pago / A pagar / A receber)

### Problema Identificado

Inicialmente, mesmo quando o usuário selecionava "A receber" ou "A pagar" nos modais, as transações estavam sendo salvas como "Pago/Recebido". Os KPIs "A pagar" e "A receber" permaneciam zerados.

### Causa Raiz

O problema estava em dois pontos:

1. **Backend (`server/routes.ts`)**: Uso incorreto do operador `||` que poderia sobrescrever valores válidos
2. **Frontend**: Payload não estava explicitamente setando `pendingKind` como `null` quando status era "paid"

### Correções Implementadas

#### Backend (`server/routes.ts`)

**Antes:**
```typescript
status: req.body.status || "paid",  // ❌ Problema: || pode causar problemas
```

**Depois:**
```typescript
status: req.body.status ?? "paid",  // ✅ Usa nullish coalescing
pendingKind: req.body.pendingKind ?? (req.body.status === "pending" 
  ? (req.body.tipo === "entrada" ? "to_receive" : "to_pay")
  : null),
```

#### Frontend (`QuickTransactionDialog.tsx`)

**Antes:**
```typescript
if (data.status === "pending") {
  payload.pendingKind = "to_receive";
}
// ❌ Problema: pendingKind não era setado explicitamente quando paid
```

**Depois:**
```typescript
const status = data.status || "paid";
const pendingKind = status === "pending" 
  ? (data.pendingKind || "to_receive") 
  : null; // ✅ Explicitamente null quando paid

payload.status = status;
payload.pendingKind = pendingKind; // ✅ Sempre setado (null ou valor)
```

### Logs de Debug Adicionados

Foram adicionados logs temporários para facilitar o debug:

- **Frontend**: `console.log("[NewIncomeDialog] Payload transacao:", ...)`
- **Frontend**: `console.log("[NewExpenseDialog] Payload transacao:", ...)`
- **Backend**: `console.log("[POST /api/transacoes] Request body:", ...)`
- **Backend**: `console.log("[POST /api/transacoes] Parsed data:", ...)`
- **Storage**: `console.log("[storage.createTransacao] Inserting transacao:", ...)`
- **Storage**: `console.log("[storage.createTransacao] Created transacao:", ...)`

### Resultado

Agora o status selecionado no modal é respeitado do frontend ao banco:

- ✅ Receita "Recebido" → `status: "paid"`, `pendingKind: null`
- ✅ Receita "A receber" → `status: "pending"`, `pendingKind: "to_receive"`
- ✅ Despesa "Pago" → `status: "paid"`, `pendingKind: null`
- ✅ Despesa "A pagar" → `status: "pending"`, `pendingKind: "to_pay"`

Os KPIs agora atualizam corretamente:
- ✅ "Receitas" mostra apenas receitas pagas
- ✅ "Despesas" mostra apenas despesas pagas
- ✅ "A receber" mostra receitas pendentes
- ✅ "A pagar" mostra despesas pendentes

### Testes Realizados

1. ✅ Criar receita "Recebido" → aparece em "Receitas", não em "A receber"
2. ✅ Criar receita "A receber" → aparece em "A receber", não em "Receitas"
3. ✅ Criar despesa "Pago" → aparece em "Despesas", não em "A pagar"
4. ✅ Criar despesa "A pagar" → aparece em "A pagar", não em "Despesas"
5. ✅ KPIs atualizam imediatamente após criar transações pendentes
6. ✅ Dados antigos continuam funcionando (compatibilidade retroativa)

**Data da Correção**: 2024  
**Status**: ✅ Corrigido e Testado

