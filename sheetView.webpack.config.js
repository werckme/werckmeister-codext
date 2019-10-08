const path = require('path');

module.exports = {
  entry: './SheetView/main.js',
  mode: 'production',
  output: {
    path: path.resolve('./SheetView/', 'dist'),
    filename: 'sheetView.dist.js'
  }
};