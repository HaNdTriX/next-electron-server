# Next Electron Server

Serve your Next.js app inside electon using a custom scheme.

## Install

```js
$ npm install next-electron-server
```

or using yarn

```js
$ yarn add next-electron-server
```

## Usage

```js
const serveNext = require("./serve-next");

serveNext("next://app");

app.on("ready", async () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
  });

  mainWindow.loadURL("next://app");
});
```

## API

### serveNext(uri, options)

#### uri

_Required_
Type: `string`

#### options

Type: `object`

##### outputDir

Type: `string`
Default: `"./out"`

The directory to serve, relative to the app root directory.

##### port

Type: `number`
Default: `3000`

The port your Next.js devserver runs on.

#### dev

Type: `boolean`
Default `!app.isPackaged`

This flag decides how to serve the files. When `dev === true` a proxy will be created pointing to `localhost:3000`.

## Motivation

Most electron tutorials recommend using a url switch to differentiate between devserver localhost urls in development and static urls used in production:

**Example:**

```js
app.on("ready", async () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
  });

  const url = isDev
    ? "http://localhost:8000"
    : format({
        pathname: join(__dirname, "../renderer/out/index.html"),
        protocol: "file:",
        slashes: true,
      });

  mainWindow.loadURL(url);
});
```

From my point of view this approach has many drawbacks.

- The origin of the html document differs between production & development
- The security model may differ between production & development
- Paths differ between production & development
- 404 pages won't work in production

Thats why I created `next-electron-server`.
The render page will always being server using the same protocol and url.

- In **development** is implements a proxy to `http://localhost:3000`.
- In **production** is serves files from the `/out` directory.

## Features

- supports 404 pages
- works with next devserver
- works with paths of images and other static resources
- static paths won't differ between development and production
