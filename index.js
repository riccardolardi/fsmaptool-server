// const simConnect = require('./SimConnect/node-simconnect');
const simConnect = require('node-simconnect');

// simConnect.objectId = {
// 	USER: 0
// };

// simConnect.dataRequestFlag = {
// 	DEFAULT: 0,
// 	CHANGED: 1,
// 	TAGGED: 2
// };

// simConnect.datatype = {
// 	INVALID: 0,  
// 	INT32: 1,    
// 	INT64: 2,    
// 	FLOAT32: 3,  
// 	FLOAT64: 4,  
// 	STRING8: 5,  
// 	STRING32: 6, 
// 	STRING64: 7, 
// 	STRING128: 8,
// 	STRING256: 9,
// 	STRING260: 10,
// 	STRINGV: 11
// };

// simConnect.simobjectType = {
// 	USER: 0,
// 	ALL: 1,
// 	AIRCRAFT: 2,
// 	HELICOPTER: 3,
// 	BOAT: 4,
// 	GROUND: 5,
// };

// simConnect.period = {
// 	NEVER: 0,
// 	ONCE: 1,
// 	VISUAL_FRAME: 2,
// 	SIM_FRAME: 3,
// 	SECOND: 4,
// };

connectToSim();

function connectToSim() {
  console.log("Trying to connect...");

  const connection = simConnect.open("myApp", function(name, version) {
    console.log(`Connected to: ${name} SimConnect version: ${version}`);
    startPolling();
  }, () => {
    console.log("Quit... :(");
    connectToSim();
  }, (exception) => {
    console.log(`SimConnect exception: ${exception.name} (${exception.dwException}, ${exception.dwSendID}, ${exception.dwIndex}, ${exception.cbData})`);
  }, (error) => {
    console.log(`SimConnect error: ${error}`);
    connectToSim();
  });

  if (!connection) setTimeout(() => connectToSim(), 5000);
}

function startPolling() {
  simConnect.requestDataOnSimObject([
    ["Plane Latitude", "degrees"], 
    ["Plane Longitude", "degrees"], 
    ["PLANE ALTITUDE", "feet"]
  ], (data) => {
    console.log(
      "Latitude:  " + data["Plane Latitude"] + "\n" +
      "Longitude: " + data["Plane Longitude"] + "\n" +
      "Altitude:  " + data["PLANE ALTITUDE"] + " feet"
    );
  }, 
    simConnect.objectId.USER,
    simConnect.period.SECOND,
    simConnect.dataRequestFlag.CHANGED
  );
}