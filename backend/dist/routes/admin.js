"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminController_1 = require("../controllers/adminController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// =========================================
// ROTA DE LOGIN
// =========================================
router.post('/login', adminController_1.loginAdmin);
// =========================================
// ROTAS DE ESTATÍSTICAS (protegidas)
// =========================================
router.get('/estatisticas/crm', auth_1.authMiddleware, adminController_1.getEstatisticasCRM);
router.get('/estatisticas/indicacao', auth_1.authMiddleware, adminController_1.getEstatisticasIndicacao);
// =========================================
// ROTAS DE TOP PERFORMERS (protegidas)
// =========================================
router.get('/top-performers', auth_1.authMiddleware, adminController_1.getTopPerformers);
router.get('/top-indicadores', auth_1.authMiddleware, adminController_1.getTopIndicadores);
// =========================================
// ROTAS DE FUNIL (protegidas)
// =========================================
router.get('/distribuicao-funil', auth_1.authMiddleware, adminController_1.getDistribuicaoFunil);
// =========================================
// ROTAS DE ALERTAS (protegidas)
// =========================================
router.get('/alertas', auth_1.authMiddleware, adminController_1.getAlertas);
// =========================================
// ROTAS DE USUÁRIOS (protegidas com autenticação)
// =========================================
router.get('/vendedores', auth_1.authMiddleware, adminController_1.getVendedores);
router.get('/admins', auth_1.authMiddleware, adminController_1.getAdmins);
router.get('/indicadores', auth_1.authMiddleware, adminController_1.getIndicadores);
// =========================================
// ROTAS DE SAQUES (protegidas)
// =========================================
router.get('/saques/pendentes', auth_1.authMiddleware, adminController_1.getSolicitacoesSaque);
// =========================================
// ROTAS DE CHAT (protegidas)
// =========================================
const adminController_2 = require("../controllers/adminController");
router.get('/chats-vendedores', auth_1.authMiddleware, adminController_2.getChatsVendedores);
// =========================================
// ROTAS DE CRIAÇÃO DE USUÁRIOS (protegidas)
// =========================================
const adminController_3 = require("../controllers/adminController");
router.post('/vendedores', auth_1.authMiddleware, adminController_3.criarVendedor);
router.post('/indicadores', auth_1.authMiddleware, adminController_3.criarIndicador);
router.post('/admins', auth_1.authMiddleware, adminController_3.criarAdmin);
router.post('/vendedores/:vendedorId/gerar-token', auth_1.authMiddleware, adminController_3.gerarTokenTemporario);
router.put('/vendedores/:id/status', auth_1.authMiddleware, adminController_3.atualizarStatusVendedor);
router.put('/indicadores/:id/status', auth_1.authMiddleware, adminController_3.atualizarStatusIndicador);
router.put('/admins/:id/status', auth_1.authMiddleware, adminController_3.atualizarStatusAdmin);
router.delete('/vendedores/:id', auth_1.authMiddleware, adminController_3.deletarVendedor);
router.delete('/indicadores/:id', auth_1.authMiddleware, adminController_3.deletarIndicador);
router.delete('/admins/:id', auth_1.authMiddleware, adminController_3.deletarAdmin);
// ROTAS DE EDIÇÃO COMPLETA DE USUÁRIOS
const adminController_4 = require("../controllers/adminController");
router.put('/vendedores/:id', auth_1.authMiddleware, adminController_4.editarVendedor);
router.put('/indicadores/:id', auth_1.authMiddleware, adminController_4.editarIndicador);
router.put('/admins/:id', auth_1.authMiddleware, adminController_4.editarAdmin);
exports.default = router;
