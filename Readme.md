# ELWebAPITool

2020.07.03

## Abstract
ELWebAPIToolは、ECHONET Lite WebAPIの送受信ツールである。Node.jsのアプリケーション。  

## Requirements
Node.jsがインストールされたWindows PC, Macまたは Raspberry Pi  

## Installation
1. zip fileを解凍する
2. 解凍したフォルダーに移動し、ターミナルで expressとwsをnpmでインストールする

```
  npm i express
  npm i ws   
```

## Launch
1. 解凍したフォルダーに移動し、ターミナルで以下のコマンドを実行する   

```
  node index.js
```

2. Web Browserを起動し、localhost:3010 をアクセスする  

## Configuration
API keyを変更するには、config.json ファイルを編集する。