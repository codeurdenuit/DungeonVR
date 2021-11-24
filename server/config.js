
exports.isProd = process.env.NODE_ENV === 'production';
exports.port = 3000;
exports.viewEngine = 'ejs';
exports.viewsDirectory = require('path').resolve(__dirname + '/view');
