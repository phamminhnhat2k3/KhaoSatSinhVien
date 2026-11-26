FROM node:24-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install --global pnpm@11.25.0
WORKDIR /app

FROM base AS dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM dependencies AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="mysql://build:build@127.0.0.1:3306/build"
ENV AUTH_SECRET="build-only-secret-not-for-runtime-00000000000000000000000000000000"
ENV APP_URL="http://localhost:3005"
RUN pnpm build

# Compose runs this one-shot service before starting the web application.
FROM build AS migrate
CMD ["pnpm", "db:migrate"]

FROM base AS runner
RUN apt-get update && apt-get install --yes --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3005
ENV HOSTNAME="0.0.0.0"
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
RUN pnpm install --prod --frozen-lockfile
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/public ./public
COPY --from=build /app/assets ./assets
COPY --from=build /app/next.config.ts ./next.config.ts
EXPOSE 3005
CMD ["pnpm", "start", "--", "--hostname", "0.0.0.0", "--port", "3005"]
