# GitHub Actions - CI/CD

Este diretório contém os workflows do GitHub Actions para CI/CD do projeto.

## Workflows Disponíveis

### 1. `ci-cd.yml`
**Quando executa:** Push e Pull Requests para `main` ou `develop`

**O que faz:**
- Executa testes unitários
- Gera relatório de coverage
- Faz build do projeto
- Cria artefato de build para deploy

### 2. `pull-request.yml`
**Quando executa:** Pull Requests para `main` ou `develop`

**O que faz:**
- Valida que todos os testes passam
- Verifica se o build é bem-sucedido
- Comenta no PR com o resultado dos testes

### 3. `deploy.yml`
**Quando executa:** Push para `main` ou manualmente via `workflow_dispatch`

**O que faz:**
- Faz build do projeto
- Cria pacote de deploy
- Faz upload do artefato
- (Opcional) Deploy automático via SSH

## Configuração

### Variáveis de Ambiente Necessárias

Configure os seguintes secrets no GitHub (Settings > Secrets):

- `DEPLOY_HOST` - Host do servidor de produção
- `DEPLOY_USER` - Usuário SSH para deploy
- `DEPLOY_SSH_KEY` - Chave SSH privada para acesso ao servidor

### Configuração do Servidor

Para habilitar deploy automático, descomente e configure as seções de deploy nos workflows.

## Requisitos para Merge

- ✅ Todos os testes devem passar
- ✅ Build deve ser bem-sucedido
- ✅ Coverage mínimo de 80% (configurável)

## Troubleshooting

### Testes falhando no CI
- Verifique se as variáveis de ambiente estão configuradas
- Verifique os logs do workflow para mais detalhes

### Build falhando
- Verifique se todas as dependências estão no `package.json`
- Verifique se o Prisma Client foi gerado corretamente

### Deploy não executando
- Verifique se os secrets estão configurados
- Verifique se o workflow está habilitado para o branch correto

