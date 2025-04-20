FROM node:22-alpine AS builder
ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}
WORKDIR /app
COPY package*.json ./
COPY tsconfig*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}
RUN chown -R node:node /app
USER node
EXPOSE 3000 3001
CMD ["npm", "run", "start:prod"]