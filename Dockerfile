FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY . .
RUN mkdir -p data && echo '[]' > data/todos.json
EXPOSE 3111
ENV PORT=3111
CMD ["node", "server.js"]
