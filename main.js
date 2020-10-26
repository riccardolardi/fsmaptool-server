const { app, BrowserWindow, Menu, Tray, shell, dialog } = require('electron');
const simConnect = require('node-simconnect');
const express = require('express');
const internalIp = require('internal-ip');
const compareVersions = require('compare-versions');
const fetch = require('electron-fetch').default;
const unhandled = require('electron-unhandled');
const log = require('electron-log');
const path = require('path');

const server = express();
const port = 12345;

unhandled();

let data = null;
let tray = null;
let ipAddress = "";
const version = app.getVersion();
const lock = app.requestSingleInstanceLock();

if (!lock) {
  quitApp();
}

const setConnected = flag => {
  if (tray) tray.setImage(path.join(__dirname, flag ? 'icon2.png' : 'icon.png'));
}

log.info('App init');

fetch('https://fsmaptool.riccardolardi.com/version.json')
  .then(res => res.json())
  .then(json => {
    const latestVersion = json.version;
    if (compareVersions(latestVersion, version) === 1) {
      const options  = {
        type: "info",
        title: "New FS Map Tool Server version available",
        buttons: ["Yes", "No"],
        message: `New server version ${latestVersion} is available. Go to download website now?`
      };
      if (dialog.showMessageBoxSync(null, options) === 0) openWebsite();
    }
  })
  .catch(error => console.error(error));

app.whenReady().then(() => {
  log.info(`App ready, running v${version}`);
  ipAddress = internalIp.v4.sync();
  tray = new Tray(path.join(__dirname, 'icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    { label: `FS Map Tool v${version}`, type: 'normal', enabled: false },
    { label: `IP: ${ipAddress}`, type: 'normal', enabled: false },
    { label: 'Website', type: 'normal', click: () => openWebsite() },
    { label: '', type: 'separator' },
    { label: 'Quit', type: 'normal', click: () => quitApp(), role: 'quit' }
  ]);
  tray.setToolTip(`FS Map Tool v${version}`);
  tray.setContextMenu(contextMenu);
  tray.setIgnoreDoubleClickEvents(true);
  tray.on('click', () => tray.popUpContextMenu());
  startServer();
  connectToSim();
});

app.on('window-all-closed', () => quitApp());

function openWebsite() {
  shell.openExternal('https://www.fsmaptool.com');
}

function quitApp() {
  tray.destroy();
  tray = null;
  app.quit();
}

function startServer() {
  server.get('/data', (req, res) => data && res.send(data));
  server.listen(port, () => log.info(`Server listening at http://localhost:${port}`));
}

function connectToSim() {
  log.info("Trying to connect...");

  const connection = simConnect.open("myApp", function(name, version) {
    log.info(`Connected to: ${name} SimConnect version: ${version}`);
    setConnected(true);
    startPolling();
  }, () => {
    log.warn("Quit... :(");
    setConnected(false);
    connectToSim();
  }, (exception) => {
    log.error(`SimConnect exception: ${exception.name} (${exception.dwException}, ${exception.dwSendID}, ${exception.dwIndex}, ${exception.cbData})`);
    setConnected(false);
  }, (error) => {
    log.error(`SimConnect error: ${error}`);
    setConnected(false);
    connectToSim();
  });

  if (!connection) {
    setConnected(false);
    setTimeout(() => connectToSim(), 5000);
  }
}

function startPolling() {
  simConnect.requestDataOnSimObject([
    ["Plane Latitude", "degrees"], 
    ["Plane Longitude", "degrees"], 
    ["INDICATED ALTITUDE", "feet"],
    ["PLANE HEADING DEGREES TRUE", "degrees"],
    ["AIRSPEED INDICATED", "knots"],
    ["GPS FLIGHT PLAN WP COUNT", "number"],
    ["GPS FLIGHT PLAN WP INDEX", "number"],
    ["GPS WP NEXT LAT", "degrees"],
    ["GPS WP NEXT LON", "degrees"],
    ["GPS WP DISTANCE", "meters"],
    ["GPS WP TRUE REQ HDG", "radians"]

  ], (response) => {
    data = {
      lat: response["Plane Latitude"],
      lon: response["Plane Longitude"],
      alt: response["INDICATED ALTITUDE"],
      head: response["PLANE HEADING DEGREES TRUE"],
      speed: response["AIRSPEED INDICATED"],
      wpCount: response["GPS FLIGHT PLAN WP COUNT"],
      wpNextLat: response["GPS WP NEXT LAT"],
      wpNextLon: response["GPS WP NEXT LON"],
      wpDistance: response["GPS WP DISTANCE"],
      wpHead: response["GPS WP TRUE REQ HDG"]
    };
    log.log(data);
  }, 0, 4, 1);
}