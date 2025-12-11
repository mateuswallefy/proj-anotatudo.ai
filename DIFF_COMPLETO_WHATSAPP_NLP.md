# 📋 DIFF COMPLETO - IMPLEMENTAÇÃO NLP WHATSAPP

## 🎯 OBJETIVO
Criar sistema completo de NLP simplificado para processar mensagens do WhatsApp, detectando despesas, receitas e lembretes.

## 📁 ARQUIVOS CRIADOS/MODIFICADOS

### 1. **NOVO ARQUIVO: `server/whatsappNLP.ts`**

Arquivo completo com:
- `classifyMessage(text: string): ClassifiedMessage` - Classifica mensagens
- `processIncomingMessage(user, text, phoneNumber, messageId)` - Processa e cria transações/eventos
- Funções auxiliares: `extractDateFromText`, `extractTimeFromText`

**Funcionalidades:**
- ✅ Detecta despesas (expense)
- ✅ Detecta receitas (income)
- ✅ Detecta lembretes (reminder)
- ✅ Extrai valores (R$ 100, 100 reais, etc)
- ✅ Identifica categorias (Alimentação, Transporte, etc)
- ✅ Extrai datas ("hoje", "amanhã", "dia 15")
- ✅ Cria transações com `status: 'paid'` por padrão
- ✅ Cria eventos na agenda
- ✅ Registra latency e sessions
- ✅ Envia respostas automáticas

### 2. **MODIFICADO: `server/routes.ts`**

**Mudanças no webhook `/api/webhook/whatsapp` (POST):**

```diff
@@ -1106,7 +1106,7 @@ export async function registerRoutes(app: Express): Promise<void> {
         return;
       }
 
-      // Se usuário está autenticado, processar transação
+      // Se usuário está autenticado, processar mensagem
       if (user.status === 'authenticated') {
         // Comando para recuperar senha
         if (messageType === 'text' && content) {
@@ -1142,6 +1142,32 @@ export async function registerRoutes(app: Express): Promise<void> {
           }
         }
 
+        // Processar mensagem de texto usando NLP simplificado
+        if (messageType === 'text' && content) {
+          try {
+            const { processIncomingMessage } = await import("./whatsappNLP.js");
+            const messageId = message.id || undefined;
+            
+            await processIncomingMessage(
+              {
+                id: user.id,
+                firstName: user.firstName,
+                whatsappNumber: user.whatsappNumber || phoneNumber,
+              },
+              content,
+              phoneNumber,
+              messageId
+            );
+
+            res.status(200).json({ success: true });
+            return;
+          } catch (nlpError: any) {
+            console.error("[WhatsApp] Erro no processamento NLP:", nlpError);
+            // Fallback para processamento antigo se NLP falhar
+          }
+        }
+
+        // Fallback: Processar mídia (áudio, imagem, vídeo) usando sistema antigo
         try {
```

**Adicionado:**
- ✅ Chamada para `processIncomingMessage` quando mensagem é texto
- ✅ Fallback para sistema antigo se NLP falhar
- ✅ Processamento de mídia mantido como fallback

**Modificado:**
- ✅ Transações criadas agora incluem `status: 'paid'` e `paymentMethod: 'other'`

## 🔧 FUNCIONALIDADES IMPLEMENTADAS

### 1. **classifyMessage(text: string)**

**Retorna:**
```typescript
{
  type: 'expense' | 'income' | 'reminder' | 'unknown',
  value?: number,
  category?: string,
  date?: string, // YYYY-MM-DD
  description?: string,
  confidence: number
}
```

**Detecção:**
- **Despesas:** "gastei", "paguei", "comprei", "despesa", etc
- **Receitas:** "recebi", "ganhei", "cliente", "venda", etc
- **Lembretes:** "lembrete", "reunião", "consulta", "compromisso", etc
- **Valores:** R$ 100, 100 reais, 100,00, etc
- **Categorias:** Alimentação, Transporte, Contas, Salário, etc
- **Datas:** "hoje", "amanhã", "dia 15", etc

### 2. **processIncomingMessage(user, text, phoneNumber, messageId)**

**Fluxo:**
1. Cria registro de latency
2. Atualiza/cria sessão WhatsApp
3. Classifica mensagem
4. Se despesa/receita:
   - Tenta extração avançada se valor não encontrado
   - Cria transação com `status: 'paid'`
   - Envia resposta: "Despesa registrada: [categoria], R$ [valor]." ou "Receita registrada 👍"
5. Se lembrete:
   - Usa `detectEventoInMessage` para extrair dados
   - Cria evento na agenda
   - Envia resposta: "Anotado! Vou te lembrar."
6. Se desconhecido:
   - Envia resposta: "Não entendi, posso registrar despesas, receitas ou lembretes."
7. Atualiza latency com sucesso/erro

## 📊 MENSAGENS DE RESPOSTA AUTOMÁTICAS

| Tipo | Mensagem |
|------|----------|
| **Despesa** | "Despesa registrada: [categoria], R$ [valor]." |
| **Receita** | "Receita registrada: [categoria], R$ [valor]." |
| **Lembrete** | "Anotado! Vou te lembrar." |
| **Desconhecido** | "Não entendi, posso registrar despesas, receitas ou lembretes. Ex: 'Almoço R$ 45', 'Recebi 100 reais' ou 'Reunião amanhã às 15h'" |
| **Sem valor** | "Não consegui identificar o valor. Pode enviar novamente? Ex: 'Almoço R$ 45' ou 'Recebi 100 reais'" |
| **Erro** | "Ops, aconteceu algo inesperado. Pode tentar novamente?" |

## ✅ COMPATIBILIDADE

### Estrutura de Transação
```typescript
{
  userId: string,
  tipo: 'entrada' | 'saida',
  categoria: string,
  valor: string, // Decimal como string
  descricao: string,
  dataReal: string, // YYYY-MM-DD
  origem: 'whatsapp',
  status: 'paid', // ✅ Padrão
  paymentMethod: 'other', // ✅ Padrão
}
```

### Estrutura de Evento
```typescript
{
  userId: string,
  titulo: string,
  descricao: string,
  data: string, // YYYY-MM-DD
  hora?: string, // HH:mm
  origem: 'whatsapp',
  whatsappMessageId?: string,
}
```

### Latency e Sessions
- ✅ `storage.createWhatsAppLatency()` - Registra latência
- ✅ `storage.updateWhatsAppLatency()` - Atualiza com sucesso
- ✅ `whatsappSessions` - Atualiza/cria sessão

## 🧪 EXEMPLOS DE USO

### Despesa
**Entrada:** "Almoço R$ 45"
**Saída:** 
- Transação criada: tipo='saida', categoria='Alimentação', valor='45.00'
- Resposta: "Despesa registrada: Alimentação, R$ 45.00."

### Receita
**Entrada:** "Hoje recebi 100 reais de um cliente"
**Saída:**
- Transação criada: tipo='entrada', categoria='Salário', valor='100.00'
- Resposta: "Receita registrada: Salário, R$ 100.00."

### Lembrete
**Entrada:** "Reunião amanhã às 15h"
**Saída:**
- Evento criado: titulo='Reunião amanhã às 15h', data=amanhã, hora='15:00'
- Resposta: "Anotado! Vou te lembrar."

## 🔍 LOGS E DEBUG

Todos os logs incluem prefixo `[WhatsApp NLP]`:
- `[WhatsApp NLP] Mensagem classificada:` - Mostra classificação
- `[WhatsApp NLP] ✅ Transação criada:` - Confirma criação
- `[WhatsApp NLP] ✅ Evento criado:` - Confirma criação
- `[WhatsApp NLP] Erro ao processar mensagem:` - Erros

## 🚀 PRÓXIMOS PASSOS

1. **Testar em produção:**
   - Enviar mensagens de teste
   - Verificar logs
   - Confirmar criação de transações/eventos

2. **Monitorar:**
   - Taxa de sucesso
   - Tempo de resposta
   - Erros

3. **Melhorar (opcional):**
   - Adicionar mais palavras-chave
   - Melhorar detecção de categorias
   - Adicionar suporte a mais formatos de data

---

**Status:** ✅ IMPLEMENTADO E PRONTO PARA TESTE
**Arquivos:** 1 novo, 1 modificado
**Linhas adicionadas:** ~400
**Linhas modificadas:** ~30

