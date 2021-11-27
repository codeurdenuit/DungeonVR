import express from 'express';
const app = express();
import http from 'http';
import path from 'path';

app.use('/', express.static(path.normalize('dist')));

const PORT = process.env.PORT || 3000;
http.createServer(app).listen(PORT, function () {
  console.info('[Express] server listening on port ' + PORT);
});

export const viteNodeApp  = app;
