import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Bell, FileText } from "lucide-react";
import { useLocation } from "wouter";

export function QuickActions() {
  const [, setLocation] = useLocation();

  const actions = [
    {
      id: "add-transaction",
      label: "Adicionar transação",
      icon: Plus,
      onClick: () => setLocation("/adicionar"),
    },
    {
      id: "reminder",
      label: "Configurar lembrete",
      icon: Bell,
      onClick: () => {
        // Em breve
        console.log("Lembretes - em breve");
      },
    },
    {
      id: "report",
      label: "Ver relatório",
      icon: FileText,
      onClick: () => {
        // Em breve
        console.log("Relatórios - em breve");
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Card
            key={action.id}
            className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-primary/50"
            onClick={action.onClick}
          >
            <CardContent className="p-4">
              <div className="flex flex-col items-center gap-2">
                <div className="p-2 rounded-full bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-center">{action.label}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

