import { Request, Response } from 'express';
import { query } from '../config/db-helper';

// Função para normalizar telefone para WhatsApp
// Remove o 9º dígito após o DDD (números novos brasileiros)
const normalizarTelefoneParaWhatsApp = (telefone: string): string => {
  // Remove tudo que não é número
  const apenasNumeros = telefone.replace(/\D/g, '');
  
  console.log('📱 Normalizando telefone:', telefone);
  console.log('📱 Apenas números:', apenasNumeros);
  
  // Se tem 13 dígitos (55 + DDD com 2 dígitos + 9 + 8 dígitos)
  // Exemplo: 5581987780566
  if (apenasNumeros.length === 13 && apenasNumeros.startsWith('55')) {
    const ddi = apenasNumeros.substring(0, 2); // 55
    const ddd = apenasNumeros.substring(2, 4); // 81
    const nono = apenasNumeros.substring(4, 5); // 9
    const resto = apenasNumeros.substring(5); // 87780566
    
    // Se o quinto dígito é 9, remove ele
    if (nono === '9') {
      const numeroNormalizado = ddi + ddd + resto;
      console.log('📱 Número normalizado (removeu 9):', numeroNormalizado);
      return numeroNormalizado;
    }
  }
  
  console.log('📱 Número mantido sem alteração:', apenasNumeros);
  return apenasNumeros;
};

// Função para converter snake_case para camelCase
const toCamelCase = (obj: any) => {
  const converted: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    let value = obj[key];
    
    // Parse JSON fields
    if ((key === 'notas_internas' || key === 'tags') && typeof value === 'string') {
      try {
        value = JSON.parse(value);
      } catch (e) {
        // Se falhar o parse, mantém o valor original
      }
    }
    
    converted[camelKey] = value;
  }
  return converted;
};

export const getLeads = async (req: Request, res: Response, next: any) => {
  try {
    const consultorId = req.user?.id;

    if (!consultorId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    console.log('📥 Carregando leads do consultor:', consultorId);

    const result = await query(
      `SELECT * FROM leads 
       WHERE consultor_id = ? 
       ORDER BY data_criacao DESC`,
      [consultorId]
    );

    if (!result.rows) {
      return res.json([]);
    }

    console.log('📊 Total de leads encontrados:', result.rows.length);

    // Converter para camelCase
    const leads = result.rows.map(toCamelCase);
    res.json(leads);
  } catch (error) {
    console.error('❌ Erro ao buscar leads:', error);
    next(error);
  }
};

export const getLead = async (req: Request, res: Response, next: any) => {
  try {
    const { id } = req.params;
    const consultorId = req.user?.id;

    if (!consultorId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (!id) {
      return res.status(400).json({ error: 'ID do lead é obrigatório' });
    }

    const result = await query(
      'SELECT * FROM leads WHERE id = ? AND consultor_id = ?',
      [id, consultorId]
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    res.json(toCamelCase(result.rows[0]));
  } catch (error) {
    console.error('❌ Erro ao buscar lead:', error);
    next(error);
  }
};

export const createLead = async (req: Request, res: Response, next: any) => {
  try {
    const consultorId = req.user?.id;

    if (!consultorId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const {
      nome,
      telefone,
      email,
      cidade,
      modeloVeiculo,
      placaVeiculo,
      anoVeiculo,
      origem,
      observacoes
    } = req.body;

    // Validações
    if (!nome || !telefone) {
      return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
    }

    if (typeof nome !== 'string' || typeof telefone !== 'string') {
      return res.status(400).json({ error: 'Nome e telefone devem ser strings' });
    }

    if (nome.trim().length < 2) {
      return res.status(400).json({ error: 'Nome deve ter pelo menos 2 caracteres' });
    }

    // Normalizar telefone para WhatsApp (remove o 9º dígito)
    const telefoneNormalizado = normalizarTelefoneParaWhatsApp(telefone);
    
    // Verificar se já existe um lead com este telefone
    const leadExistente = await query(
      'SELECT id, nome FROM leads WHERE telefone = ? AND consultor_id = ?',
      [telefoneNormalizado, consultorId]
    );

    if (leadExistente.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Já existe um lead com este número de telefone',
        leadExistente: {
          id: leadExistente.rows[0].id,
          nome: leadExistente.rows[0].nome
        }
      });
    }
    
    const result = await query(
      `INSERT INTO leads (
        nome, telefone, email, cidade, modelo_veiculo, placa_veiculo, 
        ano_veiculo, origem, status, consultor_id, observacoes,
        mensagens_nao_lidas, data_criacao, data_atualizacao
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'novo', ?, ?, 0, NOW(), NOW())`,
      [nome, telefoneNormalizado, email, cidade, modeloVeiculo, placaVeiculo, anoVeiculo, origem || 'Manual', consultorId, observacoes]
    );

    // Buscar lead criado para retornar com todos os campos
    const newLeadId = result.insertId;
    
    if (!newLeadId) {
      throw new Error('Falha ao criar lead - ID não retornado');
    }
    
    const leadResult = await query('SELECT * FROM leads WHERE id = ?', [newLeadId]);
    
    if (!leadResult.rows || leadResult.rows.length === 0) {
      throw new Error('Falha ao buscar lead criado');
    }
    
    res.status(201).json(toCamelCase(leadResult.rows[0]));
  } catch (error) {
    console.error('❌ Erro ao criar lead:', error);
    next(error);
  }
};

export const updateLead = async (req: Request, res: Response, next: any) => {
  try {
    const { id } = req.params;
    const consultorId = req.user?.id;
    const updates = req.body;

    if (!consultorId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (!id) {
      return res.status(400).json({ error: 'ID do lead é obrigatório' });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Nenhum dado para atualizar' });
    }

    console.log('🔄 ATUALIZANDO LEAD:', id);

    // Verificar se o lead pertence ao consultor
    const checkResult = await query(
      'SELECT id FROM leads WHERE id = ? AND consultor_id = ?',
      [id, consultorId]
    );

    if (!checkResult.rows || checkResult.rows.length === 0) {
      console.log('❌ Lead não encontrado');
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    // Filtrar campos undefined e construir query dinâmica
    const fields = Object.keys(updates).filter(key => updates[key] !== undefined);
    const values = fields.map((field) => {
      const value = updates[field];
      // Converter arrays/objetos para JSON
      if (field === 'notasInternas' || field === 'tags') {
        return JSON.stringify(value);
      }
      // Converter strings vazias para null em campos opcionais
      if (value === '' && ['email', 'cidade', 'modeloVeiculo', 'placaVeiculo', 'corVeiculo', 'anoVeiculo', 'observacoes', 'informacoesComerciais', 'mensalidade', 'fipe', 'plano'].includes(field)) {
        return null;
      }
      return value;
    });
    
    if (fields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    const setClause = fields
      .map((field) => `${field.replace(/([A-Z])/g, '_$1').toLowerCase()} = ?`)
      .join(', ');

    console.log('📝 Query SQL:', `UPDATE leads SET ${setClause}, data_atualizacao = NOW() WHERE id = ?`);
    console.log('📊 Valores:', [...values, id]);

    await query(
      `UPDATE leads 
       SET ${setClause}, data_atualizacao = NOW() 
       WHERE id = ?`,
      [...values, id]
    );

    console.log('✅ Lead atualizado no banco de dados');

    // Se o status foi atualizado, emitir evento Socket.IO para admins
    if (fields.includes('status')) {
      const io = (req.app as any).get('io');
      console.log('🔍 DEBUG: Status foi atualizado! io existe?', !!io);
      if (io) {
        console.log('📡 Emitindo evento lead_status_atualizado para admins');
        console.log('📊 Dados do evento:', { leadId: id, consultorId, status: updates.status });
        io.to('admins').emit('lead_status_atualizado', {
          leadId: id,
          consultorId,
          status: updates.status,
          timestamp: new Date().toISOString()
        });
        console.log('✅ Evento emitido com sucesso!');
      } else {
        console.error('❌ Socket.IO não encontrado no app!');
      }
    }

    // Buscar lead atualizado
    const result = await query(
      'SELECT * FROM leads WHERE id = ?',
      [id]
    );

    if (!result.rows || result.rows.length === 0) {
      throw new Error('Lead não encontrado após atualização');
    }

    res.json(toCamelCase(result.rows[0]));
  } catch (error) {
    console.error('❌ Erro ao atualizar lead:', error);
    next(error);
  }
};

export const deleteLead = async (req: Request, res: Response, next: any) => {
  try {
    const { id } = req.params;
    const consultorId = req.user?.id;

    if (!consultorId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (!id) {
      return res.status(400).json({ error: 'ID do lead é obrigatório' });
    }

    const result = await query(
      'DELETE FROM leads WHERE id = ? AND consultor_id = ?',
      [id, consultorId]
    );

    if (!result.affectedRows || result.affectedRows === 0) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    res.json({ message: 'Lead deletado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao deletar lead:', error);
    next(error);
  }
};

export const addTag = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tag } = req.body;
    const consultorId = req.user?.id;

    if (!tag) {
      return res.status(400).json({ error: 'Tag é obrigatória' });
    }

    // Buscar tags atuais
    const leadResult = await query(
      'SELECT tags FROM leads WHERE id = ? AND consultor_id = ?',
      [id, consultorId]
    );

    if (leadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    const tagsAtuais = leadResult.rows[0].tags ? JSON.parse(leadResult.rows[0].tags) : [];

    if (tagsAtuais.includes(tag)) {
      return res.status(400).json({ error: 'Tag já existe' });
    }

    tagsAtuais.push(tag);

    await query(
      `UPDATE leads 
       SET tags = ?, data_atualizacao = NOW() 
       WHERE id = ?`,
      [JSON.stringify(tagsAtuais), id]
    );

    const result = await query('SELECT * FROM leads WHERE id = ?', [id]);
    res.json(toCamelCase(result.rows[0]));
  } catch (error) {
    console.error('Erro ao adicionar tag:', error);
    res.status(500).json({ error: 'Erro ao adicionar tag' });
  }
};

export const removeTag = async (req: Request, res: Response) => {
  try {
    const { id, tag } = req.params;
    const consultorId = req.user?.id;

    const leadResult = await query(
      'SELECT tags FROM leads WHERE id = ? AND consultor_id = ?',
      [id, consultorId]
    );

    if (leadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    const tagsAtuais = leadResult.rows[0].tags ? JSON.parse(leadResult.rows[0].tags) : [];
    const novasTags = tagsAtuais.filter((t: string) => t !== tag);

    await query(
      `UPDATE leads 
       SET tags = ?, data_atualizacao = NOW() 
       WHERE id = ?`,
      [JSON.stringify(novasTags), id]
    );

    const result = await query('SELECT * FROM leads WHERE id = ?', [id]);
    res.json(toCamelCase(result.rows[0]));
  } catch (error) {
    console.error('Erro ao remover tag:', error);
    res.status(500).json({ error: 'Erro ao remover tag' });
  }
};

export const updateStatus = async (req: Request, res: Response, next: any) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const consultorId = req.user?.id;

    if (!consultorId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (!id) {
      return res.status(400).json({ error: 'ID do lead é obrigatório' });
    }

    if (!status) {
      return res.status(400).json({ error: 'Status é obrigatório' });
    }

    // Verificar se o status é válido
    const statusValidos = ['novo', 'primeiro_contato', 'proposta_enviada', 'convertido', 'perdido'];
    if (!statusValidos.includes(status)) {
      return res.status(400).json({ 
        error: 'Status inválido',
        statusValidos: statusValidos 
      });
    }

    console.log('🔄 Atualizando status do lead:', id, 'para:', status);

    // Verificar se o lead pertence ao consultor
    const checkResult = await query(
      'SELECT id FROM leads WHERE id = ? AND consultor_id = ?',
      [id, consultorId]
    );

    if (!checkResult.rows || checkResult.rows.length === 0) {
      console.log('❌ Lead não encontrado');
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    await query(
      `UPDATE leads 
       SET status = ?, data_atualizacao = NOW() 
       WHERE id = ?`,
      [status, id]
    );

    console.log('✅ Status atualizado com sucesso');

    // Emitir evento Socket.IO para admins atualizarem em tempo real
    const io = (req.app as any).get('io');
    console.log('🔍 DEBUG: io existe?', !!io);
    if (io) {
      console.log('📡 Emitindo evento lead_status_atualizado para admins');
      console.log('📊 Dados do evento:', { leadId: id, consultorId, status });
      io.to('admins').emit('lead_status_atualizado', {
        leadId: id,
        consultorId,
        status,
        timestamp: new Date().toISOString()
      });
      console.log('✅ Evento emitido com sucesso!');
    } else {
      console.error('❌ Socket.IO não encontrado no app!');
    }

    // Buscar lead atualizado
    const result = await query('SELECT * FROM leads WHERE id = ?', [id]);
    
    if (!result.rows || result.rows.length === 0) {
      throw new Error('Lead não encontrado após atualização');
    }
    
    res.json(toCamelCase(result.rows[0]));
  } catch (error) {
    console.error('❌ Erro ao atualizar status:', error);
    next(error);
  }
};
