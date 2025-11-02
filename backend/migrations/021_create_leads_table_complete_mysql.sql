-- Migration: Criar tabela de leads completa (MySQL)
-- Data: 2025-02-11
-- Descrição: Cria a tabela leads com todos os campos necessários para o CRM

CREATE TABLE IF NOT EXISTS leads (
  id CHAR(36) PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  cidade VARCHAR(255),
  modelo_veiculo VARCHAR(255),
  placa_veiculo VARCHAR(20),
  cor_veiculo VARCHAR(100),
  ano_veiculo VARCHAR(10),
  origem VARCHAR(50) DEFAULT 'Manual',
  status VARCHAR(50) DEFAULT 'novo',
  consultor_id CHAR(36),
  indicador_id INT,
  indicacao_id INT,
  comissao_indicador DECIMAL(10,2) DEFAULT 0.00,
  observacoes TEXT,
  notas_internas JSON,
  ultima_mensagem TEXT,
  mensagens_nao_lidas INT DEFAULT 0,
  tags JSON,
  informacoes_comerciais TEXT,
  mensalidade DECIMAL(10,2),
  fipe DECIMAL(10,2),
  plano VARCHAR(100),
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_leads_status (status),
  INDEX idx_leads_telefone (telefone),
  INDEX idx_leads_consultor (consultor_id),
  INDEX idx_leads_indicador (indicador_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
