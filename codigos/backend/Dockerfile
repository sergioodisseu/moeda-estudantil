FROM oven/bun:1 AS base
WORKDIR /app

# Prisma (schema-engine) precisa de OpenSSL; a imagem slim não o traz.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json ./
RUN bunx prisma generate

COPY src ./src
COPY tests ./tests

ENV NODE_ENV=production
EXPOSE 3000
CMD ["bun", "src/main.ts"]
