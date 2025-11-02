import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useProtecarStore } from '@/store/useProtecarStore';

export function useSocket() {
  const consultorAtual = useProtecarStore(state => state.consultorAtual);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!consultorAtual) {
      // Desconectar socket se não houver consultor
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Conectar ao Socket.IO
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://185.217.125.72:3001';
    const socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    // Timestamp de quando o Socket conectou
    const timestampConexao = Date.now();
    
    // Join na sala do consultor
    socket.on('connect', () => {
      console.log('✅ Socket.IO conectado em:', new Date().toISOString());
      socket.emit('join_consultor', consultorAtual.id);
      
      // Marcar consultor como online no sistema
      socket.emit('consultor_online', consultorAtual.id);
    });
    
    // Heartbeat a cada 30 segundos para manter status online
    const heartbeat = setInterval(() => {
      if (socket.connected) {
        socket.emit('consultor_heartbeat', consultorAtual.id);
      }
    }, 30000);

    // Escutar nova mensagem
    socket.on('nova_mensagem', async (data: any) => {
      console.log('📱 Nova mensagem recebida via Socket.IO:', data);
      console.log('🔍 Remetente:', data.remetente, 'Lead:', data.leadId);
      
      if (!data.leadId || !data.conteudo) {
        console.warn('⚠️ Mensagem sem leadId ou conteúdo, ignorando');
        return;
      }
      
      const store = useProtecarStore.getState();
      const leadSelecionado = store.leadSelecionado;
      
      // ✅ SEMPRE adicionar mensagens quando o chat está aberto para esse lead
      if (leadSelecionado && String(leadSelecionado.id) === String(data.leadId)) {
        console.log('💬 Chat está aberto para este lead - adicionando mensagem em tempo real');
        
        const novaMensagem = {
          id: data.id || `msg_${Date.now()}_${Math.random()}`,
          leadId: String(data.leadId),
          consultorId: data.consultorId || consultorAtual?.id || '',
          conteudo: data.conteudo,
          tipo: data.tipo || 'texto',
          remetente: data.remetente || 'lead',
          status: data.status || 'enviada',
          mediaUrl: data.mediaUrl || data.media_url || null,
          mediaName: data.mediaName || data.media_name || null,
          timestamp: data.timestamp || new Date().toISOString()
        };
        
        // Verificar se mensagem já existe
        const mensagensAtuais = store.mensagens;
        const jaExiste = mensagensAtuais.some(m => m.id === novaMensagem.id);
        
        if (!jaExiste) {
          console.log('➕ Adicionando mensagem ao chat aberto');
          useProtecarStore.setState({
            mensagens: [...mensagensAtuais, novaMensagem]
          });
          console.log('✅ Mensagem adicionada com sucesso!');
        } else {
          console.log('⏩ Mensagem já existe no chat, ignorando duplicação');
        }
      } else {
        console.log('💤 Chat não está aberto para este lead - apenas recarregando lista');
      }
      
      // ✅ SEMPRE recarregar lista de leads para atualizar contadores e prévia
      console.log('🔄 Recarregando lista de leads...');
      await store.carregarLeads();
      console.log('✅ Lista de leads atualizada');
    });

    // Escutar novo lead
    socket.on('novo_lead', async (data: any) => {
      console.log('👤 Novo lead recebido via Socket.IO:', data);
      // Recarregar lista de leads
      const store = useProtecarStore.getState();
      console.log('🔄 Recarregando lista de leads (novo lead)...');
      await store.carregarLeads();
      console.log('✅ Lista de leads recarregada');
    });

    // Escutar QR Code do WhatsApp
    socket.on('qr_code', (data: any) => {
      console.log('📷 QR Code recebido');
      useProtecarStore.getState().atualizarConsultor({
        qrCode: data.qrCode,
        statusConexao: 'connecting'
      });
    });

    // Escutar conexão WhatsApp
    socket.on('whatsapp_connected', (data: any) => {
      console.log('✅ WhatsApp conectado');
      console.log('📱 Número recebido:', data.numeroWhatsapp);
      useProtecarStore.getState().atualizarStatusConexao('online');
      
      // Atualizar número do WhatsApp se disponível
      if (data.numeroWhatsapp) {
        useProtecarStore.getState().atualizarConsultor({
          numeroWhatsapp: data.numeroWhatsapp
        });
      }
    });

    // Escutar desconexão WhatsApp
    socket.on('whatsapp_disconnected', (data: any) => {
      console.log('❌ WhatsApp desconectado:', data.reason);
      useProtecarStore.getState().atualizarStatusConexao('offline');
      useProtecarStore.getState().atualizarConsultor({ qrCode: undefined });
    });

    // Escutar atualização de status de mensagens
    socket.on('status_mensagem_atualizado', (data: any) => {
      console.log('✅ Status de mensagem atualizado via Socket:', data);
      console.log('🔍 LeadId:', data.leadId, 'Status:', data.status);
      
      const mensagensAtuais = useProtecarStore.getState().mensagens;
      console.log('📊 Total de mensagens antes da atualização:', mensagensAtuais.length);
      
      // Atualizar status das mensagens no store usando setState corretamente
      const mensagensAtualizadas = mensagensAtuais.map(msg => {
        // Comparar leadId como string para garantir match
        if (String(msg.leadId) === String(data.leadId) && msg.remetente === 'consultor') {
          console.log(`🔄 Atualizando mensagem ${msg.id} de ${msg.status} para ${data.status}`);
          return { ...msg, status: data.status };
        }
        return msg;
      });
      
      console.log('✅ Mensagens atualizadas, aplicando no estado...');
      useProtecarStore.setState({ mensagens: mensagensAtualizadas });
      console.log('✅ Estado atualizado com sucesso!');
    });

    // Tratar erros
    socket.on('error', (error: any) => {
      console.error('❌ Erro no Socket.IO:', error);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket.IO desconectado');
    });

    // Cleanup
    return () => {
      // Marcar consultor como offline ao desconectar
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('consultor_offline', consultorAtual.id);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      clearInterval(heartbeat);
    };
  }, [consultorAtual?.id]);

  return socketRef.current;
}
