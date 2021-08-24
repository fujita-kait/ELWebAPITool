<!---
  ELWebAPITool  - User Manual - 
  Date: Aug. 27, @2010(2021)
  Version 1.1.1
  (C)2020-2021 Kanagawa Institute of Technology, ECHONET Consortium ALL RIGHTS RESERVED
-->

# ELWebAPITool

## Abstract

ELWebAPIToolは、ECHONET Lite Web APIの送受信ツールです。
エコーネットコンソーシアムが運営しているECHONET Lite Web API実験クラウドへのアクセスを想定しています。
このツールを利用して実験クラウドへアクセスするには、事前に実験クラウドのアカウントを作成し、
APIキーを取得してください。

## Requirements

- Windows PC または Mac、Linux
- インターネットに接続できる環境

## Installation

1. [Node.js](https://nodejs.org/ja/) のHPをアクセスし、推奨版をダウンロードしてインストールします。
2. 本アーカイブ（zip file）を解凍します。
3. コマンドプロンプト(PC) またはターミナル(Mac) を起動します。
4. このコマンドプロンプトまたはターミナルで CD コマンドを使い、zip fileを解凍したフォルダに移動します。
5. 次のコマンドを実行して、必要なモジュールをインストールします。

```
  npm i
```

## Launch

1. 次のコマンドを実行して、本アプリを起動します。

```
  npm start
```

2. Web Browser（Chrome推奨）を起動し、http://localhost:3010 をアクセスします。  

3. 設定画面（画面右上の歯車アイコンより遷移）でAPI Key（実験クラウドのユーザー登録時に取得したAPIキー）を入力し、「設定保存」ボタンをクリックしてください。

## 使い方

まずは、ホーム画面（画面右上の家アイコンより遷移）の右上の「SEND」ボタンを4回クリックすると、順次ECHONET Lite Web APIのリクエストが発行され、Request & Response Windowにデータ（リクエストやレスポンス）が表示されます。

その後、各項目（Method, Service, Id, Resource Type, Resource Nameら）をプルダウンより選択して順次「SEND」ボタンをクリックすることで、さまざまな API を試すことができます。各項目の値を消去するには、プルダウンメニューの最上位のブランク行を選択してください。

リクエストボディの入力は「Body data」から行いますが、
「Copy from Response」ボタンを使うと、直前に実施したレスポンス内容が「Body data」エリアに転写されますので、その後行うリクエストボディの編集が楽になります。

Request & Response Windowの下にはLog Windowが表示されています。必要に応じて「SAVE」などしてください。展開したフォルダー内の「log」フォルダー内に保存されます。

## 機器エミュレーション

実験クラウドでは、クラウド上でECHONET Lite機器をエミュレーションしています。ツールの設定画面で、エミュレーションしている機器の一覧表示や、エミュレーションする機器の追加・削除を行うことができます。機器を追加するには、「デバイスエミュレーションの設定」の右側にあるプルダウンメニューから使いたい機器を選択し、「デバイス追加」ボタンをクリックしてください。機器の一覧表示を更新するには「UPDATE」ボタンをクリックしてください。

## Note

- 現在、実験クラウドは機器仕様部 Version 1.3.0 対応を実施済みです。機器仕様部 Version 1.3.0 でプロパティが追加・変更された機器を過去に登録し利用している場合、該当デバイスを一度削除して追加しなおす必要があります。
- 設定画面でhttpを選択することができますが、現在実装はしていません。
- 各種APIについては、実験クラウドのユーザーマニュアルや、ECHONET Lite Web APIガイドラインを参照してください。

