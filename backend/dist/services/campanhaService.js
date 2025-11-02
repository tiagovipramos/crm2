"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pararProcessamentoCampanha = exports.iniciarProcessamentoCampanha = void 0;
const db_helper_1 = require("../config/db-helper");
const whatsappService_1 = require("./whatsappService");
// Mapa para armazenar campanhas em execução
const campanhasEmExecucao = new Map();
// Substituir variáveis na mensagem
const substituirVariaveis = (mensagem, destinatario) => {
    return mensagem
        .replace(/%nome/gi, destinatario.nome || '')
        .replace(/%telefone/gi, destinatario.telefone || '')
        .replace(/%email/gi, destinatario.email || '')
        .replace(/%veiculo/gi, destinatario.modeloVeiculo || destinatario.modelo_veiculo || '')
        .replace(/%placa/gi, destinatario.placaVeiculo || destinatario.placa_veiculo || '')
        .replace(/%cidade/gi, destinatario.cidade || '');
};
// Função para aguardar um tempo
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
// Processar campanha
const iniciarProcessamentoCampanha = async (campanhaId) => {
    console.log('🚀 Iniciando processamento da campanha:', campanhaId);
    try {
        // Buscar campanha
        const campanhaResult = await (0, db_helper_1.query)('SELECT * FROM campanhas_envio WHERE id = ?', [campanhaId]);
        if (campanhaResult.rows.length === 0) {
            console.error('❌ Campanha não encontrada:', campanhaId);
            return;
        }
        const campanha = campanhaResult.rows[0];
        const mensagens = JSON.parse(campanha.mensagens);
        const destinatarios = JSON.parse(campanha.destinatarios);
        // Buscar logs pendentes
        const logsResult = await (0, db_helper_1.query)(`SELECT * FROM campanhas_envio_logs 
       WHERE campanha_id = ? AND status = 'pendente'
       ORDER BY data_criacao ASC`, [campanhaId]);
        const logsPendentes = logsResult.rows;
        if (logsPendentes.length === 0) {
            console.log('✅ Todos os envios já foram processados');
            await finalizarCampanha(campanhaId);
            return;
        }
        console.log(`📊 ${logsPendentes.length} envios pendentes`);
        // Processar cada destinatário
        let indice = campanha.indice_atual || 0;
        let enviados = campanha.enviados || 0;
        let falhas = campanha.falhas || 0;
        let mensagensEnviadas = 0;
        for (const log of logsPendentes) {
            // Verificar se campanha foi pausada ou cancelada
            const statusResult = await (0, db_helper_1.query)('SELECT status FROM campanhas_envio WHERE id = ?', [campanhaId]);
            if (statusResult.rows[0].status !== 'em_andamento') {
                console.log('⏸️ Campanha pausada ou cancelada');
                break;
            }
            // Verificar se precisa pausar
            if (campanha.pausar_a_cada > 0 &&
                mensagensEnviadas > 0 &&
                mensagensEnviadas % campanha.pausar_a_cada === 0) {
                console.log(`⏰ Pausando por ${campanha.tempo_pausa_minutos} minutos...`);
                await sleep(campanha.tempo_pausa_minutos * 60 * 1000);
            }
            try {
                // Atualizar status para "enviando"
                await (0, db_helper_1.query)('UPDATE campanhas_envio_logs SET status = \'enviando\' WHERE id = ?', [log.id]);
                // Encontrar destinatário completo
                const destinatario = destinatarios.find((d) => d.telefone === log.telefone) || {
                    nome: log.nome_destinatario,
                    telefone: log.telefone
                };
                // Selecionar mensagem (rotação)
                const mensagemIndex = indice % mensagens.length;
                let mensagem = mensagens[mensagemIndex];
                // Substituir variáveis
                if (campanha.usar_variaveis) {
                    mensagem = substituirVariaveis(mensagem, destinatario);
                }
                // Enviar mensagem via WhatsApp
                const sock = (0, whatsappService_1.getWhatsAppInstance)();
                if (!sock) {
                    throw new Error('WhatsApp não conectado');
                }
                // Formatar telefone para WhatsApp (adicionar @s.whatsapp.net)
                let telefone = log.telefone.replace(/\D/g, '');
                if (!telefone.startsWith('55')) {
                    telefone = '55' + telefone;
                }
                const jid = telefone + '@s.whatsapp.net';
                await sock.sendMessage(jid, { text: mensagem });
                // Atualizar log como enviado
                await (0, db_helper_1.query)(`UPDATE campanhas_envio_logs 
           SET status = 'enviado', 
               mensagem_enviada = ?,
               mensagem_index = ?,
               data_envio = NOW()
           WHERE id = ?`, [mensagem, mensagemIndex, log.id]);
                enviados++;
                mensagensEnviadas++;
                console.log(`✅ Enviado ${enviados}/${logsPendentes.length} - ${destinatario.nome}`);
                // Notificar via WebSocket (será implementado)
                notificarProgresso(campanhaId, {
                    enviados,
                    total: logsPendentes.length,
                    ultimo: {
                        nome: destinatario.nome,
                        telefone: log.telefone,
                        status: 'enviado'
                    }
                });
            }
            catch (error) {
                console.error('❌ Erro ao enviar para', log.telefone, error);
                // Atualizar log como falha
                await (0, db_helper_1.query)(`UPDATE campanhas_envio_logs 
           SET status = 'falha', erro = ?
           WHERE id = ?`, [String(error), log.id]);
                falhas++;
                notificarProgresso(campanhaId, {
                    enviados,
                    falhas,
                    total: logsPendentes.length,
                    ultimo: {
                        nome: log.nome_destinatario,
                        telefone: log.telefone,
                        status: 'falha',
                        erro: String(error)
                    }
                });
            }
            // Atualizar estatísticas da campanha
            await (0, db_helper_1.query)(`UPDATE campanhas_envio 
         SET enviados = ?, 
             falhas = ?, 
             pendentes = ?,
             indice_atual = ?
         WHERE id = ?`, [enviados, falhas, logsPendentes.length - (enviados + falhas), indice, campanhaId]);
            indice++;
            // Aguardar intervalo configurado
            await sleep(campanha.intervalo_segundos * 1000);
        }
        // Verificar se terminou
        const statusFinal = await (0, db_helper_1.query)('SELECT status FROM campanhas_envio WHERE id = ?', [campanhaId]);
        if (statusFinal.rows[0].status === 'em_andamento') {
            await finalizarCampanha(campanhaId);
        }
    }
    catch (error) {
        console.error('❌ Erro ao processar campanha:', error);
        // Marcar campanha como erro
        await (0, db_helper_1.query)(`UPDATE campanhas_envio 
       SET status = 'cancelada'
       WHERE id = ?`, [campanhaId]);
    }
};
exports.iniciarProcessamentoCampanha = iniciarProcessamentoCampanha;
// Finalizar campanha
const finalizarCampanha = async (campanhaId) => {
    console.log('🏁 Finalizando campanha:', campanhaId);
    await (0, db_helper_1.query)(`UPDATE campanhas_envio 
     SET status = 'concluida', 
         data_fim = NOW(),
         pendentes = 0
     WHERE id = ?`, [campanhaId]);
    // Buscar campanha para notificação
    const campanhaResult = await (0, db_helper_1.query)('SELECT * FROM campanhas_envio WHERE id = ?', [campanhaId]);
    const campanha = campanhaResult.rows[0];
    console.log(`✅ Campanha concluída: ${campanha.enviados} enviados, ${campanha.falhas} falhas`);
    // Notificar conclusão
    notificarProgresso(campanhaId, {
        status: 'concluida',
        enviados: campanha.enviados,
        falhas: campanha.falhas,
        total: campanha.total_destinatarios
    });
};
// Notificar progresso via WebSocket (será implementado no server.ts)
const notificarProgresso = (campanhaId, dados) => {
    // Esta função será implementada com Socket.IO no server.ts
    const io = global.io;
    if (io) {
        io.to(`campanha-${campanhaId}`).emit('campanha:progresso', dados);
    }
};
// Parar processamento de campanha
const pararProcessamentoCampanha = (campanhaId) => {
    const timeout = campanhasEmExecucao.get(campanhaId);
    if (timeout) {
        clearTimeout(timeout);
        campanhasEmExecucao.delete(campanhaId);
        console.log('🛑 Processamento de campanha parado:', campanhaId);
    }
};
exports.pararProcessamentoCampanha = pararProcessamentoCampanha;
