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

  chainWebpack: config => {
    config.module
      .rule('vue')
      .use('vue-loader')
      .tap(options => ({
        ...options,
        compilerOptions: {
          // treat any tag that starts with rdf- as custom elements
          isCustomElement: tag => tag.startsWith('rdf-'),
        },
      }))
  },
}
