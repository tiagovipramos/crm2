-- ================================================
-- Migration: Corrigir tipos de dados UUID em leads
-- ================================================
-- Problema: indicador_id e indicacao_id estão como INT
-- Solução: Alterar para CHAR(36) para suportar UUIDs
-- Data: 2025-11-02
-- ================================================

USE protecar_crm;

-- Desabilitar temporariamente as foreign keys
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Alterar indicador_id de INT para CHAR(36)
ALTER TABLE leads 
MODIFY COLUMN indicador_id CHAR(36) NULL;

-- 2. Alterar indicacao_id de INT para CHAR(36)
ALTER TABLE leads 
MODIFY COLUMN indicacao_id CHAR(36) NULL;

-- Reabilitar foreign keys
SET FOREIGN_KEY_CHECKS = 1;

-- Verificar alterações
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'protecar_crm'
  AND TABLE_NAME = 'leads'
  AND COLUMN_NAME IN ('indicador_id', 'indicacao_id');

-- ================================================
-- Fim da Migration
-- ================================================
