FROM node:20-alpine

WORKDIR /app

# Argumento de build para DATABASE_URL
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma.config.ts ./
COPY tsconfig.json ./
COPY prisma ./prisma

# Instalar dependências
RUN npm ci

# Gerar Prisma Client (usa DATABASE_URL do build arg)
RUN npx prisma generate

# Copiar código fonte
COPY . .

# Expor porta
EXPOSE 3000

# Comando padrão (pode ser sobrescrito pelo docker-compose)
CMD ["npm", "run", "dev"]

