const path = require('path');

module.exports = {
  entry: './WebViewApp/main.js',
  mode: 'development',
  output: {
    path: path.resolve('./WebViewApp/', 'dist'),
    filename: 'WebViewApp.dist.js'
  },
  resolve: {
    alias: {
      // packages/midi-debugger has its own node_modules, use only one lodash copy
      lodash: path.resolve(__dirname, 'node_modules/lodash')
    }
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      }
    ]
  }
};