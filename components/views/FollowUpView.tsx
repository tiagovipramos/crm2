'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Clock, Users, Target, TrendingUp, MessageSquare, 
  AlertCircle, Filter, Search, Play, Pause, X, Check, Calendar,
  BarChart3, Activity, Send, ChevronRight, Eye, EyeOff
} from 'lucide-react';
import type { 
  FollowUpSequencia, 
  FollowUpEstatisticas, 
  ProximoEnvio, 
  FollowUpLead,
  FollowUpMensagem,
  FaseFollowUp 
} from '@/types';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://185.217.125.72:3001';

// Modal para criar/editar sequência
function SequenciaModal({ 
  sequencia, 
  onClose, 
  onSave 
}: { 
  sequencia?: FollowUpSequencia | null; 
  onClose: () => void; 
  onSave: () => void;
}) {
  const [nome, setNome] = useState(sequencia?.nome || '');
  const [descricao, setDescricao] = useState(sequencia?.descricao || '');
  const [faseInicio, setFaseInicio] = useState<FaseFollowUp>(sequencia?.fase_inicio || 'novo');
  const [ativo, setAtivo] = useState(sequencia?.ativo ?? true);
  const [automatico, setAutomatico] = useState(sequencia?.automatico ?? true);
  const [prioridade, setPrioridade] = useState(sequencia?.prioridade || 0);
  const [mensagens, setMensagens] = useState<Partial<FollowUpMensagem>[]>(
    sequencia?.mensagens || [{ ordem: 1, dias_espera: 1, conteudo: '', tipo_mensagem: 'texto', ativo: true }]
  );
  const [saving, setSaving] = useState(false);

  const adicionarMensagem = () => {
    setMensagens([...mensagens, {
      ordem: mensagens.length + 1,
      dias_espera: 1,
      conteudo: '',
      tipo_mensagem: 'texto',
      ativo: true
    }]);
  };

  const removerMensagem = (index: number) => {
    if (mensagens.length <= 1) return;
    setMensagens(mensagens.filter((_, i) => i !== index));
  };

  const atualizarMensagem = (index: number, campo: string, valor: any) => {
    const novasMensagens = [...mensagens];
    (novasMensagens[index] as any)[campo] = valor;
    setMensagens(novasMensagens);
  };

  const handleSave = async () => {
    if (!nome || !faseInicio) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    if (mensagens.some(m => !m.conteudo)) {
      alert('Todas as mensagens devem ter conteúdo');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const dados = {
        nome,
        descricao,
        fase_inicio: faseInicio,
        ativo,
        automatico,
        prioridade,
        mensagens: mensagens.map((m, i) => ({
          ...m,
          ordem: i + 1
        }))
      };

      if (sequencia) {
        await axios.put(`${API_URL}/api/followup/sequencias/${sequencia.id}`, dados, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/api/followup/sequencias`, dados, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar sequência:', error);
      alert('Erro ao salvar sequência');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {sequencia ? 'Editar Sequência' : 'Nova Sequência'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Informações Básicas</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Sequência *
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#075E54] focus:border-transparent"
                placeholder="Ex: Reativação de Cotação"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#075E54] focus:border-transparent"
                rows={3}
                placeholder="Descreva o objetivo desta sequência"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fase de Início *
                </label>
                <select
                  value={faseInicio}
                  onChange={(e) => setFaseInicio(e.target.value as FaseFollowUp)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#075E54] focus:border-transparent"
                >
                  <option value="novo">Novo Lead</option>
                  <option value="primeiro_contato">Primeiro Contato</option>
                  <option value="proposta_enviada">Proposta Enviada</option>
                  <option value="convertido">Convertido</option>
                  <option value="perdido">Perdido</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioridade
                </label>
                <input
                  type="number"
                  value={prioridade}
                  onChange={(e) => setPrioridade(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#075E54] focus:border-transparent"
                  min={0}
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                  className="w-4 h-4 text-[#075E54] rounded focus:ring-[#075E54]"
                />
                <span className="text-sm text-gray-700">Sequência Ativa</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={automatico}
                  onChange={(e) => setAutomatico(e.target.checked)}
                  className="w-4 h-4 text-[#075E54] rounded focus:ring-[#075E54]"
                />
                <span className="text-sm text-gray-700">Iniciar Automaticamente</span>
              </label>
            </div>
          </div>

          {/* Mensagens */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Mensagens da Sequência</h3>
              <button
                onClick={adicionarMensagem}
                className="flex items-center gap-1 text-sm text-[#075E54] hover:text-[#064e45]"
              >
                <Plus className="w-4 h-4" />
                Adicionar Mensagem
              </button>
            </div>

            {mensagens.map((msg, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Mensagem {index + 1}</span>
                  {mensagens.length > 1 && (
                    <button
                      onClick={() => removerMensagem(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aguardar (dias)
                  </label>
                  <input
                    type="number"
                    value={msg.dias_espera}
                    onChange={(e) => atualizarMensagem(index, 'dias_espera', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#075E54] focus:border-transparent"
                    min={0}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Dias para aguardar antes de enviar esta mensagem
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Conteúdo da Mensagem *
                  </label>
                  <textarea
                    value={msg.conteudo}
                    onChange={(e) => atualizarMensagem(index, 'conteudo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#075E54] focus:border-transparent"
                    rows={3}
                    placeholder="Digite o conteúdo da mensagem..."
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={msg.ativo !== false}
                    onChange={(e) => atualizarMensagem(index, 'ativo', e.target.checked)}
                    className="w-4 h-4 text-[#075E54] rounded focus:ring-[#075E54]"
                  />
                  <span className="text-sm text-gray-700">Mensagem ativa</span>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-[#075E54] text-white rounded-lg hover:bg-[#064e45] transition disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar Sequência'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente principal
export default function FollowUpView() {
  const [sequencias, setSequencias] = useState<FollowUpSequencia[]>([]);
  const [estatisticas, setEstatisticas] = useState<FollowUpEstatisticas[]>([]);
  const [proximosEnvios, setProximosEnvios] = useState<ProximoEnvio[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewTab, setViewTab] = useState<'sequencias' | 'estatisticas' | 'envios'>('sequencias');
  const [modalAberto, setModalAberto] = useState(false);
  const [sequenciaEditando, setSequenciaEditando] = useState<FollowUpSequencia | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Carregar dados com tratamento individual de erros
      const results = await Promise.allSettled([
        axios.get(`${API_URL}/api/followup/sequencias`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/followup/estatisticas`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/followup/proximos-envios?limit=20`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      // Sequências
      if (results[0].status === 'fulfilled') {
        setSequencias(results[0].value.data);
      } else {
        console.warn('Endpoint de sequências não disponível');
        setSequencias([]);
      }

      // Estatísticas
      if (results[1].status === 'fulfilled') {
        setEstatisticas(results[1].value.data);
      } else {
        console.warn('Endpoint de estatísticas não disponível');
        setEstatisticas([]);
      }

      // Próximos Envios
      if (results[2].status === 'fulfilled') {
        setProximosEnvios(results[2].value.data);
      } else {
        console.warn('Endpoint de próximos envios não disponível');
        setProximosEnvios([]);
      }
    } catch (error) {
      console.error('Erro inesperado ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditarSequencia = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/followup/sequencias/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSequenciaEditando(res.data);
      setModalAberto(true);
    } catch (error) {
      console.error('Erro ao buscar sequência:', error);
    }
  };

  const handleDeletarSequencia = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar esta sequência?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/followup/sequencias/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      carregarDados();
    } catch (error) {
      console.error('Erro ao deletar sequência:', error);
      alert('Erro ao deletar sequência');
    }
  };

  const handleProcessarEnvios = async () => {
    if (!confirm('Deseja processar os envios programados agora?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/followup/processar`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Envios processados com sucesso!');
      carregarDados();
    } catch (error) {
      console.error('Erro ao processar envios:', error);
      alert('Erro ao processar envios');
    }
  };

  const sequenciasFiltradas = sequencias.filter(seq =>
    seq.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seq.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#075E54] mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Target className="w-7 h-7 text-[#075E54]" />
              Follow-Up Inteligente
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Automatize o acompanhamento dos seus leads com sequências personalizadas
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleProcessarEnvios}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <Send className="w-5 h-5" />
              Processar Envios
            </button>
            <button
              onClick={() => {
                setSequenciaEditando(null);
                setModalAberto(true);
              }}
              className="flex items-center gap-2 bg-[#075E54] text-white px-4 py-2 rounded-lg hover:bg-[#064e45] transition"
            >
              <Plus className="w-5 h-5" />
              Nova Sequência
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200">
          <button
            onClick={() => setViewTab('sequencias')}
            className={`px-4 py-2 font-medium transition ${
              viewTab === 'sequencias'
                ? 'text-[#075E54] border-b-2 border-[#075E54]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Sequências ({sequencias.length})
            </div>
          </button>
          <button
            onClick={() => setViewTab('estatisticas')}
            className={`px-4 py-2 font-medium transition ${
              viewTab === 'estatisticas'
                ? 'text-[#075E54] border-b-2 border-[#075E54]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Estatísticas
            </div>
          </button>
          <button
            onClick={() => setViewTab('envios')}
            className={`px-4 py-2 font-medium transition ${
              viewTab === 'envios'
                ? 'text-[#075E54] border-b-2 border-[#075E54]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Próximos Envios ({proximosEnvios.length})
            </div>
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Tab: Sequências */}
        {viewTab === 'sequencias' && (
          <div className="space-y-4">
            {/* Busca */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar sequências..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#075E54] focus:border-transparent"
                />
              </div>
            </div>

            {/* Lista de Sequências */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sequenciasFiltradas.map((sequencia) => (
                <div
                  key={sequencia.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition border border-gray-200"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">
                          {sequencia.nome}
                        </h3>
                        {sequencia.descricao && (
                          <p className="text-sm text-gray-600 mb-2">{sequencia.descricao}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditarSequencia(sequencia.id)}
                          className="p-2 text-gray-600 hover:text-[#075E54] hover:bg-gray-100 rounded transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletarSequencia(sequencia.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Fase:</span>
                        <span className="font-medium capitalize">
                          {sequencia.fase_inicio.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Status:</span>
                        <span className={`flex items-center gap-1 ${sequencia.ativo ? 'text-green-600' : 'text-gray-400'}`}>
                          {sequencia.ativo ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          {sequencia.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Automático:</span>
                        <span className={sequencia.automatico ? 'text-green-600' : 'text-gray-400'}>
                          {sequencia.automatico ? 'Sim' : 'Não'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Leads Ativos:</span>
                        <span className="font-medium text-[#075E54]">
                          {sequencia.total_leads_ativos || 0}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Mensagens:</span>
                        <span className="font-medium">
                          {sequencia.mensagens?.length || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {sequenciasFiltradas.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {searchTerm ? 'Nenhuma sequência encontrada' : 'Nenhuma sequência configurada'}
                </p>
                <button
                  onClick={() => {
                    setSequenciaEditando(null);
                    setModalAberto(true);
                  }}
                  className="mt-4 text-[#075E54] hover:underline"
                >
                  Criar primeira sequência
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab: Estatísticas */}
        {viewTab === 'estatisticas' && (
          <div className="space-y-4">
            {estatisticas.map((stat) => (
              <div key={stat.sequencia_id} className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-lg text-gray-900 mb-4">
                  {stat.sequencia_nome}
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stat.total_leads}</div>
                    <div className="text-sm text-gray-600 mt-1">Total de Leads</div>
                  </div>

                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{stat.leads_ativos}</div>
                    <div className="text-sm text-gray-600 mt-1">Leads Ativos</div>
                  </div>

                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{stat.leads_concluidos}</div>
                    <div className="text-sm text-gray-600 mt-1">Concluídos</div>
                  </div>

                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{stat.total_mensagens_enviadas}</div>
                    <div className="text-sm text-gray-600 mt-1">Mensagens Enviadas</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-gray-600">Taxa de Sucesso:</span>
                  <span className="font-medium text-green-600">
                    {stat.total_mensagens_enviadas > 0
                      ? Math.round((stat.mensagens_sucesso / stat.total_mensagens_enviadas) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            ))}

            {estatisticas.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhuma estatística disponível</p>
              </div>
            )}
          </div>
        )}

        {/* Tab: Próximos Envios */}
        {viewTab === 'envios' && (
          <div className="space-y-2">
            {proximosEnvios.map((envio) => (
              <div
                key={envio.followup_lead_id}
                className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{envio.lead_nome}</h4>
                      <span className="text-sm text-gray-600">{envio.lead_telefone}</span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Sequência:</span> {envio.sequencia_nome}
                    </div>

                    <div className="bg-gray-50 rounded p-3 mb-2">
                      <p className="text-sm text-gray-700">{envio.mensagem_conteudo}</p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Mensagem {envio.mensagem_atual}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(envio.data_proxima_mensagem).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {proximosEnvios.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum envio programado</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalAberto && (
        <SequenciaModal
          sequencia={sequenciaEditando}
          onClose={() => {
            setModalAberto(false);
            setSequenciaEditando(null);
          }}
          onSave={() => {
            carregarDados();
          }}
        />
      )}
    </div>
  );
}
