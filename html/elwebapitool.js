// elwebapitool.js for elwebapitool(client side)
// 2020.06.22

const serverURL = "/elwebapitool/";
let tid = 0;
let packetId = 0;
let active_packet_id = '';
let dataLogArray = [];
let analyzedData = "";

var vm = new Vue({
    el: '#app',
    data: {
      // idList:["/aaa", "/bbb", "/ccc"], // array of service(device, bulk, group, history) object id
      idList:[], // array of deviceId
      resourceNameList:[], // array of resource name
      idSelected:"",
      resourceNameSelected:"",
      scheme: "https",
      serverName: "webapiechonet.com",
      apiKey: "8cef65ec5f3c85bd8179ee9d1075fe413bbb6a2ad440d27b0be57cc03035471a",
      prefix: "/elapi/v1",
      method: "GET",
      service: "",
      id: "",
      resourceType: "",
      resourceName: "",
      query: "",
      body: "",
      schemeStyle: {color: 'black'},
      serverNameStyle: {color: 'black'},
      apiKeyStyle: {color: 'black'},
      prefixStyle: {color: 'black'},
      methodStyle: {color: 'black'},
      serviceStyle: {color: 'black'},
      idStyle: {color: 'black'},
      resourceTypeStyle: {color: 'black'},
      resourceNameStyle: {color: 'black'},
      queryStyle: {color: 'black'},
      bodyStyle: {color: 'black'},

        rbInputData: "el",
        rbOrder: "normalOrder",
        filters: ["showGet", "showInf", "showGetres", "showSNA"],
        packet_list: [],
        packetDetail: ""
    },
    methods: {
      // configurationのアイコンをクリックしたときの動作
      configuration: function () {
        window.open('configuration.html', 'configuration', 'width=800,height=400');
      },
      buttonClickSend: function () {
        buttonClickSend(this.scheme, this.serverName, this.apiKey, this.method, this.prefix,
          this.service, this.idSelected, this.resourceType, this.resourceNameSelected, this.query, this.body);
      },
      updateResourceName: function () {
        updateResourceName(this.idSelected);
      },
      updateRbOrder: function () {
          displayLog();
      },
      clearLog: function () {
          clearLog();
      },
      saveLog: function () {
          saveLog();
      },
		// パケット一覧からパケット行がクリックされたときの処理 (パケット詳細を表示)
		showPacketDetail: this.packetMonitorShowPacketDetail.bind(this),
		// パケット一覧で矢印キーが押されたときの処理
		upDownList: this.packetMonitorUpDownList.bind(this)
    }
});

// connect websocket
console.log('ws://' + document.location.host);
let ws = new WebSocket('ws://' + document.location.host);
ws.onopen = function(event){
    console.log(" connected");    
};

// server側のconfig.jsonのデータをリクエストする。その後setStrage
config();

// configuration.htmlからのpostMessageの受信
var updateConfig = function ( event ) {
	// 送信側のオリジン
	var origin = event.origin ;

	// 信頼できるオリジン以外からのメッセージを無視する (重要)
	// if( origin !== "https://example.com" ) return false ;

	// 送られてきたメッセージ
	var message = event.data;	// "Hello!!"
  console.log( "メッセージを受信しました!! → " + message );
  console.log("config3:", window.localStorage.getItem('config'));
}
window.addEventListener( "message", updateConfig ) ;

// XHR 非同期処理
function config(){
  function reqListener () {
    console.log("config2:", this.responseText);
    window.localStorage.setItem('config', this.responseText);
  }
  var oReq = new XMLHttpRequest();
  oReq.addEventListener("load", reqListener);
  oReq.open('GET', serverURL + 'config');
  oReq.send();


  // const request = new XMLHttpRequest();
  // request.open('GET', serverURL + 'config', false);
  // request.send();
  // console.log("config:", request.responseText);
  // const configData = JSON.parse(request.responseText);
  // window.localStorage.setItem('scheme', configData.scheme);
  // window.localStorage.setItem('server', configData.server);
  // window.localStorage.setItem('prefix', configData.prefix);
}

// XHR 同期処理
// function config(){
//   const request = new XMLHttpRequest();
//   request.open('GET', serverURL + 'config', false);
//   request.send();
//   console.log("config:", request.responseText);
//   const configData = JSON.parse(request.responseText);
//   window.localStorage.setItem('scheme', configData.scheme);
//   window.localStorage.setItem('server', configData.server);
//   window.localStorage.setItem('prefix', configData.prefix);
// }

// websocket:受信処理
ws.onmessage = function(event){
  // console.log("server_to_client", event.data);
  console.log("Web socket:");
  const obj = JSON.parse(event.data);

  console.log(" hostname:", obj.hostname);
  console.log(" path:", obj.path);
  console.log(" method:", obj.method);
  console.log(" response:", obj.response);

  // response処理

  // GET /elapi/v1/devices
  // responseはdevice idのarray
  // vm.idListにdevice idをpushする 
  let regex = /\/devices$/;   // 正規表現：行末が'/devices'
  if (regex.test(obj.path)) {
    idList = [""];
    if (obj.response.devices !== undefined) {
      for (let device of obj.response.devices) {
        idList.push("/" + device.id);
      }
    }
    // console.log("idList:", idList);
    vm.idList = idList;
  }

  // GET /elapi/v1/devices/<id>
  // responseはdevice description
  // vm.resourceNameListにresource nameをpushする
  regex = /\/devices\/([0-9]|[a-z]|[A-Z])+$/; // 正規表現'/devices/'の後、行末まで英数字
  if (regex.test(obj.path)) {
    resourceNameList = [""];
    if (obj.response.properties !== undefined) {
      for (let prpertyName of Object.keys(obj.response.properties)) {
        resourceNameList.push("/" + prpertyName);
      }
    }
    // console.log("resourceNameList:", resourceNameList);
    vm.resourceNameList = resourceNameList;
  }
  
  // LOGに追加
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
    if (dataLog.direction == 'REQ') {
      pkt = 
        {
          id: dataLog.id,
          timeStamp: dataLog.timeStamp,
          direction: dataLog.direction,
          hex: dataLog.data.method+" https://"+dataLog.data.hostname+dataLog.data.path
        };
    } else {
      pkt = 
        {
          id: dataLog.id,
          timeStamp: dataLog.timeStamp,
          direction: dataLog.direction,
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
	if (this.active_packet_id) {
		$('#' + this.active_packet_id).removeClass('active');
		this.active_packet_id = '';
	}
  vm.packetDetail = "";
}

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

function analyzeData(uint8Array) {  // uint8Array: [UInt8]
    let analyzedData = "";
    let epcArray = [];
    const esv = uint8Array[10];
    const epc = uint8Array[12];
    const edt = uint8Array.slice(14);

    // Decode PropertyMap
    if (shouldDecodePropertyMap()) {
      if (edt.length < 17) {  // PropertyMapがEPCの列挙の場合
        for (let i=1; i<edt.length; i++) {
          epcArray.push(toStringHex(edt[i], 1));
        }
      } else {    // PropertyMapがbitmapの場合
        for (let i = 1; i<17; i++) {
          for (let j = 0; j<8; j++) {
            if ((edt[i] & (1 << j)) !==0 ) {
              let epc = 0x80 + (0x10 * j) + i-1;
                epcArray.push(toStringHex(epc, 1));
            }             
          }
        }
      }
      epcArray.sort();
      analyzedData = "EPC:";
      for (let data of epcArray) {
        analyzedData += " " + data;
      }
    } else {
        return null;
    }
    return analyzedData;  // analyzedData: string
    function shouldDecodePropertyMap() {
      return ((esv == 0x72)&&((epc == 0x9D)||(epc == 0x9E)||(epc == 0x9F)));
    }
}

function elFormat(uint8Array) {
    let elString = "";
    for (let value of uint8Array) {
      elString += toStringHex(value, 1);
    }
    elString = strIns(elString, 4, " ");
    elString = strIns(elString, 9, " ");
    elString = strIns(elString, 16, " ");
    elString = strIns(elString, 23, " ");
    elString = strIns(elString, 26, " ");
    elString = strIns(elString, 29, " ");
    elString = strIns(elString, 32, " ");
    elString = strIns(elString, 35, " ");
    return elString;
}

// 数値(number)を16進数表記の文字列に変換する
// 数値のbyte数は(bytes)
// example: toStringHex(10, 1) => "0A"
// example: toStringHex(10, 2) => "000A"
function toStringHex(number, bytes) {
  let str = number.toString(16).toUpperCase();
  while (str.length < 2*bytes) { str = "0" + str; }
      return str;
}

// stringに文字列を挿入
function strIns(str, idx, val){ // str:string（元の文字列）, idx:number（挿入する位置）, val:string（挿入する文字列）
    var res = str.slice(0, idx) + val + str.slice(idx);
    return res;
}

// Check input value of text field
// argument: inputType:string, enum("ip", "deoj", "esv", "epc", "edt", "free")
// get text data from text input field of "inputType"
// return value: boolean
function checkInputValue(inputType, inputValue) {
    let regex;
    switch (inputType) {
      case "ip":
        regex = /^(([1-9]?[0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([1-9]?[0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
        break;
      case "deoj":
        regex = /^(0x)?(\d|[a-f]|[A-F]){6}$/;
        break;
      case "esv":
      case "epc":
        regex = /^(0x)?(\d|[a-f]|[A-F]){2}$/;
        break;
      case "edt":
        regex = /^((0x)?((\d|[a-f]|[A-F]){2}){1,})?$/;
        break;
      case "free":
        regex = /^((\d|[a-f]|[A-F]){2},\s*){1,}(\d|[a-f]|[A-F]){2}\s*$/;
        break;
      default:
    }
    if (regex.test(inputValue)) {
        return true;
    }else{
        return false;
    }
}

function configuration() {
  console.log("configuration");
}

function updateResourceName() {
  console.log("updateResourceName");
}

// GUIの入力データをREST PUT /elwebapitool/send
function buttonClickSend(scheme, serverName, apiKey, method, prefix, 
  service, idSelected, resourceType, resourceNameSelected, query, body) {
  console.log("buttonClickSend");
  console.log(" scheme:", scheme,", serverName:", serverName, ", apiKey:", apiKey);
  console.log(" method:", method, ", prefix:", prefix, ", service:", service, ", idSelected:", idSelected, ", resourceType:", resourceType);
  console.log(" resourceName:", resourceNameSelected, ", query:", query, ", body:", body);
  
  let path = prefix;
  if (service !== "") {
    path += service;
    if (idSelected !== "") {
      path += idSelected;
      if (resourceType !== "") {
        path += resourceType;
        if (resourceNameSelected !== "") {
          path += resourceNameSelected;
          if (query !== "") {
            path += ("?"+query);
          }
        }
      }
    }
  }
  console.log("path:",path);
  const message = {
    hostname:serverName,
    method:method, 
    path:path,
    headers: { "X-Elapi-key": apiKey }, 
    body:'body'};
  console.log("message: ", message);
  const request = new XMLHttpRequest();
  request.open('PUT', serverURL + 'send');
  request.setRequestHeader("Content-type", "application/json");
  request.send(JSON.stringify(message));

  // LOGに追加
  const packet_id = 'packet-' + packetId++;
  const pkt = {
      id:packet_id,
      timeStamp:timeStamp(),
      direction:"REQ",
      data:message
  }
  console.log("pkt:", pkt);
  dataLogArray.push(pkt);
  displayLog();
}

function saveLog() {
    let log = "";
    for (let dataLog of dataLogArray) {
      log = log + dataLog.timeStamp + "," + dataLog.direction + "," + dataLog.ip + "," + elFormat(dataLog.data) + "\n";
    }
    const message = {log:log};
    const request = new XMLHttpRequest();
    request.open('POST', serverURL + 'saveLog');
    request.setRequestHeader("Content-type", "application/json");
    request.send(JSON.stringify(message));
}

function clearLog() {
    packetId = 0;
    dataLogArray.length = 0;
    vm.packet_list = [];
	vm.packetDetail = "";
}

function packetMonitorShowPacketDetail(event){
	if (this.active_packet_id) {
		$('#' + this.active_packet_id).removeClass('active');
		this.active_packet_id = '';
	}
	let t = event.target;
	console.log("t.id: ",t.id);
    $('#' + t.id).addClass('active');
	this.active_packet_id = t.id;

	// 現在選択中のパケット ID
	let id_parts = this.active_packet_id.split('-');
	let pno = parseInt(id_parts[1], 10);
	
    // packetの解析結果の表示
	vm.packetDetail = analyzeData(dataLogArray[pno].data);
}

function packetMonitorUpDownList(event){
	event.preventDefault();
	event.stopPropagation();
	// 選択中のパケット行がなければ終了
	if (!this.active_packet_id) {
		return;
	}
	// 現在選択中のパケット ID
	let id_parts = this.active_packet_id.split('-');
	let pno = parseInt(id_parts[1], 10);

	let c = event.keyCode;
	let k = event.key;
	if (c === 38 || k === 'ArrowUp') {
		// 上矢印キー
		if (vm.rbOrder == "normalOrder") {
    		if (pno-- <0 ) {pno = 0}
		} else {
    		if (pno++ >= dataLogArray.length ) {pno = dataLogArray.length -1}		
		}
	} else if (c === 40 || k === 'ArrowDown') {
		// 下矢印キー
		if (vm.rbOrder == "normalOrder") {
    		if (pno++ >= dataLogArray.length ) {pno = dataLogArray.length -1}
		} else {
    		if (pno-- <0 ) {pno = 0}
		}
	} else {
		return;
	}
	// 遷移したパケット行にフォーカスする
	$('#packet-' + pno).focus();
}