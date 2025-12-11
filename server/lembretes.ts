import { storage } from "./storage.js";
import { sendWhatsAppMessage } from "./whatsapp.js";
import { format, addMinutes, addHours, addDays, parse, isBefore, isAfter } from "date-fns";

/**
 * Verifica eventos que precisam ser notificados e envia lembretes via WhatsApp
 */
export async function processarLembretes() {
  try {
    console.log("[Lembretes] Iniciando verificação de lembretes...");
    
    // Buscar todos os eventos que ainda não foram notificados e têm lembrete configurado
    const eventos = await storage.getEventosParaLembrete();
    
    if (eventos.length === 0) {
      console.log("[Lembretes] Nenhum evento para notificar.");
      return;
    }
    
    console.log(`[Lembretes] Encontrados ${eventos.length} eventos para verificar.`);
    
    const agora = new Date();
    const eventosParaNotificar: Array<{ evento: any; minutosRestantes: number }> = [];
    
    for (const evento of eventos) {
      if (!evento.lembreteMinutos || !evento.data) {
        continue;
      }
      
      // Construir data/hora do evento
      let dataHoraEvento: Date;
      
      if (evento.hora) {
        // Parse hora no formato HH:mm
        const [hora, minuto] = evento.hora.split(':').map(Number);
        dataHoraEvento = new Date(evento.data);
        dataHoraEvento.setHours(hora, minuto, 0, 0);
      } else {
        // Se não tem hora, usar início do dia
        dataHoraEvento = new Date(evento.data);
        dataHoraEvento.setHours(9, 0, 0, 0); // Default 9h
      }
      
      // Calcular quando o lembrete deve ser enviado
      let dataLembrete: Date;
      if (evento.lembreteMinutos === 30) {
        dataLembrete = addMinutes(dataHoraEvento, -30);
      } else if (evento.lembreteMinutos === 60) {
        dataLembrete = addHours(dataHoraEvento, -1);
      } else if (evento.lembreteMinutos === 1440) {
        dataLembrete = addDays(dataHoraEvento, -1);
      } else {
        continue;
      }
      
      // Verificar se já passou o horário do lembrete mas ainda não passou o evento
      const jaPassouLembrete = isBefore(dataLembrete, agora);
      const aindaNaoPassouEvento = isBefore(agora, dataHoraEvento);
      
      // Verificar se está dentro de uma janela de 5 minutos (para evitar múltiplos envios)
      const diferencaMinutos = Math.abs((agora.getTime() - dataLembrete.getTime()) / (1000 * 60));
      
      if (jaPassouLembrete && aindaNaoPassouEvento && diferencaMinutos <= 5) {
        eventosParaNotificar.push({
          evento,
          minutosRestantes: Math.round((dataHoraEvento.getTime() - agora.getTime()) / (1000 * 60)),
        });
      }
    }
    
    console.log(`[Lembretes] ${eventosParaNotificar.length} eventos para notificar agora.`);
    
    // Enviar lembretes
    for (const { evento, minutosRestantes } of eventosParaNotificar) {
      try {
        // Buscar usuário
        const user = await storage.getUser(evento.userId);
        if (!user || !user.whatsappNumber) {
          console.log(`[Lembretes] Usuário ${evento.userId} não tem WhatsApp configurado.`);
          continue;
        }
        
        // Formatar mensagem
        const { ptBR } = await import("date-fns/locale/pt-BR");
        const dataFormatada = format(new Date(evento.data), "dd/MM/yyyy", { locale: ptBR });
        const horaText = evento.hora ? ` às ${evento.hora}` : '';
        const minutosText = minutosRestantes < 60 
          ? `${minutosRestantes} minutos` 
          : minutosRestantes < 1440
          ? `${Math.round(minutosRestantes / 60)} horas`
          : `${Math.round(minutosRestantes / 1440)} dias`;
        
        const mensagem = `⏰ *Lembrete de Evento*\n\n*${evento.titulo}*\n📅 ${dataFormatada}${horaText}\n\n⏳ Faltam ${minutosText} para o evento.\n\n${evento.descricao ? `📝 ${evento.descricao}` : ''}`;
        
        // Enviar mensagem
        await sendWhatsAppMessage({
          to: user.whatsappNumber,
          message: mensagem,
        });
        
        // Marcar como notificado
        await storage.updateEvento(evento.id, evento.userId, {
          notificado: true,
        });
        
        console.log(`[Lembretes] ✅ Lembrete enviado para evento "${evento.titulo}" (usuário ${user.id})`);
      } catch (error: any) {
        console.error(`[Lembretes] ❌ Erro ao enviar lembrete para evento ${evento.id}:`, error.message);
      }
    }
    
    console.log("[Lembretes] Processamento de lembretes concluído.");
  } catch (error: any) {
    console.error("[Lembretes] Erro ao processar lembretes:", error);
  }
}

