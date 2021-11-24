const app = require('express')();
const express = require('express');
const http = require('http');
const path = require('path');
const config = require('./config');

app.set('view engine', config.viewEngine);
app.set('views', config.viewsDirectory);
app.use('/', express.static(path.normalize('client/.dist')));
app.use('/assets', express.static(path.normalize('client/assets')));


app.get('/', function (req, res) {
  res.render('index.ejs');
});

http.createServer(app).listen(config.port, function () {
  console.info('[Express] server listening on port ' + config.port);
});
