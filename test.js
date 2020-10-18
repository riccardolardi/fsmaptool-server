const express = require('express');
const internalIp = require('internal-ip');
const path = require('path');

const server = express();
const port = 12345;

let data = null;
let ipAddress = "";

console.info('App init');

ipAddress = internalIp.v4.sync();

startServer();

setTimeout(() => {
  data = {
    lat: 47.5502281,
    lon: 7.5641242,
    speed: 123.123,
    alt: 321.321,
    head: 180.0
  }
}, 10000);

function startServer() {
  server.get('/data', (req, res) => {
    res.send(data ? data : {"error": "no-data"});
    console.info('Sent data', data);
  });
  server.listen(port, () => console.info(`Server listening at http://localhost:${port}`));
}