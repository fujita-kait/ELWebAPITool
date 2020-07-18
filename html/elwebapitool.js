// elwebapitool.js for elwebapitool(client side)
// 2020.07.18
// Created by Hiroyuki Fujita
'use strict';

const g_serverURL = "/elwebapitool/";
let g_packetId = 0;
let g_dataLogArray = [];
let g_deviceInfo ={}; 
  // {<deviceId>:{
  //   "deviceType":<deviceType>, 
  //   "propertyList":[<resourceName>], 
  //   "propertyListWritable":[<resourceName>]
  //   "actionList":[<resourceName>]}}
let g_idList =[]; // [<deviceId>]

// 起動時の処理
// GET /v1/devices を実行し、g_idListを作成する
// window.onload = (event) => {
//   accessElServer(vm.scheme, vm.elApiServer, vm.apiKey, "GET", vm.prefix, "/devices", "", "", "", "", "")
// };

// component:template_homeの定義
const template_home = {
  template:'#tmpl-page-home',
  data:() => {return (bind_data);},
  methods: {
    // SENDボタンがクリックされたときの処理
    sendButtonIsClicked: function () {
      console.log("SENDボタンがクリックされました。");
      // ECHONET Lite WebApi serverにアクセスする
      const message = accessElServer(this.scheme, this.elApiServer, this.apiKey, 
        this.methodSelected, this.prefix, this.serviceSelected, this.idSelected, 
        this.resourceTypeSelected, this.resourceNameSelected, this.query, this.body);

      // REQUEST表示エリアのデータ設定
      this.request = message.method + " " + this.scheme + "://" +message.hostname + message.path;
    
      // REQUESTをLOGに追加
      g_dataLogArray.push({
        id:'packet-' + g_packetId++,
        timeStamp:timeStamp(),
        direction:"REQ",
        data:message
      });

      // ログを表示
      displayLog();
    },

    // 入力フィールド Method の値が変更された場合の処理
    // resourceTypeListとresourceNameListをupdate
    methodIsUpdated: function () {
      // serviceとdevice idがblankでなく、device descriptionが存在する場合
      if ((this.serviceSelected !== "") && (this.idSelected !== "")) {
        const deviceId = this.idSelected.slice(1); // remove "/" from idSelected
        let resourceNameList = [""];
        if (g_deviceInfo[deviceId] !== undefined) {
          switch (this.methodSelected) {
            case "GET":
              resourceNameList = g_deviceInfo[deviceId].propertyList;
              vm.resourceTypeSelected = "/properties";
              break;
            case "PUT":
              resourceNameList = g_deviceInfo[deviceId].propertyListWritable;
              vm.resourceTypeSelected = "/properties";
              break;
            case "POST":
              resourceNameList = g_deviceInfo[deviceId].actionList;
              vm.resourceTypeSelected = "/actions";
              break;
            case "DELETE":
              break;
          }
          if (vm.resourceTypeSelected !== ""){
            vm.resourceNameList = resourceNameList;
            vm.resourceNameSelected = "";
          }
        }
      }
    },

    // 入力フィールド service の値が変更された場合の処理
    // ""が選択されたら、入力フィールドのId, Resource Type, Resource Name, queryをブランクにする
    // devicesが選択されたらg_idListを更新する
    serviceIsUpdated: function () {
      if (this.serviceSelected == "") {
        vm.idList = [""];
        vm.resourceTypeList = [""];
        vm.resourceNameList = [""];
        vm.idSelected = "";
        vm.resourceTypeSelected = "";
        vm.resourceNameSelected = "";
        vm.deviceType = "";
      } else {
        vm.idList = g_idList;
      }
    },

    // 入力フィールド id の値が変更された場合の処理
    // 選択されたidのdevice descriptionが存在する場合は、resourceTypeとresourceNameを更新する
    idIsUpdated: function () {
      const idSelected=this.idSelected;
      vm.resourceTypeList = [""];
      vm.resourceNameList = [""];
      vm.deviceType ="";
      vm.resourceTypeSelected = "";
      vm.resourceNameSelected = "";

      const deviceId = idSelected.slice(1); // remove "/"
      const deviceInfo = g_deviceInfo[deviceId];
      if (deviceInfo !== undefined){
        vm.deviceType = deviceInfo.deviceType;
        let resourceTypeList = [""];
        if (deviceInfo.propertyList !== undefined) {
          resourceTypeList.push("/properties");
        }
        if (deviceInfo.actionList !== undefined) {
          resourceTypeList.push("/actions");
        }
        vm.resourceTypeList = resourceTypeList;
        vm.resourceTypeSelected = (resourceTypeList[1]) ? resourceTypeList[1] : "";
        updateResourceName(vm.methodSelected, idSelected, vm.resourceTypeSelected);
        vm.resourceNameSelected = (vm.resourceNameList[1]) ? vm.resourceNameList[1] : "";
      } 
    },

    // 入力フィールド resourceType の値が変更された場合の処理
    //  resourceNameListをupdateする
    resourceTypeIsUpdated: function () {
      updateResourceName(this.methodSelected, this.idSelected, this.resourceTypeSelected);
    },

    // 入力フィールド resourceName の値が変更された場合の処理
    resourceNameIsUpdated: function () {
      const resourceNameSelected=this.resourceNameSelected;
    },

    // ログのorderのラジオボタンが選択された時の処理
    rbOrderIsChanged: function () {
      displayLog();
    },

    // CLEARボタンがクリックされたときの処理（ログ画面のクリア）
    clearButtonisClicked: function () {
      clearLog();
    },

    // SAVEボタンがクリックされたときの処理（ログの保存）
    saveButtonisClicked: function () {
      saveLog();
    }
  }
};

let bind_data = {
  // data from config.json
  scheme: "",
  elApiServer: "",
  apiKey: "",
  prefix: "",

  // input or control on GUI
  methodList: ["GET", "PUT", "POST", "DELETE"],
  methodSelected: "GET",
  serviceList: [""], // [/devices, /groups]
  serviceSelected: "",
  idList: [], // [/<deviceId1>, /<deviceId2>,...]
  idSelected: "",
  deviceType: "",
  resourceTypeList: [], // [/properties, /actons]
  resourceTypeSelected: "",
  resourceNameList: [], // [/airFlowLevel, /roomTemperature,...]
  resourceNameSelected:"",
  query: "",
  body: "",
  request: "request",
  statusCode: "status code",
  response: "response",
  rbOrder: "normalOrder",

  message_list: [],
  
  // CSS
  methodStyle: {color: 'black'},
  serviceStyle: {color: 'black'},
  idStyle: {color: 'black'},
  resourceTypeStyle: {color: 'black'},
  resourceNameStyle: {color: 'black'},
  queryStyle: {color: 'black'},
  bodyStyle: {color: 'black'},
};

// routeとcomponentの定義
const template_setting = {template: '#tmpl-page-setting',data:() => {return (bind_data);}};
const template_help =    {template: '#tmpl-page-help',data:() => {return (bind_data);}};
const router = new VueRouter({
	routes : [
		{path:'/',        component:template_home},
		{path:'/home',    component:template_home},
		{path:'/setting', component:template_setting},
		{path:'/help',    component:template_help}
	]
});

// ECHONET Lite WebApi serverにアクセスする
function accessElServer(scheme, elApiServer, apiKey, methodSelected, prefix, serviceSelected, idSelected, resourceTypeSelected, resourceNameSelected, query, body) {
  console.log("access ECHONET Lite WebApi server")
  console.log("serviceSelected:",serviceSelected)
  // pathの作成
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
  console.log(" path:",path);

  const bodyData = (methodSelected == "GET") ? "" : body;
  let message = {
    hostname: elApiServer,
    method:   methodSelected, 
    path:     path,
    headers:  {
      "X-Elapi-key":    apiKey,
      "Content-Type":   "application/json",
      "Content-Length": bodyData.length
    },
    body:     bodyData
  };
  console.log(" message: ", message);

  const request = new XMLHttpRequest();
  request.open('PUT', g_serverURL + 'send');
  request.setRequestHeader("Content-type", "application/json");
  request.send(JSON.stringify(message));

  return message;
}

function clearLog() {
  g_packetId = 0;
  g_dataLogArray.length = 0;
  vm.message_list = [];
}

function saveLog() {
  let log = "";
  for (let dataLog of g_dataLogArray) {
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
  request.open('POST', g_serverURL + 'saveLog');
  request.setRequestHeader("Content-type", "application/json");
  request.send(JSON.stringify(message));
}

function updateResourceName(methodSelected, idSelected, resourceTypeSelected) {
  let resourceNameList = [];
  if (resourceTypeSelected !== "") {
    const deviceId = idSelected.slice(1); // remove "/"
    // const resourceType = resourceTypeSelected.slice(1); // remove "/"
    const deviceInfo = g_deviceInfo[deviceId];
    if (deviceInfo !== undefined) {
      if ((resourceTypeSelected == "/properties") && (methodSelected == "GET")) {
        resourceNameList = deviceInfo.propertyList;
      }  
      if ((resourceTypeSelected == "/properties") && (methodSelected == "PUT")) {
        resourceNameList = deviceInfo.propertyListWritable;
      }
      if ((resourceTypeSelected == "/actions") && (methodSelected == "POST")) {
        resourceNameList = deviceInfo.actionList;
      }
      vm.resourceNameSelected = (resourceNameList[1]) ? resourceNameList[1] : "";   
    }
  }
  vm.resourceNameList = resourceNameList;
}


let vm = new Vue({
  el: '#app',
  data: bind_data,
  router
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
oReq.open('GET', g_serverURL + 'config');
oReq.send();

// websocket:受信処理
// index.js内のwebserverがECHONET Lite WebApi serverにRESTでアクセスし、
// そのレスポンスをブラウザーにwebsocketでPUSH通信する。
ws.onmessage = function(event){
  const obj = JSON.parse(event.data);
  console.log("Web socketの受信:");
  console.log(" REQ: " + obj.method + " https://" + obj.hostname,obj.path );
  // console.log(" hostname:", obj.hostname);
  console.log(" path:", obj.path);
  // console.log(" method:", obj.method);
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
    // deviceDescriptions = {};  // service listを新規で取得したので、deviceDescriptionsを初期化する
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
  // g_idListを新規に作成する 
  regex = /\/devices$/;   // 正規表現：行末が'/devices'
  if (regex.test(obj.path)) {
    // deviceDescriptions = {};  // id listを新規で取得したので、deviceDescriptionsを初期化する
    g_idList = [""];
    if (obj.response.devices !== undefined) {
      for (let device of obj.response.devices) {
        g_idList.push("/" + device.id);
      }
    }
    console.log("idListの更新:", g_idList);
    vm.idList = g_idList.sort();
    // 入力フィールドidの表示項目の更新
    vm.idSelected = (g_idList[1]) ? g_idList[1] : "";
  }

  // GET /elapi/v1/devices/<id>
  // responseはdevice description -> g_deviceInfoに情報を追加
  // vm.resourceTypeListにresource typeをpushする
  // vm.resourceNameListにresource nameをpushする
  regex = /\/devices\/([0-9]|[a-z]|[A-Z])+$/; // 正規表現'/devices/'の後、行末まで英数字
  if (regex.test(obj.path)) {
    // deviceDescriptionsにdeviceIdをkey, device descriptionをvalueとして追加
    const pathElements = obj.path.split('/');  // pathを'/'で分割して要素を配列にする
    const deviceId = pathElements[pathElements.length - 1];  // 配列の最後の要素が deviceId
    
    // Device Desvriptionをもとにg_deviceInfoを更新する
    const deviceDescription = obj.response;
    let deviceInfo = {
      "deviceType":deviceDescription.deviceType,
      "propertyList":[""],
      "propertyListWritable":[""],
      "actionList":[""]
    };

    // propertyList,propertyListWritableの作成
    if (deviceDescription.properties !== undefined) {
      for (let resourceName of Object.keys(deviceDescription.properties)) {
        deviceInfo.propertyList.push("/" + resourceName);
        if (deviceDescription.properties[resourceName].writable === true){
          deviceInfo.propertyListWritable.push("/" + resourceName);
        }
      }
    }

    // actionListの作成
    if (deviceDescription.actions !== undefined) {
      for (let resourceName of Object.keys(deviceDescription.actions)) {
        deviceInfo.actionList.push("/" + resourceName);
      }
    }

    deviceInfo.propertyList.sort();    
    deviceInfo.propertyListWritable.sort();    
    deviceInfo.actionList.sort();    

    g_deviceInfo[deviceId] = deviceInfo;
    console.log("g_deviceInfo", g_deviceInfo);

    // resourceTypeListを新規に作成する
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
    updateResourceName("GET", "/"+deviceId, "/properties");
    vm.resourceTypeSelected = (resourceTypeList[1]) ? resourceTypeList[1] : "";

    // 入力フィールドidの下のdeviceTypeの更新
    vm.deviceType = obj.response.deviceType;
  }
  
  // RESPONSEをLOGに追加
  const packet_id = 'packet-' + g_packetId++;
  const pkt = {
    id:packet_id,
    timeStamp:timeStamp(),
    direction:"RES",
    data:obj
  }
  g_dataLogArray.push(pkt);
  
  // LOG表示の更新
  displayLog();
};

function displayLog() {
  let log = [];
  for (let dataLog of g_dataLogArray) {
    let message = {
      id: dataLog.id,
      timeStamp: dataLog.timeStamp,
      direction: dataLog.direction,
    };
    if (dataLog.direction == 'REQ') { // REQUEST
      message.body = dataLog.data.method + " https://"+dataLog.data.hostname+dataLog.data.path;
    } else { // RESPONSE
      message.statusCode = dataLog.data.statusCode;
      message.body = dataLog.data.response;
    }
    log.push(message);
  }
  if (vm.rbOrder == "reverseOrder") {
    log.reverse();
  }
  vm.message_list = log;
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