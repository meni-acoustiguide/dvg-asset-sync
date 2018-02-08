#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const asyncro_1 = require("asyncro");
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
    saveJSON: {
        alias: "j",
        describe: "Filename to save the new JSON if successful",
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
    let json;
    try {
        json = await DataLoader_1.loadDvgJsonData(dvgConfig.cloudURL);
    }
    catch (err) {
        console.error("Could not load JSON:", err.message);
        return;
    }
    const missing = await asyncro_1.filter(json.assets.assets, async (asset) => {
        return DataLoader_1.assetIsInvalid(asset, config);
    });
    console.error(`Missing ${missing.length} assets of ${json.assets.assets.length}`);
    let result = [];
    try {
        result = await DataLoader_1.downloadAll(missing, config);
    }
    catch (err) {
        console.error("Done fail");
        process.exit(-1);
    }
    console.log(`Downloaded ${result.filter((o) => o).length} of ${missing.length}`);
    if (result.includes(false)) {
        process.exit(-1);
    }
    if (argv.saveJSON) {
        console.error(`Saving new JSON file ${argv.saveJSON}`);
        try {
            await fs.outputJSON(argv.saveJSON, json);
        }
        catch (err) {
            console.error("error " + err);
            process.exit(-1);
        }
        process.exit();
    }
})();
//# sourceMappingURL=index.js.map