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
  } = options;

  // Validate
  if (!scheme) {
    const error = new Error(
      `next-electron-server: Invalid scheme: ${scheme} (${uri})`
    );
    throw error;
  }

  if (!host) {
    const error = new Error(
      `next-electron-server: Invalid host: ${host} (${uri})`
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
        allowServiceWorkers: true,
        supportFetchAPI: true,
        corsEnabled: true,
        ...privileges,
      },
    },
  ]);

  // Wait for app to be ready
  app.once("ready", () => {
    if (dev) {
      // Development: Serve Next.js using a proxy pointing the localhost:3000
      console.log(
        "\x1b[33m%s\x1b[0m",
        "next-electron-server:",
        "Using development mode"
      );
      session.defaultSession.protocol.registerStreamProtocol(
        scheme,
        (request, next) => {
          // Build proxy options
          const { url, ...options } = request;

          // Rewrite url
          const webpackDevServerUrl = url
            .replace(`${scheme}://${host}`, `http://localhost:${port}`)
            .replace(/\/$/, "");

          // Proxy request
          waitForProxy(webpackDevServerUrl, options, next);
        }
      );
    } else {
      // PRODUCTION: Serve Next.js files using a static handler
      const appPath = app.getAppPath();
      protocol.registerFileProtocol(scheme, async (request, respond) => {
        const indexPath = path.join(appPath, "index.html");
        const filePath = path.join(
          appPath,
          request.url.replace(`${scheme}://${host}`, outputDir)
        );
        respond({
          path: (await getPath(filePath)) || indexPath,
        });
      });
    }
  });
};

function waitForProxy(webpackDevServerUrl, options, next) {
  const proxyReq = http.request(webpackDevServerUrl, options, next);

  // Lets wait for the Next.js devserver to start
  proxyReq.on("error", function (error) {
    if (error.code === "ECONNREFUSED") {
      console.log(
        "\x1b[33m%s\x1b[0m",
        "next-electron-server:",
        "Waiting for local dev server"
      );
      setTimeout(() => {
        waitForProxy(webpackDevServerUrl, options, next);
      }, 1000);
    } else {
      throw error;
    }
  });
  proxyReq.end();
}

async function getPath(pth) {
  try {
    const cleanedPath = pth.replace(/\?.*/, "");
    const result = await fs.stat(cleanedPath);

    if (result.isFile()) {
      return cleanedPath;
    }

    if (result.isDirectory()) {
      return getPath(path.join(cleanedPath, "index.html"));
    }
  } catch (error) {
    // Support Next.js 404 page:
    if ((error.code = "ENOENT")) {
      const appPath = app.getAppPath();
      return path.join(appPath, "./out/404.html");
    }
    console.error(error);
  }
}
