# 🔧 Configurar Workflow no Replit

## 📋 Passo a Passo

### 1. Acessar Workflows
- No canto superior esquerdo, clique no menu **"Tools"** (ou pressione `Ctrl+K`)
- Busque por **"Workflows"** e clique nele

### 2. Criar/Editar Workflow
- Se já existir um workflow chamado **"Start application"**, clique nele para editar
- Se não existir, clique em **"Create Workflow"** ou **"New Workflow"**

### 3. Configurar o Workflow
- **Nome do Workflow:** `Start application`
- **Comando:** `bash start-dev.sh`
- Clique em **"Save"** para salvar

## ✅ O que o script faz

O `start-dev.sh` irá:
1. **Iniciar o Backend** na porta `5000` (API routes: `/api/*`)
2. **Iniciar o Frontend Vite** na porta `5173` (Interface do usuário)

Ambos os servidores rodarão simultaneamente usando `concurrently` (se disponível) ou processos em background.

## 🌐 Acessar a aplicação

Após iniciar o workflow:
- **Frontend:** Acesse via preview do Replit (porta 5173)
- **Backend API:** `http://localhost:5000/api/*`
- **Health Check:** `http://localhost:5000/api/health`

## ⚠️ Importante

- O workflow iniciará ambos os servidores automaticamente
- Se algum servidor já estiver rodando, pode haver conflito de porta
- Para parar, use `Ctrl+C` no console ou reinicie o Replit

## 🔍 Verificar se está funcionando

Após iniciar, você deve ver no console:
```
🚀 Starting AnotaTudo.AI Development Environment...
📦 Backend:  http://localhost:5000
🎨 Frontend: http://localhost:5173
```

E mensagens de ambos os servidores indicando que estão rodando.

