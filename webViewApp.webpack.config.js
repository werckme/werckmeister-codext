const path = require('path');

module.exports = {
  entry: './WebViewApp/main.js',
  mode: 'development',
  output: {
    path: path.resolve('./WebViewApp/', 'dist'),
    filename: 'WebViewApp.dist.js'
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