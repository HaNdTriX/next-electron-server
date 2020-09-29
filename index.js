const { app, protocol, session } = require("electron");
const path = require("path");
const fs = require("fs").promises;
const http = require("http");

const getPath = async (pth) => {
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
    if ((error.code = "ENOENT")) {
      const appPath = app.getAppPath();
      return path.join(appPath, "./out/404.html");
    }
    console.error(error);
  }
};

module.exports = async function serveNext(uri, config = {}) {
  const {
    privileges = {},
    port = 3000,
    dev = !app.isPackaged,
    outputDir = "./out",
  } = config;
  const [, scheme, host = "app"] = uri.match(/^([\w-]*):\/\/(.*)$/i);

  if (!scheme) {
    const error = new Error(`Invalid scheme: ${scheme}`);
    throw error;
  }

  protocol.registerSchemesAsPrivileged([
    {
      scheme,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        ...privileges,
      },
    },
  ]);

  app.on("ready", () => {
    if (dev) {
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
  // Proxy request
  const proxyReq = http.request(webpackDevServerUrl, options, next);

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
