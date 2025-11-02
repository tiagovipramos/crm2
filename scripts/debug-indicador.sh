#!/bin/bash

echo "=================================="
echo "🔍 DEBUG COMPLETO - SISTEMA INDICADOR"
echo "=================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Verificar containers Docker
echo -e "${BLUE}1. STATUS DOS CONTAINERS DOCKER${NC}"
echo "-----------------------------------"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# 2. Verificar logs recentes do backend
echo -e "${BLUE}2. ÚLTIMOS 30 LOGS DO BACKEND${NC}"
echo "-----------------------------------"
docker logs crm-backend --tail=30 2>&1
echo ""

# 3. Verificar logs recentes do frontend
echo -e "${BLUE}3. ÚLTIMOS 30 LOGS DO FRONTEND${NC}"
echo "-----------------------------------"
docker logs crm-frontend --tail=30 2>&1
echo ""

# 4. Testar conexão com banco de dados
echo -e "${BLUE}4. TESTE DE CONEXÃO COM BANCO DE DADOS${NC}"
echo "-----------------------------------"
docker exec crm-mysql mysql -uroot -proot123 -e "SELECT 'MySQL está funcionando!' as Status;" 2>&1
echo ""

# 5. Verificar estrutura da tabela de indicadores
echo -e "${BLUE}5. ESTRUTURA DA TABELA INDICADORES${NC}"
echo "-----------------------------------"
docker exec crm-mysql mysql -uroot -proot123 protecar_crm -e "DESCRIBE indicadores;" 2>&1
echo ""

# 6. Contar indicadores cadastrados
echo -e "${BLUE}6. TOTAL DE INDICADORES CADASTRADOS${NC}"
echo "-----------------------------------"
docker exec crm-mysql mysql -uroot -proot123 protecar_crm -e "SELECT COUNT(*) as Total FROM indicadores;" 2>&1
echo ""

# 7. Listar indicadores ativos
echo -e "${BLUE}7. INDICADORES ATIVOS (últimos 5)${NC}"
echo "-----------------------------------"
docker exec crm-mysql mysql -uroot -proot123 protecar_crm -e "SELECT id, nome, email, ativo, created_at FROM indicadores WHERE ativo = TRUE ORDER BY created_at DESC LIMIT 5;" 2>&1
echo ""

# 8. Verificar tabela followup_mensagens (coluna hora_envio)
echo -e "${BLUE}8. ESTRUTURA DA TABELA FOLLOWUP_MENSAGENS${NC}"
echo "-----------------------------------"
docker exec crm-mysql mysql -uroot -proot123 protecar_crm -e "DESCRIBE followup_mensagens;" 2>&1
echo ""

# 9. Testar endpoint de login do indicador
echo -e "${BLUE}9. TESTE DO ENDPOINT DE LOGIN${NC}"
echo "-----------------------------------"
curl -X POST http://localhost:3001/api/indicador/login \
  -H "Content-Type: application/json" \
  -d '{"email":"indicador@vipseg.org","senha":"123456"}' \
  -w "\nHTTP Status: %{http_code}\n" 2>&1
echo ""

# 10. Testar endpoint de dashboard (sem token)
echo -e "${BLUE}10. TESTE DO ENDPOINT DE DASHBOARD (sem autenticação)${NC}"
echo "-----------------------------------"
curl -X GET http://localhost:3001/api/indicador/dashboard \
  -w "\nHTTP Status: %{http_code}\n" 2>&1
echo ""

# 11. Verificar uso de memória dos containers
echo -e "${BLUE}11. USO DE RECURSOS DOS CONTAINERS${NC}"
echo "-----------------------------------"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" crm-mysql crm-backend crm-frontend 2>&1
echo ""

# 12. Verificar conectividade de rede
echo -e "${BLUE}12. TESTE DE CONECTIVIDADE${NC}"
echo "-----------------------------------"
echo "Frontend (porta 3000):"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:3000 2>&1
echo ""
echo "Backend (porta 3001):"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:3001 2>&1
echo ""

# 13. Verificar últimas indicações criadas
echo -e "${BLUE}13. ÚLTIMAS 5 INDICAÇÕES CRIADAS${NC}"
echo "-----------------------------------"
docker exec crm-mysql mysql -uroot -proot123 protecar_crm -e "SELECT i.id, i.indicador_id, i.nome_indicado, i.telefone_indicado, i.status, i.data_indicacao FROM indicacoes i ORDER BY i.data_indicacao DESC LIMIT 5;" 2>&1
echo ""

# 14. Verificar saldos dos indicadores
echo -e "${BLUE}14. RESUMO DE SALDOS DOS INDICADORES${NC}"
echo "-----------------------------------"
docker exec crm-mysql mysql -uroot -pprotecar_dev_2025 protecar_crm -e "SELECT nome, email, saldo_disponivel as Disponivel, saldo_bloqueado as Bloqueado, saldo_perdido as Perdido, total_indicacoes, indicacoes_respondidas, indicacoes_convertidas FROM indicadores ORDER BY data_criacao DESC LIMIT 5;" 2>&1
echo ""

# 15. Verificar processos Node.js
echo -e "${BLUE}15. PROCESSOS NODE.JS NOS CONTAINERS${NC}"
echo "-----------------------------------"
echo "Backend:"
docker exec crm-backend ps aux | grep node 2>&1
echo ""
echo "Frontend:"
docker exec crm-frontend ps aux | grep node 2>&1
echo ""

# 16. Espaço em disco
echo -e "${BLUE}16. ESPAÇO EM DISCO${NC}"
echo "-----------------------------------"
df -h | grep -E "(Filesystem|/$|/var)" 2>&1
echo ""

# 17. Verificar variáveis de ambiente do backend
echo -e "${BLUE}17. VARIÁVEIS DE AMBIENTE DO BACKEND (sem senhas)${NC}"
echo "-----------------------------------"
docker exec crm-backend printenv | grep -E "(NODE_ENV|PORT|DB_HOST|DB_NAME|DB_USER|FRONTEND_URL)" | sort 2>&1
echo ""

# 18. Última atualização do código
echo -e "${BLUE}18. ÚLTIMA ATUALIZAÇÃO DO CÓDIGO (GIT)${NC}"
echo "-----------------------------------"
git log -1 --pretty=format:"Commit: %h%nAutor: %an%nData: %ad%nMensagem: %s%n" 2>&1
echo ""

# 19. Verificar portas em uso
echo -e "${BLUE}19. PORTAS EM USO${NC}"
echo "-----------------------------------"
netstat -tlnp | grep -E "(3000|3001|3306)" 2>&1
echo ""

# 20. Resumo final
echo -e "${GREEN}=================================="
echo "✅ DEBUG COMPLETO FINALIZADO"
echo "==================================${NC}"
echo ""
echo "📊 Para salvar este relatório em arquivo, execute:"
echo "   ./scripts/debug-indicador.sh > debug-report-\$(date +%Y%m%d-%H%M%S).txt"
echo ""
