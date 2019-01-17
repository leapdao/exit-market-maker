const path = require('path');
const slsw = require('serverless-webpack');

module.exports = {
  entry: slsw.lib.entries,
  target: 'node',
  plugins: [],
  module: {
    loaders: [
      {
        test: /\.js?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['es2015', 'stage-0'],
          plugins: [
            'transform-runtime',
            'transform-async-to-generator',
            'transform-class-properties',
            [
              'babel-plugin-transform-builtin-extend',
              { globals: ['Error', 'Array'] },
            ],
          ],
        },
      },
      { test: /\.js$/, include: /node_modules\/fsevents/, use: ['shebang-loader'] },
    ],
  },
  output: {
    libraryTarget: 'commonjs',
    path: path.join(__dirname, '.webpack'),
    filename: '[name].js',
  },
};
