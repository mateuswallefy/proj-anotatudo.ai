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

  // Mostrar apenas tabs principais no mobile
  const mainTabs = tabs.filter(tab => 
    ['dashboard', 'transacoes', 'economias', 'configuracoes'].includes(tab.id)
  );

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
      <div className="grid grid-cols-4 h-14">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground'
              }`}
              data-testid={`bottom-nav-${tab.id}`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'fill-primary/20' : ''}`} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
