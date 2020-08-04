#!/usr/bin/env node

// index.js for ELWebAPITool
// 2020.08.04
// access http://localhost:3010/elwebapitool
// Created by Hiroyuki Fujita
'use strict';

const VERSION = "2019.07.16";
const portNumber = 3010;

let express = require('express');
let app = express();
let server = require('http').Server(app);
const fs = require('fs');
const https = require('https');
const WebSocket = require("ws").Server;
const wss = new WebSocket({ server });
const port = process.env.PORT || portNumber;
let config ={}; // config.json data

// 設定データ(config.json)の読み込み
fs.readFile('config.json', 'utf8', (err, data) => {
  if (err) throw err;
  config = JSON.parse(data);
  console.log("\nconfig.json:", config);
});

// create a folder "log" to save log files, if it doesn't exist
fs.readdir('.', function(err, files){
    if (err) throw err;
    if (files.includes('log') == false) {
        fs.mkdir('log', (err) => {
          if (err) console.log("Error: mkdir");
        });
    }
});

// web serverの起動
server.listen(port, function(){
  console.log("\n******************************************************");
  console.log("*** elwebapitool " + VERSION + ", http://localhost:" + port + " ***");
  console.log("******************************************************\n");
});

// ***** START of <routing for express> *****
// location of static files
app.use(express.static(__dirname + '/html'))

// middleware for express
app.use(express.json());

// *** routing for express ***
// GET /  
app.get('/', function(req, res){
  console.log("\nREST: GET /");
  res.sendFile(__dirname + '/html/index.html');
});

// GET /index
app.get('/index', function(req, res){
  console.log("\nREST: GET /index.html");
  res.sendFile(__dirname + '/html/index.html');
});

// GET /elwebapitool/config
// request config.json data
app.get('/elwebapitool/config', function(req, res){
  console.log("\nREST: GET /elwebapitool/config");
  res.send(config);
});

// PUT /elwebapitool/config
// update config.json data
app.put('/elwebapitool/config', function(req, res){
  console.log("\nREST: PUT /elwebapitool/config\n", req.body.config);
  updateConfig(JSON.stringify(req.body.config));
  res.send("Got a PUT request at /elwebapitool/config");
});

// EL web api serverへのREST送信のリクエスト
app.put('/elwebapitool/send', function(req, res){
  console.log("\nREST: PUT /elwebapitool/send");
  sendRequest(req.body.hostname, req.body.path, req.body.method, req.body.headers, req.body.body);
  res.send("Got a PUT request at /elwebapitool/send");
});

// Log保存リクエスト
app.post('/elwebapitool/saveLog', function(req, res){
  console.log("\nREST: POST /elwebapitool/saveLog");
  saveLog(req.body.log);
  res.send("Got a POST request at /elwebapitool/saveLog");
});
// ***** END of <routing for express> *****

// websocket: A process when WebSocket server gets a connection from a client
wss.on("connection", ws => {
  console.log("WebSocket: connection");
  ws.on("message", message => {
    console.log("Received: " + message);
    if (message === "hello") {
        ws.send("hello from server");
    }
  });
});

// config.jsonのupdate
function updateConfig(data){ // data:config.json用のデータ
  // writeFile config.json
  const buffer = Buffer.from(data);
  fs.writeFile("config.json", buffer, (err) => {
    if (err) console.log("Error: Can not save config.json.");
    console.log('\nconfig.json has been saved!');
  });
}

// ECHONET Lite webApi serverへのREST送信
function sendRequest(hostname, path, method, headers, body) {
  console.log("", method, hostname, path);
  console.log(" headers:", headers);
  if (body != ""){
    console.log(" body:", body);
  }

  const options = {
    hostname: hostname, //'webapiechonet.com'
    path: path,         //'/elapi/v1'
    method: method,     //'GET', 'PUT', 'POST' or 'DELETE'
    headers: headers    // { "X-Elapi-key" : "8cef65ec5f3c85bd8179ee9d1075fe413bbb6a2ad440d27b0be57cc03035471a" }
  };
  
  const req = https.request(options, (res) => {
    console.log(' response statusCode:', res.statusCode);
    let resStr = '';
    res.on('data', (d) => {
      let str = d.toString('utf8'); // response(d)はbuffer dataなので、string(JSON)に変換
      resStr += str;  // 複数回のresponseに対応
    });
    res.on('end', () => {
      console.log(" response:",resStr);
      const data = (resStr == "") ? {} : JSON.parse(resStr);

      // websocket: push to client(web browser)
      wss.clients.forEach((client) => {
        client.send(JSON.stringify({"hostname":hostname, "path":path, "method":method, "statusCode":res.statusCode, "response":data}), (error) => {
          if(error) {
            console.log('Failed to send a message on the WebSocket channel.', error);
          }
        });
      });
    });
  });
  
  req.on('error', (e) => {
    console.error(e);
  });

  // Write data to request-body for PUT or POST
  if ((body !== "") && (body !== undefined)){
    req.write(body);
  }
  req.end();
}

function saveLog(data) {  // string:data
  const date = new Date();
  let year = date.getFullYear();
  let month = (date.getMonth()+1).toString();
  let day = date.getDate().toString();
  let hour = date.getHours().toString();
  let minute = date.getMinutes().toString();
  let second = date.getSeconds().toString();
  month = (month.length == 1) ? ("0" + month) : month;
  day = (day.length == 1) ? ("0" + day) : day;
  hour = (hour.length == 1) ? ("0" + hour) : hour;
  minute = (minute.length == 1) ? ("0" + minute) : minute;
  second = (second.length == 1) ? ("0" + second) : second;
  const filename = "log_" + year + month + day + hour + minute + second  + ".txt";
  
  const buffer = Buffer.from(data);
  fs.writeFile("log/"+filename, buffer, (err) => {
    if (err) console.log("Error: Can not save a log file.");
    console.log('\nA log file is saved!');
  });
}