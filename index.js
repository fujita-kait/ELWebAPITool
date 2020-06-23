#!/usr/bin/env node

// index.js for ELWebAPITool
// 2020.06.22
// access http://localhost:3010/elwebapitool

const version = "2019.06.22";

let express = require('express');
let app = express();
let server = require('http').Server(app);
const os = require('os');
const fs = require('fs');
const https = require('https');
const WebSocket = require("ws").Server;
const wss = new WebSocket({ server });

const port = process.env.PORT || 3010;
const elwebapiServer = 'https://webapiechonet.com';

// get local IP address(ipv4)
const localAddress = getLocalAddress();
const ipv4 = localAddress.ipv4[0].address

// create a folder "log" to save log files
fs.readdir('.', function(err, files){
    if (err) throw err;
    if (files.includes('log') == false) {
        fs.mkdir('log', (err) => {
          if (err) console.log("Error: mkdir");
        });
    }
});

server.listen(port, function(){
  console.log("*** elwebapitool " + version + ", http://localhost:" + port + " ***");
});

// location of static files
// app.use(express.static('html'))
app.use(express.static(__dirname + '/html'))

// middleware for express
app.use(express.json());

// routing for express
app.get('/', function(req, res){
  console.log("REST: GET /index.html");
  res.sendFile(__dirname + '/html/index.html');
});

app.get('/index', function(req, res){
  console.log("REST: GET /index.html");
  res.sendFile(__dirname + '/html/index.html');
});

app.get('/elwebapitool/ipv4', function(req, res){
  console.log("REST: GET /elwebapitool/ipv4");
  res.send(ipv4);
});

app.put('/elwebapitool/send', function(req, res){
  console.log("REST: PUT /elwebapitool/send");
  sendRequest();
  // sendUdp(req.body.ip, req.body.uint8Array);
  res.send("Got a PUT request at /elwebapitool/send");
});

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

// Send REST request
function sendRequest() {   // string:uri, string:body
  const options = {
    hostname: 'webapiechonet.com',
    path: '/elapi/v1',
    method: 'GET',
    headers: { "X-Elapi-key" : "8cef65ec5f3c85bd8179ee9d1075fe413bbb6a2ad440d27b0be57cc03035471a" }
  };
  
  const req = https.request(options, (res) => {
    console.log('statusCode:', res.statusCode);
    console.log('headers:', res.headers);
  
    res.on('data', (d) => {
      process.stdout.write(d);
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

// Get Local IP Address
function getLocalAddress() {
    let ifacesObj = {}
    ifacesObj.ipv4 = [];
    ifacesObj.ipv6 = [];
    let interfaces = os.networkInterfaces();
    for (let dev in interfaces) {
        interfaces[dev].forEach(function(details){
            if (!details.internal){
                switch(details.family){
                    case "IPv4":
                        ifacesObj.ipv4.push({name:dev, address:details.address});
                    break;
                    case "IPv6":
                        ifacesObj.ipv6.push({name:dev, address:details.address})
                    break;
                }
            }
        });
    }
    return ifacesObj;
};