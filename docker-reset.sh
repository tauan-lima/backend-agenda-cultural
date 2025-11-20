#!/bin/bash

echo "🛑 Parando containers..."
docker-compose down

echo "🗑️  Removendo volume do banco de dados..."
docker volume rm agenda-cultural_pgdata 2>/dev/null || echo "Volume não existe ou já foi removido"

echo "🚀 Iniciando containers novamente..."
docker-compose up --build

