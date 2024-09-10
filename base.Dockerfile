FROM node:20-bullseye-slim

WORKDIR /app

COPY . .
COPY ./dataset-reader-v1.0.0.tgz .