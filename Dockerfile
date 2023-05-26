FROM node:current-alpine

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN npm install --production

COPY . .

EXPOSE 8080

CMD [ "node","index.js" ]