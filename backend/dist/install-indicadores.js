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
const db_helper_1 = require("./config/db-helper");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function install() {
    try {
        console.log('📦 Instalando módulo de indicações...\n');
        const sqlPath = path.join(__dirname, '..', 'migrations', 'schema-indicadores-mysql.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        // Separar queries (remover comentários e linhas vazias)
        const queries = sql
            .split(';')
            .map(q => q.trim())
            .filter(q => q.length > 0 && !q.startsWith('--') && !q.startsWith('/*'));
        console.log(`🔄 Executando ${queries.length} queries...\n`);
        let executed = 0;
        for (const q of queries) {
            if (q.trim()) {
                try {
                    await (0, db_helper_1.query)(q, []);
                    executed++;
                    if (executed % 5 === 0) {
                        console.log(`   ${executed}/${queries.length} queries executadas...`);
                    }
                }
                catch (err) {
                    // Ignorar erros de "já existe" ou "duplicate"
                    if (!err.message.includes('already exists') &&
                        !err.message.includes('Duplicate') &&
                        !err.message.includes('DROP TRIGGER')) {
                        console.log('⚠️  Query com erro:', q.substring(0, 50) + '...');
                        console.log('   Erro:', err.message.substring(0, 100));
                    }
                }
            }
        }
        console.log(`\n✅ ${executed} queries executadas!\n`);
        console.log('📊 Verificando instalação...');
        // Verificar tabelas criadas (usando database correto do .env)
        const result = await (0, db_helper_1.query)(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
      AND table_name IN ('indicadores', 'indicacoes', 'transacoes_indicador', 'saques_indicador')
      ORDER BY table_name
    `, []);
        if (result.rows && result.rows.length > 0) {
            console.log('✅ Tabelas criadas:', result.rows.map((r) => r.table_name || r.TABLE_NAME).join(', '));
        }
        // Verificar indicador de teste
        const indicadorTest = await (0, db_helper_1.query)(`
      SELECT id, nome, email FROM indicadores WHERE email = 'joao@indicador.com' LIMIT 1
    `, []);
        if (indicadorTest.rows && indicadorTest.rows.length > 0) {
            console.log('✅ Indicador de teste criado:', indicadorTest.rows[0].nome);
        }
        console.log('\n🎉 Instalação concluída com sucesso!');
        console.log('\n📝 Credenciais de teste:');
        console.log('   Email: joao@indicador.com');
        console.log('   Senha: 123456');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Erro na instalação:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}
install();
