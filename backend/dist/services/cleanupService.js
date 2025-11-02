"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Serviço de limpeza automática de arquivos antigos
 * Remove arquivos de mídia mais antigos que X dias
 */
class CleanupService {
    constructor() {
        this.uploadPath = path.join(process.cwd(), 'uploads');
        this.diasParaManterArquivos = 90; // Manter arquivos por 90 dias (3 meses)
    }
    /**
     * Configura quantos dias manter os arquivos
     */
    setDiasRetencao(dias) {
        this.diasParaManterArquivos = dias;
        console.log(`🗑️ Retenção de arquivos configurada para ${dias} dias`);
    }
    /**
     * Limpa arquivos antigos de todas as pastas de upload
     */
    async limparArquivosAntigos() {
        console.log('🧹 Iniciando limpeza de arquivos antigos...');
        let totalArquivos = 0;
        let arquivosDeletados = 0;
        let espacoLiberado = 0;
        const pastas = ['images', 'videos', 'audios', 'documents'];
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - this.diasParaManterArquivos);
        for (const pasta of pastas) {
            const pastaPath = path.join(this.uploadPath, pasta);
            if (!fs.existsSync(pastaPath))
                continue;
            const arquivos = fs.readdirSync(pastaPath);
            totalArquivos += arquivos.length;
            for (const arquivo of arquivos) {
                const arquivoPath = path.join(pastaPath, arquivo);
                const stats = fs.statSync(arquivoPath);
                // Verificar se arquivo é mais antigo que o limite
                if (stats.mtime < dataLimite) {
                    const tamanho = stats.size;
                    fs.unlinkSync(arquivoPath);
                    arquivosDeletados++;
                    espacoLiberado += tamanho;
                    console.log(`🗑️ Deletado: ${pasta}/${arquivo} (${this.formatarTamanho(tamanho)})`);
                }
            }
        }
        console.log('✅ Limpeza concluída:');
        console.log(`   📁 Total de arquivos: ${totalArquivos}`);
        console.log(`   🗑️ Arquivos deletados: ${arquivosDeletados}`);
        console.log(`   💾 Espaço liberado: ${this.formatarTamanho(espacoLiberado)}`);
        return { totalArquivos, arquivosDeletados, espacoLiberado };
    }
    /**
     * Obtém estatísticas de uso de espaço
     */
    async obterEstatisticas() {
        const stats = {
            totalArquivos: 0,
            espacoUsado: 0,
            porPasta: {}
        };
        const pastas = ['images', 'videos', 'audios', 'documents'];
        for (const pasta of pastas) {
            const pastaPath = path.join(this.uploadPath, pasta);
            if (!fs.existsSync(pastaPath)) {
                stats.porPasta[pasta] = { arquivos: 0, tamanho: 0 };
                continue;
            }
            const arquivos = fs.readdirSync(pastaPath);
            let tamanhoTotal = 0;
            for (const arquivo of arquivos) {
                const arquivoPath = path.join(pastaPath, arquivo);
                const fileStat = fs.statSync(arquivoPath);
                tamanhoTotal += fileStat.size;
            }
            stats.porPasta[pasta] = {
                arquivos: arquivos.length,
                tamanho: tamanhoTotal
            };
            stats.totalArquivos += arquivos.length;
            stats.espacoUsado += tamanhoTotal;
        }
        return stats;
    }
    /**
     * Inicia limpeza automática agendada
     */
    iniciarLimpezaAutomatica() {
        // Executar limpeza a cada 24 horas (1 dia)
        const INTERVALO_24H = 24 * 60 * 60 * 1000;
        // Primeira limpeza após 1 hora do servidor iniciar
        setTimeout(() => {
            this.limparArquivosAntigos().catch(err => {
                console.error('❌ Erro na limpeza automática:', err);
            });
        }, 60 * 60 * 1000); // 1 hora
        // Limpezas subsequentes a cada 24 horas
        setInterval(() => {
            this.limparArquivosAntigos().catch(err => {
                console.error('❌ Erro na limpeza automática:', err);
            });
        }, INTERVALO_24H);
        console.log(`🤖 Limpeza automática ativada (a cada 24h, mantém ${this.diasParaManterArquivos} dias)`);
    }
    /**
     * Formata tamanho em bytes para formato legível
     */
    formatarTamanho(bytes) {
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const tamanhos = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + tamanhos[i];
    }
}
exports.cleanupService = new CleanupService();
