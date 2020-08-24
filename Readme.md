# ELWebAPITool

2020.08.04

## Abstract
ELWebAPIToolは、ECHONET Lite WebAPIの送受信ツールである。<br>
エコーネットコンソーシアムが運営している実験サーバーへのアクセスを想定している。  

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
3. 設定画面でapiKeyを入力する

## 機器エミュレーション
実験サーバーでは、サーバー上で機器をエミュレートしている。<br>
このツールの設定画面で、エミュレーションしている機器の確認や、エミュレーションする機器の追加や削除をおこなうことができる。

## Note
- 設定画面でhttpを選択することができるが、実装はしていない