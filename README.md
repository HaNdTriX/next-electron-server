# Next.js Electron Server

Serve your [Next.js](https://nextjs.org/) app inside [Electron](https://www.electronjs.org/) using a custom scheme.

## Install

```js
$ npm install next-electron-server
```

or using [yarn](https://yarnpkg.com/)

```js
$ yarn add next-electron-server
```

## Usage

```js
const serveNextAt = require("next-electron-server");

serveNextAt("next://app");

app.on("ready", async () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
  });

  mainWindow.loadURL("next://app");
  // mainWindow.loadURL("next://app/page1");
  // mainWindow.loadURL("next://app/page2");
});
```

For more infos check out the [example](./example) directory.

## Motivation

Most electron tutorials recommend using a url switch to differentiate between devserver localhost urls in development and static urls used in production:

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
The render page will always being served using the same protocol and url.

- In **development** is implements a proxy to `http://localhost:3000`.
- In **production** is serves files from the `/out` directory.

## Features

- supports 404 pages
- works with next devserver
- waits for next devserver to start
- works with paths of images and other static resources
- static paths won't differ between development and production
- has zero dependencies

## API

### serveNext(uri, options)

#### uri

_Required_\
Type: `string`\
Example: `next://app`\

The entrypoint of your Next.js app.

#### options

Type: `object`

##### outputDir

Type: `string`\
Default: `"./out"`

The directory to serve, relative to the app root directory.

##### port

Type: `number`\
Default: `3000`

The port your Next.js devserver runs on.

#### dev

Type: `boolean`\
Default `!app.isPackaged`

This flag decides how to serve the files. When `dev === true` a proxy will be created pointing to `localhost:3000`.

#### privileges

Type: `object`

Check out [electron/docs/protocol](https://www.electronjs.org/docs/api/protocol#protocolregisterschemesasprivilegedcustomschemes) for more infos about this config object.

## Contributing

1. [Fork](https://help.github.com/articles/fork-a-repo/) this repository to your own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device
2. Link it to the global module directory: `yarn link`
3. Install in your local project using `yarn link next-electron-server`

## Author

Henrik Wenz ([@HenrikWenz](https://twitter.com/henrikwenz))
