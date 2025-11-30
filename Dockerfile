# --- Builder Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Install dependencies sistem yang diperlukan untuk Alpine
# libc6-compat wajib untuk Next.js/Prisma

# 6. Build aplikasi Next.js
RUN npm run build

# --- Production Stage ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

# 7. Copy file hasil build dari stage builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# 8. Fix: Copy file konfigurasi TypeScript yang benar
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3000

CMD ["npm", "start"]