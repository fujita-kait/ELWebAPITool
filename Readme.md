# ELWebAPITool

2020.09.11

## Abstract
ELWebAPIToolは、ECHONET Lite WebAPIの送受信ツールである。
エコーネットコンソーシアムが運営している実験サーバーへのアクセスを想定している。
このツールを利用して実験サーバーへアクセスするには、実験サーバーのアカウントを作成し、
APIkeyを取得する必要がある。

## Requirements
Node.jsがインストールされたWindows PC, Macまたは Linux  

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

## 使い方
まずは、ホーム画面の右上のSENDボタンを４回クリックすると、順次ECHONET Lite WebAPIのリクエストが発行され、Request & Response Windowにデータが表示される。

その後、各項目（Method, Service, Id, Resource Type, Resource Name）を選択してSENDボタンをクリックすることで、さまざまな API を試すことができる。各項目の値を消去するには、プルダウンメニューの最上位のブランクを選択する。

## 機器エミュレーション
実験サーバーでは、サーバー上でECHONET Lite機器をエミュレーションする。このツールの設定画面で、エミュレーションしている機器の表示や、エミュレーションする機器の追加・削除を行うことができる。

## Note
- 設定画面でhttpを選択することができるが、実装はしていない