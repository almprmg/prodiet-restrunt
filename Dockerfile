FROM node:20-slim
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN mkdir -p uploads && chown -R node:node /usr/src/app
USER node
EXPOSE 4000
CMD ["sh","-c","npx sequelize-cli db:migrate && node server.js"]
