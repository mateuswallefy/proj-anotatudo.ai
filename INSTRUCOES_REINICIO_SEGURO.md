# Instruções - Reinício Seguro do Servidor

## 🎯 Problema Resolvido

✅ **Porta 5000 já em uso** - Resolvido  
✅ **Servidor travando** - Resolvido  
✅ **App crashed no Replit** - Resolvido  
✅ **SSH caindo quando mato processos** - Resolvido  

---

## 📋 Comandos Disponíveis

### 1. `npm start`
Inicia o servidor de forma segura:
- Verifica se a porta 5000 está em uso
- Mata apenas processos do servidor Express (protegendo SSH/Cursor)
- Inicia o servidor em modo produção

```bash
npm start
```

### 2. `npm run restart-safe`
Reinicia o servidor de forma segura:
- Mata processos do servidor na porta 5000
- Aguarda porta ser liberada
- Inicia servidor novamente

```bash
npm run restart-safe
```

### 3. `npm run kill-port`
Mata apenas processos do servidor na porta 5000 (sem reiniciar):

```bash
npm run kill-port
# ou especificar outra porta:
npx tsx server/scripts/killPortSafe.ts 5000
```

### 4. `npm run start:direct`
Inicia o servidor diretamente (sem verificar porta):
- Use apenas se tiver certeza que a porta está livre

```bash
npm run start:direct
```

---

## 🛡️ Proteções Implementadas

### Processos Protegidos (NUNCA serão mortos):
- `ssh` / `sshd` - Conexão SSH
- `cursor` - Cursor IDE
- `replit` - Processos do Replit
- `systemd` / `init` - Processos do sistema
- `kernel` - Kernel do sistema

### Processos do Servidor (podem ser mortos):
- `node` executando `dist/index.js`
- `tsx` executando `server/index.ts`
- Qualquer processo Node.js relacionado ao servidor Express

---

## 🔍 Como Funciona

### 1. Identificação de Processos
O script usa `lsof -t -i:5000` para encontrar todos os processos usando a porta 5000.

### 2. Verificação de Segurança
Para cada processo encontrado:
- Obtém o nome do processo (`ps -p <PID> -o comm=`)
- Obtém a linha de comando completa (`ps -p <PID> -o args=`)
- Verifica se contém palavras-chave protegidas (ssh, cursor, etc.)
- Verifica se é um processo do servidor (node, tsx, dist/index.js)

### 3. Ação Segura
- **Processos protegidos**: Ignorados (não são mortos)
- **Processos do servidor**: Mortos com `kill -9 <PID>`
- **Processos desconhecidos**: Ignorados por segurança

---

## 📝 Exemplos de Uso

### Cenário 1: Servidor travado na porta 5000
```bash
# Opção 1: Reiniciar automaticamente
npm run restart-safe

# Opção 2: Apenas matar processos e iniciar manualmente
npm run kill-port
npm start
```

### Cenário 2: Erro "EADDRINUSE" ao iniciar
```bash
# npm start agora verifica e limpa automaticamente
npm start
```

### Cenário 3: Verificar processos na porta 5000
```bash
# Ver quais processos estão usando a porta
lsof -i:5000

# Matar apenas processos do servidor
npm run kill-port
```

---

## ⚠️ Avisos Importantes

1. **NUNCA use `pkill node`** - Isso mata TODOS os processos Node.js, incluindo o SSH
2. **NUNCA use `killall node`** - Mesmo problema do `pkill`
3. **Sempre use os scripts fornecidos** - Eles protegem o SSH automaticamente

---

## 🐛 Troubleshooting

### Problema: Porta ainda está em uso após `kill-port`
**Solução**: Pode haver processos protegidos (SSH/Cursor) usando a porta. Verifique com:
```bash
lsof -i:5000
```

### Problema: Script não encontra processos
**Solução**: Verifique se `lsof` está instalado:
```bash
which lsof
# Se não estiver, instale: apt-get install lsof (Linux) ou brew install lsof (macOS)
```

### Problema: Servidor não inicia após reinício
**Solução**: Verifique os logs:
```bash
npm start
# Ou verifique se o build está atualizado:
npm run build
npm start
```

---

## ✅ Checklist de Verificação

Após usar os scripts, verifique:

- [ ] Servidor iniciou sem erros
- [ ] Porta 5000 está em uso pelo servidor correto
- [ ] SSH ainda está conectado (Cursor funcionando)
- [ ] `/api/user-status` responde corretamente
- [ ] WhatsApp está funcionando
- [ ] Painel admin está acessível

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do servidor
2. Execute `npm run kill-port` para ver quais processos são detectados
3. Verifique se há processos protegidos usando a porta com `lsof -i:5000`
4. Use `npm run restart-safe` para reiniciar tudo de forma segura

---

## 🎉 Resultado Final

Agora você pode:
- ✅ Reiniciar o backend em segurança
- ✅ Manter SSH ativo
- ✅ O SaaS rodar normalmente
- ✅ O WhatsApp responder novamente
- ✅ `/api/user-status` funcionar sempre

**O SSH do Cursor nunca será encerrado pelos scripts!**



