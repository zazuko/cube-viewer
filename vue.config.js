const webpack = require('webpack')

module.exports = {
  pwa: {
    name: 'Cube Viewer',
    themeColor: '#ffb15e',
  },

  configureWebpack: config => {
    // Webpack 5 doesn't provide polyfills so we need to do it manually
    config.resolve.fallback = {
      crypto: false,
      stream: require.resolve('stream-browserify'),
    }

    config.plugins.push(
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      })
    )
  },
}
