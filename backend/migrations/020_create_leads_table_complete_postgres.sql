-- Migration: Criar tabela de leads completa (PostgreSQL)
-- Data: 2025-02-11
-- Descrição: Cria a tabela leads com todos os campos necessários para o CRM

CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  cidade VARCHAR(255),
  modelo_veiculo VARCHAR(255),
  placa_veiculo VARCHAR(20),
  cor_veiculo VARCHAR(100),
  ano_veiculo VARCHAR(10),
  status VARCHAR(50) DEFAULT 'novo',
  origem VARCHAR(50) DEFAULT 'Manual',
  consultor_id INTEGER,
  indicador_id INTEGER,
  indicacao_id INTEGER,
  observacoes TEXT,
  mensagens_nao_lidas INTEGER DEFAULT 0,
  tags JSONB,
  notas_internas JSONB,
  informacoes_comerciais TEXT,
  mensalidade DECIMAL(10,2),
  fipe DECIMAL(10,2),
  plano VARCHAR(100),
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_telefone ON leads(telefone);
CREATE INDEX IF NOT EXISTS idx_leads_consultor ON leads(consultor_id);
CREATE INDEX IF NOT EXISTS idx_leads_indicador ON leads(indicador_id);

-- Comentários para documentação
COMMENT ON TABLE leads IS 'Tabela de leads do CRM';
COMMENT ON COLUMN leads.nome IS 'Nome completo do lead';
COMMENT ON COLUMN leads.telefone IS 'Telefone/WhatsApp do lead';
COMMENT ON COLUMN leads.email IS 'E-mail do lead';
COMMENT ON COLUMN leads.cidade IS 'Cidade do lead';
COMMENT ON COLUMN leads.modelo_veiculo IS 'Modelo do veículo do cliente';
COMMENT ON COLUMN leads.placa_veiculo IS 'Placa do veículo do cliente';
COMMENT ON COLUMN leads.ano_veiculo IS 'Ano do veículo';
COMMENT ON COLUMN leads.status IS 'Status do lead no funil (novo, primeiro_contato, proposta_enviada, convertido, perdido)';
COMMENT ON COLUMN leads.origem IS 'Origem do lead (Manual, Indicação, etc)';
COMMENT ON COLUMN leads.consultor_id IS 'ID do consultor responsável pelo lead';
COMMENT ON COLUMN leads.mensagens_nao_lidas IS 'Contador de mensagens não lidas';
COMMENT ON COLUMN leads.tags IS 'Tags do lead em formato JSON';
COMMENT ON COLUMN leads.notas_internas IS 'Notas internas do lead em formato JSON';
COMMENT ON COLUMN leads.informacoes_comerciais IS 'Informações comerciais adicionais';
COMMENT ON COLUMN leads.mensalidade IS 'Valor da mensalidade';
COMMENT ON COLUMN leads.fipe IS 'Valor FIPE do veículo';
COMMENT ON COLUMN leads.plano IS 'Plano contratado';

-- Inserir alguns dados de exemplo para teste (opcional)
-- INSERT INTO leads (nome, telefone, email, cidade, status, origem, consultor_id)
-- VALUES ('Lead Teste', '5581987654321', 'teste@exemplo.com', 'Recife', 'novo', 'Manual', 1);
