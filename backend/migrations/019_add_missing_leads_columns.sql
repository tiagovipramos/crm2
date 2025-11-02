-- Migration: Adicionar colunas faltantes na tabela leads
-- Data: 2025-02-11
-- Descrição: Adiciona campos para CRM (veículos, consultor, etc)

-- Adicionar coluna consultor_id (para controle do CRM)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS consultor_id INT;

-- Adicionar colunas de informações do veículo
ALTER TABLE leads ADD COLUMN IF NOT EXISTS cidade VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS modelo_veiculo VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS placa_veiculo VARCHAR(20);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS cor_veiculo VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ano_veiculo VARCHAR(10);

-- Adicionar colunas de controle
ALTER TABLE leads ADD COLUMN IF NOT EXISTS mensagens_nao_lidas INT DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags JSON;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notas_internas JSON;

-- Adicionar colunas de informações comerciais
ALTER TABLE leads ADD COLUMN IF NOT EXISTS informacoes_comerciais TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS mensalidade DECIMAL(10,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS fipe DECIMAL(10,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS plano VARCHAR(100);

-- Adicionar índice para consultor_id
ALTER TABLE leads ADD INDEX IF NOT EXISTS idx_consultor (consultor_id);

-- Adicionar foreign key para consultor_id (assumindo que consultores são usuários)
-- ALTER TABLE leads ADD FOREIGN KEY (consultor_id) REFERENCES usuarios(id) ON DELETE SET NULL;
