# markdown-wiki2
NodeJS web application to create a wiki

| ![MarkdownWiki2 Screenshot 1](https://i.imgur.com/eIjqRZC.png) |
|-|

| ![MarkdownWiki2 Screenshot 2](https://i.imgur.com/Dkf7K3h.png) |
|-|

## How to build
```
npm install
cd markdown-wiki2-frontend
npm install --legacy-peer-deps
npm run build
```

## How to run
```
Create a secret-config.json file
Go to markdown-wiki2-frontend/src/config.json and check your URLs
npm start
Go to localhost:4001
```

## How to create database
Go to PHPMyAdmin and run the SQL file at database/markdownwiki2.sql

## How to create a secret-config.json file
```
{
    "DB_PASSWORD": "",
    "SESSION_KEY": "XXXXXXXX",
    "SECRET_TOKEN": "XXXXXXXXXXX"
}
```