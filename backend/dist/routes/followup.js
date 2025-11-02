"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const followupController_1 = require("../controllers/followupController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// ============================================
// ROTAS DE SEQUÊNCIAS
// ============================================
/**
 * @route   GET /api/followup/sequencias
 * @desc    Listar todas as sequências de follow-up
 * @access  Private
 */
router.get('/sequencias', auth_1.authMiddleware, followupController_1.listarSequencias);
/**
 * @route   GET /api/followup/sequencias/:id
 * @desc    Buscar uma sequência por ID com suas mensagens
 * @access  Private
 */
router.get('/sequencias/:id', auth_1.authMiddleware, followupController_1.buscarSequencia);
/**
 * @route   POST /api/followup/sequencias
 * @desc    Criar nova sequência de follow-up
 * @access  Private
 */
router.post('/sequencias', auth_1.authMiddleware, followupController_1.criarSequencia);
/**
 * @route   PUT /api/followup/sequencias/:id
 * @desc    Atualizar sequência existente
 * @access  Private
 */
router.put('/sequencias/:id', auth_1.authMiddleware, followupController_1.atualizarSequencia);
/**
 * @route   DELETE /api/followup/sequencias/:id
 * @desc    Deletar sequência
 * @access  Private
 */
router.delete('/sequencias/:id', auth_1.authMiddleware, followupController_1.deletarSequencia);
// ============================================
// ROTAS DE GESTÃO DE LEADS
// ============================================
/**
 * @route   POST /api/followup/leads
 * @desc    Adicionar lead a uma sequência de follow-up
 * @access  Private
 */
router.post('/leads', auth_1.authMiddleware, followupController_1.adicionarLeadSequencia);
/**
 * @route   GET /api/followup/leads/:leadId
 * @desc    Listar follow-ups ativos de um lead
 * @access  Private
 */
router.get('/leads/:leadId', auth_1.authMiddleware, followupController_1.listarFollowUpsLead);
/**
 * @route   PUT /api/followup/leads/:id/pausar
 * @desc    Pausar follow-up de um lead
 * @access  Private
 */
router.put('/leads/:id/pausar', auth_1.authMiddleware, followupController_1.pausarFollowUp);
/**
 * @route   PUT /api/followup/leads/:id/reativar
 * @desc    Reativar follow-up pausado
 * @access  Private
 */
router.put('/leads/:id/reativar', auth_1.authMiddleware, followupController_1.reativarFollowUp);
/**
 * @route   PUT /api/followup/leads/:id/cancelar
 * @desc    Cancelar follow-up de um lead
 * @access  Private
 */
router.put('/leads/:id/cancelar', auth_1.authMiddleware, followupController_1.cancelarFollowUp);
/**
 * @route   GET /api/followup/leads/:leadId/historico
 * @desc    Obter histórico de envios de um lead
 * @access  Private
 */
router.get('/leads/:leadId/historico', auth_1.authMiddleware, followupController_1.obterHistoricoLead);
// ============================================
// ROTAS DE AUTOMAÇÃO
// ============================================
/**
 * @route   POST /api/followup/processar
 * @desc    Processar envios programados (chamado por cron job)
 * @access  Private
 */
router.post('/processar', auth_1.authMiddleware, followupController_1.processarEnviosProgramados);
// ============================================
// ROTAS DE ESTATÍSTICAS
// ============================================
/**
 * @route   GET /api/followup/estatisticas
 * @desc    Obter estatísticas das sequências
 * @access  Private
 */
router.get('/estatisticas', auth_1.authMiddleware, followupController_1.obterEstatisticas);
/**
 * @route   GET /api/followup/proximos-envios
 * @desc    Obter próximos envios programados
 * @access  Private
 */
router.get('/proximos-envios', auth_1.authMiddleware, followupController_1.obterProximosEnvios);
exports.default = router;
