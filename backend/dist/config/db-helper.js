"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool_query = exports.query = void 0;
const database_1 = require("./database");
// Helper para manter compatibilidade com sintaxe PostgreSQL
const query = async (sql, params) => {
    try {
        const [result] = await database_1.pool.query(sql, params);
        // Se for um INSERT/UPDATE/DELETE, retorna ResultSetHeader com insertId
        if (result.insertId !== undefined) {
            return {
                rows: [],
                insertId: result.insertId,
                affectedRows: result.affectedRows
            };
        }
        // Se for um SELECT, retorna as rows
        return { rows: result };
    }
    catch (error) {
        throw error;
    }
};
exports.query = query;
// Wrapper do pool.query que retorna no formato {rows: []}
exports.pool_query = exports.query;
exports.default = { query: exports.query };
