'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProtecarStore } from '@/store/useProtecarStore';
import { useSocket } from '@/hooks/useSocket';
import TarefaNotification from '@/components/TarefaNotification';
import { Shield, MessageSquare, LayoutDashboard, FileText, Calendar, Settings, LogOut, Wifi, WifiOff } from 'lucide-react';

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { 
    isAuthenticated, 
    consultorAtual, 
    viewMode, 
    setViewMode, 
    logout,
    leads,
    getTarefasPendentes
  } = useProtecarStore();
  
  // Conectar ao Socket.IO para tempo real
  useSocket();

  useEffect(() => {
    // PRIMEIRO: Verificar se há tempToken na URL (login como vendedor)
    const urlParams = new URLSearchParams(window.location.search);
    const tempToken = urlParams.get('tempToken');
    
    if (tempToken) {
      console.log('✅ Token temporário detectado na URL');
      localStorage.setItem('token', tempToken);
      
      // Remover tempToken da URL sem recarregar
      const url = new URL(window.location.href);
      url.searchParams.delete('tempToken');
      window.history.replaceState({}, '', url.toString());
    }
    
    // DEPOIS: Verificar token no localStorage
    const token = localStorage.getItem('token');
    
    // Se tem token mas não está autenticado, decodificar token e carregar dados
    if (token && !isAuthenticated) {
      console.log('✅ Token encontrado no localStorage');
      
      try {
        // Decodificar token JWT (simples decode, sem verificar assinatura)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        console.log('✅ Token decodificado:', payload);
        
        // Buscar dados completos do usuário
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://185.217.125.72:3001';
        fetch(`${API_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => {
          if (!res.ok) throw new Error('Falha ao buscar dados');
          return res.json();
        })
        .then(data => {
          console.log('✅ Dados completos recebidos:', data);
          useProtecarStore.setState({
            consultorAtual: data.consultor,
            isAuthenticated: true
          });
          useProtecarStore.getState().carregarLeads();
        })
        .catch(error => {
          console.error('❌ Erro ao buscar dados completos, usando dados do token:', error);
          // Fallback: usar dados básicos do token
          useProtecarStore.setState({
            consultorAtual: {
              id: payload.id,
              nome: payload.nome || 'Vendedor',
              email: payload.email,
              telefone: '',
              statusConexao: 'offline'
            } as any,
            isAuthenticated: true
          });
          useProtecarStore.getState().carregarLeads();
        });
      } catch (error) {
        console.error('❌ Erro ao processar token:', error);
        localStorage.removeItem('token');
        router.push('/');
      }
    } else if (!token && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !consultorAtual) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // Calcular badges reais
  const totalMensagensNaoLidas = leads.reduce((total, lead) => total + (lead.mensagensNaoLidas || 0), 0);
  const totalTarefasPendentes = getTarefasPendentes().length;

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'chat', icon: MessageSquare, label: 'Chat', badge: totalMensagensNaoLidas },
    { id: 'funil', icon: LayoutDashboard, label: 'Funil' },
    { id: 'tarefas', icon: Calendar, label: 'Tarefas', badge: totalTarefasPendentes },
    { id: 'followup', icon: Calendar, label: 'Follow-UP' },
    { id: 'configuracoes', icon: Settings, label: 'Configurações' },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#ECE5DD]">
      {/* Header Superior - Estilo WhatsApp */}
      <header className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8" />
          <div>
            <h1 className="font-semibold text-lg">VIP CRM</h1>
            <p className="text-xs text-green-200">Sistema de Vendas</p>
          </div>
        </div>

        {/* Menu Principal - Centro */}
        <div className="flex items-center gap-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = viewMode === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setViewMode(item.id as any)}
                className={`
                  relative flex items-center gap-2 px-4 py-2 font-medium transition rounded-lg
                  ${isActive 
                    ? 'bg-white/20 text-white' 
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          {/* Status WhatsApp */}
          <div className="flex items-center gap-2 text-sm">
            {consultorAtual.statusConexao === 'online' ? (
              <>
                <Wifi className="w-4 h-4 text-green-300" />
                <span className="text-green-200">Online</span>
              </>
            ) : consultorAtual.statusConexao === 'connecting' ? (
              <>
                <Wifi className="w-4 h-4 text-yellow-300 animate-pulse" />
                <span className="text-yellow-200">Conectando...</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-300" />
                <span className="text-red-200">Offline</span>
              </>
            )}
          </div>

          {/* Perfil do Consultor */}
          <div className="flex items-center gap-3 pl-4 border-l border-green-700">
            <div className="text-right">
              <div className="font-medium text-sm">{consultorAtual.nome}</div>
              <div className="text-xs text-green-200">{consultorAtual.email}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden">
              {consultorAtual.avatar ? (
                <img src={consultorAtual.avatar} alt={consultorAtual.nome} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[#128C7E] font-bold text-lg">
                  {consultorAtual.nome.charAt(0)}
                </span>
              )}
            </div>
          </div>

          {/* Botão Logout */}
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-green-700 rounded-full transition"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>


      {/* Conteúdo Principal */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>

      {/* Notificações de Tarefas */}
      <TarefaNotification />
    </div>
  );
}
