import { useTab, TabType } from "@/contexts/TabContext";
import { 
  Home,
  Receipt, 
  PiggyBank, 
  Wallet, 
  Target, 
  CreditCard, 
  Lightbulb, 
  Settings 
} from "lucide-react";

const tabs: Array<{ id: TabType; icon: any; label: string }> = [
  { id: "dashboard", icon: Home, label: "Início" },
  { id: "transacoes", icon: Receipt, label: "Transações" },
  { id: "economias", icon: PiggyBank, label: "Economias" },
  { id: "orcamento", icon: Wallet, label: "Orçamento" },
  { id: "metas", icon: Target, label: "Metas" },
  { id: "cartoes", icon: CreditCard, label: "Cartões" },
  { id: "insights", icon: Lightbulb, label: "Insights" },
  { id: "configuracoes", icon: Settings, label: "Config" },
];

export function BottomNavigation() {
  const { activeTab, setActiveTab } = useTab();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
      <div className="grid grid-cols-8 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center transition-colors ${
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid={`bottom-nav-${tab.id}`}
            >
              <Icon className={`h-6 w-6 ${isActive ? 'fill-primary/20' : ''}`} />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
