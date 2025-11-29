import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Zap, Shield, TrendingUp } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">AnotaTudo.AI</h1>
          </div>
          <a href="/api/login">
            <Button data-testid="button-login">
              Entrar
            </Button>
          </a>
        </header>

        {/* Hero Section */}
        <div className="text-center mb-20">
          <h2 className="text-5xl font-bold mb-6 leading-tight">
            Bem-vindo! Seu Assessor Financeiro
            <br />
            <span className="text-primary">no WhatsApp</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Envie uma mensagem, áudio, foto ou vídeo no WhatsApp e transforme tudo em registros financeiros organizados com Inteligência Artificial.
          </p>
          <a href="/api/login">
            <Button size="lg" data-testid="button-get-started">
              Começar Agora
            </Button>
          </a>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          <Card className="hover-elevate" data-testid="card-feature-whatsapp">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">WhatsApp Integrado</h3>
              <p className="text-sm text-muted-foreground">
                Envie mensagens de texto, áudio, foto ou vídeo e deixe a IA organizar tudo.
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="card-feature-ai">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">IA Multimodal</h3>
              <p className="text-sm text-muted-foreground">
                Transcrição de áudio, OCR de boletos e análise de extratos em vídeo.
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="card-feature-cards">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Gestão de Cartões</h3>
              <p className="text-sm text-muted-foreground">
                Acompanhe limites, faturas e receba alertas inteligentes de gastos.
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="card-feature-dashboard">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Dashboard Completo</h3>
              <p className="text-sm text-muted-foreground">
                Visualize entradas, saídas, gráficos e evolução financeira em tempo real.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How it Works */}
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-12">Como Funciona</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-2xl font-bold text-primary">
                1
              </div>
              <h4 className="text-lg font-semibold">Envie no WhatsApp</h4>
              <p className="text-muted-foreground">
                "Paguei R$ 32 no lanche" ou envie foto do boleto
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-2xl font-bold text-primary">
                2
              </div>
              <h4 className="text-lg font-semibold">IA Interpreta</h4>
              <p className="text-muted-foreground">
                Extrai data, valor, categoria e tipo automaticamente
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-2xl font-bold text-primary">
                3
              </div>
              <h4 className="text-lg font-semibold">Dashboard Atualiza</h4>
              <p className="text-muted-foreground">
                Veja tudo organizado em gráficos e tabelas
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-12">
          <a href="/api/login">
            <Button size="lg" data-testid="button-cta-bottom">
              Começar a Usar Gratuitamente
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
