# Stage 1: Build the application
FROM node:lts-alpine AS builder

ENV HOME=/usr/src/backend
WORKDIR $HOME

COPY package.json yarn.lock .yarnrc.yml-example ./

RUN mv .yarnrc.yml-example .yarnrc.yml && corepack enable && yarn install

COPY . .

RUN yarn build

# Stage 2: Create the final image
FROM node:lts-alpine

ENV HOME=/usr/src/backend
WORKDIR $HOME

COPY --from=builder $HOME/dist ./dist
COPY --from=builder $HOME/package.json $HOME/yarn.lock $HOME/.yarnrc.yml ./

RUN corepack enable && yarn install 

EXPOSE 3000

CMD ["node", "dist/main"]