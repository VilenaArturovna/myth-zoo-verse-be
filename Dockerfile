# syntax=docker/dockerfile:1

FROM node:20-slim AS base
WORKDIR /app

# ---- deps ----
FROM base AS deps
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# ---- dev ----
FROM base AS dev
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000

# ---- build ----
FROM base AS build
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

# ---- prod ----
FROM node:20-slim AS prod
WORKDIR /app
ENV NODE_ENV=production

COPY package.json yarn.lock ./
# В Yarn 1 это ставит только production deps
RUN yarn install --frozen-lockfile --production=true

COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
