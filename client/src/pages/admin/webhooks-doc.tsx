import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StripeSectionCard } from "@/components/admin/StripeSectionCard";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const WEBHOOK_URL = "https://anotatudo.com/api/webhooks/subscriptions";

export default function AdminWebhooksDoc() {
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      toast({
        title: "Copiado!",
        description: `${label} copiado para a área de transferência`,
      });
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar",
        variant: "destructive",
      });
    }
  };

  const examplePayload = {
    event: "subscription_created",
    email: "cliente@exemplo.com",
    name: "João Silva",
    whatsapp: "+5511999999999",
    plan: "premium",
    status: "active",
    amount: 2990,
    interval: "month",
  };

  const curlExample = `curl -X POST ${WEBHOOK_URL} \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(examplePayload, null, 2)}'`;

  return (
    <AdminLayout 
      currentPath="/admin/webhooks-doc"
      pageTitle="Documentação Webhooks"
      pageSubtitle="Guia completo de integração via webhooks"
    >
      <AdminPageHeader
        title="Documentação de Webhooks"
        subtitle="Guia de integração para plataformas externas"
      />

      <div className="space-y-6">
        {/* Introdução */}
        <StripeSectionCard>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
              O que são Webhooks?
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Webhooks permitem que plataformas externas (Stripe, Chargebee, Hotmart, etc.) 
              notifiquem automaticamente o AnotaTudo.AI sobre eventos importantes, como criação 
              de assinaturas, pagamentos confirmados ou cancelamentos.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Quando um evento ocorre na plataforma externa, ela envia uma requisição HTTP POST 
              para nossa URL de webhook, e nosso sistema processa automaticamente a informação, 
              criando ou atualizando clientes e assinaturas.
            </p>
          </div>
        </StripeSectionCard>

        {/* URL do Webhook */}
        <StripeSectionCard>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
              URL do Webhook
            </h2>
            <div className="flex items-center gap-3">
              <div className="flex-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <code className="text-sm font-mono text-gray-900 dark:text-gray-50 break-all">
                  {WEBHOOK_URL}
                </code>
              </div>
              <Button
                onClick={() => handleCopy(WEBHOOK_URL, "URL")}
                variant="outline"
                size="sm"
                className="gap-2 flex-shrink-0"
              >
                {copied === "URL" ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
          </div>
        </StripeSectionCard>

        {/* Eventos Suportados */}
        <StripeSectionCard>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
              Eventos Suportados
            </h2>
            <div className="space-y-3">
              <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-50 mb-2">
                  subscription_created
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Nova assinatura criada. O sistema criará um novo cliente e uma assinatura em estado "trial".
                </p>
              </div>
              <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-50 mb-2">
                  subscription_activated
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Assinatura ativada. O sistema atualizará o status da assinatura para "active".
                </p>
              </div>
              <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-50 mb-2">
                  subscription_canceled
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Assinatura cancelada. O sistema atualizará o status para "canceled".
                </p>
              </div>
              <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-50 mb-2">
                  payment_succeeded
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pagamento confirmado. O sistema atualizará o status da assinatura para "active".
                </p>
              </div>
              <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-50 mb-2">
                  payment_failed
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pagamento falhou. O sistema atualizará o status para "overdue".
                </p>
              </div>
              <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-50 mb-2">
                  subscription_paused
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Assinatura pausada. O sistema atualizará o status para "paused".
                </p>
              </div>
            </div>
          </div>
        </StripeSectionCard>

        {/* Formato do Payload */}
        <StripeSectionCard>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
              Formato do Payload
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              O webhook aceita qualquer formato de JSON, mas tenta normalizar automaticamente. 
              Campos obrigatórios e opcionais:
            </p>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-50 mb-2">
                  Campos Obrigatórios
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400 ml-4">
                  <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">email</code> - Email do cliente (obrigatório)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-50 mb-2">
                  Campos Opcionais
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400 ml-4">
                  <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">event</code> - Tipo do evento (ex: "subscription_created")</li>
                  <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">name</code> - Nome completo do cliente</li>
                  <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">whatsapp</code> - Número do WhatsApp</li>
                  <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">plan</code> - Plano (free, premium, enterprise)</li>
                  <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">status</code> - Status (active, trial, paused, canceled, overdue)</li>
                  <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">amount</code> - Valor em centavos</li>
                  <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">interval</code> - Intervalo (month, year)</li>
                </ul>
              </div>
            </div>
          </div>
        </StripeSectionCard>

        {/* Exemplo de Payload */}
        <StripeSectionCard>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
              Exemplo de Payload
            </h2>
            <div className="relative">
              <pre className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-xs overflow-auto border border-gray-200 dark:border-gray-800">
                {JSON.stringify(examplePayload, null, 2)}
              </pre>
              <Button
                onClick={() => handleCopy(JSON.stringify(examplePayload, null, 2), "Payload")}
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2"
              >
                {copied === "Payload" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </StripeSectionCard>

        {/* Teste via cURL */}
        <StripeSectionCard>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
              Como Testar via cURL
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Use o comando abaixo para testar o webhook localmente ou em produção:
            </p>
            <div className="relative">
              <pre className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-xs overflow-auto border border-gray-200 dark:border-gray-800">
                {curlExample}
              </pre>
              <Button
                onClick={() => handleCopy(curlExample, "cURL")}
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2"
              >
                {copied === "cURL" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </StripeSectionCard>

        {/* Teste via Postman */}
        <StripeSectionCard>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
              Como Testar via Postman
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>Abra o Postman e crie uma nova requisição</li>
              <li>Selecione o método <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">POST</code></li>
              <li>Cole a URL: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{WEBHOOK_URL}</code></li>
              <li>Vá para a aba <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">Body</code></li>
              <li>Selecione <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">raw</code> e <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">JSON</code></li>
              <li>Cole o exemplo de payload acima</li>
              <li>Clique em <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">Send</code></li>
            </ol>
          </div>
        </StripeSectionCard>

        {/* Erros Comuns */}
        <StripeSectionCard>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
              Erros Comuns
            </h2>
            <div className="space-y-3">
              <div className="p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                <h3 className="font-semibold text-sm text-red-900 dark:text-red-50 mb-2">
                  ❌ Email é obrigatório
                </h3>
                <p className="text-sm text-red-700 dark:text-red-400">
                  Se o payload não contiver um campo "email" válido, o webhook retornará erro 400. 
                  Certifique-se de incluir o email do cliente no payload.
                </p>
              </div>
              <div className="p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
                <h3 className="font-semibold text-sm text-yellow-900 dark:text-yellow-50 mb-2">
                  ⚠️ Formato de Status
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  O sistema normaliza automaticamente status comuns (paid → active, payment_failed → overdue), 
                  mas é recomendado usar os valores padrão: active, trial, paused, canceled, overdue.
                </p>
              </div>
              <div className="p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-50 mb-2">
                  ℹ️ Cliente Existente
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  Se um cliente com o mesmo email já existir, o sistema atualizará os dados existentes 
                  ao invés de criar um novo cliente.
                </p>
              </div>
            </div>
          </div>
        </StripeSectionCard>

        {/* Resposta do Webhook */}
        <StripeSectionCard>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
              Resposta do Webhook
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              O webhook sempre retorna um JSON com o campo <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">success</code>:
            </p>
            <div className="space-y-2">
              <div className="p-4 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                <h3 className="font-semibold text-sm text-green-900 dark:text-green-50 mb-2">
                  ✅ Sucesso (200)
                </h3>
                <pre className="text-xs text-green-700 dark:text-green-400">
                  {JSON.stringify({ success: true }, null, 2)}
                </pre>
              </div>
              <div className="p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                <h3 className="font-semibold text-sm text-red-900 dark:text-red-50 mb-2">
                  ❌ Erro (400/500)
                </h3>
                <pre className="text-xs text-red-700 dark:text-red-400">
                  {JSON.stringify({ success: false, message: "Email é obrigatório no payload do webhook" }, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </StripeSectionCard>
      </div>
    </AdminLayout>
  );
}


