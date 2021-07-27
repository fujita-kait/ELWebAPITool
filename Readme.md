# ELWebAPITool

2021.07.08

## Abstract

ELWebAPIToolは、ECHONET Lite WebAPIの送受信ツールである。
エコーネットコンソーシアムが運営している実験サーバーへのアクセスを想定している。
このツールを利用して実験サーバーへアクセスするには、実験サーバーのアカウントを作成し、
APIkeyを取得する必要がある。

## Requirements

- Windows PC または Mac
- インターネットに接続できる環境

## Installation

1. [Node.js](https://nodejs.org/ja/) のHPをアクセスし、推奨版をダウンロードしてインストールする
2. 本アプリを[ここ](https://github.com/fujita-kait/ELWebAPITool)からダウンロードし、解凍後適当なフォルダに配置する
3. コマンドプロンプト(PC) またはターミナル(Mac) を起動する
4. コマンドプロンプトまたはターミナルで CD コマンドを使い、zip fileを解凍したフォルダに移動する
5. コマンドプロンプトまたはターミナルで次のコマンドを実行して、必要なモジュールをインストールする

```
  npm i
```

## Launch

1. 次のコマンドを実行して、本アプリを起動する

```
  npm start
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