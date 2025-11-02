-- Migration: Adicionar colunas faltantes na tabela leads (PostgreSQL)
-- Data: 2025-02-11
-- Descrição: Adiciona campos para CRM (veículos, consultor, etc)

-- Adicionar coluna consultor_id (para controle do CRM)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS consultor_id INTEGER;

-- Adicionar colunas de informações do veículo
ALTER TABLE leads ADD COLUMN IF NOT EXISTS cidade VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS modelo_veiculo VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS placa_veiculo VARCHAR(20);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS cor_veiculo VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ano_veiculo VARCHAR(10);

-- Adicionar colunas de controle
ALTER TABLE leads ADD COLUMN IF NOT EXISTS mensagens_nao_lidas INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags JSONB;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notas_internas JSONB;

-- Adicionar colunas de informações comerciais
ALTER TABLE leads ADD COLUMN IF NOT EXISTS informacoes_comerciais TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS mensalidade DECIMAL(10,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS fipe DECIMAL(10,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS plano VARCHAR(100);

-- Adicionar índice para consultor_id
CREATE INDEX IF NOT EXISTS idx_consultor ON leads(consultor_id);

-- Comentários para documentação
COMMENT ON COLUMN leads.consultor_id IS 'ID do consultor responsável pelo lead';
COMMENT ON COLUMN leads.modelo_veiculo IS 'Modelo do veículo do cliente';
COMMENT ON COLUMN leads.placa_veiculo IS 'Placa do veículo do cliente';
COMMENT ON COLUMN leads.ano_veiculo IS 'Ano do veículo';
COMMENT ON COLUMN leads.mensagens_nao_lidas IS 'Contador de mensagens não lidas';
COMMENT ON COLUMN leads.tags IS 'Tags do lead em formato JSON';
COMMENT ON COLUMN leads.notas_internas IS 'Notas internas do lead em formato JSON';
