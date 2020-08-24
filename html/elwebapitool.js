// elwebapitool.js for elwebapitool(client side)
// 2020.08.24
// Created by Hiroyuki Fujita
// 
// elwebapitool.jsは、ECHONET Lite WebAPI Toolのクライアント側JavaScript codeである。
// サーバーはlocalhost/elwebapitool
// サーバー側にECHONET Lite WebAPI Serverの設定がファイルconfig.jsonとして存在する。
'use strict';

const g_serverURL = "/elwebapitool/";
let g_dataLogArray = []; // logを格納するarray
let g_deviceInfo ={}; // deviceIdをkeyとして、以下の項目を保持
  // {<deviceId>:{
  //   "deviceType":<deviceType>, 
  //   "propertyList":[<resourceName>], 
  //   "propertyListWritable":[<resourceName>]
  //   "actionList":[<resourceName>]}}

let bind_data = {
  // data in config.json
  scheme: "",
  elApiServer: "",
  apiKey: "",
  prefix: "",

  // input or control on GUI
  methodList: ["GET", "PUT", "POST", "DELETE"],
  methodSelected: "GET",
  serviceList: [""], // [/devices, /groups]
  serviceSelected: "",
  idInfoList: [], // [{deviceType:"/aircon", id:"0123"},... ] GET /devices のレスポンスを利用
  idSelected: "",
  idToolTip: "XXX",
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
  rbOrder: "normalOrder", // "normalOrder" or "reverseOrder"

  message_list: [],

  // Setting page
  addDevice: "", // デバイス追加で選択されたデバイス名
  addDeviceList: [  // デバイス追加に表示するデバイス名のリスト
    "",
    "homeAirConditioner", 
    "instantaneousWaterHeater", 
    "fuelCell", 
    "storageBattery", 
    "evChargerDischarger", 
    "lvSmartElectricEnergyMeter", 
    "hvSmartElectricEnergyMeter", 
    "generalLighting", 
    "evCharger", 
    "enhancedLightingSystem", 
    "controller", 
    "ventilationFan", 
    "airCleaner", 
    "commercialAirConditionerIndoorUnit", 
    "commercialAirConditionerOutdoorUnit", 
    "electricRainDoor", 
    "electricWaterHeater", 
    "electricLock", 
    "bathroomHeaterDryer", 
    "pvPowerGeneration", 
    "floorHeater", 
    "monoFunctionalLighting", 
    "refrigerator", 
    "cookingHeater", 
    "riceCooker", 
    "commercialShowcase", 
    "commercialShowcaseOutdoorUnit", 
    "switch", 
    "hybridWaterHeater", 
    "washerDryer"
  ],
  
  // CSS
  methodStyle: {color: 'black'},
  serviceStyle: {color: 'black'},
  idStyle: {color: 'black'},
  resourceTypeStyle: {color: 'black'},
  resourceNameStyle: {color: 'black'},
  queryStyle: {color: 'black'},
  bodyStyle: {color: 'black'},
};

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
        console.log("methodIsUpdated:idSelected", this.idSelected);
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
          }
        }
      }
    },

    // 入力フィールド service の値が変更された場合の処理
    // ""が選択されたら、入力フィールドのId, Resource Type, Resource Name, queryをブランクにする
    serviceIsUpdated: function () {
      if (this.serviceSelected == "") {
        vm.idInfoList =[{}]
        vm.resourceTypeList = [""];
        vm.resourceNameList = [""];
        vm.idSelected = "";
        vm.resourceTypeSelected = "";
        vm.resourceNameSelected = "";
        vm.deviceType = "";
      }
    },

    // 入力フィールド id の値が変更された場合の処理
    // vm.deviceTypeをvm.idInfoListを利用してupdateする
    // 選択されたidのdevice descriptionが存在する場合は、resourceTypeとresourceNameを更新する
    idIsUpdated: function () {
      console.log("idIsUpdated");
      const deviceId = this.idSelected.slice(1); // remove "/"
      vm.resourceTypeList = [""];
      vm.resourceNameList = [""];
      vm.deviceType ="";
      vm.resourceTypeSelected = "";
      vm.resourceNameSelected = "";

      updateDeviceType(deviceId);
      const deviceInfo = g_deviceInfo[deviceId];
      if (deviceInfo !== undefined){
        let resourceTypeList = [""];
        if (deviceInfo.propertyList !== undefined) {
          resourceTypeList.push("/properties");
        }
        if (deviceInfo.actionList !== undefined) {
          resourceTypeList.push("/actions");
        }
        vm.resourceTypeList = resourceTypeList;
        vm.resourceTypeSelected = (resourceTypeList[1]) ? resourceTypeList[1] : "";
        updateResourceName(vm.methodSelected, deviceId, vm.resourceTypeSelected);
        vm.resourceNameSelected = (vm.resourceNameList[1]) ? vm.resourceNameList[1] : "";
      } 
    },

    // 入力フィールド resourceType の値が変更された場合の処理
    //  resourceNameListをupdateする
    resourceTypeIsUpdated: function () {
      updateResourceName(this.methodSelected, this.idSelected.slice(1), this.resourceTypeSelected);
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

function updateDeviceType(deviceId) {
  for (const idInfo of vm.idInfoList) {
    if (idInfo.id == ("/" + deviceId)) {
      vm.deviceType = idInfo.deviceType;
    }
  }
}

// component:template_settingの定義
const template_setting = {
  template: '#tmpl-page-setting',
  data:() => {return (bind_data);},
  methods:{
    // 設定保存ボタンがクリックされたときの処理
    saveSettingsButtonIsClicked: function () {
      const configData = {scheme:this.scheme, elApiServer:this.elApiServer, prefix:this.prefix, apiKey:this.apiKey};
      console.log("saveSettingsButtonIsClicked", configData);
      saveConfig(configData);
    },
    // デバイス削除ボタン(Trash can)がクリックされたときの処理
    deleteDeviceButtonIsClicked: function (value) {
      const deviceId = vm.idInfoList[value].id;
      console.log("deleteDeviceButtonIsClicked is clicked, value=", deviceId);
      accessElServerDeleteDevice(this.scheme, this.elApiServer, this.apiKey, this.prefix, deviceId);
    },
    // デバイス追加ボタンがクリックされたときの処理
    addDeviceButtonIsClicked: function () {
      console.log("addDeviceButtonIsClicked is clicked", vm.addDevice);
      accessElServerAddDevice(this.scheme, this.elApiServer, this.apiKey, this.prefix, vm.addDevice);
    },
    // UPDATEボタンがクリックされたときの処理
    updateButtonIsClicked: function () {
      console.log("updateButtonIsClicked is clicked");
      accessElServer(this.scheme, this.elApiServer, this.apiKey, 
        this.methodSelected, this.prefix, "/devices", "", "", "", "", "");
      }
  },
  // Setting pageを表示する時に呼ばれるfunction
  // EL WebAPI serverにアクセス（GET /devices)して、デバイス情報を取得
  created:function(){
    console.log('Setting page is created');
    accessElServer(this.scheme, this.elApiServer, this.apiKey, 
      "GET", this.prefix, "/devices", "", "", "", "", "");
  }
};

// component:template_helpの定義
const template_help = {
  template: '#tmpl-page-help',
  data:() => {return (bind_data);}
};

// routerの定義
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
    path += (serviceSelected);
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

// ECHONET Lite WebApi serverにアクセスして、実験クラウド専用のAPIで機器を削除する
function accessElServerDeleteDevice(scheme, elApiServer, apiKey, prefix, deviceId) {
  console.log("accessElServerDeleteDevice: Delete ", deviceId)
  let path = prefix + "/config/device/" + deviceId;
  const bodyData = "";
  let message = {
    hostname: elApiServer,
    method:   "DELETE", 
    path:     path,
    headers:  {
      "X-Elapi-key":    apiKey,
      "Content-Type":   "application/json",
      "Content-Length": bodyData.length
    },
    body:     bodyData
  };

  const request = new XMLHttpRequest();
  request.open('PUT', g_serverURL + 'send');
  request.setRequestHeader("Content-type", "application/json");
  request.send(JSON.stringify(message));
}

// ECHONET Lite WebApi serverにアクセスして、実験クラウド専用のAPIで機器を追加する
function accessElServerAddDevice(scheme, elApiServer, apiKey, prefix, deviceType) {
  console.log("accessElServerAddDevice: Add ", deviceType)
  let path = prefix + "/config/device/";
  const bodyData = '{"deviceType":"' + deviceType + '"}';
  let message = {
    hostname: elApiServer,
    method:   "POST", 
    path:     path,
    headers:  {
      "X-Elapi-key":    apiKey,
      "Content-Type":   "application/json",
      "Content-Length": bodyData.length
    },
    body:     bodyData
  };

  const request = new XMLHttpRequest();
  request.open('PUT', g_serverURL + 'send');
  request.setRequestHeader("Content-type", "application/json");
  request.send(JSON.stringify(message));
}

function clearLog() {
  g_dataLogArray.length = 0;
  vm.message_list = [];
}

function saveLog() {
  // g_dataLogArrayから保存用のstringの作成
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

// config保存をサーバーに依頼
function saveConfig(configData) {
  const message = {config:configData};
  console.log("saveConfig: message", message)
  const request = new XMLHttpRequest();
  request.open('PUT', g_serverURL + 'config');
  request.setRequestHeader("Content-type", "application/json");
  request.send(JSON.stringify(message));
}

function updateResourceName(methodSelected, idSelected, resourceTypeSelected) {
  console.log("updateResourceName ", methodSelected, idSelected, resourceTypeSelected)
  let resourceNameList = [];
  if (resourceTypeSelected !== "") {
    const deviceInfo = g_deviceInfo[idSelected];
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
      vm.resourceNameList = resourceNameList;
      vm.resourceNameSelected = (resourceNameList[1]) ? resourceNameList[1] : "";   
    }
  }
}

// Vueのインスタンス作成
let vm = new Vue({
  el: '#app',
  data: bind_data,
  router
});

// connect websocket
console.log('Request WebScoket connection, ws://' + document.location.host);
let ws = new WebSocket('ws://' + document.location.host);
ws.onopen = function(event){
  console.log(" WebSocket: connected");
};

// server側のファイルconfig.jsonのデータをリクエストする。その値をvmに設定する。
// apiKeyがblankの場合、ダイアログを表示してapiKeyを入力させる。
// XHR 非同期処理
function reqListener() {
  console.log("config.json!:", this.responseText);
  const config = JSON.parse(this.responseText);
  vm.scheme = config.scheme;
  vm.elApiServer = config.elApiServer;
  vm.apiKey = config.apiKey;
  vm.prefix = config.prefix;
  if (config.apiKey == "") {
    window.alert("Api Keyが設定されていません。設定画面で入力してください。");
  }
}
const request = new XMLHttpRequest();
request.addEventListener("load", reqListener);
request.open('GET', g_serverURL + 'config');
request.send();

// websocket:受信処理
// index.js内のwebserverがECHONET Lite WebApi serverにRESTでアクセスし、
// そのレスポンスをブラウザーにwebsocketでPUSH通信する。
ws.onmessage = function(event){
  const obj = JSON.parse(event.data);
  console.log("Web socketの受信:", obj);
  console.log(" REQ: " + obj.method + " https://" + obj.hostname + "/",obj.path );
  console.log(" path:", obj.path);
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
  // vm.idInfoListを新規に作成する 
  regex = /\/devices$/;   // 正規表現：行末が'/devices'
  if (regex.test(obj.path)) {
    vm.idInfoList = [{deviceType:"", id:""}];
    if (obj.response.devices !== undefined) {
      for (let device of obj.response.devices) {
        const idInfo = { id:"/" + device.id, deviceType:device.deviceType };
        vm.idInfoList.push(idInfo);
      }
    }

    vm.idInfoList.sort(function(a, b) {
      var nameA = a.deviceType.toUpperCase(); // 大文字と小文字を無視する
      var nameB = b.deviceType.toUpperCase(); // 大文字と小文字を無視する
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
    });

    // 入力フィールドidの表示項目の更新
    vm.idSelected = (vm.idInfoList[1]) ? vm.idInfoList[1].id : "";
    // Device Typeの表示項目の更新
    updateDeviceType(vm.idSelected.slice(1));
  }

  // GET /elapi/v1/devices/<id>
  // responseはdevice description -> g_deviceInfoに情報を追加
  // vm.resourceTypeListにresource typeをpushする
  // vm.resourceNameListにresource nameをpushする
  regex = /\/devices\/([0-9]|[a-z]|[A-Z])+$/; // 正規表現'/devices/'の後、行末まで英数字
  if (regex.test(obj.path)) {
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
    updateResourceName("GET", deviceId, "/properties");
    vm.resourceTypeSelected = (resourceTypeList[1]) ? resourceTypeList[1] : "";

    // 入力フィールドidの下のdeviceTypeの更新
    vm.deviceType = obj.response.deviceType;
  }
  
  // RESPONSEをLOGに追加
  g_dataLogArray.push({
    timeStamp:timeStamp(),
    direction:"RES",
    data:obj
  });
  
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