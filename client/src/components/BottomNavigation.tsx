import { useTab, TabType } from "@/contexts/TabContext";
import { 
  Home,
  Receipt, 
  Target, 
  CreditCard, 
  Settings 
} from "lucide-react";

const tabs: Array<{ id: TabType; icon: any; label: string }> = [
  { id: "dashboard", icon: Home, label: "Início" },
  { id: "transacoes", icon: Receipt, label: "Transações" },
  { id: "metas", icon: Target, label: "Metas" },
  { id: "cartoes", icon: CreditCard, label: "Cartões" },
  { id: "configuracoes", icon: Settings, label: "Config" },
];

export function BottomNavigation() {
  const { activeTab, setActiveTab } = useTab();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--card)] backdrop-blur supports-[backdrop-filter]:bg-[var(--card)]/60 border-t border-[var(--border)] transition-colors duration-200">
      <div className="grid grid-cols-5 h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
                isActive 
                  ? 'text-[var(--accent-green)]' 
                  : 'text-[var(--text-secondary)]'
              }`}
              data-testid={`bottom-nav-${tab.id}`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'fill-[var(--accent-green)]/20' : ''}`} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
