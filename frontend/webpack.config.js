const path = require('path');
const HTMLWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './frontend/src/index.js', // React entrypoint
  output: {
    path: path.resolve(__dirname, 'frontend/dist'), // output dir of bundled frontend code
    filename: 'bundle.js',
  },

  plugins: [
    new HTMLWebpackPlugin({
      title: 'development',
      template: './frontend/public/index.html', // Path to HTML template
    }),
  ],

  devServer: {
    host: 'localhost',
    port: 3000, // match with proxy config
    open: true,
    hot: true,
    compress: true,
    historyApiFallback: true,
    proxy: {
      '/api': 'http://localhost:8080', // Proxy API requests to Go backend
    },
    static: {
      directory: path.resolve(__dirname, 'frontend/dist'), // server React files
      publicPath: '/',
    },
  },

  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      {
        test: /\.css$/,
        exclude: /node_modules/,
        use: ['style-loader', 'css-loader']
      },
    ],
  },
};