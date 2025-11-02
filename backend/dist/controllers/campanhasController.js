"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCampanha = exports.getEstatisticas = exports.getLogs = exports.cancelarCampanha = exports.pausarCampanha = exports.iniciarCampanha = exports.createCampanha = exports.getCampanha = exports.getCampanhas = void 0;
const db_helper_1 = require("../config/db-helper");
const crypto_1 = __importDefault(require("crypto"));
// Função para converter snake_case para camelCase
const toCamelCase = (obj) => {
    const converted = {};
    for (const key in obj) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        converted[camelKey] = obj[key];
    }
    return converted;
};
// Substituir variáveis na mensagem
const substituirVariaveis = (mensagem, destinatario) => {
    return mensagem
        .replace(/%nome/gi, destinatario.nome || '')
        .replace(/%telefone/gi, destinatario.telefone || '')
        .replace(/%email/gi, destinatario.email || '')
        .replace(/%veiculo/gi, destinatario.modeloVeiculo || '')
        .replace(/%placa/gi, destinatario.placaVeiculo || '')
        .replace(/%cidade/gi, destinatario.cidade || '');
};
// Gerar ID único
const generateId = () => crypto_1.default.randomUUID();
// Listar todas as campanhas do consultor
const getCampanhas = async (req, res) => {
    try {
        const consultorId = req.user?.id;
        const { status } = req.query;
        let sql = 'SELECT * FROM campanhas_envio WHERE consultor_id = ?';
        const params = [consultorId];
        if (status) {
            sql += ' AND status = ?';
            params.push(status);
        }
        sql += ' ORDER BY data_criacao DESC';
        const result = await (0, db_helper_1.query)(sql, params);
        const campanhas = result.rows.map((row) => {
            const campanha = toCamelCase(row);
            // Parse JSON fields
            if (campanha.filtroFunil)
                campanha.filtroFunil = JSON.parse(campanha.filtroFunil);
            if (campanha.destinatarios)
                campanha.destinatarios = JSON.parse(campanha.destinatarios);
            if (campanha.mensagens)
                campanha.mensagens = JSON.parse(campanha.mensagens);
            return campanha;
        });
        res.json(campanhas);
    }
    catch (error) {
        console.error('Erro ao buscar campanhas:', error);
        res.status(500).json({ error: 'Erro ao buscar campanhas' });
    }
};
exports.getCampanhas = getCampanhas;
// Buscar uma campanha específica
const getCampanha = async (req, res) => {
    try {
        const { id } = req.params;
        const consultorId = req.user?.id;
        const result = await (0, db_helper_1.query)('SELECT * FROM campanhas_envio WHERE id = ? AND consultor_id = ?', [id, consultorId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Campanha não encontrada' });
        }
        const campanha = toCamelCase(result.rows[0]);
        if (campanha.filtroFunil)
            campanha.filtroFunil = JSON.parse(campanha.filtroFunil);
        if (campanha.destinatarios)
            campanha.destinatarios = JSON.parse(campanha.destinatarios);
        if (campanha.mensagens)
            campanha.mensagens = JSON.parse(campanha.mensagens);
        res.json(campanha);
    }
    catch (error) {
        console.error('Erro ao buscar campanha:', error);
        res.status(500).json({ error: 'Erro ao buscar campanha' });
    }
};
exports.getCampanha = getCampanha;
// Criar nova campanha
const createCampanha = async (req, res) => {
    try {
        console.log('🔍 Criando campanha...', req.body);
        console.log('👤 Usuário:', req.user);
        const consultorId = req.user?.id;
        if (!consultorId) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }
        const { titulo, filtroFunil, destinatarios, mensagens, intervaloSegundos = 3, pausarACada = 50, tempoPausaMinutos = 5, randomizarOrdem = true, pularDuplicados = true, salvarHistorico = true, notificarConclusao = true } = req.body;
        if (!titulo || !mensagens || mensagens.length === 0 || !destinatarios || destinatarios.length === 0) {
            return res.status(400).json({ error: 'Dados inválidos' });
        }
        const id = generateId();
        const totalDestinatarios = destinatarios.length;
        const tempoEstimadoMinutos = Math.ceil((totalDestinatarios * intervaloSegundos) / 60);
        await (0, db_helper_1.query)(`INSERT INTO campanhas_envio (
        id, titulo, consultor_id, status,
        filtro_funil, destinatarios, total_destinatarios,
        mensagens, usar_variaveis,
        intervalo_segundos, pausar_a_cada, tempo_pausa_minutos,
        randomizar_ordem, pular_duplicados, salvar_historico, notificar_conclusao,
        pendentes, tempo_estimado_minutos
      ) VALUES (?, ?, ?, 'rascunho', ?, ?, ?, ?, TRUE, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            id, titulo, consultorId,
            JSON.stringify(filtroFunil || []),
            JSON.stringify(destinatarios),
            totalDestinatarios,
            JSON.stringify(mensagens),
            intervaloSegundos, pausarACada, tempoPausaMinutos,
            randomizarOrdem, pularDuplicados, salvarHistorico, notificarConclusao,
            totalDestinatarios,
            tempoEstimadoMinutos
        ]);
        // Criar logs iniciais para cada destinatário
        for (const dest of destinatarios) {
            const logId = generateId();
            await (0, db_helper_1.query)(`INSERT INTO campanhas_envio_logs (
          id, campanha_id, lead_id, nome_destinatario, telefone, status
        ) VALUES (?, ?, ?, ?, ?, 'pendente')`, [logId, id, dest.id || null, dest.nome, dest.telefone]);
        }
        const campanhaResult = await (0, db_helper_1.query)('SELECT * FROM campanhas_envio WHERE id = ?', [id]);
        const campanha = toCamelCase(campanhaResult.rows[0]);
        if (campanha.destinatarios)
            campanha.destinatarios = JSON.parse(campanha.destinatarios);
        if (campanha.mensagens)
            campanha.mensagens = JSON.parse(campanha.mensagens);
        res.status(201).json(campanha);
    }
    catch (error) {
        console.error('Erro ao criar campanha:', error);
        res.status(500).json({ error: 'Erro ao criar campanha' });
    }
};
exports.createCampanha = createCampanha;
// Iniciar campanha
const iniciarCampanha = async (req, res) => {
    try {
        const { id } = req.params;
        const consultorId = req.user?.id;
        const result = await (0, db_helper_1.query)('SELECT * FROM campanhas_envio WHERE id = ? AND consultor_id = ?', [id, consultorId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Campanha não encontrada' });
        }
        const campanha = result.rows[0];
        if (campanha.status !== 'rascunho' && campanha.status !== 'pausada') {
            return res.status(400).json({ error: 'Campanha não pode ser iniciada neste status' });
        }
        await (0, db_helper_1.query)(`UPDATE campanhas_envio 
       SET status = 'em_andamento', data_inicio = NOW()
       WHERE id = ?`, [id]);
        // Iniciar processamento em background (será implementado no service)
        const { iniciarProcessamentoCampanha } = require('../services/campanhaService');
        iniciarProcessamentoCampanha(id);
        res.json({ message: 'Campanha iniciada com sucesso' });
    }
    catch (error) {
        console.error('Erro ao iniciar campanha:', error);
        res.status(500).json({ error: 'Erro ao iniciar campanha' });
    }
};
exports.iniciarCampanha = iniciarCampanha;
// Pausar campanha
const pausarCampanha = async (req, res) => {
    try {
        const { id } = req.params;
        const consultorId = req.user?.id;
        await (0, db_helper_1.query)(`UPDATE campanhas_envio 
       SET status = 'pausada'
       WHERE id = ? AND consultor_id = ? AND status = 'em_andamento'`, [id, consultorId]);
        res.json({ message: 'Campanha pausada com sucesso' });
    }
    catch (error) {
        console.error('Erro ao pausar campanha:', error);
        res.status(500).json({ error: 'Erro ao pausar campanha' });
    }
};
exports.pausarCampanha = pausarCampanha;
// Cancelar campanha
const cancelarCampanha = async (req, res) => {
    try {
        const { id } = req.params;
        const consultorId = req.user?.id;
        await (0, db_helper_1.query)(`UPDATE campanhas_envio 
       SET status = 'cancelada', data_fim = NOW()
       WHERE id = ? AND consultor_id = ?`, [id, consultorId]);
        res.json({ message: 'Campanha cancelada com sucesso' });
    }
    catch (error) {
        console.error('Erro ao cancelar campanha:', error);
        res.status(500).json({ error: 'Erro ao cancelar campanha' });
    }
};
exports.cancelarCampanha = cancelarCampanha;
// Obter logs da campanha
const getLogs = async (req, res) => {
    try {
        const { id } = req.params;
        const consultorId = req.user?.id;
        const { status } = req.query;
        // Verificar se campanha pertence ao consultor
        const campanhaResult = await (0, db_helper_1.query)('SELECT id FROM campanhas_envio WHERE id = ? AND consultor_id = ?', [id, consultorId]);
        if (campanhaResult.rows.length === 0) {
            return res.status(404).json({ error: 'Campanha não encontrada' });
        }
        let sql = 'SELECT * FROM campanhas_envio_logs WHERE campanha_id = ?';
        const params = [id];
        if (status) {
            sql += ' AND status = ?';
            params.push(status);
        }
        sql += ' ORDER BY data_criacao ASC';
        const result = await (0, db_helper_1.query)(sql, params);
        const logs = result.rows.map(toCamelCase);
        res.json(logs);
    }
    catch (error) {
        console.error('Erro ao buscar logs:', error);
        res.status(500).json({ error: 'Erro ao buscar logs' });
    }
};
exports.getLogs = getLogs;
// Obter estatísticas da campanha
const getEstatisticas = async (req, res) => {
    try {
        const { id } = req.params;
        const consultorId = req.user?.id;
        const campanhaResult = await (0, db_helper_1.query)('SELECT * FROM campanhas_envio WHERE id = ? AND consultor_id = ?', [id, consultorId]);
        if (campanhaResult.rows.length === 0) {
            return res.status(404).json({ error: 'Campanha não encontrada' });
        }
        const campanha = campanhaResult.rows[0];
        const logsResult = await (0, db_helper_1.query)(`SELECT 
        status,
        COUNT(*) as total
       FROM campanhas_envio_logs
       WHERE campanha_id = ?
       GROUP BY status`, [id]);
        const stats = {
            total: campanha.total_destinatarios,
            enviados: campanha.enviados,
            lidos: campanha.lidos,
            falhas: campanha.falhas,
            pendentes: campanha.pendentes,
            porStatus: {}
        };
        logsResult.rows.forEach((row) => {
            stats.porStatus[row.status] = row.total;
        });
        res.json(stats);
    }
    catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
};
exports.getEstatisticas = getEstatisticas;
// Deletar campanha
const deleteCampanha = async (req, res) => {
    try {
        const { id } = req.params;
        const consultorId = req.user?.id;
        await (0, db_helper_1.query)('DELETE FROM campanhas_envio WHERE id = ? AND consultor_id = ?', [id, consultorId]);
        res.json({ message: 'Campanha deletada com sucesso' });
    }
    catch (error) {
        console.error('Erro ao deletar campanha:', error);
        res.status(500).json({ error: 'Erro ao deletar campanha' });
    }
};
exports.deleteCampanha = deleteCampanha;
