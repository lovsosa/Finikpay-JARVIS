FROM node:18

WORKDIR /home/node/app

COPY package*.json ./

RUN npm install

COPY . .

ENV PORT=3000
ENV TZ=Asia/Almaty

EXPOSE 3000

CMD ["node", "app.js"]

