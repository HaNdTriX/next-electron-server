interface ElectronProtocolPrivileges {
  standard?: boolean;
  secure?: boolean;
  stream?: boolean;
  allowServiceWorkers?: boolean;
  corsEnabled?: boolean;
  supportFetchAPI?: boolean;
}

interface Options {
  /**
   * Port from the Next.js devserver
   * @default 3000
   */
  port?: number;

  /**
   * The Next.js static HTML Export directory
   * @default "./out"
   * @url https://nextjs.org/docs/advanced-features/static-html-export
   */
  outputDir?: string;

  /**
   * Development flag.
   * In development the app is served by the Next.js DevServer
   * In production the app is served from the outputDir
   * @default !electron.app.isPackaged
   */
  dev?: boolean;

  /**
   * Electron Protocol Priviliges
   * @url https://www.electronjs.org/docs/api/protocol
   */
  privileges?: ElectronProtocolPrivileges;

  /**
   * The partition the protocol should be installed to, if you're not using Electron's default partition.
   * @default electron.session.defaultSession
   */
  partition?: string;
}

declare function serveNextAt(uri: string, options?: Options): void;

export = serveNextAt;
