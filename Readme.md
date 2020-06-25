# ELWebAPITool

2020.06.22 v0.1.0 release    

## Abstract
ELWebAPIToolは、ECHONET Lite WebAPIの送受信ツールである。Node.jsのアプリケーション。  

## Requirements
Node.jsがインストールされたWindows PC, Macまたは Raspberry Pi  

## Installation
ターミナルで "npm i -g elwebapi" を実行する

## Launch
1. ターミナルで "elwebapi" を実行する   
2. Web Browserを起動し、localhost:3010 をアクセスする  
3. ELWebAPIToolのGUIが表示される(Fig. 1)  

![gui1](https://raw.githubusercontent.com/KAIT-HEMS/ssng-node/master/_graphics/gui1.png "gui1")  
<div style="text-align: center;">Fig.1 GUI of SSNG</div>

## How to use
### 基本的な使い方
　IP Address, DEOJ, ESV, EPC, EDTのデータ入力欄に値を入力し、SENDボタンをクリックするとECHONET Liteコマンドが送信される。受信したECHONET LiteデータはPackets monitor areaに自動的に表示される。  

### IP Address 入力欄
　IPv4形式の値を入力する。  

### ECHONET Lite Data 入力欄
　16進数(HEX)の値を入力する。"0x"は省略可能。  
　TIDは0x0001から始まり、コマンドを送信するごとに自動でインクリメントされる。OPCは0x01の固定値。PDCはEDTから自動で計算される。EDTが２バイト以上の場合は、0xAA33FF のような値を入力する。EDTが不要なESVの場合、EDT入力欄のデータは無視される。  

### Free Data 入力欄
　OPC=2以上のコマンドを送る場合や、ECHONET Liteとしては正しくないコマンドを送る場合は、Free Data 入力欄を利用する。ラジオボタンでFree Dataを選択するとFree Data を入力できるようになる。入力するデータのフォーマットは、コンマで区切られた１バイトデータ（0xを省略したの16進数）である。

### SEND ボタン
　その時点で選択されている入力欄のデータを用いてECHONET Liteコマンドを送信する。

### SEARCH ボタン
　機器探索のためのコマンドを送信する。

### CLEAR ボタン
　Packets monitor表示欄をクリアする。

### SAVE ボタン
　Packets monitor表示欄のデータをファイルとして保存する。保存先はホームディレクトリで、ファイル名は以下のように "ssngLog\_" の後にtimestamp(YYYYMMDDHHMMSS)を付加したものである。
>　ssngLog_20180625161502.txt

## Packets monitor display area

Packets monitor表示エリアには、送信・受信したデータが表示される。第１コラムはタイムスタンプ、第２コラムは送受信を示す記号(T:送信/R:受信)、第３コラムはECHONET Liteパケットである。   
Packets monitor headerにはデータ表示を制御するチェックボックスやラジオボタンが存在する。

### Order radio button (Normal, Reverse)
ログデータの表示の順序をコントロールするラジオボタンである。Normalを選択すると時間軸は下向き、Reverseを選択すると時間軸は上向きとなる。

### Filter check box (GET, INF, GET_RES, SNA)
受信データのESVの値によって表示にフィルタをかける。チェックをはずすと非表示となる。
