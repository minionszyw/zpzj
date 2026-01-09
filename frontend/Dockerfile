# Stage 1: Build
FROM node:20-slim AS build

WORKDIR /app

# 复制依赖定义
COPY package.json package-lock.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 设置构建参数
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# 执行构建
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

# 复制构建产物到 nginx 目录
COPY --from=build /app/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
