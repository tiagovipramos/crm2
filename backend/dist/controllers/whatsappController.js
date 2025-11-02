"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatus = exports.desconectar = exports.conectar = void 0;
const whatsappService_1 = require("../services/whatsappService");
const conectar = async (req, res) => {
    try {
        const consultorId = req.user?.id;
        if (!consultorId) {
            return res.status(401).json({ error: 'Não autenticado' });
        }
        const qrCode = await whatsappService_1.whatsappService.conectar(consultorId);
        if (qrCode) {
            res.json({
                message: 'Aguardando leitura do QR Code',
                qrCode
            });
        }
        else {
            res.json({
                message: 'WhatsApp conectado com sucesso'
            });
        }
    }
    catch (error) {
        console.error('Erro ao conectar WhatsApp:', error);
        res.status(500).json({ error: 'Erro ao conectar WhatsApp' });
    }
};
exports.conectar = conectar;
const desconectar = async (req, res) => {
    try {
        const consultorId = req.user?.id;
        if (!consultorId) {
            return res.status(401).json({ error: 'Não autenticado' });
        }
        await whatsappService_1.whatsappService.desconectar(consultorId);
        res.json({ message: 'WhatsApp desconectado com sucesso' });
    }
    catch (error) {
        console.error('Erro ao desconectar WhatsApp:', error);
        res.status(500).json({ error: 'Erro ao desconectar WhatsApp' });
    }
};
exports.desconectar = desconectar;
const getStatus = async (req, res) => {
    try {
        const consultorId = req.user?.id;
        if (!consultorId) {
            return res.status(401).json({ error: 'Não autenticado' });
        }
        const status = whatsappService_1.whatsappService.getStatus(consultorId);
        res.json(status);
    }
    catch (error) {
        console.error('Erro ao buscar status:', error);
        res.status(500).json({ error: 'Erro ao buscar status' });
    }
};
exports.getStatus = getStatus;
