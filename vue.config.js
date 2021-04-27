module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
    ? '/cube-viewer/'
    : '/',

  pwa: {
    name: 'Cube Viewer',
    themeColor: '#ffb15e',
  },
}
