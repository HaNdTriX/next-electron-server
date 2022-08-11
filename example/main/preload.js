const { ipcRenderer, contextBridge, webFrame } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  message: {
    send: (payload) => ipcRenderer.send("message", payload),
    on: (handler) => ipcRenderer.on("message", handler),
    off: (handler) => ipcRenderer.off("message", handler),
  },
});

// Next.js Websocket DevServer is not listining on our custom scheme.
// This is why we need to monkey patch the global WebSocket constructor
// to use the correct DevServer url
// More info: https://github.com/HaNdTriX/next-electron-server/issues/7
if (process.env.NEXT_ELECTON_SERVER_DEV === "true") {
  webFrame.executeJavaScript(`Object.defineProperty(globalThis, 'WebSocket', {
    value: new Proxy(WebSocket, {
      construct: (Target, [url, protocols]) => {
        if (url.endsWith('/_next/webpack-hmr')) {
          // Fix the Next.js hmr client url
          return new Target("ws://localhost:${
            process.env.NEXT_ELECTON_SERVER_PORT || 3000
          }/_next/webpack-hmr", protocols)
        } else {
          return new Target(url, protocols)
        }
      }
    })
  });`);
}
