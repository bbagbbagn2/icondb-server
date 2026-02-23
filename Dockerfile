FROM node:18-alpine

WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm ci --only=production

# 소스코드 복사
COPY . .

# 포트 노출
EXPOSE 5000

# 환경변수
ENV NODE_ENV=production

# 서버 시작
CMD ["npm", "start"]
