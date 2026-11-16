const path = require('path');

module.exports = {
  entry: './WebViewApp/main.tsx',
  mode: 'development',
  output: {
    path: path.resolve('./WebViewApp/', 'dist'),
    filename: 'WebViewApp.dist.js'
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(__dirname, 'WebViewApp/tsconfig.json')
          }
        }
      }
    ]
  }
};
