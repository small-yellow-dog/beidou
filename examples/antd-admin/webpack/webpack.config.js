const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = (app) => {
  const universal = app.config.isomorphic.universal;
  const dev = app.config.env !== 'prod';
  const outputPath = path.join(app.config.baseDir, app.config.webpack.outputPath);

  const plugins = [
    new webpack.optimize.CommonsChunkPlugin({
      name: 'manifest',
      filename: 'manifest.js',
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(dev ? 'development' : 'production'),
      __CLIENT__: true,
      __DEV__: dev,
      __SERVER__: false,
    }),
    new webpack.ProgressPlugin((percentage, msg) => {
      const stream = process.stderr;
      if (stream.isTTY && percentage < 0.71) {
        stream.cursorTo(0);
        stream.write(`📦   ${msg}`);
        stream.clearLine(1);
      }
    }),
    new ExtractTextPlugin('[name].css'),
    new webpack.NoEmitOnErrorsPlugin(),
  ];

  if (universal) {
    plugins.push(new app.IsomorphicPlugin(universal));
  }

  if (dev) {
    plugins.push(new webpack.NamedModulesPlugin());
    plugins.push(new webpack.HotModuleReplacementPlugin());
  } else {
    plugins.push(new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
      },
    }));
  }

  const config = {
    devtool: dev ? 'eval' : false,
    context: app.config.baseDir,
    entry: {
      login: [
        './client/pages/login/index.jsx',
      ],
      main: [
        './client/pages/dashboard/index.jsx',
      ],
    },
    output: {
      path: outputPath,
      filename: '[name].js?[hash]',
      chunkFilename: '[name].js',
      publicPath: app.config.webpack.publicPath,
    },
    externals: {
      react: 'React',
      'react-dom': 'ReactDOM',
      antd: true,
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              babelrc: false,
              presets: ['beidou-client'],
            },
          },
        },
        {
          test: /\.less$/,
          exclude: /node_modules/,
          use: ExtractTextPlugin.extract({
            use: [{
              loader: 'css-loader',
              options: {
                importLoaders: 1,
                modules: true,
                localIdentName: '[local]_[hash:base64]',
              },
            }, {
              loader: 'less-loader',
            }],
            fallback: 'style-loader',
          }),
        },
        {
          test: /\.(png|jpg|gif)$/,
          use: [
            {
              loader: 'url-loader',
              options: {
                limit: 81920,
              },
            },
          ],
        },
      ],
    },
    resolve: {
      extensions: ['.json', '.js', '.jsx'],
      alias: {
        client: path.join(__dirname, '../client'),
        themes: path.join(__dirname, '../client/themes'),
      },
    },
    devServer: {
      hot: true,
    },
    plugins,
  };

  return config;
};

