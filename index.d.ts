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
   * Port from the Next.js devserver
   * @default 3000
   */
  privileges?: any;
}

declare function serveNextAt(uri: string, options?: Options): void;

export = serveNextAt;
