'use client';

import { useState, useEffect, useRef } from 'react';
import { useProtecarStore } from '@/store/useProtecarStore';
import { useNotificacoes } from '@/hooks/useNotificacoes';
import { Search, MoreVertical, Phone, Video, Smile, Paperclip, Send, Check, CheckCheck, ArrowLeft, UserCircle2, Car, Calendar, FileText, Plus, Image, Film, File, User, Edit, DollarSign, Clock, TrendingUp, History, Download, Ban, Trash2, Info, X, MapPin, Mail, Tag, StickyNote, CheckCircle2, PanelRightOpen, PanelRightClose, Mic, StopCircle, Trash, Bell, BellOff, Volume2, VolumeX, ChevronUp, ChevronDown } from 'lucide-react';
import type { Lead } from '@/types';
import { formatarTelefone, isNumeroTelefone } from '@/lib/formatters';
import AudioRecorder from '@/components/AudioRecorder';
import AudioPlayer from '@/components/AudioPlayer';
import { mensagensAPI } from '@/lib/api';

export default function ChatView() {
  // URL base para arquivos de mídia (remover /api do final)
  const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://185.217.125.72:3001/api').replace('/api', '');

  const {
    getLeadsDoConsultor,
    leadSelecionado,
    selecionarLead,
    getMensagensDoLead,
    enviarMensagem,
    filtroChat,
    setFiltroChat,
    pesquisaChat,
    setPesquisaChat,
    consultorAtual,
    getTemplatesAtivos,
    criarLead,
    atualizarLead,
    deletarLead,
    setViewMode,
    moverLeadStatus
  } = useProtecarStore();

  const [mensagemTexto, setMensagemTexto] = useState('');
  const [mostrarTemplates, setMostrarTemplates] = useState(false);
  const [mostrarModalNovoLead, setMostrarModalNovoLead] = useState(false);
  const [mostrarEmojis, setMostrarEmojis] = useState(false);
  const [mostrarAnexos, setMostrarAnexos] = useState(false);
  const [mostrarMenuLead, setMostrarMenuLead] = useState(false);
  const [mostrarDetalhes, setMostrarDetalhes] = useState(true);
  const [gravandoAudio, setGravandoAudio] = useState(false);
  const [mostrarConfigNotificacoes, setMostrarConfigNotificacoes] = useState(false);
  const [mostrarBuscaChat, setMostrarBuscaChat] = useState(false);
  const [mostrarModalTarefa, setMostrarModalTarefa] = useState(false);
  const [tituloTarefa, setTituloTarefa] = useState('');
  const [descricaoTarefa, setDescricaoTarefa] = useState('');
  const [dataTarefa, setDataTarefa] = useState('');
  const [horaTarefa, setHoraTarefa] = useState('');
  const [textoBusca, setTextoBusca] = useState('');
  const [dataBuscaInicio, setDataBuscaInicio] = useState('');
  const [dataBuscaFim, setDataBuscaFim] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState<number[]>([]);
  const [indiceResultadoAtual, setIndiceResultadoAtual] = useState(0);
  const [notaInterna, setNotaInterna] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ultimaMensagemIdRef = useRef<string | null>(null);

  const {
    permissaoNotificacao,
    solicitarPermissao,
    mostrarNotificacao,
    somAtivado,
    setSomAtivado
  } = useNotificacoes();
  
  const templates = getTemplatesAtivos();
  
  const leads = getLeadsDoConsultor();
  
  // Filtra leads baseado no filtro selecionado e pesquisa
  let leadsFiltrados = leads.filter(lead => {
    // Filtro por etapa do funil
    if (filtroChat !== 'todos' && lead.status !== filtroChat) return false;

    // Filtro por pesquisa
    if (pesquisaChat) {
      const busca = pesquisaChat.toLowerCase();
      return (
        lead.nome.toLowerCase().includes(busca) ||
        lead.telefone.includes(busca) ||
        lead.modeloVeiculo?.toLowerCase().includes(busca)
      );
    }

    return true;
  });
  
  // Ordenar por última mensagem (mais recente primeiro) - como WhatsApp Web
  leadsFiltrados = leadsFiltrados.sort((a, b) => {
    const dataA = new Date(a.dataAtualizacao).getTime();
    const dataB = new Date(b.dataAtualizacao).getTime();
    return dataB - dataA; // Ordem decrescente (mais recente primeiro)
  });

  const mensagens = leadSelecionado ? getMensagensDoLead(leadSelecionado.id) : [];
  
  // 🔍 DEBUG: Verificar mensagens de áudio
  useEffect(() => {
    if (mensagens.length > 0) {
      const audios = mensagens.filter(m => m.tipo === 'audio');
      console.log('🎵 Total de áudios na conversa:', audios.length);
      audios.forEach(audio => {
        console.log(`  - ID: ${audio.id}, Remetente: ${audio.remetente}, mediaUrl: ${audio.mediaUrl}, conteudo: ${audio.conteudo}`);
      });
    }
  }, [mensagens]);

  // Scroll automático para a última mensagem
  const scrollToBottom = () => {
    // Usar setTimeout para garantir que o DOM foi atualizado
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
    }, 100);
  };

  // Scroll ao carregar mensagens ou quando leadSelecionado muda
  useEffect(() => {
    if (leadSelecionado && mensagens.length > 0) {
      scrollToBottom();
    }
  }, [leadSelecionado?.id, mensagens.length]);

  // Scroll adicional após mudança de lead (para garantir)
  useEffect(() => {
    if (leadSelecionado) {
      // Aguardar renderização completa
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [leadSelecionado?.id]);

  // Monitora novas mensagens para notificações
  useEffect(() => {
    if (mensagens.length > 0) {
      const ultimaMensagem = mensagens[mensagens.length - 1];
      
      // Se é uma nova mensagem do lead (não do consultor) e não é a primeira carga
      if (
        ultimaMensagem.remetente === 'lead' &&
        ultimaMensagemIdRef.current !== null &&
        ultimaMensagem.id !== ultimaMensagemIdRef.current
      ) {
        const lead = leadSelecionado;
        if (lead) {
          mostrarNotificacao({
            titulo: `💬 Nova mensagem de ${lead.nome}`,
            mensagem: ultimaMensagem.conteudo.substring(0, 100) + (ultimaMensagem.conteudo.length > 100 ? '...' : ''),
            som: true
          });
        }
      }
      
      ultimaMensagemIdRef.current = ultimaMensagem.id;
    }
  }, [mensagens, leadSelecionado, mostrarNotificacao]);

  const handleEnviarMensagem = () => {
    if (!mensagemTexto.trim() || !leadSelecionado) return;

    enviarMensagem(leadSelecionado.id, mensagemTexto);
    setMensagemTexto('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviarMensagem();
    }
  };

  const emojisComuns = [
    '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
    '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛',
    '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
    '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩',
    '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵',
    '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫',
    '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮',
    '👍', '👎', '👌', '✌️', '🤞', '🤝', '👏', '🙌', '👐', '🤲',
    '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃',
    '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
    '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐',
    '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '💾', '💿', '📀', '📞',
    '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏰',
    '⏳', '⌛', '⏱️', '⏲️', '🕰️', '🌍', '🌎', '🌏', '🗺️', '🧭',
    '✅', '❌', '⭐', '🌟', '💫', '✨', '⚡', '🔥', '💥', '💯',
    '💢', '💬', '💭', '💤', '💮', '♨️', '🚨', '🚩', '⚠️', '🔰'
  ];

  const inserirEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const inicio = textarea.selectionStart;
    const fim = textarea.selectionEnd;
    const textoAntes = mensagemTexto.substring(0, inicio);
    const textoDepois = mensagemTexto.substring(fim);
    
    const novoTexto = textoAntes + emoji + textoDepois;
    setMensagemTexto(novoTexto);
    
    // Mantém o foco e posiciona o cursor após o emoji
    setTimeout(() => {
      textarea.focus();
      const novaPosicao = inicio + emoji.length;
      textarea.setSelectionRange(novaPosicao, novaPosicao);
    }, 0);
  };

  const handleAnexarArquivo = (tipo: 'foto' | 'video' | 'documento') => {
    const input = fileInputRef.current;
    if (!input) return;

    // Define os tipos aceitos baseado na opção
    switch (tipo) {
      case 'foto':
        input.accept = 'image/*';
        break;
      case 'video':
        input.accept = 'video/*';
        break;
      case 'documento':
        input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.txt';
        break;
    }

    input.click();
    setMostrarAnexos(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && leadSelecionado) {
      try {
        console.log('📤 Enviando arquivo:', file.name);
        
        // Upload real do arquivo via API
        const { mensagensAPI } = await import('@/lib/api');
        await mensagensAPI.uploadFile(leadSelecionado.id, file);
        
        console.log('✅ Arquivo enviado com sucesso!');
        
        // Aguardar 1 segundo e forçar atualização selecionando o lead novamente
        setTimeout(() => {
          selecionarLead(leadSelecionado.id);
        }, 1000);
        
        // Limpa o input
        e.target.value = '';
      } catch (error) {
        console.error('❌ Erro ao enviar arquivo:', error);
        alert('Erro ao enviar arquivo. Tente novamente.');
        
        // Limpa o input mesmo em caso de erro
        e.target.value = '';
      }
    }
  };

  const handleEnviarAudio = async (audioBlob: Blob, duracao: number) => {
    if (!leadSelecionado) {
      console.error('❌ Lead não selecionado');
      return;
    }

    try {
      console.log('🎤 Preparando para enviar áudio...');
      console.log('📋 Lead ID:', leadSelecionado.id);
      console.log('📊 Tamanho do blob:', audioBlob.size, 'bytes');
      console.log('🕐 Duração:', duracao, 'segundos');
      console.log('📝 Tipo do blob:', audioBlob.type);
      
      await mensagensAPI.sendAudio(leadSelecionado.id, audioBlob, duracao);
      console.log('✅ Áudio enviado com sucesso!');
      
      // Atualizar lista de mensagens
      setTimeout(() => {
        selecionarLead(leadSelecionado.id);
      }, 1000);
      
      setGravandoAudio(false);
    } catch (error: any) {
      console.error('❌ Erro ao enviar áudio:', error);
      console.error('📋 Detalhes do erro:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      alert(`Erro ao enviar áudio: ${error.response?.data?.error || error.message || 'Erro desconhecido'}`);
      setGravandoAudio(false);
    }
  };

  const handleCancelarAudio = () => {
    setGravandoAudio(false);
  };

  const formatarHora = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatarData = (timestamp: string) => {
    const date = new Date(timestamp);
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(hoje.getDate() - 1);

    if (date.toDateString() === hoje.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === ontem.toDateString()) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  const buscarNoChat = () => {
    if (!textoBusca.trim() && !dataBuscaInicio && !dataBuscaFim) {
      setResultadosBusca([]);
      return;
    }

    const indices: number[] = [];
    mensagens.forEach((msg, index) => {
      let corresponde = true;

      if (textoBusca.trim()) {
        const texto = msg.conteudo.toLowerCase();
        const busca = textoBusca.toLowerCase();
        if (!texto.includes(busca)) {
          corresponde = false;
        }
      }

      if (dataBuscaInicio && corresponde) {
        const dataMensagem = new Date(msg.timestamp);
        const dataInicio = new Date(dataBuscaInicio);
        dataInicio.setHours(0, 0, 0, 0);
        if (dataMensagem < dataInicio) {
          corresponde = false;
        }
      }

      if (dataBuscaFim && corresponde) {
        const dataMensagem = new Date(msg.timestamp);
        const dataFim = new Date(dataBuscaFim);
        dataFim.setHours(23, 59, 59, 999);
        if (dataMensagem > dataFim) {
          corresponde = false;
        }
      }

      if (corresponde) {
        indices.push(index);
      }
    });

    setResultadosBusca(indices);
    setIndiceResultadoAtual(0);
  };

  const limparBusca = () => {
    setTextoBusca('');
    setDataBuscaInicio('');
    setDataBuscaFim('');
    setResultadosBusca([]);
    setIndiceResultadoAtual(0);
  };

  const navegarResultado = (direcao: 'anterior' | 'proximo') => {
    if (resultadosBusca.length === 0) return;

    let novoIndice = indiceResultadoAtual;
    if (direcao === 'proximo') {
      novoIndice = (indiceResultadoAtual + 1) % resultadosBusca.length;
    } else {
      novoIndice = indiceResultadoAtual === 0 ? resultadosBusca.length - 1 : indiceResultadoAtual - 1;
    }
    setIndiceResultadoAtual(novoIndice);

    const elemento = document.getElementById(`msg-${resultadosBusca[novoIndice]}`);
    if (elemento) {
      elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const destacarTexto = (texto: string) => {
    if (!textoBusca.trim()) return texto;

    const regex = new RegExp(`(${textoBusca})`, 'gi');
    const partes = texto.split(regex);

    return partes.map((parte, i) => 
      regex.test(parte) 
        ? <mark key={i} className="bg-yellow-300 px-1 rounded">{parte}</mark>
        : parte
    );
  };

  const handleCriarTarefa = async () => {
    if (!tituloTarefa.trim()) {
      alert('❌ Preencha o título da tarefa');
      return;
    }

    if (!dataTarefa) {
      alert('❌ Preencha a data');
      return;
    }

    if (!horaTarefa) {
      alert('❌ Preencha a hora');
      return;
    }

    if (!leadSelecionado) {
      alert('❌ Nenhum lead selecionado');
      return;
    }

    // Validar comprimento da data
    if (dataTarefa.length < 10) {
      alert('❌ Data incompleta! Digite a data completa no formato dd/mm/aaaa\nExemplo: 22/10/2025');
      return;
    }

    // Validar formato de data (dd/mm/aaaa)
    if (!dataTarefa.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      alert('❌ Data inválida! Use o formato dd/mm/aaaa\nExemplo: 22/10/2025');
      return;
    }

    // Validar comprimento da hora
    if (horaTarefa.length < 5) {
      alert('❌ Hora incompleta! Digite a hora completa no formato hh:mm\nExemplo: 14:30');
      return;
    }

    // Validar formato de hora (hh:mm)
    if (!horaTarefa.match(/^\d{2}:\d{2}$/)) {
      alert('❌ Hora inválida! Use o formato hh:mm\nExemplo: 14:30');
      return;
    }

    try {
      // Converter data brasileira (dd/mm/aaaa) para ISO (yyyy-mm-dd)
      const [dia, mes, ano] = dataTarefa.split('/');
      
      // Validar valores
      const diaNum = parseInt(dia, 10);
      const mesNum = parseInt(mes, 10);
      const anoNum = parseInt(ano, 10);
      
      if (diaNum < 1 || diaNum > 31) {
        alert('❌ Dia inválido! Deve estar entre 01 e 31');
        return;
      }
      
      if (mesNum < 1 || mesNum > 12) {
        alert('❌ Mês inválido! Deve estar entre 01 e 12');
        return;
      }
      
      if (anoNum < 2000 || anoNum > 2100) {
        alert('❌ Ano inválido! Deve estar entre 2000 e 2100');
        return;
      }
      
      // Validar hora
      const [hora, minuto] = horaTarefa.split(':');
      const horaNum = parseInt(hora, 10);
      const minutoNum = parseInt(minuto, 10);
      
      if (horaNum < 0 || horaNum > 23) {
        alert('❌ Hora inválida! Deve estar entre 00 e 23');
        return;
      }
      
      if (minutoNum < 0 || minutoNum > 59) {
        alert('❌ Minuto inválido! Deve estar entre 00 e 59');
        return;
      }
      
      // Criar data no formato MySQL (yyyy-mm-dd hh:mm:ss) sem conversão de fuso horário
      const dataFormatada = `${anoNum}-${String(mesNum).padStart(2, '0')}-${String(diaNum).padStart(2, '0')} ${String(horaNum).padStart(2, '0')}:${String(minutoNum).padStart(2, '0')}:00`;
      
      console.log('📅 Criando tarefa:', {
        leadId: leadSelecionado.id,
        titulo: tituloTarefa,
        descricao: descricaoTarefa,
        dataInput: dataTarefa,
        horaInput: horaTarefa,
        dataHora: dataFormatada
      });

      // Salvar no backend
      const { tarefasAPI } = await import('@/lib/api');
      await tarefasAPI.create({
        leadId: leadSelecionado.id,
        titulo: tituloTarefa,
        descricao: descricaoTarefa || '',
        dataHora: dataFormatada,
        status: 'pendente'
      });
      
      console.log('✅ Tarefa salva no backend com sucesso!');
      alert(`✅ Tarefa agendada para ${dataTarefa} às ${horaTarefa}!`);
      
      // Recarregar tarefas para aparecer imediatamente
      await useProtecarStore.getState().carregarTarefas();
      console.log('✅ Lista de tarefas recarregada!');
      
      // Limpar campos
      setTituloTarefa('');
      setDescricaoTarefa('');
      setDataTarefa('');
      setHoraTarefa('');
      setMostrarModalTarefa(false);
    } catch (error: any) {
      console.error('❌ Erro ao criar tarefa:', error);
      alert(`❌ Erro ao criar tarefa: ${error.response?.data?.error || error.response?.data?.details || error.message || 'Erro desconhecido'}`);
    }
  };

  const handleSalvarNota = async () => {
    if (!leadSelecionado || !notaInterna.trim()) {
      alert('Digite uma nota antes de salvar');
      return;
    }

    try {
      console.log('📝 Salvando nota interna:', notaInterna);
      
      // Criar nova nota
      const novaNota = {
        id: Date.now().toString(),
        texto: notaInterna,
        consultorId: consultorAtual?.id || '',
        consultorNome: consultorAtual?.nome || 'Consultor',
        dataHora: new Date().toISOString()
      };
      
      // Adicionar ao array de notas
      const notasAtualizadas = [...(leadSelecionado.notasInternas || []), novaNota];
      
      await atualizarLead(leadSelecionado.id, {
        ...leadSelecionado,
        notasInternas: notasAtualizadas
      });
      
      // Limpar campo de texto
      setNotaInterna('');
      
      // Força atualização do lead selecionado
      setTimeout(() => {
        selecionarLead(leadSelecionado.id);
      }, 500);
      
      console.log('✅ Nota salva com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao salvar nota:', error);
      alert('Erro ao salvar nota. Tente novamente.');
    }
  };

  // Limpar campos quando mudar de lead
  useEffect(() => {
    if (leadSelecionado) {
      setNotaInterna('');
      setMensagemTexto(''); // ✅ Limpar campo de mensagem também!
    }
  }, [leadSelecionado]);

  return (
    <div className="flex h-full">
      {/* Lista de Conversas - Sidebar Esquerda */}
      <div className="w-[400px] bg-white border-r border-gray-200 flex flex-col">
        {/* Header da Lista */}
        <div className="p-4 bg-[#F0F2F5] border-b border-gray-200">
          {/* Filtros por Etapa do Funil */}
          <div className="flex flex-wrap gap-2 mb-3">
            {[
              { id: 'todos', label: 'Todos', cor: '#128C7E' },
              { id: 'novo', label: 'Novo', cor: '#3B82F6' },
              { id: 'primeiro_contato', label: '1º Contato', cor: '#8B5CF6' },
              { id: 'proposta_enviada', label: 'Proposta', cor: '#F59E0B' },
              { id: 'convertido', label: 'Convertido', cor: '#10B981' },
              { id: 'perdido', label: 'Perdido', cor: '#6B7280' }
            ].map((filtro) => {
              const isActive = filtroChat === filtro.id;
              
              return (
                <button
                  key={filtro.id}
                  onClick={() => setFiltroChat(filtro.id as any)}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-medium transition
                    ${isActive
                      ? 'text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }
                  `}
                  style={isActive ? { backgroundColor: filtro.cor } : {}}
                >
                  {filtro.label}
                </button>
              );
            })}
          </div>
          
          {/* Barra de Pesquisa */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={pesquisaChat}
              onChange={(e) => setPesquisaChat(e.target.value)}
              placeholder="Pesquisar conversas..."
              className="w-full pl-10 pr-4 py-2 bg-white rounded-lg border border-gray-300 focus:outline-none focus:border-[#128C7E] text-sm"
            />
          </div>
        </div>

        {/* Lista de Leads */}
        <div className="flex-1 overflow-y-auto">
          {leadsFiltrados.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>Nenhuma conversa encontrada</p>
            </div>
          ) : (
            leadsFiltrados.map((lead) => (
              <button
                key={lead.id}
                onClick={() => selecionarLead(lead.id)}
                className={`
                  w-full p-4 flex items-start gap-3 hover:bg-[#F5F6F6] transition border-b border-gray-100
                  ${leadSelecionado?.id === lead.id ? 'bg-[#F0F2F5]' : 'bg-white'}
                `}
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-[#128C7E] flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {lead.nome.charAt(0).toUpperCase()}
                </div>

                {/* Info do Lead */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{lead.nome}</h3>
                    <span className="text-xs text-gray-500">
                      {lead.ultimaMensagem && formatarHora(lead.dataAtualizacao)}
                    </span>
                  </div>
                  
                  {lead.ultimaMensagem && (
                    <p className="text-sm text-gray-600 truncate">{lead.ultimaMensagem}</p>
                  )}
                  
                  <div className="flex items-center gap-2 mt-1">
                    {lead.modeloVeiculo && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Car className="w-3 h-3" />
                        {lead.modeloVeiculo}
                      </span>
                    )}
                  </div>
                </div>

                {/* Badge não lidas */}
                {lead.mensagensNaoLidas > 0 && (
                  <div className="w-6 h-6 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{lead.mensagensNaoLidas}</span>
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Área de Chat - Centro */}
      {leadSelecionado ? (
        <div className="flex-1 flex">
          {/* Chat */}
          <div className="flex-1 flex flex-col bg-[#E5DDD5]">
          {/* Header do Chat */}
          <div className="bg-[#F0F2F5] px-4 py-3 flex items-center justify-between border-b border-gray-200">
            <div className="flex items-center gap-3">
              <button
                onClick={() => selecionarLead(null)}
                className="lg:hidden p-2 hover:bg-gray-200 rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="w-10 h-10 rounded-full bg-[#128C7E] flex items-center justify-center text-white font-semibold">
                {leadSelecionado.nome.charAt(0).toUpperCase()}
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900">
                  {isNumeroTelefone(leadSelecionado.nome) 
                    ? formatarTelefone(leadSelecionado.nome)
                    : leadSelecionado.nome}
                </h3>
                <p className="text-sm text-gray-600">{formatarTelefone(leadSelecionado.telefone)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <button 
                  onClick={() => setMostrarConfigNotificacoes(!mostrarConfigNotificacoes)}
                  className="p-2 hover:bg-gray-200 rounded-full transition"
                  title="Configurar notificações"
                >
                  {permissaoNotificacao === 'granted' ? (
                    <Bell className="w-5 h-5 text-[#128C7E]" />
                  ) : (
                    <BellOff className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {/* Menu de Config Notificações */}
                {mostrarConfigNotificacoes && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-20 p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Notificações</h3>
                    
                    {/* Status da Permissão */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        {permissaoNotificacao === 'granted' ? (
                          <>
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-medium text-green-700">Ativadas</span>
                          </>
                        ) : permissaoNotificacao === 'denied' ? (
                          <>
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-sm font-medium text-red-700">Bloqueadas</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <span className="text-sm font-medium text-yellow-700">Desativadas</span>
                          </>
                        )}
                      </div>
                      
                      {permissaoNotificacao !== 'granted' && (
                        <button
                          onClick={solicitarPermissao}
                          className="w-full mt-2 px-3 py-2 bg-[#128C7E] hover:bg-[#075E54] text-white text-sm font-medium rounded-lg transition"
                        >
                          Ativar Notificações
                        </button>
                      )}

                      {permissaoNotificacao === 'denied' && (
                        <p className="text-xs text-red-600 mt-2">
                          Você bloqueou as notificações. Ative nas configurações do navegador.
                        </p>
                      )}
                    </div>

                    {/* Config de Som */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {somAtivado ? (
                            <Volume2 className="w-4 h-4 text-[#128C7E]" />
                          ) : (
                            <VolumeX className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="text-sm font-medium text-gray-700">Som</span>
                        </div>
                        <button
                          onClick={() => setSomAtivado(!somAtivado)}
                          className={`
                            w-11 h-6 rounded-full transition relative
                            ${somAtivado ? 'bg-[#128C7E]' : 'bg-gray-300'}
                          `}
                        >
                          <div className={`
                            w-5 h-5 bg-white rounded-full shadow-md transform transition absolute top-0.5
                            ${somAtivado ? 'translate-x-5' : 'translate-x-0.5'}
                          `} />
                        </button>
                      </div>

                      <p className="text-xs text-gray-500">
                        Toca um som quando chega uma nova mensagem
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setMostrarModalTarefa(true)}
                className="p-2 hover:bg-gray-200 rounded-full transition"
                title="Agendar atendimento"
              >
                <Calendar className="w-5 h-5 text-[#128C7E]" />
              </button>
              <button 
                onClick={() => setMostrarDetalhes(!mostrarDetalhes)}
                className="p-2 hover:bg-gray-200 rounded-full transition"
                title={mostrarDetalhes ? "Fechar detalhes" : "Abrir detalhes"}
              >
                {mostrarDetalhes ? (
                  <PanelRightClose className="w-5 h-5 text-[#128C7E]" />
                ) : (
                  <PanelRightOpen className="w-5 h-5 text-[#128C7E]" />
                )}
              </button>
              <div className="relative">
                <button 
                  onClick={() => setMostrarMenuLead(!mostrarMenuLead)}
                  className="p-2 hover:bg-gray-200 rounded-full transition"
                >
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>

                {/* Menu Dropdown */}
                {mostrarMenuLead && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
                    <div className="p-2">
                      <button 
                        onClick={() => {
                          setMostrarDetalhes(true);
                          setMostrarMenuLead(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg transition text-left"
                      >
                        <Info className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">Ver Detalhes do Lead</span>
                      </button>

                      <button 
                        onClick={() => {
                          // Ir para o funil com o lead selecionado
                          setViewMode('funil');
                          setMostrarMenuLead(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg transition text-left"
                      >
                        <Edit className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-gray-700">Editar Lead</span>
                      </button>

                      <button 
                        onClick={async () => {
                          const opcoes = [
                            { valor: 'novo', label: '1 - Novo' },
                            { valor: 'primeiro_contato', label: '2 - Primeiro Contato' },
                            { valor: 'proposta_enviada', label: '3 - Proposta Enviada' },
                            { valor: 'convertido', label: '4 - Convertido' },
                            { valor: 'perdido', label: '5 - Perdido' }
                          ];
                          
                          const escolha = prompt(
                            'Escolha o novo status:\n' + 
                            opcoes.map(o => o.label).join('\n')
                          );
                          
                          if (escolha) {
                            const opcaoEscolhida = opcoes.find(o => 
                              o.label.startsWith(escolha) || 
                              o.valor === escolha.toLowerCase().replace(' ', '_')
                            );
                            
                            if (opcaoEscolhida) {
                              try {
                                await moverLeadStatus(leadSelecionado.id, opcaoEscolhida.valor as Lead['status']);
                                alert('✅ Status alterado para: ' + opcaoEscolhida.label.split(' - ')[1]);
                              } catch (error) {
                                console.error('Erro ao atualizar status:', error);
                                alert('❌ Erro ao atualizar status. Tente novamente.');
                              }
                            } else {
                              alert('❌ Opção inválida. Digite o número da opção (1-5).');
                            }
                          }
                          setMostrarMenuLead(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg transition text-left"
                      >
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">Mover no Funil</span>
                      </button>

                      <button 
                        onClick={() => {
                          const mensagensTexto = mensagens.map(m => 
                            `[${formatarData(m.timestamp)} ${formatarHora(m.timestamp)}] ${m.remetente === 'consultor' ? 'Você' : leadSelecionado.nome}: ${m.conteudo}`
                          ).join('\n');
                          
                          const blob = new Blob([mensagensTexto], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `chat-${leadSelecionado.nome}-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.txt`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                          
                          alert('✅ Chat exportado com sucesso!');
                          setMostrarMenuLead(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg transition text-left"
                      >
                        <Download className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-medium text-gray-700">Exportar Chat</span>
                      </button>

                      <div className="my-1 border-t border-gray-200"></div>

                      <button 
                        onClick={async () => {
                          const confirmacao = confirm(
                            `⚠️ Tem certeza que deseja excluir este lead?\n\n` +
                            `Nome: ${leadSelecionado.nome}\n` +
                            `Telefone: ${leadSelecionado.telefone}\n\n` +
                            `Esta ação não pode ser desfeita!`
                          );

                          if (!confirmacao) {
                            setMostrarMenuLead(false);
                            return;
                          }

                          try {
                            await deletarLead(leadSelecionado.id);
                            setMostrarMenuLead(false);
                            console.log('✅ Lead deletado com sucesso!');
                          } catch (error) {
                            console.error('❌ Erro ao deletar lead:', error);
                            alert('Erro ao deletar o lead. Tente novamente.');
                            setMostrarMenuLead(false);
                          }
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 rounded-lg transition text-left"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-red-700">Excluir Lead</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[url('/whatsapp-bg.png')] bg-repeat" id="messages-container">
            {mensagens.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <UserCircle2 className="w-20 h-20 mb-4" />
                <p>Nenhuma mensagem ainda</p>
                <p className="text-sm">Envie a primeira mensagem para {leadSelecionado.nome}</p>
              </div>
            ) : (
              mensagens.map((msg, index) => {
                const mostrarData = index === 0 || 
                  formatarData(msg.timestamp) !== formatarData(mensagens[index - 1].timestamp);
                
                return (
                  <div key={msg.id}>
                    {/* Separador de data */}
                    {mostrarData && (
                      <div className="flex justify-center my-4">
                        <span className="bg-white px-3 py-1 rounded-lg text-xs text-gray-600 shadow-sm">
                          {formatarData(msg.timestamp)}
                        </span>
                      </div>
                    )}

                    {/* Bolha de mensagem */}
                    <div className={`flex ${msg.remetente === 'consultor' ? 'justify-end' : 'justify-start'}`}>
                      {msg.tipo === 'audio' ? (
                        // Mensagem de áudio
                        msg.mediaUrl ? (
                          <div className="flex flex-col gap-1">
                            <AudioPlayer
                              audioUrl={`${API_BASE_URL}${msg.mediaUrl}`}
                              duracao={msg.conteudo.match(/\((\d+:\d+)\)/)?.[1]}
                              remetente={msg.remetente}
                            />
                            <div className={`flex items-center gap-1 ${msg.remetente === 'consultor' ? 'justify-end' : 'justify-start'}`}>
                              <span className="text-xs text-gray-500">{formatarHora(msg.timestamp)}</span>
                              {msg.remetente === 'consultor' && (
                                msg.status === 'lida' || msg.status === 'entregue' ? (
                                  <CheckCheck className="w-4 h-4 text-blue-500" />
                                ) : (
                                  <Check className="w-4 h-4 text-gray-400" />
                                )
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className={`
                            max-w-[65%] rounded-lg px-3 py-2 shadow
                            ${msg.remetente === 'consultor'
                              ? 'bg-[#D9FDD3]'
                              : 'bg-white'
                            }
                          `}>
                            <p className="text-gray-900 whitespace-pre-wrap break-words text-sm">
                              {msg.conteudo}
                            </p>
                            <p className="text-xs text-orange-600 mt-1">⚠️ Áudio indisponível</p>
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <span className="text-xs text-gray-500">{formatarHora(msg.timestamp)}</span>
                              {msg.remetente === 'consultor' && (
                                msg.status === 'lida' ? (
                                  <CheckCheck className="w-4 h-4 text-blue-500" />
                                ) : msg.status === 'entregue' || msg.status === 'enviada' ? (
                                  <CheckCheck className="w-4 h-4 text-gray-400" />
                                ) : (
                                  <Check className="w-4 h-4 text-gray-400" />
                                )
                              )}
                            </div>
                          </div>
                        )
                      ) : msg.tipo === 'imagem' ? (
                        // Mensagem de imagem
                        <div className="flex flex-col gap-1">
                          <div className={`
                            rounded-lg overflow-hidden shadow max-w-[300px]
                            ${msg.remetente === 'consultor'
                              ? 'bg-[#D9FDD3]'
                              : 'bg-white'
                            }
                          `}>
                            {msg.mediaUrl ? (
                              <a 
                                href={`${API_BASE_URL}${msg.mediaUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                              >
                                <img 
                                  src={`${API_BASE_URL}${msg.mediaUrl}`}
                                  alt="Imagem enviada"
                                  className="w-full h-auto cursor-pointer hover:opacity-90 transition"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement?.parentElement;
                                    if (parent) {
                                      parent.innerHTML = `
                                        <div class="px-3 py-2">
                                          <p class="text-gray-900 text-sm">📷 Imagem</p>
                                          <p class="text-xs text-orange-600 mt-1">⚠️ Imagem indisponível</p>
                                        </div>
                                      `;
                                    }
                                  }}
                                />
                                {msg.conteudo && msg.conteudo !== '📷 Imagem' && (
                                  <div className="px-3 py-2">
                                    <p className="text-gray-900 text-sm whitespace-pre-wrap break-words">
                                      {msg.conteudo}
                                    </p>
                                  </div>
                                )}
                              </a>
                            ) : (
                              <div className="px-3 py-2">
                                <p className="text-gray-900 text-sm">📷 Imagem</p>
                                <p className="text-xs text-orange-600 mt-1">⚠️ Imagem indisponível</p>
                              </div>
                            )}
                          </div>
                          <div className={`flex items-center gap-1 px-1 ${msg.remetente === 'consultor' ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-xs text-gray-500">{formatarHora(msg.timestamp)}</span>
                            {msg.remetente === 'consultor' && (
                              msg.status === 'lida' || msg.status === 'entregue' ? (
                                <CheckCheck className="w-4 h-4 text-blue-500" />
                              ) : (
                                <Check className="w-4 h-4 text-gray-400" />
                              )
                            )}
                          </div>
                        </div>
                      ) : msg.tipo === 'video' ? (
                        // Mensagem de vídeo
                        <div className="flex flex-col gap-1">
                          <div className={`
                            rounded-lg overflow-hidden shadow max-w-[300px]
                            ${msg.remetente === 'consultor'
                              ? 'bg-[#D9FDD3]'
                              : 'bg-white'
                            }
                          `}>
                            {msg.mediaUrl ? (
                              <video 
                                src={`${API_BASE_URL}${msg.mediaUrl}`}
                                controls
                                className="w-full h-auto"
                                onError={(e) => {
                                  const target = e.target as HTMLVideoElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `
                                      <div class="px-3 py-2">
                                        <p class="text-gray-900 text-sm">🎥 Vídeo</p>
                                        <p class="text-xs text-orange-600 mt-1">⚠️ Vídeo indisponível</p>
                                      </div>
                                    `;
                                  }
                                }}
                              >
                                Seu navegador não suporta a reprodução de vídeo.
                              </video>
                            ) : (
                              <div className="px-3 py-2">
                                <p className="text-gray-900 text-sm">🎥 Vídeo</p>
                                <p className="text-xs text-orange-600 mt-1">⚠️ Vídeo indisponível</p>
                              </div>
                            )}
                          </div>
                          <div className={`flex items-center gap-1 px-1 ${msg.remetente === 'consultor' ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-xs text-gray-500">{formatarHora(msg.timestamp)}</span>
                            {msg.remetente === 'consultor' && (
                              msg.status === 'lida' || msg.status === 'entregue' ? (
                                <CheckCheck className="w-4 h-4 text-blue-500" />
                              ) : (
                                <Check className="w-4 h-4 text-gray-400" />
                              )
                            )}
                          </div>
                        </div>
                      ) : msg.tipo === 'documento' ? (
                        // Mensagem de documento - Estilo WhatsApp Web
                        <div className="flex flex-col gap-1">
                          <div className={`
                            rounded-lg shadow max-w-[350px]
                            ${msg.remetente === 'consultor'
                              ? 'bg-[#D9FDD3]'
                              : 'bg-white'
                            }
                          `}>
                            {msg.mediaUrl ? (
                              <div className="p-3">
                                {/* Card do Documento */}
                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                  {/* Preview/Header do Documento */}
                                  <div className="bg-gradient-to-br from-red-50 to-orange-50 p-4 flex items-center justify-center border-b border-gray-200">
                                    <div className="relative">
                                      {/* Ícone PDF */}
                                      <div className="w-16 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg flex items-center justify-center">
                                        <File className="w-8 h-8 text-white" />
                                      </div>
                                      {/* Badge PDF */}
                                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                                        PDF
                                      </div>
                                    </div>
                                  </div>

                                  {/* Informações do Documento */}
                                  <div className="p-3">
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                      {/* Nome do Arquivo */}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate mb-0.5">
                                          {msg.mediaName?.replace(/\.[^/.]+$/, '') || 'Documento'}
                                        </p>
                                        {/* Metadados do Arquivo */}
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                          <span>PDF</span>
                                          {/* Você pode adicionar mais info como tamanho se tiver */}
                                        </p>
                                      </div>

                                      {/* Botão de Download */}
                                      <a
                                        href={`${API_BASE_URL}${msg.mediaUrl}`}
                                        download={msg.mediaName || 'documento.pdf'}
                                        className="flex-shrink-0 w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition group"
                                        title="Baixar documento"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Download className="w-4 h-4 text-gray-600 group-hover:text-gray-900" />
                                      </a>
                                    </div>

                                    {/* Link para abrir */}
                                    <a
                                      href={`${API_BASE_URL}${msg.mediaUrl}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1 mt-1"
                                    >
                                      Abrir documento
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                    </a>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="p-3">
                                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <File className="w-6 h-6 text-gray-400" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">Documento</p>
                                    <p className="text-xs text-orange-600">⚠️ Arquivo indisponível</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Hora e Status */}
                          <div className={`flex items-center gap-1 px-1 ${msg.remetente === 'consultor' ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-xs text-gray-500">{formatarHora(msg.timestamp)}</span>
                            {msg.remetente === 'consultor' && (
                              msg.status === 'lida' || msg.status === 'entregue' ? (
                                <CheckCheck className="w-4 h-4 text-blue-500" />
                              ) : (
                                <Check className="w-4 h-4 text-gray-400" />
                              )
                            )}
                          </div>
                        </div>
                      ) : (
                        // Mensagem de texto normal
                        <div
                          className={`
                            max-w-[65%] rounded-lg px-3 py-2 shadow
                            ${msg.remetente === 'consultor'
                              ? 'bg-[#D9FDD3]'
                              : 'bg-white'
                            }
                          `}
                        >
                          <p className="text-gray-900 whitespace-pre-wrap break-words">{msg.conteudo}</p>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span className="text-xs text-gray-500">{formatarHora(msg.timestamp)}</span>
                            {msg.remetente === 'consultor' && (
                              msg.status === 'lida' || msg.status === 'entregue' ? (
                                <CheckCheck className="w-4 h-4 text-blue-500" />
                              ) : (
                                <Check className="w-4 h-4 text-gray-400" />
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            {/* Elemento invisível para scroll automático */}
            <div ref={messagesEndRef} />
          </div>

          {/* Input de Mensagem / Gravação de Áudio */}
          <div className="bg-[#F0F2F5] px-4 py-3 flex items-end gap-2 relative">
            {gravandoAudio ? (
              // Interface de Gravação de Áudio
              <AudioRecorder 
                onSendAudio={handleEnviarAudio}
                onCancel={handleCancelarAudio}
              />
            ) : (
              // Interface Normal de Texto
              <>
            <button 
              onClick={() => setMostrarEmojis(!mostrarEmojis)}
              className="p-2 hover:bg-gray-200 rounded-full transition flex-shrink-0"
            >
              <Smile className="w-6 h-6 text-gray-600" />
            </button>

            {/* Seletor de Emojis */}
            {mostrarEmojis && (
              <div className="absolute bottom-full left-0 mb-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                <div className="p-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Emojis</h3>
                  <button
                    onClick={() => setMostrarEmojis(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-4 grid grid-cols-10 gap-2 max-h-80 overflow-y-auto">
                  {emojisComuns.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => inserirEmoji(emoji)}
                      className="text-2xl hover:bg-gray-100 active:bg-gray-200 rounded p-2 transition"
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <button 
              onClick={() => setMostrarAnexos(!mostrarAnexos)}
              className="p-2 hover:bg-gray-200 rounded-full transition flex-shrink-0"
            >
              <Paperclip className="w-6 h-6 text-gray-600" />
            </button>

            {/* Input oculto para anexos */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Menu de Anexos */}
            {mostrarAnexos && (
              <div className="absolute bottom-full left-12 mb-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                <div className="p-2">
                  <button
                    onClick={() => handleAnexarArquivo('foto')}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition text-left"
                  >
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Image className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Foto</div>
                      <div className="text-xs text-gray-500">JPG, PNG, GIF</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleAnexarArquivo('video')}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition text-left"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Film className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Vídeo</div>
                      <div className="text-xs text-gray-500">MP4, AVI, MOV</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleAnexarArquivo('documento')}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition text-left"
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <File className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Documento</div>
                      <div className="text-xs text-gray-500">PDF, DOC, XLS</div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            <button 
              onClick={() => setMostrarTemplates(!mostrarTemplates)}
              className="p-2 hover:bg-gray-200 rounded-full transition flex-shrink-0 relative"
              title="Mensagens pré-definidas"
            >
              <FileText className="w-6 h-6 text-gray-600" />
              {templates.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#128C7E] text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {templates.length}
                </span>
              )}
            </button>

            {/* Dropdown de Templates */}
            {mostrarTemplates && templates.length > 0 && (
              <div className="absolute bottom-full left-0 mb-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-10">
                <div className="p-3 border-b border-gray-200 bg-gray-50">
                  <h3 className="font-semibold text-gray-900">Mensagens Pré-definidas</h3>
                  <p className="text-xs text-gray-600">Clique para usar</p>
                </div>
                <div className="p-2">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => {
                        setMensagemTexto(template.conteudo);
                        setMostrarTemplates(false);
                      }}
                      className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition"
                    >
                      <div className="font-medium text-gray-900 text-sm mb-1">{template.nome}</div>
                      <div className="text-xs text-gray-600 line-clamp-2">{template.conteudo}</div>
                      <div className="text-xs text-gray-400 mt-1 capitalize">
                        {template.categoria.replace('_', ' ')}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 bg-white rounded-lg">
              <textarea
                ref={textareaRef}
                value={mensagemTexto}
                onChange={(e) => setMensagemTexto(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite uma mensagem"
                rows={1}
                className="w-full px-4 py-3 resize-none outline-none rounded-lg"
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
            </div>

            {mensagemTexto.trim() ? (
              <button
                onClick={handleEnviarMensagem}
                className="p-3 bg-[#128C7E] hover:bg-[#075E54] rounded-full transition flex-shrink-0"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            ) : (
              <button
                onClick={() => setGravandoAudio(true)}
                className="p-3 bg-[#128C7E] hover:bg-[#075E54] rounded-full transition flex-shrink-0"
                title="Gravar áudio"
              >
                <Mic className="w-5 h-5 text-white" />
              </button>
            )}
              </>
            )}
          </div>
          </div>

          {/* Sidebar Direita - Detalhes do Lead */}
          {mostrarDetalhes && (
            <div className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <h3 className="font-semibold text-gray-900">Detalhes do Lead</h3>
                <button
                  onClick={() => setMostrarDetalhes(false)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* Info Principal */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-16 h-16 rounded-full bg-[#128C7E] flex items-center justify-center text-white text-2xl font-bold">
                      {leadSelecionado.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-lg">{leadSelecionado.nome}</h4>
                      <span className={`
                        inline-block px-2 py-0.5 text-xs font-medium rounded-full
                        ${leadSelecionado.status === 'novo' ? 'bg-blue-100 text-blue-700' :
                          leadSelecionado.status === 'primeiro_contato' ? 'bg-purple-100 text-purple-700' :
                          leadSelecionado.status === 'proposta_enviada' ? 'bg-orange-100 text-orange-700' :
                          leadSelecionado.status === 'convertido' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'}
                      `}>
                        {leadSelecionado.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{formatarTelefone(leadSelecionado.telefone)}</span>
                    </div>
                    {leadSelecionado.email && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{leadSelecionado.email}</span>
                      </div>
                    )}
                    {leadSelecionado.cidade && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{leadSelecionado.cidade}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dados do Veículo */}
                {leadSelecionado.modeloVeiculo && (
                  <div className="p-4 border-b border-gray-200">
                    <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Car className="w-4 h-4 text-[#128C7E]" />
                      Veículo
                    </h5>
                    <div className="bg-gray-50 rounded-lg p-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Modelo:</span>
                        <span className="font-medium text-gray-900">{leadSelecionado.modeloVeiculo}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Origem */}
                {leadSelecionado.origem && (
                  <div className="p-4 border-b border-gray-200">
                    <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <History className="w-4 h-4 text-[#128C7E]" />
                      Origem
                    </h5>
                    <div className="bg-gray-50 rounded-lg p-3 text-sm">
                      <span className="font-medium text-gray-900">{leadSelecionado.origem}</span>
                    </div>
                  </div>
                )}

                {/* Data de Criação */}
                <div className="p-4 border-b border-gray-200">
                  <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#128C7E]" />
                    Informações
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Criado em:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(leadSelecionado.dataCriacao).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Última atualização:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(leadSelecionado.dataAtualizacao).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notas Internas */}
                <div className="p-4">
                  <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <StickyNote className="w-4 h-4 text-[#128C7E]" />
                    Notas Internas
                    {leadSelecionado.notasInternas && leadSelecionado.notasInternas.length > 0 && (
                      <span className="ml-auto text-xs bg-[#128C7E] text-white px-2 py-0.5 rounded-full">
                        {leadSelecionado.notasInternas.length}
                      </span>
                    )}
                  </h5>

                  {/* Histórico de Notas */}
                  {leadSelecionado.notasInternas && leadSelecionado.notasInternas.length > 0 && (
                    <div className="mb-3 space-y-2 max-h-60 overflow-y-auto">
                      {[...leadSelecionado.notasInternas].reverse().map((nota) => (
                        <div key={nota.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <div className="flex items-start justify-between mb-1">
                            <span className="text-xs font-medium text-gray-700">{nota.consultorNome}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(nota.dataHora).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })} às {new Date(nota.dataHora).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{nota.texto}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Campo para Nova Nota */}
                  <textarea
                    value={notaInterna}
                    onChange={(e) => setNotaInterna(e.target.value)}
                    placeholder="Digite uma nova nota..."
                    className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#128C7E] resize-none"
                    rows={3}
                  />
                  <button 
                    onClick={handleSalvarNota}
                    disabled={!notaInterna.trim()}
                    className="mt-2 w-full py-2 bg-[#128C7E] hover:bg-[#075E54] text-white text-sm font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Adicionar Nota
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Tela vazia quando nenhum chat está selecionado
        <div className="flex-1 flex flex-col items-center justify-center bg-[#F8F9FA]">
          <div className="text-center">
            <div className="w-24 h-24 bg-[#128C7E] rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCircle2 className="w-16 h-16 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">VIP Web</h3>
            <p className="text-gray-600 max-w-md">
              Selecione uma conversa para começar a atender seus clientes
            </p>
          </div>
        </div>
      )}

      {/* Modal de Criar Tarefa */}
      {mostrarModalTarefa && leadSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#128C7E] rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Agendar Tarefa</h3>
                  <p className="text-sm text-gray-600">{leadSelecionado.nome}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setMostrarModalTarefa(false);
                  setTituloTarefa('');
                  setDescricaoTarefa('');
                  setDataTarefa('');
                  setHoraTarefa('');
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título da Tarefa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={tituloTarefa}
                  onChange={(e) => setTituloTarefa(e.target.value)}
                  placeholder="Ex: Retornar contato, Enviar proposta..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#128C7E]"
                />
              </div>

              {/* Data e Hora */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={dataTarefa}
                    onChange={(e) => {
                      let valor = e.target.value.replace(/\D/g, '');
                      
                      if (valor.length >= 2) {
                        valor = valor.substring(0, 2) + '/' + valor.substring(2);
                      }
                      if (valor.length >= 5) {
                        valor = valor.substring(0, 5) + '/' + valor.substring(5, 9);
                      }
                      
                      setDataTarefa(valor);
                    }}
                    placeholder="dd/mm/aaaa"
                    maxLength={10}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#128C7E]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={horaTarefa}
                    onChange={(e) => {
                      let valor = e.target.value.replace(/\D/g, '');
                      
                      if (valor.length >= 2) {
                        valor = valor.substring(0, 2) + ':' + valor.substring(2, 4);
                      }
                      
                      setHoraTarefa(valor);
                    }}
                    placeholder="hh:mm"
                    maxLength={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#128C7E]"
                  />
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  value={descricaoTarefa}
                  onChange={(e) => setDescricaoTarefa(e.target.value)}
                  placeholder="Adicione detalhes sobre a tarefa..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#128C7E] resize-none"
                />
              </div>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  Você receberá um lembrete no horário agendado.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setMostrarModalTarefa(false);
                  setTituloTarefa('');
                  setDescricaoTarefa('');
                  setDataTarefa('');
                  setHoraTarefa('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleCriarTarefa}
                className="flex-1 px-4 py-2 bg-[#128C7E] text-white rounded-lg hover:bg-[#075E54] transition font-medium"
              >
                Agendar Tarefa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
