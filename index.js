#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const mp = require("multi-progress");
const yargs = require("yargs");
const DataLoader_1 = require("./lib/DataLoader");
const argv = yargs
    .options({
    config: {
        alias: "c",
        demandOption: true,
        describe: "Config file (update_profile.json)",
    },
    dir: {
        alias: "d",
        describe: "Target directory for files",
        demandOption: true,
    },
}).help().argv;
(async () => {
    const dvgConfig = await DataLoader_1.loadConfig(argv.config);
    const config = {
        baseDirectory: await fs.realpath(argv.dir),
        baseURL: dvgConfig.cloudRoot,
        progress: new mp(process.stderr),
        maxSimultaneousDownloads: 6,
    };
    const json = await DataLoader_1.loadDvgJsonData(dvgConfig.cloudURL);
    DataLoader_1.downloadAll(json.assets.assets, config);
})();
