# 第一阶段：构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /usr/src/app

# 复制包管理文件
COPY package*.json ./
COPY yarn.lock ./

# 安装依赖（包括devDependencies）
RUN npm ci

# 复制所有源代码
COPY . .

# 运行构建
RUN npm run build

# 第二阶段：生产运行阶段
FROM node:18-alpine AS production

# 设置工作目录
WORKDIR /usr/src/app

# 从构建阶段复制必要的文件
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

# 设置环境变量
ENV NODE_ENV production
ENV PORT 3000

# 暴露端口
EXPOSE 3000

# 启动命令 - 使用你package.json中的start:prod脚本
CMD ["npm", "run", "start:prod"]