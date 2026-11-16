FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci
COPY apps/web apps/web
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ARG NEXT_PUBLIC_ENABLE_LOCAL_DEMO_PASSWORD_RESET=false
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_ENABLE_LOCAL_DEMO_PASSWORD_RESET=$NEXT_PUBLIC_ENABLE_LOCAL_DEMO_PASSWORD_RESET
RUN npm run build -w apps/web
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["npm","run","start"]
