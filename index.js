#!/usr/bin/env node

// index.js for ELWebAPITool
// 2020.07.02
// access http://localhost:3010/elwebapitool

const version = "2019.06.29";
const portNumber = 3010;

let express = require('express');
let app = express();
let server = require('http').Server(app);
const os = require('os');
const fs = require('fs');
const https = require('https');
const WebSocket = require("ws").Server;
const wss = new WebSocket({ server });

const port = process.env.PORT || portNumber;
const elwebapiServer = 'https://webapiechonet.com';

let config ={}; // config.json data

// 設定データの読み込み
// read config.json
fs.readFile('config.json', 'utf8', (err, data) => {
  if (err) throw err;
  config = JSON.parse(data);
  console.log("config.json:", config);
});

// create a folder "log" to save log files
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
  console.log("*** elwebapitool " + version + ", http://localhost:" + port + " ***");
});

// location of static files
app.use(express.static(__dirname + '/html'))

// middleware for express
app.use(express.json());

// routing for express
// GET /  
app.get('/', function(req, res){
  console.log("REST: GET /index.html");
  res.sendFile(__dirname + '/html/index.html');
});

// GET /index
app.get('/index', function(req, res){
  console.log("REST: GET /index.html");
  res.sendFile(__dirname + '/html/index.html');
});

// GET /elwebapitool/config
// request config.json data
app.get('/elwebapitool/config', function(req, res){
  console.log("REST: GET /elwebapitool/config");
  res.send(config);
});

// PUT /elwebapitool/config
// request config.json data update
app.put('/elwebapitool/config', function(req, res){
  console.log("REST: PUT /elwebapitool/config");
  updateConfig(req.body.config);
  res.send("Got a PUT request at /elwebapitool/config");
});

// EL web api serverへのREST送信のリクエスト
app.put('/elwebapitool/send', function(req, res){
  console.log("REST: PUT /elwebapitool/send");
  sendRequest(req.body.hostname, req.body.path, req.body.method, req.body.headers);
  // sendUdp(req.body.ip, req.body.uint8Array);
  res.send("Got a PUT request at /elwebapitool/send");
});

// Log保存リクエスト
app.post('/elwebapitool/saveLog', function(req, res){
  console.log("REST: POST /elwebapitool/saveLog");
  saveLog(req.body.log);
  res.send("Got a POST request at /elwebapitool/saveLog");
});

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
function updateConfig(newConfig){ // newConfig:config.json用のデータ
  // writeFile config.json
  const buffer = new Buffer(data);
  fs.writeFile("config.json", buffer, (err) => {
    if (err) console.log("Error: Can not save config.json.");
    console.log('config.json has been saved!');
  });
}

// EL web api serverへのREST送信
function sendRequest(hostname, path, method, headers) {   // string:uri, string:body
  console.log("sendRequest::　hostname:",hostname, ", path:", path, ", method:", method, ", headers:", headers);
  const options = {
    hostname: hostname, //'webapiechonet.com'
    path: path,         //'/elapi/v1'
    method: method,     //'GET'
    headers: headers    // { "X-Elapi-key" : "8cef65ec5f3c85bd8179ee9d1075fe413bbb6a2ad440d27b0be57cc03035471a" }
  };
  
  const req = https.request(options, (res) => {
    console.log('statusCode:', res.statusCode);
    // console.log('headers:', res.headers);
    let resStr = '';
    res.on('data', (d) => {
      // dはbuffer dataなので、string(JSON)に変換
      let str = d.toString('utf8');
      // console.log("response:",str);
      resStr += str;
    });
    res.on('end', () => {
      console.log("response:",resStr);
      // JSONをobjectに変換
      let data = JSON.parse(resStr);
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
  filename = "elwebapitoolLog_" + year + month + day + hour + minute + second  + ".txt";
  
  const buffer = new Buffer(data);
  fs.writeFile("log/"+filename, buffer, (err) => {
    if (err) console.log("Error: Can not save a log file.");
    console.log('The file has been saved!');
  });
}