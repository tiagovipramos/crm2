"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTarefa = exports.completeTarefa = exports.createTarefa = exports.getTarefasByLead = exports.getTarefas = void 0;
const database_1 = require("../config/database");
// Listar todas as tarefas do consultor
const getTarefas = async (req, res) => {
    try {
        const consultorId = req.user.id;
        const [tarefas] = await database_1.pool.query(`SELECT t.*, 
       DATE_FORMAT(t.data_hora, '%Y-%m-%d %H:%i:%s') as data_hora,
       l.nome as lead_nome, l.telefone as lead_telefone
       FROM tarefas t
       LEFT JOIN leads l ON t.lead_id = l.id
       WHERE t.consultor_id = ?
       ORDER BY t.data_hora ASC`, [consultorId]);
        res.json(tarefas);
    }
    catch (error) {
        console.error('Erro ao buscar tarefas:', error);
        res.status(500).json({ error: 'Erro ao buscar tarefas' });
    }
};
exports.getTarefas = getTarefas;
// Buscar tarefas por lead
const getTarefasByLead = async (req, res) => {
    try {
        const { leadId } = req.params;
        const consultorId = req.user.id;
        const [tarefas] = await database_1.pool.query(`SELECT * FROM tarefas 
       WHERE lead_id = ? AND consultor_id = ?
       ORDER BY data_hora ASC`, [leadId, consultorId]);
        res.json(tarefas);
    }
    catch (error) {
        console.error('Erro ao buscar tarefas do lead:', error);
        res.status(500).json({ error: 'Erro ao buscar tarefas do lead' });
    }
};
exports.getTarefasByLead = getTarefasByLead;
// Criar nova tarefa
const createTarefa = async (req, res) => {
    try {
        const { leadId, titulo, descricao, dataHora } = req.body;
        const consultorId = req.user.id;
        console.log('📝 Dados recebidos para criar tarefa:', {
            leadId,
            titulo,
            descricao,
            dataHora,
            consultorId
        });
        // Validação
        if (!leadId || !titulo || !dataHora) {
            return res.status(400).json({
                error: 'Campos obrigatórios: leadId, titulo, dataHora'
            });
        }
        // O frontend já envia no formato MySQL correto (yyyy-mm-dd hh:mm:ss)
        // NÃO converter com new Date() para evitar problemas de timezone
        const dataFormatada = dataHora;
        console.log('🕐 Data recebida (sem conversão):', dataFormatada);
        const [result] = await database_1.pool.query(`INSERT INTO tarefas (lead_id, consultor_id, titulo, descricao, data_hora, status, criado_em)
       VALUES (?, ?, ?, ?, ?, 'pendente', NOW())`, [leadId, consultorId, titulo, descricao || '', dataFormatada]);
        console.log('✅ Tarefa criada com ID:', result.insertId);
        const [tarefa] = await database_1.pool.query('SELECT * FROM tarefas WHERE id = ?', [result.insertId]);
        res.status(201).json(tarefa[0]);
    }
    catch (error) {
        console.error('❌ Erro ao criar tarefa:', error);
        console.error('📋 Stack trace:', error.stack);
        res.status(500).json({
            error: 'Erro ao criar tarefa',
            details: error.message
        });
    }
};
exports.createTarefa = createTarefa;
// Marcar tarefa como concluída
const completeTarefa = async (req, res) => {
    try {
        const { id } = req.params;
        const consultorId = req.user.id;
        await database_1.pool.query(`UPDATE tarefas 
       SET status = 'concluida', concluida_em = NOW()
       WHERE id = ? AND consultor_id = ?`, [id, consultorId]);
        const [tarefa] = await database_1.pool.query('SELECT * FROM tarefas WHERE id = ?', [id]);
        res.json(tarefa[0]);
    }
    catch (error) {
        console.error('Erro ao concluir tarefa:', error);
        res.status(500).json({ error: 'Erro ao concluir tarefa' });
    }
};
exports.completeTarefa = completeTarefa;
// Deletar tarefa
const deleteTarefa = async (req, res) => {
    try {
        const { id } = req.params;
        const consultorId = req.user.id;
        await database_1.pool.query('DELETE FROM tarefas WHERE id = ? AND consultor_id = ?', [id, consultorId]);
        res.json({ message: 'Tarefa deletada com sucesso' });
    }
    catch (error) {
        console.error('Erro ao deletar tarefa:', error);
        res.status(500).json({ error: 'Erro ao deletar tarefa' });
    }
};
exports.deleteTarefa = deleteTarefa;
