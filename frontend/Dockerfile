# frontend/Dockerfile
FROM node:18-alpine as build

WORKDIR /app

# package.json と package-lock.json をコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm ci --only=production

# アプリケーションコードをコピー
COPY . .

# 本番ビルド
RUN npm run build

# nginx for serving static files
FROM nginx:alpine

# 静的ファイルをnginxに配置
COPY --from=build /app/build /usr/share/nginx/html

# nginx設定
COPY nginx.conf /etc/nginx/nginx.conf

# Basic認証用の.htpasswdファイルを作成
# Note: Replace with your own credentials
RUN apk add --no-cache apache2-utils && \
    htpasswd -cb /etc/nginx/.htpasswd ${BASIC_AUTH_USER:-user} ${BASIC_AUTH_PASS:-password}

EXPOSE 80

# health check endpoint
RUN echo '<!DOCTYPE html><html><body><h1>OK</h1></body></html>' > /usr/share/nginx/html/health

CMD ["nginx", "-g", "daemon off;"]
