// elwebapitool.js for elwebapitool(client side)
// 2020.07.09
// Created by Hiroyuki Fujita
'use strict';

const serverURL = "/elwebapitool/";
let packetId = 0;
let dataLogArray = [];
let deviceDescriptions = {};

let vm = new Vue({
  el: '#app',
  data: {
    // data from config.json
    scheme: "",
    elApiServer: "",
    apiKey: "",
    prefix: "",

    // input or control on GUI
    methodList: ["GET", "PUT", "POST", "DELETE"],
    methodSelected: "GET",
    serviceList: [],
    serviceSelected: "",
    idList: [], // array of deviceId
    idSelected: "",
    deviceType: "",
    resourceTypeList: [],
    resourceTypeSelected: "",
    resourceNameList: [], // array of resource name
    resourceNameSelected:"",
    query: "",
    body: "",
    request: "request",
    statusCode: "status code",
    response: "response",
    rbOrder: "normalOrder",

    packet_list: [],
    
    // CSS
    methodStyle: {color: 'black'},
    serviceStyle: {color: 'black'},
    idStyle: {color: 'black'},
    resourceTypeStyle: {color: 'black'},
    resourceNameStyle: {color: 'black'},
    queryStyle: {color: 'black'},
    bodyStyle: {color: 'black'},

  },
  methods: {
    // settingのアイコンをクリックしたときの処理
    // setting: function () {
    // },

    // SENDボタンがクリックされたときの処理
    buttonClickSend: function () {
      buttonClickSend(this.scheme, this.elApiServer, this.apiKey, this.methodSelected, this.prefix,
        this.serviceSelected, this.idSelected, this.resourceTypeSelected, this.resourceNameSelected,
        this.query, this.body);
    },
    methodIsUpdated: function () {
      methodIsUpdated(this.methodSelected, this.serviceSelected, this.idSelected, this.resourceTypeSelected);
    },
    serviceIsUpdated: function () {
      serviceIsUpdated(this.serviceSelected);
    },
    idIsUpdated: function () {
      idIsUpdated(this.idSelected);
    },
    resourceTypeIsUpdated: function () {
      resourceTypeIsUpdated(this.idSelected, this.resourceTypeSelected);
    },
    resourceNameIsUpdated: function () {
      resourceNameIsUpdated(this.resourceNameSelected);
    },
    updateRbOrder: function () {
      displayLog();
    },
    // CLEARボタンがクリックされたときの処理
    clearLog: function () {
      clearLog();
    },
    // SAVEボタンがクリックされたときの処理
    saveLog: function () {
      saveLog();
    }
  }
});

// connect websocket
console.log('ws://' + document.location.host);
let ws = new WebSocket('ws://' + document.location.host);
ws.onopen = function(event){
  console.log("WebSocket: connected");    
};

// server側のconfig.jsonのデータをリクエストする。その値をvmに設定する。
// XHR 非同期処理
function reqListener() {
  console.log("config.json!:", this.responseText);
  const config = JSON.parse(this.responseText);
  // window.localStorage.setItem('config', this.responseText);
  vm.scheme = config.scheme;
  vm.elApiServer = config.elApiServer;
  vm.apiKey = config.apiKey;
  vm.prefix = config.prefix;
}
let oReq = new XMLHttpRequest();
oReq.addEventListener("load", reqListener);
oReq.open('GET', serverURL + 'config');
oReq.send();

// websocket:受信処理
// index.js内のwebserverがECHONET Lite WebApi serverにRESTでアクセスし、
// そのレスポンスをブラウザーにwebsocketでPUSH通信する。
ws.onmessage = function(event){
  const obj = JSON.parse(event.data);
  console.log("Web socketの受信:");
  console.log(" hostname:", obj.hostname);
  console.log(" path:", obj.path);
  console.log(" method:", obj.method);
  console.log(" status code:", obj.statusCode);
  console.log(" response:", obj.response);
  vm.statusCode = "status code: " + obj.statusCode;
  vm.response = obj.response;

  // ECHONET Lite WebApi Serverからのresponse処理
  let regex; // obj.path でどのREQUESTのRESPONSEであるかを分岐する

  // GET /elapi/v1
  // serviceListを新規に作成する 
  regex = /\/v1$/;   // 正規表現：行末が'/v1'
  if (regex.test(obj.path)) {
    deviceDescriptions = {};  // service listを新規で取得したので、deviceDescriptionsを初期化する
    let serviceList = [""];
    if (obj.response.version !== undefined) {
      for (let service of obj.response.version) {
        serviceList.push("/" + service.name);
      }
    }
    console.log("serviceListの更新:", serviceList);
    vm.serviceList = serviceList;
    // 入力フィールドserviceの表示項目の更新
    vm.serviceSelected = (serviceList[1]) ? serviceList[1] : "";
  }

  // GET /elapi/v1/devices
  // vm.idListにdevice idをpushする 
  regex = /\/devices$/;   // 正規表現：行末が'/devices'
  if (regex.test(obj.path)) {
    deviceDescriptions = {};
    let idList = [""];
    if (obj.response.devices !== undefined) {
      for (let device of obj.response.devices) {
        idList.push("/" + device.id);
      }
    }
    console.log("idListの更新:", idList);
    vm.idList = idList.sort();
    // 入力フィールドidの表示項目の更新
    vm.idSelected = (idList[1]) ? idList[1] : "";
  }

  // GET /elapi/v1/devices/<id>
  // responseはdevice description
  // vm.resourceTypeListにresource typeをpushする
  // vm.resourceNameListにresource nameをpushする
  regex = /\/devices\/([0-9]|[a-z]|[A-Z])+$/; // 正規表現'/devices/'の後、行末まで英数字
  if (regex.test(obj.path)) {
    // device idの取り出し
    const pathElements = obj.path.split('/');  // 最後の要素が device id
    let deviceId = pathElements[pathElements.length - 1];
    // console.log("deviceId:", deviceId);
    deviceDescriptions[deviceId] = obj.response;
    // console.log("deviceDescriptions:", deviceDescriptions);

    // resourceTypeListの処理
    let resourceTypeList = [""];
    if (obj.response.properties !== undefined) {
      resourceTypeList.push("/properties");
    }
    if (obj.response.actions !== undefined) {
      resourceTypeList.push("/actions");
    }
    if (obj.response.events !== undefined) {
      resourceTypeList.push("/events");
    }
    console.log("resourceTypeListの更新:", resourceTypeList);
    vm.resourceTypeList = resourceTypeList;
    
    // 入力フィールドResouce TypeとResource Nameの表示項目の更新
    resourceTypeIsUpdated("/"+deviceId, "/properties");
    vm.resourceTypeSelected = (resourceTypeList[1]) ? resourceTypeList[1] : "";

    // 入力フィールドidの下のdeviceTypeの更新
    vm.deviceType = obj.response.deviceType;
  }
  
  // RESPONSEをLOGに追加
  const packet_id = 'packet-' + packetId++;
  const pkt = {
    id:packet_id,
    timeStamp:timeStamp(),
    direction:"RES",
    data:obj
  }
  dataLogArray.push(pkt);
  displayLog();

};

function displayLog() {
  let log = [];
  for (let dataLog of dataLogArray) {
    let pkt={};
    if (dataLog.direction == 'REQ') { // REQUEST
      pkt = 
        {
          id: dataLog.id,
          timeStamp: dataLog.timeStamp,
          direction: dataLog.direction,
          hex: dataLog.data.method + " https://"+dataLog.data.hostname+dataLog.data.path
        };
    } else { // RESPONSE
      pkt = 
        {
          id: dataLog.id,
          timeStamp: dataLog.timeStamp,
          direction: dataLog.direction,
          statusCode: dataLog.data.statusCode,
          hex: dataLog.data.response
        };
    }
    log.push(pkt);
  }
  if (vm.rbOrder == "reverseOrder") {
    log.reverse();
  }
  vm.packet_list = log;

  // clear packet selection
	// if (this.active_packet_id) {
	// 	$('#' + this.active_packet_id).removeClass('active');
	// 	this.active_packet_id = '';
	// }
}

// ログ用に現在の時刻を取得する
function timeStamp() {
  const date = new Date();
  let hour = date.getHours().toString();
  let minute = date.getMinutes().toString();
  let second = date.getSeconds().toString();
  hour = (hour.length == 1) ? ("0" + hour) : hour;
  minute = (minute.length == 1) ? ("0" + minute) : minute;
  second = (second.length == 1) ? ("0" + second) : second;
  return hour + ":" + minute + ":" + second;
}

// 入力フィールド method の値が変更された場合の処理
function methodIsUpdated(methodSelected, serviceSelected, idSelected, resourceTypeSelected){
  switch (methodSelected) {
    case "GET":
      console.log("GET");
      // serviceとdevice idがblankでなく、device descriptionが存在する場合
      if ((serviceSelected !== "") && (idSelected !== "")){
        const deviceId = idSelected.slice(1); // remove "/" from idSelected
        const deviceDescription = deviceDescriptions[deviceId];

        if (deviceDescription !== undefined) {
          // resourceNameList作成
          let resourceNameList = [""];
          if (deviceDescription.properties !== undefined) {
            for (let propertyName of Object.keys(deviceDescription.properties)) {
              resourceNameList.push("/" + propertyName);
            }
            resourceNameList.sort();
            vm.resourceNameList = resourceNameList;    
          }
        }
      }
      break;
    case "PUT":
      console.log("PUT");
      // serviceとdevice idがblankでなく、device descriptionが存在する場合
      if ((serviceSelected !== "") && (idSelected !== "")){
        const deviceId = idSelected.slice(1); // remove "/" from idSelected
        const deviceDescription = deviceDescriptions[deviceId];

        if (deviceDescription !== undefined) {
          // writableがtrueのものでresourceNameList作成
          let resourceNameList = [""];
          if (deviceDescription.properties !== undefined) {
            for (let propertyName of Object.keys(deviceDescription.properties)) {
              // writable : trueなら
              if (deviceDescription.properties[propertyName].writable === true){
                resourceNameList.push("/" + propertyName);
              }
            }
            resourceNameList.sort();
            vm.resourceNameList = resourceNameList;    
          }
        }
      }
      break;
    case "POST":
      console.log("POST");
      break;
    case "DELETE":
      console.log("DELETE");
      break;
  }
}

// 入力フィールド service の値が変更された場合の処理
function serviceIsUpdated(serviceSelected) {
  console.log("serviceIsUpdated", serviceSelected);
  if (serviceSelected == "") {
    vm.idList = [""];
    vm.resourceTypeList = [""];
    vm.resourceNameList = [""];
    vm.idSelected = "";
    vm.resourceTypeSelected = "";
    vm.resourceNameSelected = "";
    vm.deviceType = "";
  }
}

// 入力フィールド id の値が変更された場合の処理
// 選択されたidのdevice descriptionが存在する場合は、resourceTypeとresourceNameを更新する
function idIsUpdated(idSelected) {
  console.log("idが更新されました。", idSelected);
  if (idSelected == "") {
    vm.resourceTypeList = [""];
    vm.resourceNameList = [""];
    vm.deviceType ="";
  } else {
    vm.resourceTypeList = [""];
    vm.resourceNameList = [""];
    vm.resourceTypeSelected = "";
    vm.resourceNameSelected = "";

    const deviceId = idSelected.slice(1); // remove "/"
    const deviceDescription = deviceDescriptions[deviceId];

    if (deviceDescription !== undefined){
      vm.deviceType = deviceDescription.deviceType;
      // Update resourceTypeList
      let resourceTypeList = [""];
      if (deviceDescription.properties !== undefined) {
        resourceTypeList.push("/properties");
      }
      if (deviceDescription.actions !== undefined) {
        resourceTypeList.push("/actions");
      }
      if (deviceDescription.events !== undefined) {
        resourceTypeList.push("/events");
      }
      console.log("resourceTypeList:", resourceTypeList);
      vm.resourceTypeList = resourceTypeList;
      vm.resourceTypeSelected = (resourceTypeList[1]) ? resourceTypeList[1] : "";
      resourceTypeIsUpdated(idSelected, vm.resourceTypeSelected);
      vm.resourceNameSelected = (vm.resourceNameList[1]) ? vm.resourceNameList[1] : "";
    } else {
      vm.deviceType ="";
    }
  }
}

// 入力フィールド resourceType の値が変更された場合の処理
function resourceTypeIsUpdated(idSelected, resourceTypeSelected) {
  console.log("resourceTypeIsUpdated",resourceTypeSelected);
  if (resourceTypeSelected == "") {
    // resource nameをクリア
    vm.resourceNameList = [""];
  }

  let resourceNameList = [];
  // "Resource Type" で "properties"が選択されたら "Resource Name" に property name を設定
  if (resourceTypeSelected == "/properties") {
    // resourceNameListを作成
    const deviceId = idSelected.slice(1); // remove "/"
    const deviceDescription = deviceDescriptions[deviceId];
    
    // resourceNameListの処理
    resourceNameList = [""];
    if (deviceDescription.properties !== undefined) {
      for (let propertyName of Object.keys(deviceDescription.properties)) {
        resourceNameList.push("/" + propertyName);
      }
      resourceNameList.sort();
      vm.resourceNameList = resourceNameList;    
    }
  }

  // "Resource Type" で "action"が選択されたら "Resource Nmae" に action name を設定
  if (resourceTypeSelected == "/actions") {
    // resourceNameListを作成
    const deviceId = idSelected.slice(1); // remove "/"
    const deviceDescription = deviceDescriptions[deviceId];
      
    // resourceNameListの処理
    resourceNameList = [""];
    if (deviceDescription.actions !== undefined) {
      for (let actionName of Object.keys(deviceDescription.actions)) {
        resourceNameList.push("/" + actionName);
      }
      resourceNameList.sort();
      vm.resourceNameList = resourceNameList;    
    }
  }
  vm.resourceNameSelected = (resourceNameList[1]) ? resourceNameList[1] : "";
}

// 入力フィールド resourceName の値が変更された場合の処理
function resourceNameIsUpdated(resourceNameSelected) {
  console.log("resourceNameIsUpdated",resourceNameSelected);
  // update "display schema"
}

// GUIのSENDボタンをクリックした場合の処理
// 入力データをREST PUT /elwebapitool/send
function buttonClickSend(scheme, elApiServer, apiKey, methodSelected, prefix, 
  serviceSelected, idSelected, resourceTypeSelected, resourceNameSelected, query, body) {
  console.log("SENDボタンがクリックされました。");
  // console.log(" scheme:", scheme,", elApiServer:", elApiServer, ", apiKey:", apiKey);
  // console.log(" methodSelected:", methodSelected, ", prefix:", prefix, ", serviceSelected:", serviceSelected, ", idSelected:", idSelected, ", resourceTypeSelected:", resourceTypeSelected);
  // console.log(" resourceName:", resourceNameSelected, ", query:", query, ", body:", body);
  
  let path = prefix;
  if (serviceSelected !== "") {
    path += serviceSelected;
    if (idSelected !== "") {
      path += idSelected;
      if (resourceTypeSelected !== "") {
        path += resourceTypeSelected;
        if (resourceNameSelected !== "") {
          path += resourceNameSelected;
          if (query !== "") {
            path += ("?"+query);
          }
        }
      }
    }
  }
  // console.log(" path:",path);

  let message = {
    hostname: elApiServer,
    method:   methodSelected, 
    path:     path
  };
  if(methodSelected == "GET"){
     message.headers = { "X-Elapi-key": apiKey };
     message.body    = "";
  }
  if((methodSelected == "PUT")||(methodSelected == "POST")){
    message.headers = {
      "X-Elapi-key":    apiKey,
      "Content-Type":   "application/json",
      "Content-Length": body.length
    };
    message.body = body;
  }

  console.log(" message: ", message);
  const request = new XMLHttpRequest();
  request.open('PUT', serverURL + 'send');
  request.setRequestHeader("Content-type", "application/json");
  request.send(JSON.stringify(message));
  vm.request = message.method + " " + vm.scheme + "://" +message.hostname + message.path;

  // REQUESTをLOGに追加
  const packet_id = 'packet-' + packetId++;
  const pkt = {
    id:packet_id,
    timeStamp:timeStamp(),
    direction:"REQ",
    data:message
  }
  console.log(" pkt:", pkt);
  dataLogArray.push(pkt);
  displayLog();
}

// ログの保存機能
function saveLog() {
  // ログの作成
  let log = "";
  for (let dataLog of dataLogArray) {
    if (dataLog.direction == "REQ") { // REQUESTの場合
      log += dataLog.timeStamp + ",REQ," + dataLog.data.method + "," + vm.scheme + "://" + dataLog.data.hostname + dataLog.data.path;
      if (dataLog.data.body == ""){
        log +=  "\n";
      } else {
        log +=  ",body:" + dataLog.data.body + "\n";
      }
    } else {　// RESPONSEの場合
      log = log + dataLog.timeStamp + ",RES," + dataLog.data.statusCode + "," + JSON.stringify(dataLog.data.response) + "\n";
    }
  }
  // ログ保存をサーバーに依頼
  const message = {log:log};
  const request = new XMLHttpRequest();
  request.open('POST', serverURL + 'saveLog');
  request.setRequestHeader("Content-type", "application/json");
  request.send(JSON.stringify(message));
}

// ログ画面のクリア機能
function clearLog() {
  packetId = 0;
  dataLogArray.length = 0;
  vm.packet_list = [];
}