const simConnect = require('node-simconnect');
const express = require('express');
const bodyParser = require('body-parser');
const internalIp = require('internal-ip');
const path = require('path');

const server = express();
const port = 12345;

const data = {
  lat: 42.532219,
  lon: 9.7364273,
  speed: 123.123,
  alt: 321.321,
  head: 45.0
};

let ipAddress = "";

server.use(bodyParser.urlencoded({ extended: false }));
server.use(bodyParser.json());

console.info('App init');

ipAddress = internalIp.v4.sync();

startServer();

setInterval(() => {
  data.lat = data.lat + 0.01;
  data.lon = data.lon + 0.01;
}, 1000);

function startServer() {
  app.post('/teleport', (req, res) => {
    console.log('Got body:', req.body);
    res.sendStatus(200);
  });
  server.get('/data', (req, res) => {
    res.send(data ? data : {"error": "no-data"});
    console.info('Sent data', data);
  });
  server.listen(port, () => console.info(`Server listening at http://localhost:${port}`));
}