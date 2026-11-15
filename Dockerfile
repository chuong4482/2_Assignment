FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

FROM dependencies AS api
COPY apps/api apps/api
RUN npm run db:generate && npm run build -w apps/api
WORKDIR /app/apps/api
ENV NODE_ENV=production
EXPOSE 4000
CMD ["npm", "run", "start:prod"]

FROM dependencies AS web
COPY apps/web apps/web
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ARG NEXT_PUBLIC_ENABLE_LOCAL_DEMO_PASSWORD_RESET=false
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_ENABLE_LOCAL_DEMO_PASSWORD_RESET=$NEXT_PUBLIC_ENABLE_LOCAL_DEMO_PASSWORD_RESET
RUN npm run build -w apps/web
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["npm", "run", "start"]
