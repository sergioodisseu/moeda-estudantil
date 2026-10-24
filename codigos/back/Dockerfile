# Estágio de instalação de dependências
FROM oven/bun:1 AS install
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Estágio de build e execução
FROM oven/bun:1 AS release
WORKDIR /app
COPY --from=install /app/node_modules ./node_modules
COPY . .

# Gera o Prisma Client com base no schema
RUN bunx prisma generate

EXPOSE 3000
USER bun
ENTRYPOINT [ "bun", "run", "src/index.ts" ]