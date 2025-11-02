'use client';

import { useEffect, useState } from 'react';
import { useAdminStore } from '@/store/useAdminStore';
import { useAdminSocket } from '@/hooks/useAdminSocket';
import { MessageSquare, Radio } from 'lucide-react';

export default function ChatVisaoGeralView() {
  const chatsVendedores = useAdminStore((state) => state.chatsVendedores);
  const fetchChatsVendedores = useAdminStore((state) => state.fetchChatsVendedores);
  
  // Conectar ao Socket.IO para atualizações em tempo real
  useAdminSocket();

  // Carregar dados iniciais
  useEffect(() => {
    fetchChatsVendedores();
  }, []);

  // Função para abrir CRM do vendedor em nova aba
  const abrirCRMVendedor = async (vendedorId: string | number) => {
    try {
      // Buscar token do admin (pode estar com nome diferente)
      let token = localStorage.getItem('token');
      
      // Se não encontrar, tentar buscar com outro nome comum
      if (!token) {
        token = localStorage.getItem('adminToken');
      }
      if (!token) {
        token = localStorage.getItem('auth_token');
      }
      
      // Como último recurso, pegar de qualquer chave que tenha 'token'
      if (!token) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.toLowerCase().includes('token')) {
            token = localStorage.getItem(key);
            console.log(`✅ Token encontrado em: ${key}`);
            break;
          }
        }
      }
      
      if (!token) {
        console.error('❌ Nenhum token encontrado no localStorage');
        console.log('📋 Chaves disponíveis:', Object.keys(localStorage));
        alert('Token de autenticação não encontrado. Faça login novamente.');
        return;
      }
      
      console.log('✅ Token do admin encontrado!');

      // Solicitar token temporário
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://185.217.125.72:3001';
      const response = await fetch(`${API_URL}/admin/vendedores/${vendedorId}/gerar-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar token temporário');
      }

      const data = await response.json();
      
      // Abrir nova aba com o token temporário
      const url = `${window.location.origin}/crm?tempToken=${data.token}`;
      window.open(url, '_blank');
    } catch (error) {
      console.error('Erro ao abrir CRM do vendedor:', error);
      alert('Erro ao abrir CRM do vendedor');
    }
  };

  // Exibir mensagem se não houver chats ativos
  if (chatsVendedores.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Chat - Visão Geral</h2>
            <div className="flex items-center gap-2 text-slate-600">
              <span>Acompanhe os chats ativos de cada vendedor</span>
              <span className="flex items-center gap-1 text-green-600 text-sm">
                <Radio className="w-3 h-3 animate-pulse" />
                Tempo Real
              </span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg">Nenhum chat ativo no momento</p>
          <p className="text-slate-400 text-sm mt-2">Os chats ativos dos vendedores aparecerão aqui</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Chat - Visão Geral</h2>
          <div className="flex items-center gap-2 text-slate-600">
            <span>Acompanhe os chats ativos de cada vendedor</span>
            <span className="flex items-center gap-1 text-green-600 text-sm">
              <Radio className="w-3 h-3 animate-pulse" />
              Tempo Real
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chatsVendedores.map((chat) => (
          <div key={chat.vendedorId} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                  {chat.vendedorNome.charAt(0)}
                </div>
                <div>
                  <button
                    onClick={() => abrirCRMVendedor(chat.vendedorId)}
                    className="font-semibold text-slate-800 hover:text-blue-600 transition-colors text-left"
                    title="Clique para abrir o CRM deste vendedor"
                  >
                    {chat.vendedorNome}
                  </button>
                  <div className="flex items-center gap-1 text-xs">
                  <div className="flex flex-col gap-1">
                    {/* Status WhatsApp */}
                    {chat.whatsappConectado ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        📱 WhatsApp: Conectado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        📱 WhatsApp: Desconectado
                      </span>
                    )}
                    
                    {/* Status Sistema */}
                    {chat.sistemaOnline ? (
                      <span className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        💻 Sistema: Logado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        💻 Sistema: Deslogado
                      </span>
                    )}
                  </div>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{chat.chatsAtivos}</p>
                <p className="text-xs text-slate-500">chats</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700 mb-2">Distribuição:</p>
              {chat.distribuicao.map((dist) => (
                <div key={dist.etapa} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{dist.etapa}</span>
                  <span className="font-medium text-slate-800">{dist.quantidade} ({dist.percentual.toFixed(0)}%)</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
