const { devDependencies } = require("./package.json");

module.exports = {
  presets: [
    [
      "next/babel",
      {
        "preset-env": {
          targets: {
            // Babel Env needs to upgrade electron-to-chromium
            // for the following line to work with electron > 7:
            // electron: devDependencies.electron.replace(/^\^|~/, ""),
            electron: 7,
          },
        },
      },
    ],
  ],
};
