const process = require('process');


/**
 * The URL of the Jitsi Meet deployment to be proxy to in the context of
 * development with webpack-dev-server.
 */
const devServerProxyTarget = process.env.WEBPACK_DEV_SERVER_PROXY_TARGET || 'https://alpha.jitsi.net';



/**
 * Determines whether a specific (HTTP) request is to bypass the proxy of
 * webpack-dev-server (i.e. is to be handled by the proxy target) and, if not,
 * which local file is to be served in response to the request.
 *
 * @param {Object} request - The (HTTP) request received by the proxy.
 * @returns {string|undefined} If the request is to be served by the proxy
 * target, undefined; otherwise, the path to the local file to be served.
 */
const devServerProxyBypass = ({ path }) => {
  if (path.indexOf('http-bind') !== -1) {
    return;
  }

  if (path.startsWith('/libs/')) {
    return path;
  }

  if (path.indexOf('index223') !== -1) {
    return path;
  }
};


module.exports = {
  devServer: {
    port: 8081,
    https: true,
    inline: true,
    proxy: {
      '/': {
        bypass: devServerProxyBypass,
        secure: false,
        target: devServerProxyTarget,
        headers: {
          'Host': new URL(devServerProxyTarget).host
        }
      }
    }
  },
  devtool: 'source-map'
};