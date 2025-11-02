import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAdminStore } from '@/store/useAdminStore';

export function useAdminSocket() {
  const usuarioLogado = useAdminStore(state => state.usuarioLogado);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!usuarioLogado) {
      // Desconectar socket se não houver usuário logado
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

    // Join na sala do admin
    socket.on('connect', () => {
      console.log('✅ Admin Socket.IO conectado em:', new Date().toISOString());
      socket.emit('join_admin', usuarioLogado.id);
    });

    // Escutar atualizações de chats
    socket.on('chats_atualizado', async () => {
      console.log('🔄 Chats atualizados - recarregando dados...');
      const store = useAdminStore.getState();
      await store.fetchChatsVendedores();
      console.log('✅ Chats recarregados em tempo real!');
    });

    // Escutar nova mensagem (para atualizar chats em tempo real)
    socket.on('nova_mensagem', async (data: any) => {
      console.log('📱 Nova mensagem detectada - atualizando chats...');
      const store = useAdminStore.getState();
      await store.fetchChatsVendedores();
    });

    // Escutar novo lead (para atualizar chats)
    socket.on('novo_lead', async (data: any) => {
      console.log('👤 Novo lead detectado - atualizando chats...');
      const store = useAdminStore.getState();
      await store.fetchChatsVendedores();
    });

    // Escutar mudança de status de lead
    socket.on('lead_status_atualizado', async (data: any) => {
      console.log('📊 Status de lead atualizado - atualizando chats...');
      const store = useAdminStore.getState();
      await store.fetchChatsVendedores();
    });

    // Escutar conexão/desconexão de WhatsApp
    socket.on('whatsapp_connected', async (data: any) => {
      console.log('✅ WhatsApp conectado - atualizando chats...');
      const store = useAdminStore.getState();
      await store.fetchChatsVendedores();
    });

    socket.on('whatsapp_disconnected', async (data: any) => {
      console.log('❌ WhatsApp desconectado - atualizando chats...');
      const store = useAdminStore.getState();
      await store.fetchChatsVendedores();
    });

    // Escutar mudança de status online/offline do consultor
    socket.on('consultor_status_mudou', async (data: any) => {
      console.log(`🔄 Status do consultor ${data.consultorId} mudou: ${data.online ? 'Online' : 'Offline'}`);
      const store = useAdminStore.getState();
      await store.fetchChatsVendedores();
    });

    // Tratar erros
    socket.on('error', (error: any) => {
      console.error('❌ Erro no Admin Socket.IO:', error);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Admin Socket.IO desconectado');
    });

    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [usuarioLogado?.id]);

  return socketRef.current;
}
