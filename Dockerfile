# Stage 1: Build da aplicação React com Vite
FROM node:22-alpine AS build

WORKDIR /app

# Argumento para URL da API em tempo de build (injetável pelo Railway ou Docker)
ARG VITE_API_URL=https://consolida-api.up.railway.app
ENV VITE_API_URL=$VITE_API_URL

COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# Stage 2: Servidor Nginx Alpine para Produção
FROM nginx:alpine

# Remove configuração default estática
RUN rm -f /etc/nginx/conf.d/default.conf

# Template Nginx dinâmico compatível com a variável $PORT do Railway
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Copia os assets compilados do stage 1
COPY --from=build /app/dist /usr/share/nginx/html

# Define porta padrão caso $PORT não seja injetada (Docker local usa 80)
ENV PORT=80

# Inicia processando o template com envsubst e roda o Nginx
CMD ["/bin/sh", "-c", "envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
