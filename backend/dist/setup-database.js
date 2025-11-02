"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const database_1 = require("./config/database");
async function setupDatabase() {
    try {
        console.log('🔧 Configurando banco de dados MySQL...\n');
        // Ler schema
        const schemaPath = path_1.default.join(__dirname, '../schema-mysql.sql');
        const schema = fs_1.default.readFileSync(schemaPath, 'utf8');
        // Dividir por comandos SQL
        const commands = schema
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
        console.log(`📝 Executando ${commands.length} comandos SQL...\n`);
        for (const command of commands) {
            if (command.toLowerCase().includes('create database')) {
                // Executar CREATE DATABASE separadamente
                const conn = await database_1.pool.getConnection();
                await conn.query(command);
                conn.release();
                console.log('✅ Banco de dados criado');
            }
            else if (command.toLowerCase().includes('use protecar_crm')) {
                // Skip USE command (já estamos usando o banco)
                continue;
            }
            else {
                // Executar outros comandos
                await database_1.pool.query(command);
            }
        }
        console.log('\n✅ Banco de dados configurado com sucesso!');
        console.log('\n📊 Verificando tabelas...');
        // Verificar tabelas
        const [tables] = await database_1.pool.query('SHOW TABLES');
        console.log(`\n✅ ${tables.length} tabelas criadas:`);
        tables.forEach((table) => {
            console.log(`   - ${Object.values(table)[0]}`);
        });
        // Verificar consultor teste
        const [consultores] = await database_1.pool.query('SELECT nome, email FROM consultores');
        if (consultores.length > 0) {
            console.log('\n✅ Consultor de teste criado:');
            console.log(`   Email: ${consultores[0].email}`);
            console.log(`   Senha: 123456`);
        }
        console.log('\n🎉 Tudo pronto! Agora execute: npm run dev');
        process.exit(0);
    }
    catch (error) {
        console.error('\n❌ Erro ao configurar banco:', error.message);
        process.exit(1);
    }
}
setupDatabase();
