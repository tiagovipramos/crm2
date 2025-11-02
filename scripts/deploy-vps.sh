#!/bin/bash
# ==============================================
# SCRIPT: Deploy Automatizado para VPS
# ==============================================
# Script para facilitar o deploy inicial do CRM Protecar em VPS Linux
# Uso: ./scripts/deploy-vps.sh

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
clear
echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║        🚀 CRM PROTECAR - DEPLOY AUTOMATIZADO VPS           ║"
echo "║                                                            ║"
echo "║        Este script irá configurar o sistema completo      ║"
echo "║        em uma VPS Linux para produção                     ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# Função para pausar e aguardar confirmação
pause() {
    echo -e "\n${YELLOW}Pressione ENTER para continuar...${NC}"
    read -r
}

# Função para verificar se comando foi bem sucedido
check_success() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Sucesso!${NC}\n"
        return 0
    else
        echo -e "${RED}❌ Erro! Verifique a mensagem acima.${NC}\n"
        exit 1
    fi
}

# Verificar se está rodando como root ou com sudo
if [ "$EUID" -eq 0 ]; then 
    echo -e "${RED}⚠️  Não execute este script como root!${NC}"
    echo "Execute como usuário normal. O script pedirá sudo quando necessário."
    exit 1
fi

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}ETAPA 1: Verificação do Sistema${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Verificar sistema operacional
echo -e "${CYAN}Verificando sistema operacional...${NC}"
if [ -f /etc/os-release ]; then
    . /etc/os-release
    echo -e "Sistema: ${GREEN}$NAME $VERSION${NC}"
    
    if [[ "$ID" != "ubuntu" ]] && [[ "$ID" != "debian" ]]; then
        echo -e "${YELLOW}⚠️  Atenção: Este script foi testado em Ubuntu/Debian${NC}"
        echo -e "Seu sistema é: $ID"
        echo -e "Continuar? (s/n)"
        read -r resposta
        if [[ "$resposta" != "s" ]] && [[ "$resposta" != "S" ]]; then
            exit 0
        fi
    fi
else
    echo -e "${RED}Não foi possível detectar o sistema operacional${NC}"
    exit 1
fi

# Verificar recursos do sistema
echo -e "\n${CYAN}Verificando recursos do sistema...${NC}"
TOTAL_MEM=$(free -g | awk '/^Mem:/{print $2}')
TOTAL_DISK=$(df -BG / | awk 'NR==2 {print $2}' | sed 's/G//')
CPU_CORES=$(nproc)

echo -e "CPU Cores: ${GREEN}$CPU_CORES${NC}"
echo -e "Memória RAM: ${GREEN}${TOTAL_MEM}GB${NC}"
echo -e "Disco: ${GREEN}${TOTAL_DISK}GB${NC}"

if [ "$TOTAL_MEM" -lt 4 ]; then
    echo -e "${YELLOW}⚠️  Atenção: Memória RAM menor que 4GB. Pode haver problemas de performance.${NC}"
fi

if [ "$TOTAL_DISK" -lt 20 ]; then
    echo -e "${RED}❌ Erro: Disco com menos de 20GB. Insuficiente para o projeto.${NC}"
    exit 1
fi

pause

echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}ETAPA 2: Configuração Inicial${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Coletar informações do usuário
echo -e "${CYAN}Configuração do Domínio:${NC}"
echo -e "Digite o domínio principal (ex: crm.protecar.com.br):"
read -r DOMAIN_MAIN

echo -e "\nDigite o domínio da API (ex: api.protecar.com.br):"
read -r DOMAIN_API

echo -e "\n${CYAN}Seu domínio principal: ${GREEN}$DOMAIN_MAIN${NC}"
echo -e "${CYAN}Seu domínio da API: ${GREEN}$DOMAIN_API${NC}"
echo -e "\nEstá correto? (s/n)"
read -r resposta
if [[ "$resposta" != "s" ]] && [[ "$resposta" != "S" ]]; then
    echo "Execute o script novamente para reconfigurar."
    exit 0
fi

# Gerar senhas fortes
echo -e "\n${CYAN}Gerando senhas fortes...${NC}"
DB_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)
echo -e "${GREEN}✅ Senhas geradas com sucesso${NC}"

pause

echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}ETAPA 3: Atualização do Sistema${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

echo -e "${CYAN}Atualizando lista de pacotes...${NC}"
sudo apt update
check_success

echo -e "${CYAN}Atualizando pacotes instalados...${NC}"
sudo apt upgrade -y
check_success

echo -e "${CYAN}Instalando ferramentas essenciais...${NC}"
sudo apt install -y curl git vim wget ufw net-tools htop
check_success

pause

echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}ETAPA 4: Configuração do Firewall${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

echo -e "${CYAN}Configurando UFW (Uncomplicated Firewall)...${NC}"
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
check_success

echo -e "${CYAN}Status do Firewall:${NC}"
sudo ufw status numbered

pause

echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}ETAPA 5: Configuração de Swap${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Verificar se já existe swap
SWAP_CURRENT=$(free -h | awk '/^Swap:/{print $2}')
echo -e "Swap atual: ${GREEN}$SWAP_CURRENT${NC}"

if [[ "$SWAP_CURRENT" == "0B" ]] || [[ "$SWAP_CURRENT" == "0" ]]; then
    echo -e "${CYAN}Criando arquivo de swap de 2GB...${NC}"
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    check_success
    echo -e "Novo swap: ${GREEN}$(free -h | awk '/^Swap:/{print $2}')${NC}"
else
    echo -e "${GREEN}✅ Swap já configurado${NC}"
fi

pause

echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}ETAPA 6: Instalação do Docker${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Verificar se Docker já está instalado
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ Docker já está instalado${NC}"
    docker --version
else
    echo -e "${CYAN}Instalando Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
    check_success
    
    echo -e "${CYAN}Adicionando usuário ao grupo docker...${NC}"
    sudo usermod -aG docker $USER
    check_success
    
    echo -e "${YELLOW}⚠️  IMPORTANTE: Execute 'newgrp docker' após o script ou faça logout/login${NC}"
fi

pause

echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}ETAPA 7: Instalação do Docker Compose${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Verificar se Docker Compose já está instalado
if command -v docker compose &> /dev/null; then
    echo -e "${GREEN}✅ Docker Compose já está instalado${NC}"
    docker compose version
else
    echo -e "${CYAN}Instalando Docker Compose...${NC}"
    sudo apt install -y docker-compose-plugin
    check_success
fi

pause

echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}ETAPA 8: Configuração do Docker${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

echo -e "${CYAN}Criando configuração do Docker para produção...${NC}"
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF
check_success

echo -e "${CYAN}Reiniciando Docker...${NC}"
sudo systemctl restart docker
check_success

pause

echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}ETAPA 9: Configuração do Projeto${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Verificar se estamos no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Erro: docker-compose.yml não encontrado!${NC}"
    echo "Execute este script a partir do diretório raiz do projeto."
    exit 1
fi

echo -e "${CYAN}Criando arquivo .env de produção...${NC}"

# Criar backup do .env.production se existir
if [ -f "backend/.env.production" ]; then
    cp "backend/.env.production" "backend/.env.production.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${YELLOW}Backup do .env.production anterior criado${NC}"
fi

# Criar novo arquivo .env.production
cat > backend/.env.production << EOF
# ==============================================
# CONFIGURAÇÃO DE PRODUÇÃO - CRM PROTECAR
# ==============================================
# Gerado automaticamente em: $(date)

# ==============================================
# SERVIDOR
# ==============================================
PORT=3001
NODE_ENV=production

# ==============================================
# BANCO DE DADOS MYSQL
# ==============================================
DB_HOST=mysql
DB_PORT=3306
DB_NAME=protecar_crm
DB_USER=protecar_user
DB_PASSWORD=$DB_PASSWORD

# ==============================================
# AUTENTICAÇÃO JWT
# ==============================================
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d

# ==============================================
# FRONTEND E CORS
# ==============================================
FRONTEND_URL=https://$DOMAIN_MAIN

# ==============================================
# UPLOADS
# ==============================================
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# ==============================================
# LOGS E DEBUG
# ==============================================
LOG_LEVEL=warn
DEBUG=false

# ==============================================
# SEGURANÇA
# ==============================================
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000
HELMET_ENABLED=true

# ==============================================
# WHATSAPP
# ==============================================
WHATSAPP_SESSION_PATH=./whatsapp-session
EOF

check_success

# Criar .env na raiz também
cat > .env << EOF
NODE_ENV=production
DB_PASSWORD=$DB_PASSWORD
DB_NAME=protecar_crm
DB_USER=protecar_user
DB_PORT=3306
PORT=3001
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://$DOMAIN_MAIN
NEXT_PUBLIC_API_URL=https://$DOMAIN_API
EOF

echo -e "${CYAN}Salvando credenciais em arquivo seguro...${NC}"
cat > CREDENCIAIS_PRODUCAO.txt << EOF
# ==============================================
# CREDENCIAIS DE PRODUÇÃO - CRM PROTECAR
# ==============================================
# GUARDE ESTE ARQUIVO EM LOCAL SEGURO!
# NÃO COMMITE NO GIT!
# Gerado em: $(date)

DOMÍNIO PRINCIPAL: https://$DOMAIN_MAIN
DOMÍNIO API: https://$DOMAIN_API

BANCO DE DADOS:
  Host: mysql (interno ao Docker)
  Port: 3306
  Database: protecar_crm
  User: protecar_user
  Password: $DB_PASSWORD

JWT SECRET: $JWT_SECRET

USUÁRIO ADMIN PADRÃO:
  Email: admin@protecar.com.br
  Senha: admin123
  IMPORTANTE: ALTERE A SENHA APÓS PRIMEIRO LOGIN!

IP DO SERVIDOR: $(curl -s ifconfig.me || echo "Não detectado")
EOF

chmod 600 CREDENCIAIS_PRODUCAO.txt
echo -e "${GREEN}✅ Credenciais salvas em CREDENCIAIS_PRODUCAO.txt${NC}"

pause

echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}ETAPA 10: Tornar Scripts Executáveis${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

echo -e "${CYAN}Dando permissão de execução para scripts...${NC}"
chmod +x scripts/*.sh
check_success

pause

echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}ETAPA 11: Build e Inicialização do Sistema${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

echo -e "${CYAN}Fazendo build das imagens Docker (pode levar alguns minutos)...${NC}"
NODE_ENV=production docker compose build
check_success

echo -e "${CYAN}Iniciando serviços em modo produção...${NC}"
./scripts/start.sh prod
check_success

echo -e "${CYAN}Aguardando MySQL inicializar (30 segundos)...${NC}"
sleep 30

pause

echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}ETAPA 12: Configuração do Banco de Dados${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

echo -e "${CYAN}Executando migrations...${NC}"
./scripts/migrate.sh
check_success

echo -e "${CYAN}Criando usuário admin...${NC}"
./scripts/seed.sh
check_success

pause

echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}ETAPA 13: Verificação de Saúde${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

echo -e "${CYAN}Executando health check...${NC}"
./scripts/health-check.sh

pause

echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}ETAPA 14: Instalação do Nginx${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

echo -e "${CYAN}Instalando Nginx...${NC}"
sudo apt install -y nginx
check_success

echo -e "${CYAN}Iniciando e habilitando Nginx...${NC}"
sudo systemctl start nginx
sudo systemctl enable nginx
check_success

pause

echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}ETAPA 15: Configuração do Nginx${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

echo -e "${CYAN}Criando configuração do Nginx...${NC}"
sudo tee /etc/nginx/sites-available/crm-protecar > /dev/null << EOF
# CRM PROTECAR - FRONTEND
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN_MAIN www.$DOMAIN_MAIN;
    
    access_log /var/log/nginx/crm-access.log;
    error_log /var/log/nginx/crm-error.log;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

# CRM PROTECAR - BACKEND API
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN_API;
    
    access_log /var/log/nginx/crm-api-access.log;
    error_log /var/log/nginx/crm-api-error.log;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        client_max_body_size 10M;
    }
}
EOF
check_success

echo -e "${CYAN}Ativando site...${NC}"
sudo ln -sf /etc/nginx/sites-available/crm-protecar /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
check_success

pause

echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}ETAPA 16: Configuração de Backup Automático${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

echo -e "${CYAN}Criando script de backup automático...${NC}"
cat > scripts/cron-backup.sh << 'EOFSCRIPT'
#!/bin/bash
cd "$(dirname "$0")/.."
./scripts/backup-db.sh "auto_$(date +\%Y\%m\%d)"
find backups/ -name "auto_*.sql.gz" -mtime +30 -delete
echo "[$(date)] Backup automático executado" >> /var/log/crm-backup.log
EOFSCRIPT

chmod +x scripts/cron-backup.sh
check_success

echo -e "${CYAN}Configurando cron para backup diário às 2h...${NC}"
(crontab -l 2>/dev/null; echo "0 2 * * * $(pwd)/scripts/cron-backup.sh >> /var/log/crm-backup.log 2>&1") | crontab -
check_success

pause

echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}ETAPA 17: Configuração SSL (Let's Encrypt)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}⚠️  IMPORTANTE: Antes de continuar, certifique-se que:${NC}"
echo -e "   1. Os domínios $DOMAIN_MAIN e $DOMAIN_API estão apontando para este servidor"
echo -e "   2. As portas 80 e 443 estão abertas no firewall"
echo -e "   3. Você tem acesso a um email válido para registro no Let's Encrypt"
echo -e "\nDeseja instalar certificados SSL agora? (s/n)"
read -r resposta

if [[ "$resposta" == "s" ]] || [[ "$resposta" == "S" ]]; then
    echo -e "\n${CYAN}Instalando Certbot...${NC}"
    sudo apt install -y certbot python3-certbot-nginx
    check_success
    
    echo -e "\n${CYAN}Obtendo certificado para $DOMAIN_MAIN...${NC}"
    sudo certbot --nginx -d $DOMAIN_MAIN -d www.$DOMAIN_MAIN
    
    echo -e "\n${CYAN}Obtendo certificado para $DOMAIN_API...${NC}"
    sudo certbot --nginx -d $DOMAIN_API
    
    echo -e "\n${CYAN}Testando renovação automática...${NC}"
    sudo certbot renew --dry-run
    check_success
else
    echo -e "${YELLOW}Você pode instalar SSL depois executando:${NC}"
    echo -e "sudo certbot --nginx -d $DOMAIN_MAIN -d www.$DOMAIN_MAIN"
    echo -e "sudo certbot --nginx -d $DOMAIN_API"
fi

pause

# Resumo final
clear
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║        ✅ DEPLOY CONCLUÍDO COM SUCESSO! ✅                  ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📊 INFORMAÇÕES DO SISTEMA${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

echo -e "${CYAN}URLs de Acesso:${NC}"
echo -e "  Frontend: ${GREEN}https://$DOMAIN_MAIN${NC}"
echo -e "  Backend API: ${GREEN}https://$DOMAIN_API${NC}"
echo -e "  Health Check: ${GREEN}https://$DOMAIN_API/api/health${NC}"
echo ""

echo -e "${CYAN}Credenciais Admin Padrão:${NC}"
echo -e "  Email: ${GREEN}admin@protecar.com.br${NC}"
echo -e "  Senha: ${GREEN}admin123${NC}"
echo -e "  ${RED}⚠️  ALTERE A SENHA APÓS PRIMEIRO LOGIN!${NC}"
echo ""

echo -e "${CYAN}Arquivos Importantes:${NC}"
echo -e "  Credenciais: ${GREEN}$(pwd)/CREDENCIAIS_PRODUCAO.txt${NC}"
echo -e "  Configuração: ${GREEN}$(pwd)/backend/.env.production${NC}"
echo -e "  Backups: ${GREEN}$(pwd)/backups/${NC}"
echo ""

echo -e "${CYAN}Comandos Úteis:${NC}"
echo -e "  Ver logs: ${YELLOW}./scripts/logs.sh all${NC}"
echo -e "  Health check: ${YELLOW}./scripts/health-check.sh${NC}"
echo -e "  Reiniciar: ${YELLOW}./scripts/restart.sh prod${NC}"
echo -e "  Parar: ${YELLOW}./scripts/stop.sh${NC}"
echo -e "  Backup: ${YELLOW}./scripts/backup-db.sh nome_backup${NC}"
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📋 PRÓXIMOS PASSOS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

echo -e "1. ${YELLOW}Acessar o sistema e alterar senha do admin${NC}"
echo -e "2. ${YELLOW}Criar usuários consultores${NC}"
echo -e "3. ${YELLOW}Configurar WhatsApp${NC}"
echo -e "4. ${YELLOW}Importar leads${NC}"
echo -e "5. ${YELLOW}Testar todas as funcionalidades${NC}"
echo -e "6. ${YELLOW}Ler a documentação completa em DEPLOY-VPS-COMPLETO.md${NC}"
echo ""

echo -e "${GREEN}🎉 Seu CRM Protecar está rodando em produção!${NC}\n"

echo -e "${YELLOW}💡 Dica: Guarde o arquivo CREDENCIAIS_PRODUCAO.txt em local seguro!${NC}\n"
