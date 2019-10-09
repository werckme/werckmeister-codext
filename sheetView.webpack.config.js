const path = require('path');

module.exports = {
  entry: './SheetView/main.js',
  mode: 'development',
  output: {
    path: path.resolve('./SheetView/', 'dist'),
    filename: 'sheetView.dist.js'
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