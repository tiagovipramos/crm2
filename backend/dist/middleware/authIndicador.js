"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTokenIndicador = exports.authIndicador = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'protecar-secret-key-indicador-2024';
const authIndicador = (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({
                error: 'Token não fornecido',
                message: 'Autenticação necessária'
            });
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Verificar se é um token de indicador
        if (decoded.tipo !== 'indicador') {
            return res.status(403).json({
                error: 'Token inválido',
                message: 'Token não é de indicador'
            });
        }
        req.indicadorId = decoded.id;
        req.indicadorEmail = decoded.email;
        next();
    }
    catch (error) {
        console.error('Erro na autenticação do indicador:', error);
        return res.status(401).json({
            error: 'Token inválido',
            message: 'Sessão expirada ou inválida'
        });
    }
};
exports.authIndicador = authIndicador;
const generateTokenIndicador = (id, email) => {
    return jsonwebtoken_1.default.sign({ id, email, tipo: 'indicador' }, JWT_SECRET, { expiresIn: '30d' });
};
exports.generateTokenIndicador = generateTokenIndicador;
