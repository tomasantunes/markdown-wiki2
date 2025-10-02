# markdown-wiki2
NodeJS web application to create a wiki

| ![MarkdownWiki2 Screenshot 1](https://i.imgur.com/P2EYyHC.png) |
|-|

| ![MarkdownWiki2 Screenshot 1](https://i.imgur.com/rks1mPa.png) |
|-|

| ![MarkdownWiki2 Screenshot 2](https://i.imgur.com/Tuwmrs3.png) |
|-|

| ![MarkdownWiki2 Screenshot 3](https://i.imgur.com/yZs8Iqi.png) |
|-|

## How to build
```
npm install
cd frontend
npm install --legacy-peer-deps
pip install bookmarks_parser
```

## How to run
```
Create a secret-config.json file by copying and renaming the secret-config-base.json
Create a config.json file by copying and renaming the file frontend/src/config-base.json
npm run build
Create a sessions.json file by copying and renaming the file sessions-base.json
npm start
Go to localhost:4001
```

## How to create database
Go to PHPMyAdmin and run the SQL file at database/markdownwiki2.sql

## How to run using Docker
```
Install Docker
Install Python 3
Run the following python script: install/config.py
docker build -f docker/Dockerfile.database -t markdownwiki2/database .
docker run -d -p 3307:3306 markdownwiki2/database
docker build -f docker/Dockerfile.application -t markdownwiki2/application .
docker run -d -p 4002:80 markdownwiki2/application
Go to localhost:4002
```