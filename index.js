const { app, protocol, session } = require("electron");
const path = require("path");
const fs = require("fs").promises;
const http = require("http");

module.exports = async function serveNextAt(uri, options = {}) {
  // Parse scheme
  const [, scheme, host] = uri.match(/^([\w-]*):\/\/(.*)$/i);

  // Configure defaults
  const {
    privileges = {},
    port = 3000,
    dev = !app.isPackaged,
    outputDir = "./out",
    partition,
  } = options;

  // Expose the server port and dev flag as en environment variable
  // This allows us to dynamically expose the port to the preload script
  process.env.NEXT_ELECTON_SERVER_PORT = port;
  process.env.NEXT_ELECTON_SERVER_DEV = dev;

  // Validate
  if (!scheme) {
    const error = new Error(
      `next-electron-server - Invalid scheme: ${scheme} (${uri})`
    );
    throw error;
  }

  if (!host) {
    const error = new Error(
      `next-electron-server - Invalid host: ${host} (${uri})`
    );
    throw error;
  }

  // Register scheme
  protocol.registerSchemesAsPrivileged([
    {
      scheme,
      privileges: {
        standard: true,
        secure: true,
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
      console.log(
        "\x1b[33m%s\x1b[0m",
        "next-electron-server",
        `- Serving files via ${scheme}://${host} from http://localhost:${port}`
      );
      protocol.registerStreamProtocol(scheme, (request, next) => {
        // Parse proxy options
        const { url, ...options } = request;

        // Rewrite url to localhost localhost
        const devServerUrl = url
          .replace(`${scheme}://${host}`, `http://localhost:${port}`)
          .replace(/\/$/, "");

        // Proxy request
        lazyProxyRequest(devServerUrl, options, next);
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

function lazyProxyRequest(webpackDevServerUrl, options, next) {
  return http
    .request(webpackDevServerUrl, options, next)
    .on("error", async (error) => {
      // Lets wait for the Next.js devserver to start
      if (error.code === "ECONNREFUSED") {
        console.log(
          "\x1b[33m%s\x1b[0m",
          "next-electron-server",
          "- Waiting for Next.js DevServer"
        );

        // Next devserver is not ready yet, lets wait for it
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Retry
        lazyProxyRequest(webpackDevServerUrl, options, next);
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
