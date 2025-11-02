"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compartilharPremio = exports.abrirLootBox = exports.getLootBoxStatus = exports.atualizarAvatar = exports.getSaques = exports.solicitarSaque = exports.getTransacoes = exports.getIndicacao = exports.deletarTodasIndicacoes = exports.getIndicacoes = exports.criarIndicacao = exports.validarWhatsApp = exports.getDashboard = exports.getMe = exports.login = exports.register = void 0;
const authIndicador_1 = require("../middleware/authIndicador");
const db_helper_1 = require("../config/db-helper");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const whatsappValidationService_1 = require("../services/whatsappValidationService");
const whatsappService_1 = require("../services/whatsappService");
// ============================================
// AUTENTICAÇÃO
// ============================================
const register = async (req, res) => {
    try {
        const { nome, email, senha, telefone, cpf } = req.body;
        // Validar campos obrigatórios
        if (!nome || !email || !senha) {
            return res.status(400).json({
                error: 'Campos obrigatórios não preenchidos',
                message: 'Nome, email e senha são obrigatórios'
            });
        }
        // Verificar se email já existe
        const emailExistente = await (0, db_helper_1.query)('SELECT id FROM indicadores WHERE email = ?', [email]);
        if (emailExistente.rows.length > 0) {
            return res.status(400).json({
                error: 'Email já cadastrado',
                message: 'Este email já está em uso'
            });
        }
        // Verificar se CPF já existe (se fornecido)
        if (cpf) {
            const cpfExistente = await (0, db_helper_1.query)('SELECT id FROM indicadores WHERE cpf = ?', [cpf]);
            if (cpfExistente.rows.length > 0) {
                return res.status(400).json({
                    error: 'CPF já cadastrado',
                    message: 'Este CPF já está em uso'
                });
            }
        }
        // Hash da senha
        const senhaHash = await bcryptjs_1.default.hash(senha, 10);
        // Criar indicador
        const result = await (0, db_helper_1.query)(`INSERT INTO indicadores (nome, email, senha, telefone, cpf, data_criacao)
       VALUES (?, ?, ?, ?, ?, NOW())`, [nome, email, senhaHash, telefone || null, cpf || null]);
        // Buscar indicador criado
        const indicadorResult = await (0, db_helper_1.query)('SELECT * FROM indicadores WHERE email = ?', [email]);
        const indicador = indicadorResult.rows[0];
        // Gerar token
        const token = (0, authIndicador_1.generateTokenIndicador)(indicador.id, indicador.email);
        res.json({
            success: true,
            token,
            indicador: {
                id: indicador.id,
                nome: indicador.nome,
                email: indicador.email,
                telefone: indicador.telefone,
                cpf: indicador.cpf,
                avatar: indicador.avatar,
                saldoDisponivel: parseFloat(indicador.saldo_disponivel || 0),
                saldoBloqueado: parseFloat(indicador.saldo_bloqueado || 0),
                saldoPerdido: parseFloat(indicador.saldo_perdido || 0),
                totalIndicacoes: indicador.total_indicacoes || 0,
                indicacoesRespondidas: indicador.indicacoes_respondidas || 0,
                indicacoesConvertidas: indicador.indicacoes_convertidas || 0,
                pixChave: indicador.pix_chave,
                pixTipo: indicador.pix_tipo,
                ativo: indicador.ativo,
                dataCriacao: indicador.data_criacao
            }
        });
    }
    catch (error) {
        console.error('Erro ao registrar indicador:', error);
        res.status(500).json({
            error: 'Erro ao registrar',
            message: 'Erro interno do servidor'
        });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, senha } = req.body;
        if (!email || !senha) {
            return res.status(400).json({
                error: 'Campos obrigatórios não preenchidos',
                message: 'Email e senha são obrigatórios'
            });
        }
        // Buscar indicador
        const result = await (0, db_helper_1.query)('SELECT * FROM indicadores WHERE email = ?', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({
                error: 'Credenciais inválidas',
                message: 'Email ou senha incorretos'
            });
        }
        const indicador = result.rows[0];
        // Verificar se está ativo
        if (!indicador.ativo) {
            return res.status(403).json({
                error: 'Conta desativada',
                message: 'Sua conta foi desativada. Entre em contato com o suporte.'
            });
        }
        // Verificar senha
        const senhaCorreta = await bcryptjs_1.default.compare(senha, indicador.senha);
        if (!senhaCorreta) {
            return res.status(401).json({
                error: 'Credenciais inválidas',
                message: 'Email ou senha incorretos'
            });
        }
        // Atualizar último acesso
        await (0, db_helper_1.query)('UPDATE indicadores SET ultimo_acesso = NOW() WHERE id = ?', [indicador.id]);
        // Gerar token
        const token = (0, authIndicador_1.generateTokenIndicador)(indicador.id, indicador.email);
        res.json({
            success: true,
            token,
            indicador: {
                id: indicador.id,
                nome: indicador.nome,
                email: indicador.email,
                telefone: indicador.telefone,
                cpf: indicador.cpf,
                avatar: indicador.avatar,
                saldoDisponivel: parseFloat(indicador.saldo_disponivel || 0),
                saldoBloqueado: parseFloat(indicador.saldo_bloqueado || 0),
                saldoPerdido: parseFloat(indicador.saldo_perdido || 0),
                totalIndicacoes: indicador.total_indicacoes || 0,
                indicacoesRespondidas: indicador.indicacoes_respondidas || 0,
                indicacoesConvertidas: indicador.indicacoes_convertidas || 0,
                pixChave: indicador.pix_chave,
                pixTipo: indicador.pix_tipo,
                ativo: indicador.ativo,
                dataCriacao: indicador.data_criacao,
                ultimoAcesso: indicador.ultimo_acesso
            }
        });
    }
    catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({
            error: 'Erro ao fazer login',
            message: 'Erro interno do servidor'
        });
    }
};
exports.login = login;
const getMe = async (req, res) => {
    try {
        const indicadorId = req.indicadorId;
        const result = await (0, db_helper_1.query)('SELECT * FROM indicadores WHERE id = ?', [indicadorId]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Indicador não encontrado',
                message: 'Indicador não encontrado'
            });
        }
        const indicador = result.rows[0];
        res.json({
            id: indicador.id,
            nome: indicador.nome,
            email: indicador.email,
            telefone: indicador.telefone,
            cpf: indicador.cpf,
            saldoDisponivel: parseFloat(indicador.saldo_disponivel || 0),
            saldoBloqueado: parseFloat(indicador.saldo_bloqueado || 0),
            saldoPerdido: parseFloat(indicador.saldo_perdido || 0),
            totalIndicacoes: indicador.total_indicacoes || 0,
            indicacoesRespondidas: indicador.indicacoes_respondidas || 0,
            indicacoesConvertidas: indicador.indicacoes_convertidas || 0,
            pixChave: indicador.pix_chave,
            pixTipo: indicador.pix_tipo,
            ativo: indicador.ativo,
            dataCriacao: indicador.data_criacao,
            ultimoAcesso: indicador.ultimo_acesso
        });
    }
    catch (error) {
        console.error('Erro ao buscar indicador:', error);
        res.status(500).json({
            error: 'Erro ao buscar dados',
            message: 'Erro interno do servidor'
        });
    }
};
exports.getMe = getMe;
// ============================================
// DASHBOARD
// ============================================
const getDashboard = async (req, res) => {
    try {
        const indicadorId = req.indicadorId;
        // Buscar dados do indicador
        const indicadorResult = await (0, db_helper_1.query)('SELECT * FROM indicadores WHERE id = ?', [indicadorId]);
        if (indicadorResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Indicador não encontrado'
            });
        }
        const indicador = indicadorResult.rows[0];
        // Buscar estatísticas de indicações
        const estatisticasResult = await (0, db_helper_1.query)(`SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pendente' THEN 1 ELSE 0 END) as pendentes,
        SUM(CASE WHEN status = 'enviado_crm' THEN 1 ELSE 0 END) as enviadas,
        SUM(CASE WHEN status = 'respondeu' THEN 1 ELSE 0 END) as respondidas,
        SUM(CASE WHEN status = 'converteu' THEN 1 ELSE 0 END) as convertidas,
        SUM(CASE WHEN status = 'engano' THEN 1 ELSE 0 END) as engano
       FROM indicacoes 
       WHERE indicador_id = ?`, [indicadorId]);
        const stats = estatisticasResult.rows[0];
        const totalIndicacoes = parseInt(stats.total) || 0;
        const indicacoesRespondidas = parseInt(stats.respondidas) || 0;
        const indicacoesConvertidas = parseInt(stats.convertidas) || 0;
        // Calcular taxas
        const taxaResposta = totalIndicacoes > 0
            ? (indicacoesRespondidas / totalIndicacoes * 100).toFixed(2)
            : 0;
        const taxaConversao = indicacoesRespondidas > 0
            ? (indicacoesConvertidas / indicacoesRespondidas * 100).toFixed(2)
            : 0;
        // Buscar indicações recentes
        const indicacoesRecentes = await (0, db_helper_1.query)(`SELECT 
        ind.*,
        l.nome as lead_nome,
        l.status as lead_status,
        c.nome as consultor_nome
       FROM indicacoes ind
       LEFT JOIN leads l ON ind.lead_id = l.id
       LEFT JOIN consultores c ON l.consultor_id = c.id
       WHERE ind.indicador_id = ?
       ORDER BY ind.data_indicacao DESC
       LIMIT 10`, [indicadorId]);
        // Buscar transações recentes
        const transacoesRecentes = await (0, db_helper_1.query)(`SELECT * FROM transacoes_indicador
       WHERE indicador_id = ?
       ORDER BY data_transacao DESC
       LIMIT 10`, [indicadorId]);
        res.json({
            indicador: {
                id: indicador.id,
                nome: indicador.nome,
                email: indicador.email,
                avatar: indicador.avatar,
                saldoDisponivel: parseFloat(indicador.saldo_disponivel || 0),
                saldoBloqueado: parseFloat(indicador.saldo_bloqueado || 0),
                saldoPerdido: parseFloat(indicador.saldo_perdido || 0),
                totalIndicacoes: indicador.total_indicacoes || 0,
                indicacoesRespondidas: indicador.indicacoes_respondidas || 0,
                indicacoesConvertidas: indicador.indicacoes_convertidas || 0
            },
            saldos: {
                disponivel: parseFloat(indicador.saldo_disponivel || 0),
                bloqueado: parseFloat(indicador.saldo_bloqueado || 0),
                perdido: parseFloat(indicador.saldo_perdido || 0),
                total: parseFloat(indicador.saldo_disponivel || 0) + parseFloat(indicador.saldo_bloqueado || 0)
            },
            estatisticas: {
                totalIndicacoes,
                indicacoesRespondidas,
                indicacoesConvertidas,
                indicacoesPendentes: parseInt(stats.pendentes) || 0,
                indicacoesEngano: parseInt(stats.engano) || 0,
                taxaResposta: parseFloat(taxaResposta.toString()),
                taxaConversao: parseFloat(taxaConversao.toString())
            },
            indicacoesRecentes: indicacoesRecentes.rows.map((ind) => ({
                id: ind.id,
                nomeIndicado: ind.nome_indicado,
                telefoneIndicado: ind.telefone_indicado,
                status: ind.status,
                comissaoResposta: parseFloat(ind.comissao_resposta || 0),
                comissaoVenda: parseFloat(ind.comissao_venda || 0),
                dataIndicacao: ind.data_indicacao,
                dataResposta: ind.data_resposta,
                dataConversao: ind.data_conversao,
                leadNome: ind.lead_nome,
                leadStatus: ind.lead_status,
                consultorNome: ind.consultor_nome
            })),
            transacoesRecentes: transacoesRecentes.rows.map((trans) => ({
                id: trans.id,
                tipo: trans.tipo,
                valor: parseFloat(trans.valor || 0),
                saldoAnterior: parseFloat(trans.saldo_anterior || 0),
                saldoNovo: parseFloat(trans.saldo_novo || 0),
                descricao: trans.descricao,
                dataTransacao: trans.data_transacao
            }))
        });
    }
    catch (error) {
        console.error('Erro ao buscar dashboard:', error);
        res.status(500).json({
            error: 'Erro ao buscar dashboard',
            message: 'Erro interno do servidor'
        });
    }
};
exports.getDashboard = getDashboard;
// ============================================
// VALIDAÇÃO DE WHATSAPP
// ============================================
const validarWhatsApp = async (req, res) => {
    try {
        const { telefone } = req.body;
        if (!telefone) {
            return res.status(400).json({
                error: 'Telefone não fornecido',
                message: 'O telefone é obrigatório'
            });
        }
        // Validar usando o serviço
        const resultado = await whatsappValidationService_1.whatsappValidationService.validarComCache(telefone);
        res.json(resultado);
    }
    catch (error) {
        console.error('Erro ao validar WhatsApp:', error);
        res.status(500).json({
            error: 'Erro ao validar WhatsApp',
            message: 'Erro interno do servidor'
        });
    }
};
exports.validarWhatsApp = validarWhatsApp;
// ============================================
// INDICAÇÕES
// ============================================
const criarIndicacao = async (req, res) => {
    try {
        const indicadorId = req.indicadorId;
        const { nomeIndicado, telefoneIndicado } = req.body;
        if (!nomeIndicado || !telefoneIndicado) {
            return res.status(400).json({
                error: 'Campos obrigatórios não preenchidos',
                message: 'Nome e telefone são obrigatórios'
            });
        }
        // Validar WhatsApp
        const validacao = await whatsappValidationService_1.whatsappValidationService.validarComCache(telefoneIndicado);
        if (!validacao.valido) {
            return res.status(400).json({
                error: 'Telefone inválido',
                message: validacao.mensagem
            });
        }
        // Verificar se o telefone já foi indicado por este indicador
        const indicacaoExistente = await (0, db_helper_1.query)(`SELECT id FROM indicacoes 
       WHERE indicador_id = ? AND telefone_indicado = ?`, [indicadorId, validacao.telefone]);
        if (indicacaoExistente.rows.length > 0) {
            return res.status(400).json({
                error: 'ESSE CONTATO JÁ FOI INDICADO.',
                message: 'ESSE CONTATO JÁ FOI INDICADO.'
            });
        }
        // Criar indicação
        const result = await (0, db_helper_1.query)(`INSERT INTO indicacoes (
        indicador_id, nome_indicado, telefone_indicado, 
        whatsapp_validado, status, data_indicacao, data_validacao_whatsapp
      ) VALUES (?, ?, ?, ?, 'pendente', NOW(), NOW())`, [indicadorId, nomeIndicado, validacao.telefone, validacao.existe]);
        // Buscar indicação criada
        const indicacaoResult = await (0, db_helper_1.query)('SELECT * FROM indicacoes WHERE indicador_id = ? AND telefone_indicado = ? ORDER BY data_indicacao DESC LIMIT 1', [indicadorId, validacao.telefone]);
        const indicacao = indicacaoResult.rows[0];
        // Bloquear comissão de R$ 2,00 e incrementar contador de leads para loot box
        await (0, db_helper_1.query)(`UPDATE indicadores 
       SET saldo_bloqueado = saldo_bloqueado + 2.00,
           total_indicacoes = total_indicacoes + 1,
           leads_para_proxima_caixa = leads_para_proxima_caixa + 1
       WHERE id = ?`, [indicadorId]);
        // Registrar transação de bloqueio
        await (0, db_helper_1.query)(`INSERT INTO transacoes_indicador (
        indicador_id, indicacao_id, tipo, valor, saldo_anterior, saldo_novo, descricao
      ) SELECT 
        ?, ?, 'bloqueio', 2.00, saldo_bloqueado - 2.00, saldo_bloqueado,
        'Comissão bloqueada aguardando resposta do lead'
       FROM indicadores WHERE id = ?`, [indicadorId, indicacao.id, indicadorId]);
        // Buscar o primeiro consultor disponível para atribuir o lead (com nome e status de conexão)
        const consultorResult = await (0, db_helper_1.query)('SELECT id, nome, status_conexao FROM consultores ORDER BY data_criacao ASC LIMIT 1');
        let leadCriado = false;
        let mensagem = 'Indicação criada com sucesso!';
        // Se houver consultores, criar o lead automaticamente
        if (consultorResult.rows.length > 0) {
            const consultorId = consultorResult.rows[0].id;
            const consultorNome = consultorResult.rows[0].nome;
            const statusConexao = consultorResult.rows[0].status_conexao;
            // Criar lead no CRM automaticamente no kanban "Indicação"
            await (0, db_helper_1.query)(`INSERT INTO leads (
          nome, telefone, origem, status, mensagens_nao_lidas, 
          consultor_id, indicador_id, indicacao_id, data_criacao, data_atualizacao
        ) VALUES (?, ?, 'Indicação', 'indicacao', 0, ?, ?, ?, NOW(), NOW())`, [nomeIndicado, validacao.telefone, consultorId, indicadorId, indicacao.id]);
            // Atualizar indicação com lead_id e status
            const leadResult = await (0, db_helper_1.query)('SELECT id FROM leads WHERE indicacao_id = ? ORDER BY data_criacao DESC LIMIT 1', [indicacao.id]);
            if (leadResult.rows.length > 0) {
                await (0, db_helper_1.query)('UPDATE indicacoes SET lead_id = ?, status = ? WHERE id = ?', [leadResult.rows[0].id, 'enviado_crm', indicacao.id]);
                // 🔥 Emitir evento Socket.IO para o consultor sobre o novo lead
                const io = global.io;
                if (io) {
                    console.log(`📡 Emitindo evento 'novo_lead' para consultor ${consultorId}`);
                    io.to(`consultor_${consultorId}`).emit('novo_lead', {
                        leadId: leadResult.rows[0].id,
                        nome: nomeIndicado,
                        telefone: validacao.telefone,
                        origem: 'Indicação',
                        status: 'indicacao',
                        consultorId: consultorId,
                        indicadorId: indicadorId,
                        timestamp: new Date().toISOString()
                    });
                    console.log('✅ Evento Socket.IO emitido com sucesso');
                }
                else {
                    console.warn('⚠️ Socket.IO não disponível para emitir evento');
                }
                // 📱 Enviar mensagem automática de boas-vindas via WhatsApp
                if (statusConexao === 'online') {
                    try {
                        // Buscar nome do indicador
                        const indicadorResult = await (0, db_helper_1.query)('SELECT nome FROM indicadores WHERE id = ?', [indicadorId]);
                        const indicadorNome = indicadorResult.rows[0]?.nome || 'um parceiro';
                        // Montar mensagem personalizada
                        const mensagemBoasVindas = `Olá, tudo bem? Meu nome é ${consultorNome} e recebi seu contato através do ${indicadorNome}. Seria para fazer a cotação do seu seguro.`;
                        // 🔧 Garantir formato correto do número (55 + DDD + número)
                        let numeroFormatado = validacao.telefone.replace(/\D/g, '');
                        // Se não começa com 55, adicionar
                        if (!numeroFormatado.startsWith('55')) {
                            numeroFormatado = '55' + numeroFormatado;
                        }
                        // Verificar se tem o dígito 9 após o DDD (celulares)
                        // Formato esperado: 55 + DDD (2 dígitos) + 9 + 8 dígitos = 13 dígitos
                        if (numeroFormatado.length === 12) {
                            // Falta o 9, adicionar após o DDD
                            numeroFormatado = numeroFormatado.slice(0, 4) + '9' + numeroFormatado.slice(4);
                        }
                        console.log('📱 Número formatado para envio:', numeroFormatado);
                        console.log('📏 Comprimento:', numeroFormatado.length, 'dígitos');
                        if (numeroFormatado.length !== 13) {
                            console.warn('⚠️ AVISO: Número pode estar em formato incorreto!');
                            console.warn('⚠️ Formato esperado: 5581988040121 (13 dígitos)');
                        }
                        console.log(`📤 Enviando mensagem automática de boas-vindas...`);
                        // Enviar mensagem via WhatsApp
                        await whatsappService_1.whatsappService.enviarMensagem(consultorId, numeroFormatado, mensagemBoasVindas);
                        console.log('✅ Mensagem de boas-vindas enviada com sucesso!');
                        mensagem = 'Indicação criada com sucesso! O lead foi enviado para o CRM e recebeu uma mensagem de boas-vindas.';
                    }
                    catch (whatsappError) {
                        console.error('⚠️ Erro ao enviar mensagem de boas-vindas:', whatsappError);
                        console.error('📋 Detalhes do erro:', {
                            message: whatsappError.message,
                            stack: whatsappError.stack
                        });
                        // Não bloquear a criação da indicação se o WhatsApp falhar
                        mensagem = 'Indicação criada com sucesso! O lead foi enviado para o CRM.';
                    }
                }
                else {
                    console.log('⚠️ WhatsApp do consultor não está conectado. Mensagem de boas-vindas não será enviada.');
                    mensagem = 'Indicação criada com sucesso! O lead foi enviado para o CRM.';
                }
            }
            leadCriado = true;
            if (!mensagem.includes('boas-vindas')) {
                mensagem = 'Indicação criada com sucesso! O lead foi enviado para o CRM.';
            }
        }
        else {
            // Se não houver consultores, manter indicação como pendente
            console.warn('Aviso: Nenhum consultor disponível. Indicação criada mas lead não foi gerado.');
            mensagem = 'Indicação criada com sucesso! Aguardando disponibilidade de consultores para envio ao CRM.';
        }
        res.json({
            success: true,
            message: mensagem,
            indicacao: {
                id: indicacao.id,
                nomeIndicado: indicacao.nome_indicado,
                telefoneIndicado: indicacao.telefone_indicado,
                status: leadCriado ? 'enviado_crm' : 'pendente',
                dataIndicacao: indicacao.data_indicacao
            }
        });
    }
    catch (error) {
        console.error('Erro ao criar indicação:', error);
        res.status(500).json({
            error: 'Erro ao criar indicação',
            message: 'Erro interno do servidor'
        });
    }
};
exports.criarIndicacao = criarIndicacao;
const getIndicacoes = async (req, res) => {
    try {
        const indicadorId = req.indicadorId;
        const { status, limit = 50, offset = 0 } = req.query;
        let whereClause = 'WHERE ind.indicador_id = ?';
        const params = [indicadorId];
        if (status) {
            whereClause += ' AND ind.status = ?';
            params.push(status);
        }
        const result = await (0, db_helper_1.query)(`SELECT 
        ind.*,
        l.nome as lead_nome,
        l.status as lead_status,
        c.nome as consultor_nome
       FROM indicacoes ind
       LEFT JOIN leads l ON ind.lead_id = l.id
       LEFT JOIN consultores c ON l.consultor_id = c.id
       ${whereClause}
       ORDER BY ind.data_indicacao DESC
       LIMIT ? OFFSET ?`, [...params, parseInt(limit), parseInt(offset)]);
        const indicacoes = result.rows.map((ind) => ({
            id: ind.id,
            nomeIndicado: ind.nome_indicado,
            telefoneIndicado: ind.telefone_indicado,
            whatsappValidado: ind.whatsapp_validado,
            status: ind.status,
            comissaoResposta: parseFloat(ind.comissao_resposta || 0),
            comissaoVenda: parseFloat(ind.comissao_venda || 0),
            dataIndicacao: ind.data_indicacao,
            dataResposta: ind.data_resposta,
            dataConversao: ind.data_conversao,
            leadNome: ind.lead_nome,
            leadStatus: ind.lead_status,
            consultorNome: ind.consultor_nome
        }));
        res.json(indicacoes);
    }
    catch (error) {
        console.error('Erro ao buscar indicações:', error);
        res.status(500).json({
            error: 'Erro ao buscar indicações',
            message: 'Erro interno do servidor'
        });
    }
};
exports.getIndicacoes = getIndicacoes;
const deletarTodasIndicacoes = async (req, res) => {
    try {
        const indicadorId = req.indicadorId;
        // Buscar todas as indicações do indicador
        const indicacoesResult = await (0, db_helper_1.query)('SELECT id FROM indicacoes WHERE indicador_id = ?', [indicadorId]);
        const totalIndicacoes = indicacoesResult.rows.length;
        if (totalIndicacoes === 0) {
            return res.status(404).json({
                error: 'Nenhuma indicação encontrada',
                message: 'Você não tem indicações para apagar'
            });
        }
        // 1. Primeiro, remover as referências nos leads (indicador_id e indicacao_id)
        await (0, db_helper_1.query)('UPDATE leads SET indicador_id = NULL, indicacao_id = NULL WHERE indicador_id = ?', [indicadorId]);
        // 2. Deletar todas as transações relacionadas
        await (0, db_helper_1.query)('DELETE FROM transacoes_indicador WHERE indicador_id = ?', [indicadorId]);
        // 3. Deletar todas as indicações
        await (0, db_helper_1.query)('DELETE FROM indicacoes WHERE indicador_id = ?', [indicadorId]);
        // 4. Resetar saldos e contadores do indicador
        await (0, db_helper_1.query)(`UPDATE indicadores 
       SET saldo_disponivel = 0,
           saldo_bloqueado = 0,
           saldo_perdido = 0,
           total_indicacoes = 0,
           indicacoes_respondidas = 0,
           indicacoes_convertidas = 0
       WHERE id = ?`, [indicadorId]);
        // 5. Emitir evento Socket.IO para atualizar dashboard em tempo real
        const io = global.io;
        if (io) {
            console.log(`📡 Emitindo evento 'indicacoes_deletadas' para indicador ${indicadorId}`);
            io.to(`indicador_${indicadorId}`).emit('indicacoes_deletadas', {
                indicadorId,
                totalDeletadas: totalIndicacoes,
                timestamp: new Date().toISOString()
            });
        }
        res.json({
            success: true,
            message: `${totalIndicacoes} indicação(ões) deletada(s) com sucesso!`,
            totalDeletadas: totalIndicacoes
        });
    }
    catch (error) {
        console.error('Erro ao deletar todas as indicações:', error);
        res.status(500).json({
            error: 'Erro ao deletar indicações',
            message: 'Erro interno do servidor'
        });
    }
};
exports.deletarTodasIndicacoes = deletarTodasIndicacoes;
const getIndicacao = async (req, res) => {
    try {
        const indicadorId = req.indicadorId;
        const { id } = req.params;
        const result = await (0, db_helper_1.query)(`SELECT 
        ind.*,
        l.nome as lead_nome,
        l.status as lead_status,
        l.email as lead_email,
        c.nome as consultor_nome,
        c.email as consultor_email
       FROM indicacoes ind
       LEFT JOIN leads l ON ind.lead_id = l.id
       LEFT JOIN consultores c ON l.consultor_id = c.id
       WHERE ind.id = ? AND ind.indicador_id = ?`, [id, indicadorId]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Indicação não encontrada'
            });
        }
        const ind = result.rows[0];
        res.json({
            id: ind.id,
            nomeIndicado: ind.nome_indicado,
            telefoneIndicado: ind.telefone_indicado,
            whatsappValidado: ind.whatsapp_validado,
            status: ind.status,
            comissaoResposta: parseFloat(ind.comissao_resposta || 0),
            comissaoVenda: parseFloat(ind.comissao_venda || 0),
            dataIndicacao: ind.data_indicacao,
            dataResposta: ind.data_resposta,
            dataConversao: ind.data_conversao,
            dataValidacaoWhatsapp: ind.data_validacao_whatsapp,
            leadNome: ind.lead_nome,
            leadStatus: ind.lead_status,
            leadEmail: ind.lead_email,
            consultorNome: ind.consultor_nome,
            consultorEmail: ind.consultor_email
        });
    }
    catch (error) {
        console.error('Erro ao buscar indicação:', error);
        res.status(500).json({
            error: 'Erro ao buscar indicação',
            message: 'Erro interno do servidor'
        });
    }
};
exports.getIndicacao = getIndicacao;
// ============================================
// TRANSAÇÕES
// ============================================
const getTransacoes = async (req, res) => {
    try {
        const indicadorId = req.indicadorId;
        const { limit = 50, offset = 0 } = req.query;
        const result = await (0, db_helper_1.query)(`SELECT * FROM transacoes_indicador
       WHERE indicador_id = ?
       ORDER BY data_transacao DESC
       LIMIT ? OFFSET ?`, [indicadorId, parseInt(limit), parseInt(offset)]);
        const transacoes = result.rows.map((trans) => ({
            id: trans.id,
            indicacaoId: trans.indicacao_id,
            tipo: trans.tipo,
            valor: parseFloat(trans.valor || 0),
            saldoAnterior: parseFloat(trans.saldo_anterior || 0),
            saldoNovo: parseFloat(trans.saldo_novo || 0),
            descricao: trans.descricao,
            dataTransacao: trans.data_transacao
        }));
        res.json(transacoes);
    }
    catch (error) {
        console.error('Erro ao buscar transações:', error);
        res.status(500).json({
            error: 'Erro ao buscar transações',
            message: 'Erro interno do servidor'
        });
    }
};
exports.getTransacoes = getTransacoes;
// ============================================
// SAQUES
// ============================================
const solicitarSaque = async (req, res) => {
    try {
        const indicadorId = req.indicadorId;
        const { valor, pixChave, pixTipo } = req.body;
        if (!valor || !pixChave || !pixTipo) {
            return res.status(400).json({
                error: 'Campos obrigatórios não preenchidos',
                message: 'Valor, chave PIX e tipo são obrigatórios'
            });
        }
        const valorNum = parseFloat(valor);
        if (valorNum <= 0) {
            return res.status(400).json({
                error: 'Valor inválido',
                message: 'O valor deve ser maior que zero'
            });
        }
        // Verificar saldo disponível
        const indicadorResult = await (0, db_helper_1.query)('SELECT saldo_disponivel FROM indicadores WHERE id = ?', [indicadorId]);
        const saldoDisponivel = parseFloat(indicadorResult.rows[0].saldo_disponivel || 0);
        if (valorNum > saldoDisponivel) {
            return res.status(400).json({
                error: 'Saldo insuficiente',
                message: `Você tem apenas R$ ${saldoDisponivel.toFixed(2)} disponível para saque`
            });
        }
        // Criar solicitação de saque
        await (0, db_helper_1.query)(`INSERT INTO saques_indicador (
        indicador_id, valor, pix_chave, pix_tipo, status, data_solicitacao
      ) VALUES (?, ?, ?, ?, 'solicitado', NOW())`, [indicadorId, valorNum, pixChave, pixTipo]);
        // Descontar do saldo disponível
        await (0, db_helper_1.query)(`UPDATE indicadores 
       SET saldo_disponivel = saldo_disponivel - ?
       WHERE id = ?`, [valorNum, indicadorId]);
        // Registrar transação
        await (0, db_helper_1.query)(`INSERT INTO transacoes_indicador (
        indicador_id, tipo, valor, saldo_anterior, saldo_novo, descricao
      ) SELECT 
        ?, 'saque', ?, saldo_disponivel + ?, saldo_disponivel,
        CONCAT('Saque solicitado via PIX: ', ?)
       FROM indicadores WHERE id = ?`, [indicadorId, valorNum, valorNum, pixChave, indicadorId]);
        res.json({
            success: true,
            message: 'Saque solicitado com sucesso! Aguarde a aprovação.'
        });
    }
    catch (error) {
        console.error('Erro ao solicitar saque:', error);
        res.status(500).json({
            error: 'Erro ao solicitar saque',
            message: 'Erro interno do servidor'
        });
    }
};
exports.solicitarSaque = solicitarSaque;
const getSaques = async (req, res) => {
    try {
        const indicadorId = req.indicadorId;
        const result = await (0, db_helper_1.query)(`SELECT * FROM saques_indicador
       WHERE indicador_id = ?
       ORDER BY data_solicitacao DESC`, [indicadorId]);
        const saques = result.rows.map((saque) => ({
            id: saque.id,
            valor: parseFloat(saque.valor || 0),
            pixChave: saque.pix_chave,
            pixTipo: saque.pix_tipo,
            status: saque.status,
            comprovanteUrl: saque.comprovante_url,
            dataSolicitacao: saque.data_solicitacao,
            dataPagamento: saque.data_pagamento,
            observacoes: saque.observacoes
        }));
        res.json(saques);
    }
    catch (error) {
        console.error('Erro ao buscar saques:', error);
        res.status(500).json({
            error: 'Erro ao buscar saques',
            message: 'Erro interno do servidor'
        });
    }
};
exports.getSaques = getSaques;
// ============================================
// AVATAR
// ============================================
const atualizarAvatar = async (req, res) => {
    try {
        const indicadorId = req.indicadorId;
        const { avatar } = req.body;
        if (!avatar) {
            return res.status(400).json({
                error: 'Avatar não fornecido',
                message: 'O avatar é obrigatório'
            });
        }
        // Verificar se é uma string base64 válida
        if (!avatar.startsWith('data:image/')) {
            return res.status(400).json({
                error: 'Formato inválido',
                message: 'O avatar deve estar em formato base64'
            });
        }
        // Atualizar avatar no banco de dados
        await (0, db_helper_1.query)('UPDATE indicadores SET avatar = ? WHERE id = ?', [avatar, indicadorId]);
        res.json({
            success: true,
            message: 'Avatar atualizado com sucesso!',
            avatar
        });
    }
    catch (error) {
        console.error('Erro ao atualizar avatar:', error);
        res.status(500).json({
            error: 'Erro ao atualizar avatar',
            message: 'Erro interno do servidor'
        });
    }
};
exports.atualizarAvatar = atualizarAvatar;
// ============================================
// LOOT BOX / CAIXA MISTERIOSA
// ============================================
const getLootBoxStatus = async (req, res) => {
    try {
        const indicadorId = req.indicadorId;
        // Buscar status atual do indicador
        const indicadorResult = await (0, db_helper_1.query)(`SELECT leads_para_proxima_caixa, total_caixas_abertas, total_ganho_caixas,
              vendas_para_proxima_caixa, total_caixas_vendas_abertas, total_ganho_caixas_vendas
       FROM indicadores WHERE id = ?`, [indicadorId]);
        if (indicadorResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Indicador não encontrado'
            });
        }
        const indicador = indicadorResult.rows[0];
        const leadsParaProximaCaixa = indicador.leads_para_proxima_caixa || 0;
        const vendasParaProximaCaixa = indicador.vendas_para_proxima_caixa || 0;
        const podeAbrirIndicacoes = leadsParaProximaCaixa >= 10;
        const podeAbrirVendas = vendasParaProximaCaixa >= 5;
        // Buscar histórico recente
        const historicoResult = await (0, db_helper_1.query)(`SELECT * FROM lootbox_historico
       WHERE indicador_id = ?
       ORDER BY data_abertura DESC
       LIMIT 10`, [indicadorId]);
        res.json({
            leadsParaProximaCaixa,
            leadsNecessarios: 10,
            podeAbrirIndicacoes,
            vendasParaProximaCaixa,
            vendasNecessarias: 5,
            podeAbrirVendas,
            totalCaixasAbertas: indicador.total_caixas_abertas || 0,
            totalGanhoCaixas: parseFloat(indicador.total_ganho_caixas || 0),
            totalCaixasVendasAbertas: indicador.total_caixas_vendas_abertas || 0,
            totalGanhoCaixasVendas: parseFloat(indicador.total_ganho_caixas_vendas || 0),
            historico: historicoResult.rows.map((h) => ({
                id: h.id,
                premioValor: parseFloat(h.premio_valor),
                premioTipo: h.premio_tipo,
                leadsAcumulados: h.leads_acumulados,
                dataAbertura: h.data_abertura,
                compartilhado: h.compartilhado
            }))
        });
    }
    catch (error) {
        console.error('Erro ao buscar status da loot box:', error);
        res.status(500).json({
            error: 'Erro ao buscar status',
            message: 'Erro interno do servidor'
        });
    }
};
exports.getLootBoxStatus = getLootBoxStatus;
const abrirLootBox = async (req, res) => {
    try {
        const indicadorId = req.indicadorId;
        // Buscar status atual do indicador
        const indicadorResult = await (0, db_helper_1.query)(`SELECT leads_para_proxima_caixa, saldo_disponivel
       FROM indicadores WHERE id = ?`, [indicadorId]);
        if (indicadorResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Indicador não encontrado'
            });
        }
        const indicador = indicadorResult.rows[0];
        const leadsParaProximaCaixa = indicador.leads_para_proxima_caixa || 0;
        // Verificar se pode abrir
        if (leadsParaProximaCaixa < 10) {
            return res.status(400).json({
                error: 'Leads insuficientes',
                message: `Você precisa de ${10 - leadsParaProximaCaixa} leads para abrir uma caixa`
            });
        }
        // Buscar prêmios disponíveis
        const premiosResult = await (0, db_helper_1.query)('SELECT * FROM lootbox_premios WHERE ativo = TRUE');
        if (premiosResult.rows.length === 0) {
            return res.status(500).json({
                error: 'Sem prêmios disponíveis',
                message: 'Não há prêmios configurados no sistema'
            });
        }
        // Sortear prêmio baseado no peso
        const premios = premiosResult.rows;
        const pesoTotal = premios.reduce((sum, p) => sum + p.peso, 0);
        let random = Math.random() * pesoTotal;
        let premioSorteado = premios[0];
        for (const premio of premios) {
            random -= premio.peso;
            if (random <= 0) {
                premioSorteado = premio;
                break;
            }
        }
        // Adicionar prêmio ao saldo disponível
        await (0, db_helper_1.query)(`UPDATE indicadores 
       SET saldo_disponivel = saldo_disponivel + ?,
           leads_para_proxima_caixa = leads_para_proxima_caixa - 10,
           total_caixas_abertas = total_caixas_abertas + 1,
           total_ganho_caixas = total_ganho_caixas + ?
       WHERE id = ?`, [premioSorteado.valor, premioSorteado.valor, indicadorId]);
        // Registrar no histórico
        const historicoResult = await (0, db_helper_1.query)(`INSERT INTO lootbox_historico (
        indicador_id, premio_valor, premio_tipo, leads_acumulados, data_abertura
      ) VALUES (?, ?, ?, ?, NOW())`, [indicadorId, premioSorteado.valor, premioSorteado.tipo, leadsParaProximaCaixa]);
        // Registrar transação
        await (0, db_helper_1.query)(`INSERT INTO transacoes_indicador (
        indicador_id, tipo, valor, saldo_anterior, saldo_novo, descricao
      ) SELECT 
        ?, 'lootbox', ?, saldo_disponivel - ?, saldo_disponivel,
        ?
       FROM indicadores WHERE id = ?`, [
            indicadorId,
            premioSorteado.valor,
            premioSorteado.valor,
            `🎁 Prêmio da Caixa Misteriosa ${premioSorteado.emoji}`,
            indicadorId
        ]);
        // Emitir evento Socket.IO
        const io = global.io;
        if (io) {
            io.to(`indicador_${indicadorId}`).emit('lootbox_aberta', {
                premio: {
                    valor: parseFloat(premioSorteado.valor),
                    tipo: premioSorteado.tipo,
                    emoji: premioSorteado.emoji,
                    cor: premioSorteado.cor_hex
                },
                novoSaldo: parseFloat(indicador.saldo_disponivel) + parseFloat(premioSorteado.valor),
                timestamp: new Date().toISOString()
            });
        }
        res.json({
            success: true,
            premio: {
                id: historicoResult.insertId,
                valor: parseFloat(premioSorteado.valor),
                tipo: premioSorteado.tipo,
                emoji: premioSorteado.emoji,
                cor: premioSorteado.cor_hex
            },
            novoSaldo: parseFloat(indicador.saldo_disponivel) + parseFloat(premioSorteado.valor),
            leadsRestantes: leadsParaProximaCaixa - 10
        });
    }
    catch (error) {
        console.error('Erro ao abrir loot box:', error);
        res.status(500).json({
            error: 'Erro ao abrir caixa',
            message: 'Erro interno do servidor'
        });
    }
};
exports.abrirLootBox = abrirLootBox;
const compartilharPremio = async (req, res) => {
    try {
        const indicadorId = req.indicadorId;
        const { lootboxId } = req.body;
        if (!lootboxId) {
            return res.status(400).json({
                error: 'ID da loot box não fornecido'
            });
        }
        // Verificar se a loot box existe e pertence ao indicador
        const lootboxResult = await (0, db_helper_1.query)(`SELECT * FROM lootbox_historico 
       WHERE id = ? AND indicador_id = ?`, [lootboxId, indicadorId]);
        if (lootboxResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Prêmio não encontrado'
            });
        }
        // Marcar como compartilhado
        await (0, db_helper_1.query)(`UPDATE lootbox_historico 
       SET compartilhado = TRUE, data_compartilhamento = NOW()
       WHERE id = ?`, [lootboxId]);
        res.json({
            success: true,
            message: 'Compartilhamento registrado!'
        });
    }
    catch (error) {
        console.error('Erro ao registrar compartilhamento:', error);
        res.status(500).json({
            error: 'Erro ao registrar compartilhamento',
            message: 'Erro interno do servidor'
        });
    }
};
exports.compartilharPremio = compartilharPremio;
