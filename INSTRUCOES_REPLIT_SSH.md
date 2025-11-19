# Instruções - Como Rodar no Replit sem Derrubar o SSH

## ✅ Problema Resolvido

Todos os scripts foram corrigidos para serem compatíveis com ESM/TypeScript:
- ❌ Removida palavra reservada `protected`
- ✅ Substituída por `safeProcess` e `SAFE_PROCESSES`
- ✅ Todos os scripts são compatíveis com `tsx`
- ✅ Nenhum uso de `require()`, apenas `import`

---

## 🚀 Comandos Disponíveis no Replit

### 1. Reiniciar o Servidor (Recomendado)
```bash
npm run restart-safe
```

Este comando:
- ✅ Mata apenas processos do servidor Express na porta 5000
- ✅ Protege processos SSH/Cursor (nunca os mata)
- ✅ Aguarda a porta ser liberada
- ✅ Reinicia o servidor em modo produção
- ✅ Mantém o SSH ativo

### 2. Iniciar o Servidor
```bash
npm start
```

Este comando:
- ✅ Verifica se a porta 5000 está em uso
- ✅ Mata processos do servidor se necessário
- ✅ Inicia o servidor em modo produção
- ✅ Protege SSH/Cursor automaticamente

### 3. Apenas Matar Processos na Porta 5000
```bash
npm run kill-port
```

Este comando:
- ✅ Identifica processos na porta 5000
- ✅ Mata apenas processos do servidor Express
- ✅ Protege SSH/Cursor
- ✅ Não reinicia o servidor

### 4. Iniciar Diretamente (Sem Verificação)
```bash
npm run start:direct
```

**⚠️ Use apenas se tiver certeza que a porta está livre!**

---

## 📋 Passo a Passo no Replit SSH

### Cenário 1: Servidor Travado na Porta 5000

```bash
# 1. Conecte via SSH no Replit
# 2. Execute o comando de reinício seguro:
npm run restart-safe

# 3. Aguarde a mensagem:
#    "[Restart Server Safe] ✅ Servidor iniciado com sucesso!"
```

### Cenário 2: Erro "EADDRINUSE" ao Iniciar

```bash
# 1. Execute:
npm start

# O script verifica e limpa automaticamente
# Se ainda der erro, use:
npm run restart-safe
```

### Cenário 3: Verificar Processos na Porta 5000

```bash
# Ver quais processos estão usando a porta:
lsof -i:5000

# Matar apenas processos do servidor:
npm run kill-port

# Depois iniciar:
npm start
```

---

## 🛡️ Garantias de Segurança

### Processos Protegidos (NUNCA serão mortos):
- ✅ `ssh` / `sshd` - Conexão SSH
- ✅ `cursor` - Cursor IDE
- ✅ `replit` - Processos do Replit
- ✅ `systemd` / `init` - Processos do sistema
- ✅ `kernel` - Kernel do sistema

### Processos do Servidor (podem ser mortos):
- ✅ `node` executando `dist/index.js`
- ✅ `tsx` executando `server/index.ts`
- ✅ Qualquer processo Node.js relacionado ao servidor Express

---

## ⚠️ O Que NUNCA Fazer

### ❌ NUNCA use:
```bash
pkill node          # Mata TODOS os processos Node.js, incluindo SSH
killall node        # Mesmo problema
pkill -f node       # Também mata SSH
```

### ✅ SEMPRE use:
```bash
npm run restart-safe    # Seguro e recomendado
npm start               # Verifica e limpa automaticamente
npm run kill-port       # Apenas mata processos do servidor
```

---

## 🔍 Verificação Pós-Execução

Após executar qualquer comando, verifique:

1. **Servidor iniciou?**
   ```bash
   curl http://localhost:5000/health
   # Deve retornar: {"status":"ok","timestamp":"..."}
   ```

2. **SSH ainda está conectado?**
   - Verifique se o terminal SSH ainda responde
   - Tente digitar qualquer comando
   - Se não responder, reconecte (mas isso não deve acontecer)

3. **Porta 5000 está em uso pelo servidor correto?**
   ```bash
   lsof -i:5000
   # Deve mostrar apenas o processo do servidor Express
   ```

4. **API está funcionando?**
   ```bash
   curl http://localhost:5000/api/user-status?email=test@example.com
   # Deve retornar JSON
   ```

---

## 🐛 Troubleshooting

### Problema: Script não encontra processos
**Solução**: Verifique se `lsof` está instalado:
```bash
which lsof
# Se não estiver, instale: apt-get install lsof
```

### Problema: Porta ainda está em uso após `kill-port`
**Solução**: Pode haver processos protegidos (SSH/Cursor) usando a porta:
```bash
lsof -i:5000
# Verifique quais processos estão listados
# Se for SSH/Cursor, não será morto (isso é correto)
```

### Problema: Servidor não inicia após reinício
**Solução**: Verifique os logs e o build:
```bash
# 1. Verifique se o build está atualizado:
npm run build

# 2. Tente iniciar novamente:
npm run restart-safe

# 3. Verifique os logs de erro
```

### Problema: Erro "protected is a reserved word"
**Solução**: ✅ **JÁ CORRIGIDO!** Todos os scripts foram reescritos sem palavras reservadas.

---

## 📝 Exemplo Completo de Uso

```bash
# 1. Conecte via SSH no Replit

# 2. Navegue até o diretório do projeto (se necessário)
cd /home/runner/workspace

# 3. Verifique se há processos na porta 5000
lsof -i:5000

# 4. Reinicie o servidor de forma segura
npm run restart-safe

# 5. Aguarde a mensagem de sucesso:
#    "[Restart Server Safe] ✅ Servidor iniciado com sucesso!"

# 6. Verifique se o servidor está rodando
curl http://localhost:5000/health

# 7. Teste a API
curl http://localhost:5000/api/user-status?email=test@example.com
```

---

## ✅ Checklist Final

Após executar os comandos, confirme:

- [ ] Servidor iniciou sem erros
- [ ] Porta 5000 está em uso pelo servidor correto
- [ ] SSH ainda está conectado (terminal responde)
- [ ] `/api/user-status` responde corretamente
- [ ] WhatsApp está funcionando
- [ ] Painel admin está acessível
- [ ] Nenhum erro de "protected is a reserved word"

---

## 🎉 Resultado

Agora você pode:
- ✅ Reiniciar o backend em segurança no Replit
- ✅ Manter SSH ativo (nunca será derrubado)
- ✅ O SaaS rodar normalmente
- ✅ O WhatsApp responder novamente
- ✅ `/api/user-status` funcionar sempre
- ✅ Todos os scripts compatíveis com ESM/TypeScript

**O SSH do Cursor nunca será encerrado pelos scripts!**




