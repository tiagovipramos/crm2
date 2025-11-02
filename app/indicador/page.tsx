'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useIndicadorStore } from '@/store/useIndicadorStore';
import {
  DollarSign,
  Lock,
  XCircle,
  Users,
  TrendingUp,
  LogOut,
  Loader2,
  Check,
  X,
  Phone,
  Plus,
  Search,
  Filter,
  Calendar,
  Award,
  ArrowUp,
  Menu,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  Gift,
} from 'lucide-react';
import CelebrationConfetti from '@/components/CelebrationConfetti';
import { useCelebration } from '@/hooks/useCelebration';
import AvatarUpload from '@/components/AvatarUpload';
import LootBox from '@/components/LootBox';
import LootBoxProgressDual from '@/components/LootBoxProgressDual';

export default function IndicadorDashboardPage() {
  const router = useRouter();
  const {
    indicador,
    token,
    dashboard,
    lootboxStatus,
    logout,
    fetchDashboard,
    fetchLootBoxStatus,
    abrirLootBox,
    compartilharPremio,
    validarWhatsApp,
    criarIndicacao,
    deletarTodasIndicacoes,
    atualizarAvatar,
    isLoading,
  } = useIndicadorStore();

  const [nomeIndicado, setNomeIndicado] = useState('');
  const [telefoneIndicado, setTelefoneIndicado] = useState('');
  const [validando, setValidando] = useState(false);
  const [validacaoResult, setValidacaoResult] = useState<any>(null);
  const [criandoIndicacao, setCriandoIndicacao] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [filtroMes, setFiltroMes] = useState<string>('');
  const [filtroAno, setFiltroAno] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [buscaNome, setBuscaNome] = useState<string>('');
  
  // Estados para UI Mobile
  const [showNovaIndicacao, setShowNovaIndicacao] = useState(false);
  const [showFiltros, setShowFiltros] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [showLootBox, setShowLootBox] = useState(false);
  
  // Hook de celebração
  const { 
    showCelebration, 
    celebrationData, 
    celebrate, 
    hideCelebration, 
    soundEnabled, 
    toggleSound,
    requestNotificationPermission 
  } = useCelebration();
  
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [previousIndicacoes, setPreviousIndicacoes] = useState<any[]>([]);

  useEffect(() => {
    if (!token) {
      router.replace('/indicador/login');
      return;
    }
    fetchDashboard();
    fetchLootBoxStatus();
    
    // Verificar permissão de notificações
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, [token, router]);
  
  // Detectar mudanças nas indicações para celebrar
  useEffect(() => {
    if (!dashboard) return;
    
    const currentIndicacoes = dashboard.indicacoesRecentes;
    
    // Se não há indicações anteriores, apenas salvar o estado atual
    if (previousIndicacoes.length === 0 && currentIndicacoes.length > 0) {
      setPreviousIndicacoes(currentIndicacoes);
      return;
    }
    
    // Verificar se alguma indicação mudou de status para "respondeu" ou "converteu"
    currentIndicacoes.forEach(current => {
      const previous = previousIndicacoes.find(p => p.id === current.id);
      
      if (previous) {
        // Se mudou de "aguardando" para "respondeu"
        if (previous.status === 'aguardando' && current.status === 'respondeu') {
          celebrate(2.00, `${current.nomeIndicado} respondeu!`);
        }
        // Se mudou para "converteu"
        else if (previous.status !== 'converteu' && current.status === 'converteu') {
          celebrate(2.00, `${current.nomeIndicado} comprou!`);
        }
      }
    });
    
    setPreviousIndicacoes(currentIndicacoes);
  }, [dashboard, celebrate]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white font-semibold">Carregando...</p>
        </div>
      </div>
    );
  }

  const handleValidarWhatsApp = async () => {
    if (!telefoneIndicado) return;

    setValidando(true);
    setValidacaoResult(null);

    try {
      const result = await validarWhatsApp(telefoneIndicado);
      setValidacaoResult(result);
    } catch (error) {
      setValidacaoResult({
        valido: false,
        existe: false,
        mensagem: 'Erro ao validar WhatsApp',
      });
    } finally {
      setValidando(false);
    }
  };

  const handleCriarIndicacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validacaoResult?.valido) return;

    setCriandoIndicacao(true);
    setSucesso(false);

    try {
      await criarIndicacao(nomeIndicado, telefoneIndicado);
      setSucesso(true);
      setNomeIndicado('');
      setTelefoneIndicado('');
      setValidacaoResult(null);
      setShowNovaIndicacao(false);
      
      setTimeout(() => setSucesso(false), 5000);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao criar indicação');
    } finally {
      setCriandoIndicacao(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/indicador/login');
  };

  const maskPhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    
    if (numbers.length === 11) {
      const ddd = numbers.substring(0, 2);
      const lastFour = numbers.substring(7);
      return `(${ddd}) *****-${lastFour}`;
    } else if (numbers.length === 10) {
      const ddd = numbers.substring(0, 2);
      const lastFour = numbers.substring(6);
      return `(${ddd}) ****-${lastFour}`;
    } else if (numbers.length === 13) {
      const ddd = numbers.substring(2, 4);
      const lastFour = numbers.substring(9);
      return `(${ddd}) *****-${lastFour}`;
    }
    
    const lastFour = numbers.substring(numbers.length - 4);
    return `*****-${lastFour}`;
  };

  const indicacoesFiltradas = dashboard?.indicacoesRecentes.filter((ind) => {
    if (buscaNome && ind.nomeIndicado && !ind.nomeIndicado.toLowerCase().includes(buscaNome.toLowerCase())) {
      return false;
    }

    if (filtroStatus && ind.status !== filtroStatus) {
      return false;
    }

    const dataIndicacao = new Date(ind.dataIndicacao);
    
    if (filtroMes) {
      const mesIndicacao = (dataIndicacao.getMonth() + 1).toString().padStart(2, '0');
      if (mesIndicacao !== filtroMes) {
        return false;
      }
    }

    if (filtroAno) {
      const anoIndicacao = dataIndicacao.getFullYear().toString();
      if (anoIndicacao !== filtroAno) {
        return false;
      }
    }

    return true;
  }) || [];

  const limparFiltros = () => {
    setFiltroMes('');
    setFiltroAno('');
    setFiltroStatus('');
    setBuscaNome('');
  };

  if (!indicador || !dashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white font-semibold">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header Fixo Mobile */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAvatarUpload(true)}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all hover:scale-110 active:scale-95 relative group"
            >
              {indicador.avatar ? (
                <img
                  src={indicador.avatar}
                  alt={indicador.nome}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-lg">
                  {indicador.nome ? indicador.nome.charAt(0).toUpperCase() : '?'}
                </span>
              )}
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
            </button>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">
                {indicador.nome ? indicador.nome.split(' ')[0] : 'Indicador'}
              </h1>
              <p className="text-purple-100 text-xs">Indicador VIP</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Menu className="w-6 h-6 text-white" />
          </button>
        </div>

        {showMenu && (
          <div className="absolute top-full right-4 mt-2 w-56 bg-white rounded-xl shadow-xl overflow-hidden animate-slideDown">
            <button
              onClick={() => {
                celebrate(2.00, 'Teste de celebração! 🎉');
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-green-50 transition-colors text-green-600 font-medium border-b"
            >
              <Award className="w-5 h-5" />
              <span>🎉 Testar Celebração</span>
            </button>
            
            <button
              onClick={toggleSound}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors text-gray-700 font-medium border-b"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-5 h-5 text-green-600" />
                  <span>Som Ativado</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-5 h-5 text-gray-400" />
                  <span>Som Desativado</span>
                </>
              )}
            </button>
            
            <button
              onClick={async () => {
                const granted = await requestNotificationPermission();
                if (granted) {
                  setNotificationPermission('granted');
                  alert('✅ Notificações ativadas! Você receberá alertas quando ganhar comissões.');
                } else {
                  alert('❌ Permissão negada. Ative nas configurações do navegador.');
                }
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors text-gray-700 font-medium border-b"
            >
              {notificationPermission === 'granted' ? (
                <>
                  <Bell className="w-5 h-5 text-blue-600" />
                  <span>Notificações Ativas</span>
                </>
              ) : (
                <>
                  <BellOff className="w-5 h-5 text-gray-400" />
                  <span>Ativar Notificações</span>
                </>
              )}
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 transition-colors text-red-600 font-medium"
            >
              <LogOut className="w-5 h-5" />
              Sair da Conta
            </button>
          </div>
        )}
      </header>

      {sucesso && (
        <div className="fixed top-20 left-4 right-4 z-50 animate-slideDown">
          <div className="bg-green-500 text-white p-4 rounded-xl shadow-xl flex items-center gap-3">
            <Check className="w-6 h-6 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold">Indicação criada!</p>
              <p className="text-sm text-green-100">R$ 2,00 bloqueados</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Celebração com Confetti */}
      {showCelebration && celebrationData && (
        <CelebrationConfetti
          amount={celebrationData.amount}
          message={celebrationData.message}
          onComplete={hideCelebration}
        />
      )}

      <main className="pt-20 px-4 max-w-[480px] mx-auto">
        <div className="space-y-3 mb-6">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <span className="text-green-50 text-sm font-semibold">Disponível</span>
              </div>
              <div className="bg-white/20 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
            </div>
            <p className="text-4xl font-black text-white mb-1">
              R$ {dashboard.saldos.disponivel.toFixed(2)}
            </p>
            <p className="text-green-100 text-sm font-medium">Pronto para saque</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-black text-white mb-1">
                R$ {dashboard.saldos.bloqueado.toFixed(2)}
              </p>
              <p className="text-orange-100 text-xs font-medium">Bloqueado</p>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl p-4 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                <XCircle className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-black text-white mb-1">
                R$ {dashboard.saldos.perdido.toFixed(2)}
              </p>
              <p className="text-red-100 text-xs font-medium">Perdido</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            Estatísticas
          </h2>
          
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-blue-100 flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-gray-800">
                {dashboard.estatisticas.totalIndicacoes}
              </p>
              <p className="text-xs text-gray-500 font-medium">Total</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-green-100 flex items-center justify-center mb-2">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-2xl font-black text-gray-800">
                {dashboard.estatisticas.indicacoesRespondidas}
              </p>
              <p className="text-xs text-gray-500 font-medium">Respostas</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-purple-100 flex items-center justify-center mb-2">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-2xl font-black text-gray-800">
                {dashboard.estatisticas.indicacoesConvertidas}
              </p>
              <p className="text-xs text-gray-500 font-medium">Vendas</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-orange-100 flex items-center justify-center mb-2">
                <ArrowUp className="w-6 h-6 text-orange-600" />
              </div>
              <p className="text-2xl font-black text-gray-800">
                {dashboard.estatisticas.taxaResposta.toFixed(0)}%
              </p>
              <p className="text-xs text-gray-500 font-medium">Taxa</p>
            </div>
          </div>
        </div>

        {/* Caixas Misteriosas - Gamificação Dual */}
        {lootboxStatus && (
          <LootBoxProgressDual
            leadsParaProximaCaixa={lootboxStatus.leadsParaProximaCaixa}
            leadsNecessarios={lootboxStatus.leadsNecessarios}
            podeAbrirIndicacoes={lootboxStatus.podeAbrirIndicacoes}
            onAbrirIndicacoes={() => setShowLootBox(true)}
            vendasParaProximaCaixa={lootboxStatus.vendasParaProximaCaixa}
            vendasNecessarias={lootboxStatus.vendasNecessarias}
            podeAbrirVendas={lootboxStatus.podeAbrirVendas}
            onAbrirVendas={() => setShowLootBox(true)}
          />
        )}

        <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
          <div className="flex gap-2 mb-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={buscaNome}
                onChange={(e) => setBuscaNome(e.target.value)}
                placeholder="Buscar indicação..."
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none font-medium text-sm"
              />
            </div>
            <button
              onClick={() => setShowFiltros(!showFiltros)}
              className={`px-4 rounded-xl font-semibold transition-all ${
                showFiltros || filtroMes || filtroAno || filtroStatus
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {showFiltros && (
            <div className="space-y-3 pt-3 border-t animate-slideDown">
              <select
                value={filtroMes}
                onChange={(e) => setFiltroMes(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none font-medium text-sm"
              >
                <option value="">Todos os meses</option>
                <option value="01">Janeiro</option>
                <option value="02">Fevereiro</option>
                <option value="03">Março</option>
                <option value="04">Abril</option>
                <option value="05">Maio</option>
                <option value="06">Junho</option>
                <option value="07">Julho</option>
                <option value="08">Agosto</option>
                <option value="09">Setembro</option>
                <option value="10">Outubro</option>
                <option value="11">Novembro</option>
                <option value="12">Dezembro</option>
              </select>

              <select
                value={filtroAno}
                onChange={(e) => setFiltroAno(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none font-medium text-sm"
              >
                <option value="">Todos os anos</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </select>

              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none font-medium text-sm"
              >
                <option value="">Todos os status</option>
                <option value="aguardando">Aguardando</option>
                <option value="respondeu">Respondeu</option>
                <option value="converteu">Converteu</option>
                <option value="engano">Engano</option>
              </select>

              {(buscaNome || filtroMes || filtroAno || filtroStatus) && (
                <button
                  onClick={limparFiltros}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Limpar Filtros
                </button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Indicações ({indicacoesFiltradas.length})
            </h2>
            
            {dashboard.indicacoesRecentes.length > 0 && (
              <button
                onClick={async () => {
                  if (!confirm('⚠️ Deseja realmente APAGAR TODAS as indicações?\n\nEsta ação não pode ser desfeita!')) return;
                  if (!confirm('⚠️ ÚLTIMA CONFIRMAÇÃO!\n\nTodos os seus saldos serão resetados.')) return;
                  
                  try {
                    await deletarTodasIndicacoes();
                    alert('✅ Todas as indicações foram apagadas!');
                  } catch (error) {
                    alert('❌ Erro ao apagar indicações');
                  }
                }}
                className="text-xs font-semibold text-red-600 hover:text-red-700"
              >
                Apagar Todas
              </button>
            )}
          </div>

          {indicacoesFiltradas.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium mb-1">
                {buscaNome || filtroMes || filtroAno || filtroStatus
                  ? 'Nenhuma indicação encontrada'
                  : 'Nenhuma indicação ainda'}
              </p>
              <p className="text-sm text-gray-400">
                {buscaNome || filtroMes || filtroAno || filtroStatus
                  ? 'Ajuste os filtros'
                  : 'Toque no + para criar'}
              </p>
            </div>
          ) : (
            indicacoesFiltradas.map((ind) => (
              <div
                key={ind.id}
                className="bg-white rounded-2xl p-4 shadow-lg"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {ind.nomeIndicado && ind.nomeIndicado.length > 0 ? ind.nomeIndicado.charAt(0).toUpperCase() : '?'}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 truncate">
                          {ind.nomeIndicado || 'Nome não informado'}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {maskPhone(ind.telefoneIndicado)}
                        </p>
                      </div>
                      
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${
                          ind.status === 'converteu'
                            ? 'bg-green-100 text-green-700'
                            : ind.status === 'respondeu'
                            ? 'bg-blue-100 text-blue-700'
                            : ind.status === 'engano'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {ind.status === 'converteu' ? '✓ Venda' : 
                         ind.status === 'respondeu' ? '💬 OK' :
                         ind.status === 'engano' ? '✗ Erro' : '⏳ Aguard.'}
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(ind.dataIndicacao).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Botão Caixa Misteriosa */}
      {lootboxStatus && lootboxStatus.leadsParaProximaCaixa > 0 && (
        <button
          onClick={() => setShowLootBox(true)}
          className={`fixed bottom-24 right-6 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center z-50 transition-all ${
            lootboxStatus.podeAbrir
              ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 animate-bounce hover:scale-110'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105'
          }`}
        >
          <div className="relative">
            <Gift className="w-8 h-8 text-white" />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white">
              {lootboxStatus.leadsParaProximaCaixa}
            </div>
          </div>
        </button>
      )}

      <button
        onClick={() => setShowNovaIndicacao(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full shadow-2xl flex items-center justify-center z-50 hover:scale-110 active:scale-95 transition-transform"
      >
        <Plus className="w-7 h-7 text-white" />
      </button>

      {showNovaIndicacao && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center animate-fadeIn">
          <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl p-6 animate-slideUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Nova Indicação</h2>
              <button
                onClick={() => {
                  setShowNovaIndicacao(false);
                  setNomeIndicado('');
                  setTelefoneIndicado('');
                  setValidacaoResult(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCriarIndicacao} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={nomeIndicado}
                  onChange={(e) => setNomeIndicado(e.target.value)}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none font-medium"
                  placeholder="Ex: João Silva"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  WhatsApp
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={telefoneIndicado}
                    onChange={(e) => {
                      setTelefoneIndicado(e.target.value);
                      setValidacaoResult(null);
                    }}
                    className="flex-1 px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none font-medium"
                    placeholder="11987654321"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleValidarWhatsApp}
                    disabled={validando || !telefoneIndicado}
                    className="px-6 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {validando ? <Loader2 className="w-5 h-5 animate-spin" /> : 'OK'}
                  </button>
                </div>

                {validacaoResult && (
                  <div className={`mt-3 p-4 rounded-xl flex items-center gap-3 ${
                    validacaoResult.valido
                      ? 'bg-green-50 border-2 border-green-200'
                      : 'bg-red-50 border-2 border-red-200'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      validacaoResult.valido ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {validacaoResult.valido ? (
                        <Check className="w-5 h-5 text-white" />
                      ) : (
                        <X className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <span className={`text-sm font-semibold ${
                      validacaoResult.valido ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {validacaoResult.mensagem}
                    </span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!validacaoResult?.valido || criandoIndicacao}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-5 rounded-xl font-bold text-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {criandoIndicacao ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Check className="w-6 h-6" />
                    Criar Indicação
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Avatar Upload */}
      {showAvatarUpload && (
        <AvatarUpload
          currentAvatar={indicador.avatar}
          onSave={async (imageData) => {
            try {
              await atualizarAvatar(imageData);
              setShowAvatarUpload(false);
              await fetchDashboard(); // Atualizar dashboard para pegar novo avatar
              alert('✅ Foto de perfil atualizada com sucesso!');
            } catch (error) {
              alert('❌ Erro ao atualizar foto. Tente novamente.');
            }
          }}
          onClose={() => setShowAvatarUpload(false)}
        />
      )}

      {/* Modal de Loot Box */}
      {showLootBox && lootboxStatus && (
        <LootBox
          leadsParaProximaCaixa={lootboxStatus.leadsParaProximaCaixa}
          leadsNecessarios={lootboxStatus.leadsNecessarios}
          podeAbrir={lootboxStatus.podeAbrirIndicacoes || lootboxStatus.podeAbrirVendas}
          onAbrir={abrirLootBox}
          onCompartilhar={compartilharPremio}
          onClose={() => setShowLootBox(false)}
        />
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
