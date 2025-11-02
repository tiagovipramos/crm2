import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import type { Indicador, DashboardIndicador, Indicacao, TransacaoIndicador } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://185.217.125.72:3001/api';

interface LootBoxStatus {
  leadsParaProximaCaixa: number;
  leadsNecessarios: number;
  podeAbrirIndicacoes: boolean;
  vendasParaProximaCaixa: number;
  vendasNecessarias: number;
  podeAbrirVendas: boolean;
  totalCaixasAbertas: number;
  totalGanhoCaixas: number;
  totalCaixasVendasAbertas: number;
  totalGanhoCaixasVendas: number;
  historico: any[];
  // Manter compatibilidade com código antigo
  podeAbrir?: boolean;
}

interface IndicadorState {
  indicador: Indicador | null;
  token: string | null;
  dashboard: DashboardIndicador | null;
  indicacoes: Indicacao[];
  transacoes: TransacaoIndicador[];
  lootboxStatus: LootBoxStatus | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, senha: string) => Promise<void>;
  register: (data: { nome: string; email: string; senha: string; telefone?: string; cpf?: string }) => Promise<void>;
  logout: () => void;
  fetchDashboard: () => Promise<void>;
  fetchIndicacoes: () => Promise<void>;
  fetchTransacoes: () => Promise<void>;
  validarWhatsApp: (telefone: string) => Promise<{ valido: boolean; existe: boolean; mensagem: string }>;
  criarIndicacao: (nomeIndicado: string, telefoneIndicado: string) => Promise<void>;
  deletarTodasIndicacoes: () => Promise<void>;
  atualizarAvatar: (avatarData: string) => Promise<void>;
  fetchLootBoxStatus: () => Promise<void>;
  abrirLootBox: () => Promise<{ premio: { id?: number; valor: number; tipo: string; emoji: string; cor: string } }>;
  compartilharPremio: (lootboxId: number) => Promise<void>;
  setError: (error: string | null) => void;
}

export const useIndicadorStore = create<IndicadorState>()(
  persist(
    (set, get) => ({
      indicador: null,
      token: null,
      dashboard: null,
      indicacoes: [],
      transacoes: [],
      lootboxStatus: null,
      isLoading: false,
      error: null,

      login: async (email: string, senha: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(`${API_URL}/indicador/login`, {
            email,
            senha,
          });
          
          set({
            indicador: response.data.indicador,
            token: response.data.token,
            isLoading: false,
          });
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Erro ao fazer login';
          set({ error: errorMsg, isLoading: false });
          throw new Error(errorMsg);
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(`${API_URL}/indicador/register`, data);
          
          set({
            indicador: response.data.indicador,
            token: response.data.token,
            isLoading: false,
          });
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Erro ao cadastrar';
          set({ error: errorMsg, isLoading: false });
          throw new Error(errorMsg);
        }
      },

      logout: () => {
        set({
          indicador: null,
          token: null,
          dashboard: null,
          indicacoes: [],
          transacoes: [],
        });
      },

      fetchDashboard: async () => {
        const { token } = get();
        if (!token) return;

        set({ isLoading: true, error: null });
        try {
          const response = await axios.get(`${API_URL}/indicador/dashboard`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          set({
            dashboard: response.data,
            isLoading: false,
          });
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Erro ao buscar dashboard';
          set({ error: errorMsg, isLoading: false });
        }
      },

      fetchIndicacoes: async () => {
        const { token } = get();
        if (!token) return;

        set({ isLoading: true, error: null });
        try {
          const response = await axios.get(`${API_URL}/indicador/indicacoes`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          set({
            indicacoes: response.data,
            isLoading: false,
          });
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Erro ao buscar indicações';
          set({ error: errorMsg, isLoading: false });
        }
      },

      fetchTransacoes: async () => {
        const { token } = get();
        if (!token) return;

        set({ isLoading: true, error: null });
        try {
          const response = await axios.get(`${API_URL}/indicador/transacoes`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          set({
            transacoes: response.data,
            isLoading: false,
          });
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Erro ao buscar transações';
          set({ error: errorMsg, isLoading: false });
        }
      },

      validarWhatsApp: async (telefone: string) => {
        const { token } = get();
        if (!token) throw new Error('Não autenticado');

        try {
          const response = await axios.post(
            `${API_URL}/indicador/validar-whatsapp`,
            { telefone },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          return response.data;
        } catch (error: any) {
          throw new Error(error.response?.data?.message || 'Erro ao validar WhatsApp');
        }
      },

      criarIndicacao: async (nomeIndicado: string, telefoneIndicado: string) => {
        const { token } = get();
        if (!token) throw new Error('Não autenticado');

        set({ isLoading: true, error: null });
        try {
          await axios.post(
            `${API_URL}/indicador/indicar`,
            { nomeIndicado, telefoneIndicado },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          // Atualizar dashboard, indicações E lootbox status
          await get().fetchDashboard();
          await get().fetchIndicacoes();
          await get().fetchLootBoxStatus();
          
          set({ isLoading: false });
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Erro ao criar indicação';
          set({ error: errorMsg, isLoading: false });
          throw new Error(errorMsg);
        }
      },

      deletarTodasIndicacoes: async () => {
        const { token } = get();
        if (!token) throw new Error('Não autenticado');

        set({ isLoading: true, error: null });
        try {
          await axios.delete(
            `${API_URL}/indicador/indicacoes`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          // FORÇAR RESET do lootboxStatus para garantir atualização
          set({ lootboxStatus: null });
          
          // Atualizar dashboard, indicações E lootbox status
          await get().fetchDashboard();
          await get().fetchIndicacoes();
          await get().fetchLootBoxStatus();
          
          set({ isLoading: false });
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Erro ao deletar indicações';
          set({ error: errorMsg, isLoading: false });
          throw new Error(errorMsg);
        }
      },

      atualizarAvatar: async (avatarData: string) => {
        const { token, indicador } = get();
        if (!token) throw new Error('Não autenticado');

        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(
            `${API_URL}/indicador/avatar`,
            { avatar: avatarData },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          // Atualizar o indicador local com o novo avatar
          if (indicador) {
            set({
              indicador: {
                ...indicador,
                avatar: avatarData,
              },
              isLoading: false,
            });
          }
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Erro ao atualizar avatar';
          set({ error: errorMsg, isLoading: false });
          throw new Error(errorMsg);
        }
      },

      fetchLootBoxStatus: async () => {
        const { token } = get();
        if (!token) return;

        try {
          const response = await axios.get(`${API_URL}/indicador/lootbox/status`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          set({ lootboxStatus: response.data });
        } catch (error: any) {
          console.error('Erro ao buscar status da loot box:', error);
        }
      },

      abrirLootBox: async () => {
        const { token } = get();
        if (!token) throw new Error('Não autenticado');

        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(
            `${API_URL}/indicador/lootbox/abrir`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          // Atualizar dashboard e status da lootbox
          await get().fetchDashboard();
          await get().fetchLootBoxStatus();
          
          set({ isLoading: false });
          return response.data;
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Erro ao abrir caixa';
          set({ error: errorMsg, isLoading: false });
          throw new Error(errorMsg);
        }
      },

      compartilharPremio: async (lootboxId: number) => {
        const { token } = get();
        if (!token) throw new Error('Não autenticado');

        try {
          await axios.post(
            `${API_URL}/indicador/lootbox/compartilhar`,
            { lootboxId },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (error: any) {
          console.error('Erro ao compartilhar prêmio:', error);
        }
      },

      setError: (error: string | null) => {
        set({ error });
      },
    }),
    {
      name: 'indicador-storage',
      partialize: (state) => ({
        indicador: state.indicador,
        token: state.token,
      }),
    }
  )
);
