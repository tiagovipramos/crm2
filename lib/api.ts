import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://185.217.125.72:3001/api';

// Criar instância do axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido ou expirado
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: async (email: string, senha: string) => {
    const { data } = await api.post('/auth/login', { email, senha });
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },

  getMe: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },

  logout: () => {
    localStorage.removeItem('token');
  },
};

// Leads
export const leadsAPI = {
  getAll: async () => {
    const { data } = await api.get('/leads');
    return data;
  },

  getOne: async (id: string) => {
    const { data } = await api.get(`/leads/${id}`);
    return data;
  },

  create: async (leadData: any) => {
    const { data } = await api.post('/leads', leadData);
    return data;
  },

  update: async (id: string, leadData: any) => {
    const { data } = await api.put(`/leads/${id}`, leadData);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/leads/${id}`);
    return data;
  },

  addTag: async (id: string, tag: string) => {
    const { data } = await api.post(`/leads/${id}/tags`, { tag });
    return data;
  },

  removeTag: async (id: string, tag: string) => {
    const { data } = await api.delete(`/leads/${id}/tags/${tag}`);
    return data;
  },

  atualizarStatus: async (id: string, status: string) => {
    const { data } = await api.patch(`/leads/${id}/status`, { status });
    return data;
  },
};

// Mensagens
export const mensagensAPI = {
  getByLead: async (leadId: string) => {
    const { data } = await api.get(`/mensagens/lead/${leadId}`);
    return data;
  },

  send: async (leadId: string, conteudo: string, tipo = 'texto') => {
    const { data } = await api.post('/mensagens/send', {
      leadId,
      conteudo,
      tipo,
    });
    return data;
  },

  uploadFile: async (leadId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('leadId', leadId);

    const { data } = await api.post('/mensagens/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  markAsRead: async (leadId: string) => {
    const { data } = await api.put(`/mensagens/lead/${leadId}/mark-read`);
    return data;
  },

  sendAudio: async (leadId: string, audioBlob: Blob, duracao: number) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');
    formData.append('leadId', leadId);
    formData.append('duracao', duracao.toString());

    const { data } = await api.post('/mensagens/send-audio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
};

// WhatsApp
export const whatsappAPI = {
  connect: async () => {
    const { data } = await api.post('/whatsapp/connect');
    return data;
  },

  disconnect: async () => {
    const { data } = await api.post('/whatsapp/disconnect');
    return data;
  },

  getStatus: async () => {
    const { data } = await api.get('/whatsapp/status');
    return data;
  },
};

// Propostas
export const propostasAPI = {
  getByLead: async (leadId: string) => {
    const { data } = await api.get(`/propostas/lead/${leadId}`);
    return data;
  },

  create: async (propostaData: any) => {
    const { data } = await api.post('/propostas', propostaData);
    return data;
  },

  update: async (id: string, propostaData: any) => {
    const { data } = await api.put(`/propostas/${id}`, propostaData);
    return data;
  },

  send: async (id: string) => {
    const { data } = await api.post(`/propostas/${id}/enviar`);
    return data;
  },
};

// Tarefas
export const tarefasAPI = {
  getAll: async () => {
    const { data } = await api.get('/tarefas');
    return data;
  },

  getByLead: async (leadId: string) => {
    const { data } = await api.get(`/tarefas/lead/${leadId}`);
    return data;
  },

  create: async (tarefaData: any) => {
    const { data } = await api.post('/tarefas', tarefaData);
    return data;
  },

  update: async (id: string, tarefaData: any) => {
    const { data } = await api.put(`/tarefas/${id}`, tarefaData);
    return data;
  },

  complete: async (id: string) => {
    const { data } = await api.put(`/tarefas/${id}/concluir`);
    return data;
  },

  delete: async (id: string) => {
    const { data} = await api.delete(`/tarefas/${id}`);
    return data;
  },
};

// Relatórios
export const relatoriosAPI = {
  getTempoMedioResposta: async () => {
    const { data } = await api.get('/relatorios/tempo-medio-resposta');
    return data;
  },
};

export default api;
