const { app, net, protocol, session } = require("electron");
const path = require("path");
const fs = require("fs").promises;

module.exports = async function serveNextAt(uri, options = {}) {
  // Parse scheme
  const urlObj = new URL(uri);
  const host = urlObj.host;
  const scheme = urlObj.protocol.replace(/:$/, "");

  // Configure defaults
  const {
    privileges = {},
    port = 3000,
    dev = !app.isPackaged,
    outputDir = "./out",
    partition,
    logger = createLogger("next-electron-server"),
  } = options;

  // Register scheme
  protocol.registerSchemesAsPrivileged([
    {
      scheme,
      privileges: {
        standard: true,
        secure: true,
        allowServiceWorkers: true,
        supportFetchAPI: true,
        corsEnabled: true,
        ...privileges,
      },
    },
  ]);

  // Wait for app to be ready
  app.whenReady().then(() => {
    const { protocol } = partition
      ? session.fromPartition(partition)
      : session.defaultSession;

    if (dev) {
      if (isNaN(port)) {
        const error = new Error(
          `next-electron-server - "port" must be a number`
        );
        throw error;
      }

      // Development: Serve Next.js using a proxy pointing the localhost:3000
      logger.log(
        `Serving files via ${scheme}://${host} from http://localhost:${port}`
      );

      protocol.registerStreamProtocol(scheme, (request, next) => {
        const patchedRequest = {
          ...request,
          url: request.url
            .replace(`${scheme}://${host}`, `http://localhost:${port}`)
            .replace(/\/$/, ""),
        };

        // Patch Next.js webpack.js to fix the hmr client url
        if (
          patchedRequest.url.includes(`:${port}/_next/static/chunks/webpack.js`)
        ) {
          logger.log("Patching _next/static/chunks/webpack.js");

          return cloneAndRetryRequest(patchedRequest, (response) => {
            const { PassThrough } = require("stream");
            const stream = new PassThrough();

            // Patch the webpack.js file to fix the hmr client url:
            // We do this, by adding a Websocket proxy that fixes the url
            // to the top of the response body
            stream.push(`
              Object.defineProperty(globalThis, 'WebSocket', {
                value: new Proxy(WebSocket, {
                  construct: (Target, [url, protocols]) => {
                    if (url.endsWith('/_next/webpack-hmr')) {
                      // Fix the Next.js hmr client url
                      return new Target("ws://localhost:${port}/_next/webpack-hmr", protocols)
                    } else {
                      return new Target(url, protocols)
                    }
                  }
                })
              });
            `);

            response.pipe(stream);
            next(stream);
          });
        }

        // Proxy request
        return cloneAndRetryRequest(patchedRequest, next);
      });
    } else {
      // PRODUCTION: Serve Next.js files using a static handler
      const appPath = app.getAppPath();
      protocol.registerFileProtocol(scheme, async (request, respond) => {
        // Get the requested filePath
        const filePath = path.join(
          appPath,
          request.url.replace(`${scheme}://${host}`, outputDir)
        );

        // Try to resolve it
        let resolvedPath = await resolvePath(filePath);

        // If not found lets try to find it as .html file
        if (!resolvedPath && !path.extname(filePath)) {
          resolvedPath = await resolvePath(filePath + ".html");
        }

        // Snap the file doesn't exist. Lets render the Next.js 404
        if (!resolvedPath) {
          resolvedPath = path.join(appPath, outputDir, "./404.html");
        }

        respond({
          path: resolvedPath,
        });
      });
    }
  });
};

function cloneAndRetryRequest(options, next) {
  return net
    .request(options)
    .on("response", next)
    .on("error", async (error) => {
      // Lets wait for the Next.js devserver to start
      if (error.code === "ECONNREFUSED") {
        logger.log("Waiting for Next.js DevServer");

        // Next devserver is not ready yet, lets wait for it
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Retry
        cloneAndRetryRequest(options, next);
      } else {
        throw error;
      }
    })
    .end();
}

async function resolvePath(pth) {
  try {
    const cleanedPath = pth.replace(/\?.*/, "");
    const result = await fs.stat(cleanedPath);

    if (result.isFile()) {
      return cleanedPath;
    }

    if (result.isDirectory()) {
      return resolvePath(path.join(cleanedPath, "index.html"));
    }
  } catch (_) {}
}

function createLogger(namespace) {
  return new Proxy(console, {
    get(target, key) {
      return target[key].bind(target, "\x1b[33m%s\x1b[0m", namespace, "-");
    },
  });
}
