"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const relatoriosController_1 = require("../controllers/relatoriosController");
const router = (0, express_1.Router)();
// Todas as rotas requerem autenticação
router.use(auth_1.authMiddleware);
// GET /api/relatorios/tempo-medio-resposta
router.get('/tempo-medio-resposta', relatoriosController_1.getTempoMedioResposta);
exports.default = router;
