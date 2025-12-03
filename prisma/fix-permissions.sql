-- Script para verificar e corrigir permissões do PostgreSQL
-- Execute este script como superusuário (postgres) no banco de dados

-- Verificar permissões atuais
SELECT
    has_schema_privilege('postgres', 'pg_catalog', 'USAGE') as has_pg_catalog_usage,
    has_schema_privilege('postgres', 'information_schema', 'USAGE') as has_information_schema_usage;

-- Conceder permissões necessárias (execute apenas se as verificações acima retornarem false)
-- GRANT USAGE ON SCHEMA pg_catalog TO postgres;
-- GRANT SELECT ON ALL TABLES IN SCHEMA pg_catalog TO postgres;
-- GRANT USAGE ON SCHEMA information_schema TO postgres;
-- GRANT SELECT ON ALL TABLES IN SCHEMA information_schema TO postgres;

-- Verificar novamente após conceder permissões
SELECT
    has_schema_privilege('postgres', 'pg_catalog', 'USAGE') as has_pg_catalog_usage,
    has_schema_privilege('postgres', 'information_schema', 'USAGE') as has_information_schema_usage;

