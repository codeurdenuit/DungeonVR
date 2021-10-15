
exports.isProd = process.env.NODE_ENV === 'production';
exports.port = 3000;
exports.instance = process.env.NODE_APP_INSTANCE ? parseInt(process.env.NODE_APP_INSTANCE, 10) : 0;
exports.viewEngine = 'ejs';
exports.viewsDirectory = require('path').resolve(__dirname + '/view');
