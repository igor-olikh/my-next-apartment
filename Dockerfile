FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm test && npm run build
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD ["npx", "tsx", "src/server/main.ts"]
