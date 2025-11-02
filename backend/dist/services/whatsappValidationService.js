"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappValidationService = void 0;
const whatsappService_1 = require("./whatsappService");
class WhatsAppValidationService {
    constructor() {
        /**
         * Cache de validações para evitar múltiplas verificações do mesmo número
         */
        this.cacheValidacoes = new Map();
        this.CACHE_DURATION = 1000 * 60 * 60; // 1 hora
    }
    /**
     * Valida se um número de telefone é WhatsApp válido
     */
    async validarNumeroWhatsApp(telefone, consultorId) {
        try {
            // Limpar o número (remover espaços, hífens, parênteses)
            const telefoneLimpo = telefone.replace(/\D/g, '');
            // Validação básica do formato
            if (telefoneLimpo.length < 10 || telefoneLimpo.length > 13) {
                return {
                    telefone: telefoneLimpo,
                    valido: false,
                    existe: false,
                    mensagem: 'Número de telefone inválido. Deve ter entre 10 e 13 dígitos.'
                };
            }
            // Validar se começa com 55 (código do Brasil)
            let numeroFormatado = telefoneLimpo;
            if (!numeroFormatado.startsWith('55')) {
                numeroFormatado = '55' + numeroFormatado;
            }
            // 🔥 REMOVER O "9" DO CELULAR SE EXISTIR
            // No Brasil, números novos têm 11 dígitos (DDD + 9 + 8 dígitos)
            // Mas WhatsApp funciona apenas com 10 dígitos (DDD + 8 dígitos)
            // Exemplo: 5581988040121 (13 dígitos) -> 558188040121 (12 dígitos)
            if (numeroFormatado.length === 13 && numeroFormatado.startsWith('55')) {
                const ddd = numeroFormatado.substring(2, 4);
                const nono = numeroFormatado.substring(4, 5);
                const resto = numeroFormatado.substring(5);
                // Se o terceiro dígito após o 55 for "9", remover
                if (nono === '9' && resto.length === 8) {
                    numeroFormatado = '55' + ddd + resto;
                    console.log(`🔄 Número convertido de 11 para 10 dígitos: ${numeroFormatado}`);
                }
            }
            // ⚠️ VALIDAÇÃO ANTI-SPAM: Detectar números suspeitos/inválidos
            const numeroSemCodigo = numeroFormatado.replace('55', '');
            // Verificar números com muitos dígitos repetidos (ex: 8199999999)
            const digitosRepetidos = this.contarDigitosRepetidos(numeroSemCodigo);
            if (digitosRepetidos >= 6) {
                return {
                    telefone: numeroFormatado,
                    valido: false,
                    existe: false,
                    mensagem: '❌ Número suspeito: muitos dígitos repetidos'
                };
            }
            // Verificar sequências óbvias (ex: 1234567890, 0987654321)
            if (this.isSequencial(numeroSemCodigo)) {
                return {
                    telefone: numeroFormatado,
                    valido: false,
                    existe: false,
                    mensagem: '❌ Número suspeito: sequência inválida'
                };
            }
            // Verificar se o DDD é válido (lista de DDDs brasileiros)
            const ddd = parseInt(numeroSemCodigo.substring(0, 2));
            if (!this.isDDDValido(ddd)) {
                return {
                    telefone: numeroFormatado,
                    valido: false,
                    existe: false,
                    mensagem: `❌ DDD ${ddd} inválido`
                };
            }
            // ⚠️ NOTA IMPORTANTE: O método onWhatsApp() do Baileys tem limitações
            // e pode retornar falsos positivos. Por isso, apenas validamos o formato
            // e padrões suspeitos. A validação real acontece quando tenta enviar mensagem.
            // ✅ VERIFICAÇÃO COM BAILEYS (com aviso de limitações)
            try {
                // Obter socket de qualquer sessão ativa
                const sock = await this.obterSocketAtivo(consultorId);
                if (sock) {
                    console.log(`🔍 Verificando se ${numeroFormatado} tem WhatsApp...`);
                    // Usar método onWhatsApp do Baileys para verificar se número existe
                    const [resultado] = await sock.onWhatsApp(numeroFormatado);
                    console.log('📋 Resultado da verificação Baileys:', resultado);
                    if (resultado && resultado.exists) {
                        // ⚠️ AVISO: Baileys pode dar falso positivo, então informamos isso
                        return {
                            telefone: numeroFormatado,
                            valido: true,
                            existe: true,
                            mensagem: '✅ Formato válido - verificar ao enviar mensagem'
                        };
                    }
                    else {
                        return {
                            telefone: numeroFormatado,
                            valido: false,
                            existe: false,
                            mensagem: '❌ Este número NÃO tem WhatsApp'
                        };
                    }
                }
                else {
                    // Se não há conexão WhatsApp ativa, aceitar apenas números com formato válido
                    return {
                        telefone: numeroFormatado,
                        valido: true,
                        existe: false,
                        mensagem: '⚠️ Formato válido (não foi possível verificar WhatsApp)'
                    };
                }
            }
            catch (error) {
                console.error('❌ Erro ao validar WhatsApp:', error);
                // Em caso de erro, retornar formato válido mas não confirmado
                return {
                    telefone: numeroFormatado,
                    valido: true,
                    existe: false,
                    mensagem: '⚠️ Formato válido (erro na verificação)'
                };
            }
        }
        catch (error) {
            console.error('❌ Erro na validação:', error);
            return {
                telefone,
                valido: false,
                existe: false,
                mensagem: 'Erro ao validar número de telefone'
            };
        }
    }
    /**
     * Conta quantos dígitos consecutivos repetidos existem no número
     */
    contarDigitosRepetidos(numero) {
        let maxRepetidos = 0;
        let repetidosAtuais = 1;
        for (let i = 1; i < numero.length; i++) {
            if (numero[i] === numero[i - 1]) {
                repetidosAtuais++;
                maxRepetidos = Math.max(maxRepetidos, repetidosAtuais);
            }
            else {
                repetidosAtuais = 1;
            }
        }
        return maxRepetidos;
    }
    /**
     * Verifica se o número é uma sequência óbvia (ex: 1234567890)
     */
    isSequencial(numero) {
        // Verificar sequência crescente
        let crescente = true;
        let decrescente = true;
        for (let i = 1; i < numero.length; i++) {
            const diff = parseInt(numero[i]) - parseInt(numero[i - 1]);
            if (diff !== 1)
                crescente = false;
            if (diff !== -1)
                decrescente = false;
        }
        return crescente || decrescente;
    }
    /**
     * Valida se o DDD é válido no Brasil
     */
    isDDDValido(ddd) {
        const dddsValidos = [
            11, 12, 13, 14, 15, 16, 17, 18, 19, // São Paulo
            21, 22, 24, // Rio de Janeiro
            27, 28, // Espírito Santo
            31, 32, 33, 34, 35, 37, 38, // Minas Gerais
            41, 42, 43, 44, 45, 46, // Paraná
            47, 48, 49, // Santa Catarina
            51, 53, 54, 55, // Rio Grande do Sul
            61, // Distrito Federal
            62, 64, // Goiás
            63, // Tocantins
            65, 66, // Mato Grosso
            67, // Mato Grosso do Sul
            68, // Acre
            69, // Rondônia
            71, 73, 74, 75, 77, // Bahia
            79, // Sergipe
            81, 87, // Pernambuco
            82, // Alagoas
            83, // Paraíba
            84, // Rio Grande do Norte
            85, 88, // Ceará
            86, 89, // Piauí
            91, 93, 94, // Pará
            92, 97, // Amazonas
            95, // Roraima
            96, // Amapá
            98, 99, // Maranhão
        ];
        return dddsValidos.includes(ddd);
    }
    /**
     * Obtém um socket ativo para fazer a verificação
     * Tenta usar o consultorId fornecido, ou busca qualquer sessão ativa
     */
    async obterSocketAtivo(consultorId) {
        try {
            // Tentar obter socket direto do whatsappService
            if (consultorId) {
                const status = whatsappService_1.whatsappService.getStatus(consultorId);
                if (status.connected) {
                    // Acessar a sessão diretamente (precisamos adicionar um método público)
                    return whatsappService_1.whatsappService.getSocket(consultorId);
                }
            }
            // Se não tem consultorId ou não está conectado, tentar buscar qualquer sessão ativa
            return whatsappService_1.whatsappService.getAnyActiveSocket();
        }
        catch (error) {
            console.error('Erro ao obter socket:', error);
            return null;
        }
    }
    /**
     * Formatar número para exibição
     */
    formatarNumero(telefone) {
        const limpo = telefone.replace(/\D/g, '');
        if (limpo.startsWith('55')) {
            const numero = limpo.substring(2);
            if (numero.length === 11) {
                // (XX) 9XXXX-XXXX
                return `(${numero.substring(0, 2)}) ${numero.substring(2, 7)}-${numero.substring(7)}`;
            }
            else if (numero.length === 10) {
                // (XX) XXXX-XXXX
                return `(${numero.substring(0, 2)}) ${numero.substring(2, 6)}-${numero.substring(6)}`;
            }
        }
        return telefone;
    }
    async validarComCache(telefone) {
        const telefoneLimpo = telefone.replace(/\D/g, '');
        const cached = this.cacheValidacoes.get(telefoneLimpo);
        if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
            return cached.resultado;
        }
        const resultado = await this.validarNumeroWhatsApp(telefone);
        this.cacheValidacoes.set(telefoneLimpo, {
            resultado,
            timestamp: Date.now()
        });
        return resultado;
    }
    /**
     * Limpar cache de validações antigas
     */
    limparCache() {
        const agora = Date.now();
        for (const [telefone, data] of this.cacheValidacoes.entries()) {
            if (agora - data.timestamp > this.CACHE_DURATION) {
                this.cacheValidacoes.delete(telefone);
            }
        }
    }
}
exports.whatsappValidationService = new WhatsAppValidationService();
// Limpar cache a cada hora
setInterval(() => {
    exports.whatsappValidationService.limparCache();
}, 1000 * 60 * 60);
