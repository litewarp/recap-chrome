//github.com/samuelsimoes/chrome-extension-webpack-boilerplate/
https: var webpack = require('webpack');
var config = require('../webpack.config.js');

webpack(config, function (err) {
  if (err) throw err;
});
