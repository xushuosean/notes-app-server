# 第一阶段：构建阶段
FROM node:lts AS builder

WORKDIR /usr/src/app

# 复制 yarn 的依赖文件
COPY package.json yarn.lock ./

# 设置淘宝镜像源，加速构建
RUN yarn config set registry https://registry.npmmirror.com

# 安装开发依赖
RUN yarn install

# 复制所有源码（避免复制 .git 和 node_modules）
COPY . .

# 构建生产代码
RUN yarn build

# 第二阶段：仅拷贝运行所需部分
FROM node:lts AS production

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# 启动 NestJS（package.json 的 "start:prod"）
CMD ["npm", "run", "start:prod"]
