"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const indicadorController_1 = require("../controllers/indicadorController");
const authIndicador_1 = require("../middleware/authIndicador");
const router = express_1.default.Router();
// ============================================
// ROTAS PÚBLICAS (SEM AUTENTICAÇÃO)
// ============================================
// Autenticação
router.post('/register', indicadorController_1.register);
router.post('/login', indicadorController_1.login);
// ============================================
// ROTAS PROTEGIDAS (COM AUTENTICAÇÃO)
// ============================================
// Perfil
router.get('/me', authIndicador_1.authIndicador, indicadorController_1.getMe);
// Dashboard
router.get('/dashboard', authIndicador_1.authIndicador, indicadorController_1.getDashboard);
// Validação de WhatsApp
router.post('/validar-whatsapp', authIndicador_1.authIndicador, indicadorController_1.validarWhatsApp);
// Indicações
router.post('/indicar', authIndicador_1.authIndicador, indicadorController_1.criarIndicacao);
router.get('/indicacoes', authIndicador_1.authIndicador, indicadorController_1.getIndicacoes);
router.get('/indicacoes/:id', authIndicador_1.authIndicador, indicadorController_1.getIndicacao);
router.delete('/indicacoes', authIndicador_1.authIndicador, indicadorController_1.deletarTodasIndicacoes);
// Transações
router.get('/transacoes', authIndicador_1.authIndicador, indicadorController_1.getTransacoes);
// Saques
router.post('/solicitar-saque', authIndicador_1.authIndicador, indicadorController_1.solicitarSaque);
router.get('/saques', authIndicador_1.authIndicador, indicadorController_1.getSaques);
// Avatar
router.post('/avatar', authIndicador_1.authIndicador, indicadorController_1.atualizarAvatar);
// Loot Box / Caixa Misteriosa
router.get('/lootbox/status', authIndicador_1.authIndicador, indicadorController_1.getLootBoxStatus);
router.post('/lootbox/abrir', authIndicador_1.authIndicador, indicadorController_1.abrirLootBox);
router.post('/lootbox/compartilhar', authIndicador_1.authIndicador, indicadorController_1.compartilharPremio);
exports.default = router;
