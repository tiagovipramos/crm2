"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTempoMedioResposta = void 0;
const db_helper_1 = require("../config/db-helper");
const getTempoMedioResposta = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Não autenticado' });
        }
        // Buscar leads do consultor
        const leadsResult = await (0, db_helper_1.query)('SELECT id FROM leads WHERE consultor_id = ?', [userId]);
        if (leadsResult.rows.length === 0) {
            return res.json({ tempoMedio: '0', unidade: 'min' });
        }
        const leadIds = leadsResult.rows.map((row) => row.id);
        let totalTempoResposta = 0;
        let totalLeadsComResposta = 0;
        // Para cada lead, calcular tempo de resposta
        for (const leadId of leadIds) {
            // Buscar primeira mensagem do lead
            const primeiraMensagemLead = await (0, db_helper_1.query)(`SELECT timestamp FROM mensagens 
         WHERE lead_id = ? AND remetente = 'lead' 
         ORDER BY timestamp ASC LIMIT 1`, [leadId]);
            if (primeiraMensagemLead.rows.length === 0)
                continue;
            const timestampMensagemLead = new Date(primeiraMensagemLead.rows[0].timestamp);
            // Buscar primeira resposta do consultor/vendedor após essa mensagem
            const primeiraRespostaConsultor = await (0, db_helper_1.query)(`SELECT timestamp FROM mensagens 
         WHERE lead_id = ? AND remetente IN ('consultor', 'vendedor') AND timestamp > ?
         ORDER BY timestamp ASC LIMIT 1`, [leadId, primeiraMensagemLead.rows[0].timestamp]);
            if (primeiraRespostaConsultor.rows.length === 0)
                continue;
            const timestampRespostaConsultor = new Date(primeiraRespostaConsultor.rows[0].timestamp);
            // Calcular diferença em minutos
            const diferencaMs = timestampRespostaConsultor.getTime() - timestampMensagemLead.getTime();
            const diferencaMinutos = diferencaMs / (1000 * 60);
            totalTempoResposta += diferencaMinutos;
            totalLeadsComResposta++;
        }
        if (totalLeadsComResposta === 0) {
            return res.json({ tempoMedio: '0', unidade: 'min' });
        }
        const tempoMedioMinutos = totalTempoResposta / totalLeadsComResposta;
        // Formatar para exibição
        let tempoFormatado;
        let unidade;
        if (tempoMedioMinutos < 60) {
            // Menos de 1 hora - mostrar em minutos
            tempoFormatado = Math.round(tempoMedioMinutos).toString();
            unidade = 'min';
        }
        else if (tempoMedioMinutos < 1440) {
            // Menos de 24 horas - mostrar em horas
            const horas = (tempoMedioMinutos / 60).toFixed(1);
            tempoFormatado = horas;
            unidade = 'h';
        }
        else {
            // 24 horas ou mais - mostrar em dias
            const dias = (tempoMedioMinutos / 1440).toFixed(1);
            tempoFormatado = dias;
            unidade = 'd';
        }
        res.json({
            tempoMedio: tempoFormatado,
            unidade,
            tempoMedioMinutos: Math.round(tempoMedioMinutos),
            totalLeads: totalLeadsComResposta
        });
    }
    catch (error) {
        console.error('Erro ao calcular tempo médio de resposta:', error);
        res.status(500).json({ error: 'Erro ao calcular tempo médio de resposta' });
    }
};
exports.getTempoMedioResposta = getTempoMedioResposta;
