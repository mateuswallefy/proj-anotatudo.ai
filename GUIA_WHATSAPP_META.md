# 📱 Guia Completo: Integração WhatsApp Business API (Meta)

## 🎯 Como Funciona o Sistema

**Conceito importante:** Você (empresa) terá UM número de WhatsApp Business. Seus clientes enviam mensagens para ESSE número, e o sistema identifica cada cliente pelo número de WhatsApp dele.

### Fluxo Completo:
1. Cliente manda: *"gastei 100 reais com pizza"*
2. Meta envia para seu servidor (webhook)
3. IA interpreta a mensagem
4. Sistema cria a transação automaticamente
5. Cliente vê no dashboard!

---

## 📋 PASSO 1: Criar Conta Meta for Developers

1. Acesse: **https://developers.facebook.com/**
2. Faça login com sua conta Facebook/Meta
3. Clique em **"Meus Apps"** (canto superior direito)
4. Clique em **"Criar App"**
5. Escolha: **"Business"**
6. Preencha:
   - **Nome do app:** AnotaTudo AI
   - **Email de contato:** seu email
   - **Portfólio de Negócios:** (crie um novo se não tiver)
7. Clique em **"Criar App"**

✅ **Resultado:** Você terá um App criado no painel Meta

---

## 📱 PASSO 2: Adicionar WhatsApp ao App

1. No painel do seu app, role até encontrar **"WhatsApp"**
2. Clique em **"Configurar"**
3. Você receberá **GRATUITAMENTE**:
   - ✅ 1 número de telefone de teste
   - ✅ Até 1.000 conversas gratuitas/mês
   - ✅ Possibilidade de enviar mensagens para 5 números (modo teste)

### Informações Importantes:

No painel **"WhatsApp" → "Visão Geral da API"**, você verá:

- **Phone Number ID:** `109123456789012` (exemplo)
- **WhatsApp Business Account ID (WABA ID):** anote este ID
- **Número de Teste:** `+1 555 025 3483` (exemplo)
- **Token de Acesso Temporário:** válido por 24 horas

---

## 🔑 PASSO 3: Gerar Token de Acesso Permanente

**⚠️ IMPORTANTE:** O token temporário expira em 24h. Para produção, você precisa de um token permanente.

### Como Gerar Token Permanente:

1. Acesse **Meta Business Suite**: https://business.facebook.com/
2. Vá em **Configurações de Negócios**
3. Menu lateral: **Usuários** → **Usuários do Sistema**
4. Clique em **"Adicionar"**
   - Nome: "AnotaTudo AI System User"
   - Função: **Administrador**
5. Clique no usuário criado
6. Clique em **"Gerar Novo Token"**
7. Selecione seu app: **AnotaTudo AI**
8. Marque as permissões:
   - ✅ `whatsapp_business_messaging`
   - ✅ `whatsapp_business_management`
9. Clique em **"Gerar Token"**

### ⚠️ GUARDE ESTE TOKEN COM SEGURANÇA!

Copie o token gerado (começa com `EAAXXX...`) e guarde em local seguro. Você precisará dele no próximo passo.

**Exemplo de token:**
```
EAAXQZBr1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ
```

---

## 🔐 PASSO 4: Configurar Secrets no Replit

1. No seu Replit, vá em **Tools** → **Secrets**
2. Adicione os seguintes secrets:

### Secret 1: WHATSAPP_VERIFY_TOKEN
- **Key:** `WHATSAPP_VERIFY_TOKEN`
- **Value:** Uma senha secreta qualquer que VOCÊ escolher
- **Exemplo:** `meu_token_super_secreto_12345`
- **Importante:** Você vai usar isso no próximo passo!

### Secret 2: WHATSAPP_ACCESS_TOKEN
- **Key:** `WHATSAPP_ACCESS_TOKEN`
- **Value:** Cole o token permanente que você gerou no PASSO 3
- **Exemplo:** `EAAXQZBr1234567890abc...`

### Secret 3: WHATSAPP_PHONE_NUMBER_ID
- **Key:** `WHATSAPP_PHONE_NUMBER_ID`
- **Value:** O Phone Number ID que você anotou no PASSO 2
- **Exemplo:** `109123456789012`

---

## 🌐 PASSO 5: Pegar URL do Webhook do Replit

1. No Replit, clique em **Run** (ou espere o app iniciar)
2. Você verá a URL do seu app na parte superior
3. Copie a URL (exemplo: `https://seuapp.replit.app`)
4. Adicione `/api/whatsapp/webhook` no final

**Sua URL de Webhook será:**
```
https://seuapp.replit.app/api/whatsapp/webhook
```

✅ **Anote esta URL - você precisará dela no próximo passo!**

---

## ⚙️ PASSO 6: Configurar Webhook na Meta

1. Volte ao **Meta for Developers**
2. Vá em seu app → **WhatsApp** → **Configuração**
3. Procure a seção **"Webhook"**
4. Clique em **"Configurar"** ou **"Editar"**

### Preencha os campos:

**Callback URL:**
```
https://seuapp.replit.app/api/whatsapp/webhook
```

**Verify Token:**
```
meu_token_super_secreto_12345
```
(Use O MESMO token que você criou no Secret WHATSAPP_VERIFY_TOKEN!)

5. Clique em **"Verificar e Salvar"**

### ✅ Se aparecer "Webhook verificado com sucesso!", está perfeito!

### ❌ Se der erro:
- Verifique se o Replit está rodando
- Confirme se a URL está correta
- Confirme se o VERIFY_TOKEN está igual nos dois lugares

---

## 📨 PASSO 7: Inscrever nos Eventos do Webhook

Ainda na seção **"Webhook"**, você verá **"Campos de webhook"**.

1. Clique em **"Gerenciar"**
2. Marque as seguintes opções:
   - ✅ **messages** (mensagens recebidas)
   - ✅ **message_template_status_update** (status de templates)
3. Clique em **"Concluído"**

---

## 🧪 PASSO 8: Testar o Sistema

### Opção 1: Testar com Número de Teste (Desenvolvimento)

1. No painel Meta, vá em **WhatsApp** → **Teste de API**
2. Clique em **"Adicionar destinatário"**
3. Adicione seu número de WhatsApp pessoal: `+55 11 99999-9999`
4. Você receberá uma mensagem no WhatsApp pedindo confirmação
5. Responda **"SIM"** ou **"ACEITO"**

**Agora você pode testar:**

1. Primeiro, configure seu usuário no sistema com seu número de WhatsApp:
   - No banco de dados, atualize o campo `telefone` do seu usuário
   - Use o formato: `+5511999999999` (sem espaços ou traços)

2. Envie uma mensagem para o número de teste da Meta:
   ```
   gastei 50 reais com pizza
   ```

3. Aguarde alguns segundos e veja os logs no Replit:
   ```
   [WhatsApp] New text message from +5511999999999
   [WhatsApp] Processing message: "gastei 50 reais com pizza"
   [WhatsApp] AI Result: { tipo: 'saida', valor: 50, ... }
   [WhatsApp] ✅ Transaction created for user abc-123
   ```

4. Abra o dashboard e veja a transação aparecer automaticamente! 🎉

### Opção 2: Testar Direto pelo Painel Meta

1. No painel Meta, vá em **WhatsApp** → **Teste de API**
2. Na seção **"Enviar e receber mensagens"**
3. Digite seu número no campo **"Para"**
4. Envie uma mensagem de teste

---

## 🚀 PASSO 9: Ir para Produção (Opcional)

Para usar um número real próprio (não o de teste):

1. **Registrar seu número:**
   - Painel Meta → WhatsApp → **"Phone Numbers"**
   - Clique em **"Add phone number"**
   - Siga o processo de verificação (SMS)

2. **Solicitar Aprovação (App Review):**
   - Painel do App → **"App Review"**
   - Solicite acesso avançado para:
     - `whatsapp_business_messaging`
     - `whatsapp_business_management`
   - Preencha formulário explicando seu caso de uso

3. **Verificar seu Negócio:**
   - Meta Business Suite → **Configurações**
   - Complete a verificação comercial
   - Pode levar 2-7 dias úteis

---

## 🔧 Configuração Adicional: Associar Usuários aos Números

### Como funciona a associação:

Quando um cliente envia mensagem pelo WhatsApp, o sistema precisa saber qual usuário do dashboard é aquele número.

**Método 1: Atualizar manualmente no banco (para testes)**

```sql
UPDATE users 
SET telefone = '+5511999999999' 
WHERE email = 'cliente@exemplo.com';
```

**Método 2: Adicionar campo no cadastro**

Adicione um campo de telefone no formulário de registro onde o cliente informa o número de WhatsApp dele.

**Método 3: Fluxo de autenticação via WhatsApp (futuro)**

Implementar um fluxo onde:
1. Cliente acessa o site e clica "Conectar WhatsApp"
2. Sistema gera código único
3. Cliente envia código via WhatsApp
4. Sistema associa o número ao usuário

---

## 📊 Monitoramento e Logs

Para ver se está funcionando, acompanhe os logs no Replit:

```
[WhatsApp Webhook] Received: { object: 'whatsapp_business_account', ... }
[WhatsApp] New text message from +5511999999999
[WhatsApp] Processing message: "gastei 100 reais com pizza"
[WhatsApp] AI Result: { tipo: 'saida', categoria: 'Alimentação', valor: 100, ... }
[WhatsApp] ✅ Transaction created for user abc-123-def-456
```

---

## ❓ Problemas Comuns

### Webhook não verificou
- ✅ Confirme que o Replit está rodando
- ✅ Verifique se WHATSAPP_VERIFY_TOKEN está correto
- ✅ URL deve ser HTTPS (Replit já fornece)

### Mensagens não chegam
- ✅ Verifique se inscreveu no campo "messages" do webhook
- ✅ Confirme que seu número está na lista de destinatários de teste
- ✅ Veja os logs do Replit para erros

### IA não processa corretamente
- ✅ Verifique se OPENAI_API_KEY está configurado
- ✅ Teste enviar mensagens mais claras: "gastei 50 reais com pizza"
- ✅ Veja os logs para ver a resposta da IA

### Usuário não encontrado
- ✅ Verifique se o número está cadastrado no campo `telefone` do usuário
- ✅ Use o formato internacional: `+5511999999999`

---

## 🎉 Pronto!

Agora seu sistema está integrado com WhatsApp! 

**Seus clientes podem:**
- ✅ Enviar "gastei 100 reais com pizza" → Cria gasto automaticamente
- ✅ Enviar foto do recibo → IA extrai o valor
- ✅ Enviar áudio "comprei café 10 reais" → IA transcreve e registra
- ✅ Ver tudo no dashboard em tempo real

**Próximos passos sugeridos:**
1. Implementar resposta automática do bot (confirmando que registrou)
2. Criar fluxo de onboarding via WhatsApp
3. Adicionar notificações quando atingir limites de gasto
4. Permitir consultar saldo via WhatsApp

---

## 📚 Documentação Oficial Meta

- **Get Started:** https://developers.facebook.com/docs/whatsapp/cloud-api/get-started
- **Webhooks:** https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks
- **Enviar Mensagens:** https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages
- **Templates:** https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates

---

**Dúvidas?** Qualquer problema, me avise que te ajudo a resolver! 🚀
