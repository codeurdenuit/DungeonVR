const path = require('path');
const prettify = true;

module.exports = {
  mode: 'development',
  entry: {
    app: './client/src/app.js'
  },
  output: {
    path: path.resolve(__dirname, './client/.dist'),
    filename: '[name].js'
  },
  optimization: {
    minimize: prettify
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        }
      }
    ]
  },
  plugins: [

  ]
}
