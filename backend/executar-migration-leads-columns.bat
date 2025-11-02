@echo off
echo Executando migration para adicionar colunas faltantes na tabela leads...
echo.
docker exec -i crm-mysql mysql -u root -pprotecar_dev_2025 protecar_crm < migrations\019_add_missing_leads_columns.sql
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Migration executada com sucesso!
) else (
    echo.
    echo ❌ Erro ao executar migration!
)
echo.
pause
