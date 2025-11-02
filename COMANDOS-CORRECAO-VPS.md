# 🔧 Comandos para Corrigir Tabela Leads na VPS

## ⚠️ PROBLEMA IDENTIFICADO
A VPS está usando **MySQL** (não PostgreSQL), e a tabela `leads` está faltando os seguintes campos:
- `comissao_indicador`
- `ultima_mensagem`
- E o campo `id` deve ser CHAR(36) para UUID

## 📋 COMANDOS PARA EXECUTAR NA VPS

### 1. Conectar na VPS via SSH
```bash
ssh root@185.217.125.72
# Senha: UA3485Z43hqvZ@4r
```

### 2. Ir para o diretório do projeto
```bash
cd /root/crm
```

### 3. Verificar se a tabela leads existe
```bash
docker exec crm-mysql mysql protecar_crm -e "SHOW TABLES;"
```

### 4. Se a tabela leads existir, deletá-la
```bash
docker exec crm-mysql mysql protecar_crm -e "DROP TABLE IF EXISTS leads;"
```

### 5. Criar a tabela leads correta
```bash
docker exec crm-mysql mysql protecar_crm <<EOF
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
EOF
```

### 6. Verificar se a tabela foi criada corretamente
```bash
docker exec crm-mysql mysql protecar_crm -e "DESCRIBE leads;"
```

### 7. Reiniciar o backend
```bash
docker compose restart backend
```

### 8. Verificar os logs do backend
```bash
docker logs -f crm-backend
```

### 9. Testar criando um lead pela interface web
Acesse o CRM e tente criar um lead. O erro 500 deve estar resolvido!

---

## 🔄 ALTERNATIVA: Usando o arquivo de migration

Se preferir usar o arquivo já copiado:

```bash
cd /root/crm
cat backend/migrations/021_create_leads_table_complete_mysql.sql | docker exec -i crm-mysql mysql protecar_crm
```

---

## ✅ VERIFICAÇÃO FINAL

Após executar os comandos acima:

1. Acesse o CRM: http://185.217.125.72:3000
2. Faça login
3. Tente criar um novo lead
4. Verifique se o lead foi criado com sucesso (sem erro 500)

---

## 📝 OBSERVAÇÕES

- O arquivo `021_create_leads_table_complete_mysql.sql` já foi copiado para `/root/crm/backend/migrations/`
- A tabela está configurada para usar UUID (CHAR(36)) no campo `id` e `consultor_id`
- Todos os campos necessários estão incluídos: `comissao_indicador`, `ultima_mensagem`, etc.
