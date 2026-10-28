FROM node:22
ENV TZ="America/Sao_Paulo"

WORKDIR /app

COPY . /app

RUN npm install serve -g

RUN yarn install

RUN npm run build

EXPOSE 4902

CMD ["npm", "run", "serve"]