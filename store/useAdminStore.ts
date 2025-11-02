import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  UsuarioAdmin,
  Vendedor,
  Indicador,
  Funil,
  SolicitacaoSaque,
  EstatisticasCRM,
  EstatisticasIndicacao,
  TopPerformer,
  TopIndicador,
  Alerta,
  ChatVendedor,
  LogAuditoria,
  ConfiguracaoSistema,
  ViewAdmin,
} from '@/types/admin';
import {
  mockDiretor,
  mockGerentes,
  mockSupervisores,
  mockFunis,
  mockChatsVendedores,
  mockLogsAuditoria,
  mockConfiguracaoSistema,
  getAllAdmins,
} from '@/data/mockAdminData';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://185.217.125.72:3001/api';

interface AdminState {
  // Autenticação
  usuarioLogado: UsuarioAdmin | null;
  token: string | null;
  isAuthenticated: boolean;

  // View ativa
  currentView: ViewAdmin;

  // Dados
  admins: UsuarioAdmin[];
  vendedores: Vendedor[];
  indicadores: Indicador[];
  funis: Funil[];
  solicitacoesSaque: SolicitacaoSaque[];
  estatisticasCRM: EstatisticasCRM | null;
  estatisticasIndicacao: EstatisticasIndicacao | null;
  topPerformers: TopPerformer[];
  topIndicadores: TopIndicador[];
  alertas: Alerta[];
  chatsVendedores: ChatVendedor[];
  logsAuditoria: LogAuditoria[];
  configuracaoSistema: ConfiguracaoSistema;
  distribuicaoFunil: Array<{ etapa: string; quantidade: number; cor: string }>;

  // Loading states
  isLoadingEstatisticasCRM: boolean;
  isLoadingEstatisticasIndicacao: boolean;
  isLoadingVendedores: boolean;
  isLoadingIndicadores: boolean;

  // Actions
  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => void;
  setCurrentView: (view: ViewAdmin) => void;

  // Data fetching actions
  fetchEstatisticasCRM: () => Promise<void>;
  fetchEstatisticasIndicacao: () => Promise<void>;
  fetchTopPerformers: () => Promise<void>;
  fetchTopIndicadores: () => Promise<void>;
  fetchDistribuicaoFunil: () => Promise<void>;
  fetchAlertas: () => Promise<void>;
  fetchVendedores: () => Promise<void>;
  fetchIndicadores: () => Promise<void>;
  fetchAdmins: () => Promise<void>;
  fetchSolicitacoesSaque: () => Promise<void>;
  fetchChatsVendedores: () => Promise<void>;
  fetchAllDashboardData: () => Promise<void>;

  // Vendedores
  getVendedoresPorHierarquia: () => Vendedor[];
  cadastrarVendedor: (vendedor: Omit<Vendedor, 'id'> & { senha: string }) => Promise<void>;
  editarVendedor: (id: number, vendedor: Partial<Vendedor>) => void;
  desativarVendedor: (id: number) => Promise<void>;
  deletarVendedor: (id: number | string) => Promise<void>;

  // Indicadores
  getIndicadores: () => Indicador[];
  cadastrarIndicador: (indicador: Omit<Indicador, 'id'> & { senha: string }) => Promise<void>;
  editarIndicador: (id: number, indicador: Partial<Indicador>) => void;
  desativarIndicador: (id: number) => Promise<void>;
  deletarIndicador: (id: number | string) => Promise<void>;

  // Admins
  getAdminsPorHierarquia: () => UsuarioAdmin[];
  cadastrarAdmin: (admin: Omit<UsuarioAdmin, 'id'>) => void;
  editarAdmin: (id: number, admin: Partial<UsuarioAdmin>) => void;
  desativarAdmin: (id: number) => void;
  deletarAdmin: (id: number | string) => Promise<void>;

  // Funis
  getFunis: () => Funil[];
  criarFunil: (funil: Omit<Funil, 'id'>) => void;
  editarFunil: (id: number, funil: Partial<Funil>) => void;
  excluirFunil: (id: number) => void;

  // Saques
  aprovarSaque: (id: number) => void;
  rejeitarSaque: (id: number, motivo: string) => void;

  // Alertas
  marcarAlertaComoLido: (id: number) => void;
  getAlertasNaoLidos: () => Alerta[];

  // Logs
  adicionarLog: (log: Omit<LogAuditoria, 'id'>) => void;

  // Configurações
  atualizarConfiguracoes: (config: Partial<ConfiguracaoSistema>) => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      usuarioLogado: null,
      token: null,
      isAuthenticated: false,
      currentView: 'dashboard-crm',

      // Dados iniciais
      admins: getAllAdmins(),
      vendedores: [],
      indicadores: [],
      funis: mockFunis,
      solicitacoesSaque: [],
      estatisticasCRM: null,
      estatisticasIndicacao: null,
      topPerformers: [],
      topIndicadores: [],
      alertas: [],
  chatsVendedores: [],
  logsAuditoria: mockLogsAuditoria,
  configuracaoSistema: mockConfiguracaoSistema,
  distribuicaoFunil: [],

      // Loading states
      isLoadingEstatisticasCRM: false,
      isLoadingEstatisticasIndicacao: false,
      isLoadingVendedores: false,
      isLoadingIndicadores: false,

      // Actions
      login: async (email: string, senha: string) => {
        try {
          console.log('[STORE] Iniciando login no store...');
          console.log('[STORE] URL da API:', `${API_BASE_URL}/admin/login`);
          console.log('[STORE] Email:', email);
          console.log('[STORE] Senha length:', senha.length);
          
          const response = await fetch(`${API_BASE_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
          });

          console.log('[STORE] Response status:', response.status);
          console.log('[STORE] Response ok:', response.ok);

          if (!response.ok) {
            try {
              const errorData = await response.json();
              console.error('[STORE] Erro na resposta:', errorData);
              
              // Lançar erro com a mensagem do backend
              throw new Error(errorData.error || 'Erro ao fazer login');
            } catch (parseError) {
              // Se não conseguir parsear o JSON, lançar erro genérico
              throw new Error('Erro ao fazer login');
            }
          }

          const data = await response.json();
          console.log('[STORE] Dados recebidos:', data);
          
          // Criar objeto de usuário com os dados da API
          const usuario: UsuarioAdmin = {
            id: data.admin.id,
            nome: data.admin.nome,
            email: data.admin.email,
            telefone: data.admin.telefone || '',
            role: data.admin.role || 'diretor',
            nivel: data.admin.role === 'diretor' ? 1 : data.admin.role === 'gerente' ? 2 : 3,
            senha: '', // Não armazenar senha
            dataCadastro: new Date().toISOString().replace('T', ' ').substring(0, 19),
            ativo: true,
            vendedores: [],
            supervisores: [],
          };

          console.log('[STORE] Usuário criado:', usuario);

          set({
            usuarioLogado: usuario,
            token: data.token,
            isAuthenticated: true,
          });

          console.log('[STORE] Estado atualizado com sucesso');

          // Adicionar log de login
          get().adicionarLog({
            usuarioId: usuario.id,
            usuarioNome: usuario.nome,
            usuarioRole: usuario.role.charAt(0).toUpperCase() + usuario.role.slice(1),
            acao: 'Login',
            descricao: `Login realizado com sucesso`,
            data: new Date().toISOString().replace('T', ' ').substring(0, 19),
            ip: '192.168.1.100',
            navegador: 'Chrome 120',
          });

          console.log('[STORE] Login concluído com sucesso!');
          return true;
        } catch (error: any) {
          console.error('[STORE] Erro ao fazer login:', error);
          // Re-lançar o erro para ser capturado no componente
          throw error;
        }
      },

      logout: () => {
        const usuario = get().usuarioLogado;
        if (usuario) {
          // Adicionar log de logout
          get().adicionarLog({
            usuarioId: usuario.id,
            usuarioNome: usuario.nome,
            usuarioRole: usuario.role.charAt(0).toUpperCase() + usuario.role.slice(1),
            acao: 'Logout',
            descricao: `Logout realizado`,
            data: new Date().toISOString().replace('T', ' ').substring(0, 19),
            ip: '192.168.1.100',
            navegador: 'Chrome 120',
          });
        }

        set({
          usuarioLogado: null,
          token: null,
          isAuthenticated: false,
          currentView: 'dashboard-crm',
        });
      },

      setCurrentView: (view: ViewAdmin) => {
        set({ currentView: view });
      },

      // Vendedores
      getVendedoresPorHierarquia: () => {
        const { usuarioLogado, vendedores } = get();
        console.log('getVendedoresPorHierarquia - usuarioLogado:', usuarioLogado);
        console.log('getVendedoresPorHierarquia - vendedores no state:', vendedores);
        
        // Se não estiver logado, retorna todos os vendedores (para visualização sem filtro)
        if (!usuarioLogado) {
          console.log('Usuário não logado, retornando todos:', vendedores);
          return Array.isArray(vendedores) ? vendedores : [];
        }

        // O BACKEND JÁ filtra os vendedores baseado no role e created_by
        // Então aqui só retornamos o que veio do backend
        console.log('Retornando vendedores do backend (já filtrados):', vendedores);
        return Array.isArray(vendedores) ? vendedores : [];
      },

      cadastrarVendedor: async (vendedor) => {
        try {
          const token = get().token;
          const response = await fetch(`${API_BASE_URL}/admin/vendedores`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token || ''}`
            },
            body: JSON.stringify(vendedor)
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erro ao criar vendedor');
          }

          const novoVendedor = await response.json();
          
          // Atualizar lista local (garantir que seja array)
          set(state => ({
            vendedores: Array.isArray(state.vendedores) 
              ? [...state.vendedores, novoVendedor]
              : [novoVendedor]
          }));

          // Recarregar lista completa
          await get().fetchVendedores();
        } catch (error) {
          console.error('Erro ao cadastrar vendedor:', error);
          throw error;
        }
      },

      editarVendedor: async (id, vendedor) => {
        try {
          const { vendedores, usuarioLogado, token } = get();
          
          // Se estiver alterando o campo ativo, usar endpoint específico
          if ('ativo' in vendedor && Object.keys(vendedor).length === 1) {
            const response = await fetch(`${API_BASE_URL}/admin/vendedores/${id}/status`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token || ''}`
              },
              body: JSON.stringify({ ativo: vendedor.ativo })
            });

            if (!response.ok) {
              throw new Error('Erro ao atualizar status');
            }
          } else {
            // Para outras edições, usar endpoint de edição completa
            const response = await fetch(`${API_BASE_URL}/admin/vendedores/${id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token || ''}`
              },
              body: JSON.stringify(vendedor)
            });

            if (!response.ok) {
              throw new Error('Erro ao atualizar vendedor');
            }
          }

          // Atualizar estado local
          set({
            vendedores: vendedores.map((v) =>
              v.id === id ? { ...v, ...vendedor } : v
            ),
          });

          // Adicionar log
          if (usuarioLogado) {
            const vendedorEditado = vendedores.find((v) => v.id === id);
            if (vendedorEditado) {
              get().adicionarLog({
                usuarioId: usuarioLogado.id,
                usuarioNome: usuarioLogado.nome,
                usuarioRole:
                  usuarioLogado.role.charAt(0).toUpperCase() +
                  usuarioLogado.role.slice(1),
                acao: 'ativo' in vendedor ? (vendedor.ativo ? 'Ativação de Usuário' : 'Inativação de Usuário') : 'Edição de Usuário',
                descricao: `${vendedor.ativo === false ? 'Inativou' : vendedor.ativo === true ? 'Ativou' : 'Editou dados do'} vendedor: ${vendedorEditado.nome}`,
                data: new Date().toISOString().replace('T', ' ').substring(0, 19),
                ip: '192.168.1.100',
                navegador: 'Chrome 120',
              });
            }
          }
        } catch (error) {
          console.error('Erro ao editar vendedor:', error);
          throw error;
        }
      },

      desativarVendedor: async (id) => {
        try {
          const vendedor = get().vendedores.find(v => v.id === id);
          if (!vendedor) return;

          const response = await fetch(`${API_BASE_URL}/admin/vendedores/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ativo: !vendedor.ativo })
          });

          if (!response.ok) {
            throw new Error('Erro ao atualizar status');
          }

          // Atualizar localmente
          get().editarVendedor(id, { ativo: !vendedor.ativo });
        } catch (error) {
          console.error('Erro ao desativar vendedor:', error);
          throw error;
        }
      },

      deletarVendedor: async (id) => {
        try {
          const token = get().token;
          console.log('[Store] Deletando vendedor, ID:', id, 'Tipo:', typeof id);
          const response = await fetch(`${API_BASE_URL}/admin/vendedores/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token || ''}`
            }
          });

          console.log('[Store] Resposta da API:', response.status);

          if (!response.ok) {
            const errorData = await response.json();
            console.error('[Store] Erro da API:', errorData);
            throw new Error(errorData.message || 'Erro ao deletar vendedor');
          }

          // Remover localmente
          set(state => ({
            vendedores: state.vendedores.filter(v => v.id !== id)
          }));
          
          console.log('[Store] Vendedor removido localmente');
        } catch (error) {
          console.error('[Store] Erro ao deletar vendedor:', error);
          throw error;
        }
      },

      // Indicadores
      getIndicadores: () => {
        // Diretor vê todos os indicadores
        return get().indicadores;
      },

      cadastrarIndicador: async (indicador) => {
        try {
          const token = get().token;
          const response = await fetch(`${API_BASE_URL}/admin/indicadores`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token || ''}`
            },
            body: JSON.stringify(indicador)
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erro ao criar indicador');
          }

          const novoIndicador = await response.json();
          
          // Atualizar lista local (garantir que seja array)
          set(state => ({
            indicadores: Array.isArray(state.indicadores)
              ? [...state.indicadores, novoIndicador]
              : [novoIndicador]
          }));

          // Recarregar lista completa
          await get().fetchIndicadores();
        } catch (error) {
          console.error('Erro ao cadastrar indicador:', error);
          throw error;
        }
      },

      editarIndicador: async (id, indicador) => {
        try {
          const { indicadores, usuarioLogado, token } = get();
          
          // Se estiver alterando o campo ativo, usar endpoint específico
          if ('ativo' in indicador && Object.keys(indicador).length === 1) {
            const response = await fetch(`${API_BASE_URL}/admin/indicadores/${id}/status`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token || ''}`
              },
              body: JSON.stringify({ ativo: indicador.ativo })
            });

            if (!response.ok) {
              throw new Error('Erro ao atualizar status');
            }
          } else {
            // Para outras edições, usar endpoint de edição completa
            const response = await fetch(`${API_BASE_URL}/admin/indicadores/${id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token || ''}`
              },
              body: JSON.stringify(indicador)
            });

            if (!response.ok) {
              throw new Error('Erro ao atualizar indicador');
            }
          }

          // Atualizar estado local
          set({
            indicadores: indicadores.map((i) =>
              i.id === id ? { ...i, ...indicador } : i
            ),
          });

          // Adicionar log
          if (usuarioLogado) {
            const indicadorEditado = indicadores.find((i) => i.id === id);
            if (indicadorEditado) {
              get().adicionarLog({
                usuarioId: usuarioLogado.id,
                usuarioNome: usuarioLogado.nome,
                usuarioRole:
                  usuarioLogado.role.charAt(0).toUpperCase() +
                  usuarioLogado.role.slice(1),
                acao: 'ativo' in indicador ? (indicador.ativo ? 'Ativação de Indicador' : 'Inativação de Indicador') : 'Edição de Indicador',
                descricao: `${indicador.ativo === false ? 'Inativou' : indicador.ativo === true ? 'Ativou' : 'Editou dados do'} indicador: ${indicadorEditado.nome}`,
                data: new Date().toISOString().replace('T', ' ').substring(0, 19),
                ip: '192.168.1.100',
                navegador: 'Chrome 120',
              });
            }
          }
        } catch (error) {
          console.error('Erro ao editar indicador:', error);
          throw error;
        }
      },

      desativarIndicador: async (id) => {
        try {
          const indicador = get().indicadores.find(i => i.id === id);
          if (!indicador) return;

          const response = await fetch(`${API_BASE_URL}/admin/indicadores/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ativo: !indicador.ativo })
          });

          if (!response.ok) {
            throw new Error('Erro ao atualizar status');
          }

          // Atualizar localmente
          get().editarIndicador(id, { ativo: !indicador.ativo });
        } catch (error) {
          console.error('Erro ao desativar indicador:', error);
          throw error;
        }
      },

      deletarIndicador: async (id) => {
        try {
          const token = get().token;
          console.log('[Store] Deletando indicador, ID:', id, 'Tipo:', typeof id);
          const response = await fetch(`${API_BASE_URL}/admin/indicadores/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token || ''}`
            }
          });

          console.log('[Store] Resposta da API:', response.status);

          if (!response.ok) {
            const errorData = await response.json();
            console.error('[Store] Erro da API:', errorData);
            throw new Error(errorData.message || 'Erro ao deletar indicador');
          }

          // Remover localmente
          set(state => ({
            indicadores: state.indicadores.filter(i => i.id !== id)
          }));
          
          console.log('[Store] Indicador removido localmente');
        } catch (error) {
          console.error('[Store] Erro ao deletar indicador:', error);
          throw error;
        }
      },

      // Admins
      getAdminsPorHierarquia: () => {
        const { usuarioLogado, admins } = get();
        if (!usuarioLogado) return [];

        // Diretor vê todos
        if (usuarioLogado.role === 'diretor') {
          return admins;
        }

        // Gerente vê seus supervisores
        if (usuarioLogado.role === 'gerente') {
          return admins.filter(
            (a) =>
              a.id === usuarioLogado.id ||
              (a.role === 'supervisor' &&
                usuarioLogado.supervisores?.includes(a.id))
          );
        }

        // Supervisor vê apenas a si mesmo
        if (usuarioLogado.role === 'supervisor') {
          return admins.filter((a) => a.id === usuarioLogado.id);
        }

        return [];
      },

      cadastrarAdmin: async (admin) => {
        try {
          const token = get().token;
          const response = await fetch(`${API_BASE_URL}/admin/admins`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token || ''}`
            },
            body: JSON.stringify(admin)
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erro ao criar admin');
          }

          const novoAdmin = await response.json();
          
          // Atualizar lista local
          set(state => ({
            admins: Array.isArray(state.admins) 
              ? [...state.admins, novoAdmin]
              : [novoAdmin]
          }));

          // Recarregar lista completa
          await get().fetchAdmins();

          // Adicionar log
          const usuarioLogado = get().usuarioLogado;
          if (usuarioLogado) {
            get().adicionarLog({
              usuarioId: usuarioLogado.id,
              usuarioNome: usuarioLogado.nome,
              usuarioRole:
                usuarioLogado.role.charAt(0).toUpperCase() +
                usuarioLogado.role.slice(1),
              acao: 'Cadastro de Admin',
              descricao: `Cadastrou novo ${admin.role}: ${admin.nome}`,
              data: new Date().toISOString().replace('T', ' ').substring(0, 19),
              ip: '192.168.1.100',
              navegador: 'Chrome 120',
            });
          }
        } catch (error) {
          console.error('Erro ao cadastrar admin:', error);
          throw error;
        }
      },

      editarAdmin: async (id, admin) => {
        try {
          const { admins, usuarioLogado, token } = get();
          
          // Se estiver alterando o campo ativo, usar endpoint específico
          if ('ativo' in admin && Object.keys(admin).length === 1) {
            const response = await fetch(`${API_BASE_URL}/admin/admins/${id}/status`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token || ''}`
              },
              body: JSON.stringify({ ativo: admin.ativo })
            });

            if (!response.ok) {
              throw new Error('Erro ao atualizar status');
            }
          } else {
            // Para outras edições, usar endpoint de edição completa
            const response = await fetch(`${API_BASE_URL}/admin/admins/${id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token || ''}`
              },
              body: JSON.stringify(admin)
            });

            if (!response.ok) {
              throw new Error('Erro ao atualizar admin');
            }
          }

          // Atualizar estado local
          set({
            admins: admins.map((a) => (a.id === id ? { ...a, ...admin } : a)),
          });

          // Adicionar log
          if (usuarioLogado) {
            const adminEditado = admins.find((a) => a.id === id);
            if (adminEditado) {
              get().adicionarLog({
                usuarioId: usuarioLogado.id,
                usuarioNome: usuarioLogado.nome,
                usuarioRole:
                  usuarioLogado.role.charAt(0).toUpperCase() +
                  usuarioLogado.role.slice(1),
                acao: 'ativo' in admin ? (admin.ativo ? 'Ativação de Admin' : 'Inativação de Admin') : 'Edição de Admin',
                descricao: `${admin.ativo === false ? 'Inativou' : admin.ativo === true ? 'Ativou' : 'Editou dados do'} ${adminEditado.role}: ${adminEditado.nome}`,
                data: new Date().toISOString().replace('T', ' ').substring(0, 19),
                ip: '192.168.1.100',
                navegador: 'Chrome 120',
              });
            }
          }
        } catch (error) {
          console.error('Erro ao editar admin:', error);
          throw error;
        }
      },

      desativarAdmin: (id) => {
        get().editarAdmin(id, { ativo: false });
      },

      deletarAdmin: async (id) => {
        try {
          const token = get().token;
          console.log('[Store] Deletando admin, ID:', id, 'Tipo:', typeof id);
          const response = await fetch(`${API_BASE_URL}/admin/admins/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token || ''}`
            }
          });

          console.log('[Store] Resposta da API:', response.status);

          if (!response.ok) {
            const errorData = await response.json();
            console.error('[Store] Erro da API:', errorData);
            throw new Error(errorData.message || 'Erro ao deletar admin');
          }

          // Remover localmente
          set(state => ({
            admins: state.admins.filter(a => a.id !== id)
          }));
          
          console.log('[Store] Admin removido localmente');
        } catch (error) {
          console.error('[Store] Erro ao deletar admin:', error);
          throw error;
        }
      },

      // Funis
      getFunis: () => {
        return get().funis;
      },

      criarFunil: (funil) => {
        const { funis, usuarioLogado } = get();
        const novoId = Math.max(...funis.map((f) => f.id)) + 1;
        const novoFunil: Funil = {
          ...funil,
          id: novoId,
        };

        set({
          funis: [...funis, novoFunil],
        });

        // Adicionar log
        if (usuarioLogado) {
          get().adicionarLog({
            usuarioId: usuarioLogado.id,
            usuarioNome: usuarioLogado.nome,
            usuarioRole:
              usuarioLogado.role.charAt(0).toUpperCase() +
              usuarioLogado.role.slice(1),
            acao: 'Criação de Funil',
            descricao: `Criou novo funil: ${funil.nome}`,
            data: new Date().toISOString().replace('T', ' ').substring(0, 19),
            ip: '192.168.1.100',
            navegador: 'Chrome 120',
          });
        }
      },

      editarFunil: (id, funil) => {
        const { funis, usuarioLogado } = get();
        set({
          funis: funis.map((f) => (f.id === id ? { ...f, ...funil } : f)),
        });

        // Adicionar log
        if (usuarioLogado) {
          const funilEditado = funis.find((f) => f.id === id);
          if (funilEditado) {
            get().adicionarLog({
              usuarioId: usuarioLogado.id,
              usuarioNome: usuarioLogado.nome,
              usuarioRole:
                usuarioLogado.role.charAt(0).toUpperCase() +
                usuarioLogado.role.slice(1),
              acao: 'Edição de Funil',
              descricao: `Editou funil: ${funilEditado.nome}`,
              data: new Date().toISOString().replace('T', ' ').substring(0, 19),
              ip: '192.168.1.100',
              navegador: 'Chrome 120',
            });
          }
        }
      },

      excluirFunil: (id) => {
        const { funis, usuarioLogado } = get();
        const funilExcluido = funis.find((f) => f.id === id);

        set({
          funis: funis.filter((f) => f.id !== id),
        });

        // Adicionar log
        if (usuarioLogado && funilExcluido) {
          get().adicionarLog({
            usuarioId: usuarioLogado.id,
            usuarioNome: usuarioLogado.nome,
            usuarioRole:
              usuarioLogado.role.charAt(0).toUpperCase() +
              usuarioLogado.role.slice(1),
            acao: 'Exclusão de Funil',
            descricao: `Excluiu funil: ${funilExcluido.nome}`,
            data: new Date().toISOString().replace('T', ' ').substring(0, 19),
            ip: '192.168.1.100',
            navegador: 'Chrome 120',
          });
        }
      },

      // Saques
      aprovarSaque: (id) => {
        const { solicitacoesSaque, usuarioLogado } = get();
        const saque = solicitacoesSaque.find((s) => s.id === id);

        if (saque && usuarioLogado) {
          set({
            solicitacoesSaque: solicitacoesSaque.map((s) =>
              s.id === id
                ? {
                    ...s,
                    status: 'aprovado' as const,
                    dataProcessamento: new Date()
                      .toISOString()
                      .replace('T', ' ')
                      .substring(0, 19),
                    processadoPor: usuarioLogado.id.toString(),
                    processadoPorNome: usuarioLogado.nome,
                  }
                : s
            ),
          });

          // Adicionar log
          get().adicionarLog({
            usuarioId: usuarioLogado.id,
            usuarioNome: usuarioLogado.nome,
            usuarioRole:
              usuarioLogado.role.charAt(0).toUpperCase() +
              usuarioLogado.role.slice(1),
            acao: 'Aprovação de Saque',
            descricao: `Aprovou saque de R$ ${saque.valor.toFixed(2)} para ${
              saque.indicadorNome
            }`,
            data: new Date().toISOString().replace('T', ' ').substring(0, 19),
            ip: '192.168.1.100',
            navegador: 'Chrome 120',
          });
        }
      },

      rejeitarSaque: (id, motivo) => {
        const { solicitacoesSaque, usuarioLogado } = get();
        const saque = solicitacoesSaque.find((s) => s.id === id);

        if (saque && usuarioLogado) {
          set({
            solicitacoesSaque: solicitacoesSaque.map((s) =>
              s.id === id
                ? {
                    ...s,
                    status: 'rejeitado' as const,
                    motivoRejeicao: motivo,
                    dataProcessamento: new Date()
                      .toISOString()
                      .replace('T', ' ')
                      .substring(0, 19),
                    processadoPor: usuarioLogado.id.toString(),
                    processadoPorNome: usuarioLogado.nome,
                  }
                : s
            ),
          });

          // Adicionar log
          get().adicionarLog({
            usuarioId: usuarioLogado.id,
            usuarioNome: usuarioLogado.nome,
            usuarioRole:
              usuarioLogado.role.charAt(0).toUpperCase() +
              usuarioLogado.role.slice(1),
            acao: 'Rejeição de Saque',
            descricao: `Rejeitou saque de R$ ${saque.valor.toFixed(2)} para ${
              saque.indicadorNome
            } (${motivo})`,
            data: new Date().toISOString().replace('T', ' ').substring(0, 19),
            ip: '192.168.1.100',
            navegador: 'Chrome 120',
          });
        }
      },

      // Alertas
      marcarAlertaComoLido: (id) => {
        const { alertas } = get();
        set({
          alertas: alertas.map((a) =>
            a.id === id ? { ...a, lido: true } : a
          ),
        });
      },

      getAlertasNaoLidos: () => {
        return get().alertas.filter((a) => !a.lido);
      },

      // Logs
      adicionarLog: (log) => {
        const { logsAuditoria } = get();
        const novoId =
          logsAuditoria.length > 0
            ? Math.max(...logsAuditoria.map((l) => l.id)) + 1
            : 1;
        const novoLog: LogAuditoria = {
          ...log,
          id: novoId,
        };

        set({
          logsAuditoria: [novoLog, ...logsAuditoria],
        });
      },

      // Configurações
      atualizarConfiguracoes: (config) => {
        const { configuracaoSistema, usuarioLogado } = get();
        set({
          configuracaoSistema: {
            ...configuracaoSistema,
            ...config,
          },
        });

        // Adicionar log
        if (usuarioLogado) {
          get().adicionarLog({
            usuarioId: usuarioLogado.id,
            usuarioNome: usuarioLogado.nome,
            usuarioRole:
              usuarioLogado.role.charAt(0).toUpperCase() +
              usuarioLogado.role.slice(1),
            acao: 'Atualização de Configurações',
            descricao: `Atualizou configurações do sistema`,
            data: new Date().toISOString().replace('T', ' ').substring(0, 19),
            ip: '192.168.1.100',
            navegador: 'Chrome 120',
          });
        }
      },

      // Data fetching actions
      fetchEstatisticasCRM: async () => {
        set({ isLoadingEstatisticasCRM: true });
        try {
          const token = get().token;
          const response = await fetch(`${API_BASE_URL}/admin/estatisticas/crm`, {
            headers: {
              'Authorization': `Bearer ${token || ''}`
            }
          });
          
          if (!response.ok) {
            if (response.status === 401) {
              console.error('Token inválido ou expirado');
              get().logout();
            }
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          set({ estatisticasCRM: data, isLoadingEstatisticasCRM: false });
        } catch (error) {
          console.error('Erro ao buscar estatísticas CRM:', error);
          set({ isLoadingEstatisticasCRM: false });
        }
      },

      fetchEstatisticasIndicacao: async () => {
        set({ isLoadingEstatisticasIndicacao: true });
        try {
          const token = get().token;
          const response = await fetch(`${API_BASE_URL}/admin/estatisticas/indicacao`, {
            headers: {
              'Authorization': `Bearer ${token || ''}`
            }
          });
          
          if (!response.ok) {
            if (response.status === 401) {
              console.error('Token inválido ou expirado');
              get().logout();
            }
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          set({ estatisticasIndicacao: data, isLoadingEstatisticasIndicacao: false });
        } catch (error) {
          console.error('Erro ao buscar estatísticas de indicação:', error);
          set({ isLoadingEstatisticasIndicacao: false });
        }
      },

      fetchTopPerformers: async () => {
        try {
          const token = get().token;
          const response = await fetch(`${API_BASE_URL}/admin/top-performers`, {
            headers: {
              'Authorization': `Bearer ${token || ''}`
            }
          });
          
          if (!response.ok) {
            if (response.status === 401) {
              console.error('Token inválido ou expirado');
              get().logout();
            }
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          set({ topPerformers: data });
        } catch (error) {
          console.error('Erro ao buscar top performers:', error);
        }
      },

      fetchTopIndicadores: async () => {
        try {
          const token = get().token;
          const response = await fetch(`${API_BASE_URL}/admin/top-indicadores`, {
            headers: {
              'Authorization': `Bearer ${token || ''}`
            }
          });
          
          if (!response.ok) {
            if (response.status === 401) {
              console.error('Token inválido ou expirado');
              get().logout();
            }
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          set({ topIndicadores: data });
        } catch (error) {
          console.error('Erro ao buscar top indicadores:', error);
        }
      },

      fetchDistribuicaoFunil: async () => {
        try {
          const token = get().token;
          const response = await fetch(`${API_BASE_URL}/admin/distribuicao-funil`, {
            headers: {
              'Authorization': `Bearer ${token || ''}`
            }
          });
          
          if (!response.ok) {
            if (response.status === 401) {
              console.error('Token inválido ou expirado');
              get().logout();
            }
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          set({ distribuicaoFunil: data });
        } catch (error) {
          console.error('Erro ao buscar distribuição do funil:', error);
        }
      },

      fetchAlertas: async () => {
        try {
          const token = get().token;
          const response = await fetch(`${API_BASE_URL}/admin/alertas`, {
            headers: {
              'Authorization': `Bearer ${token || ''}`
            }
          });
          
          if (!response.ok) {
            if (response.status === 401) {
              console.error('Token inválido ou expirado');
              get().logout();
            }
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          set({ alertas: data });
        } catch (error) {
          console.error('Erro ao buscar alertas:', error);
        }
      },

      fetchVendedores: async () => {
        set({ isLoadingVendedores: true });
        try {
          const token = get().token;
          
          const response = await fetch(`${API_BASE_URL}/admin/vendedores`, {
            headers: {
              'Authorization': `Bearer ${token || ''}`
            }
          });
          
          if (!response.ok) {
            if (response.status === 401) {
              console.error('Token inválido ou expirado');
              get().logout();
            }
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          set({ vendedores: Array.isArray(data) ? data : [], isLoadingVendedores: false });
        } catch (error) {
          console.error('Erro ao buscar vendedores:', error);
          set({ vendedores: [], isLoadingVendedores: false });
        }
      },

      fetchIndicadores: async () => {
        set({ isLoadingIndicadores: true });
        try {
          const token = get().token;
          
          const response = await fetch(`${API_BASE_URL}/admin/indicadores`, {
            headers: {
              'Authorization': `Bearer ${token || ''}`
            }
          });
          
          if (!response.ok) {
            if (response.status === 401) {
              console.error('Token inválido ou expirado');
              get().logout();
            }
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          set({ indicadores: Array.isArray(data) ? data : [], isLoadingIndicadores: false });
        } catch (error) {
          console.error('Erro ao buscar indicadores:', error);
          set({ indicadores: [], isLoadingIndicadores: false });
        }
      },

      fetchAdmins: async () => {
        try {
          const token = get().token;
          
          const response = await fetch(`${API_BASE_URL}/admin/admins`, {
            headers: {
              'Authorization': `Bearer ${token || ''}`
            }
          });
          
          if (!response.ok) {
            if (response.status === 401) {
              console.error('Token inválido ou expirado');
              get().logout();
            }
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          set({ admins: Array.isArray(data) ? data : [] });
        } catch (error) {
          console.error('Erro ao buscar admins:', error);
          set({ admins: [] });
        }
      },

      fetchSolicitacoesSaque: async () => {
        try {
          const token = get().token;
          const response = await fetch(`${API_BASE_URL}/admin/saques/pendentes`, {
            headers: {
              'Authorization': `Bearer ${token || ''}`
            }
          });
          
          if (!response.ok) {
            if (response.status === 401) {
              console.error('Token inválido ou expirado');
              get().logout();
            }
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          set({ solicitacoesSaque: data });
        } catch (error) {
          console.error('Erro ao buscar solicitações de saque:', error);
        }
      },

      fetchChatsVendedores: async () => {
        try {
          const token = get().token;
          const response = await fetch(`${API_BASE_URL}/admin/chats-vendedores`, {
            headers: {
              'Authorization': `Bearer ${token || ''}`
            }
          });
          
          if (!response.ok) {
            if (response.status === 401) {
              console.error('Token inválido ou expirado');
              get().logout();
            }
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          set({ chatsVendedores: Array.isArray(data) ? data : [] });
        } catch (error) {
          console.error('Erro ao buscar chats dos vendedores:', error);
          set({ chatsVendedores: [] });
        }
      },

      fetchAllDashboardData: async () => {
        const { 
          fetchEstatisticasCRM, 
          fetchEstatisticasIndicacao,
          fetchTopPerformers,
          fetchTopIndicadores,
          fetchDistribuicaoFunil,
          fetchAlertas,
          fetchVendedores,
          fetchIndicadores,
          fetchSolicitacoesSaque
        } = get();

        await Promise.all([
          fetchEstatisticasCRM(),
          fetchEstatisticasIndicacao(),
          fetchTopPerformers(),
          fetchTopIndicadores(),
          fetchDistribuicaoFunil(),
          fetchAlertas(),
          fetchVendedores(),
          fetchIndicadores(),
          fetchSolicitacoesSaque()
        ]);
      },
    }),
    {
      name: 'admin-storage',
      partialize: (state) => ({
        usuarioLogado: state.usuarioLogado,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
