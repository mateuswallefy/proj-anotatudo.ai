import { useLocation } from "wouter";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AdminOverview from "./overview";

export default function AdminPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        toast({
          title: "Acesso negado",
          description: "Você precisa estar autenticado para acessar o painel admin.",
          variant: "destructive",
        });
        setLocation("/auth");
        return;
      }

      if (user.role !== "admin") {
        toast({
          title: "Acesso restrito",
          description: "Apenas administradores podem acessar o painel admin.",
          variant: "destructive",
        });
        setLocation("/");
        return;
      }
    }
  }, [user, isLoading, setLocation, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return <AdminOverview />;
}








