"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const tarefasController_1 = require("../controllers/tarefasController");
const router = (0, express_1.Router)();
// Todas as rotas requerem autenticação
router.use(auth_1.authMiddleware);
// Listar todas as tarefas do consultor
router.get('/', tarefasController_1.getTarefas);
// Buscar tarefas por lead
router.get('/lead/:leadId', tarefasController_1.getTarefasByLead);
// Criar nova tarefa
router.post('/', tarefasController_1.createTarefa);
// Atualizar tarefa
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        // Se está marcando como concluída, usar a função específica
        if (status === 'concluida') {
            return (0, tarefasController_1.completeTarefa)(req, res);
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Erro ao atualizar tarefa:', error);
        res.status(500).json({ error: 'Erro ao atualizar tarefa' });
    }
});
// Marcar tarefa como concluída
router.put('/:id/concluir', tarefasController_1.completeTarefa);
// Deletar tarefa
router.delete('/:id', tarefasController_1.deleteTarefa);
exports.default = router;
