#!/usr/bin/env node

import * as fs from "fs-extra";
import * as mp from "multi-progress";
import * as yargs from "yargs";

import {Argv} from "yargs";
import { Config, downloadAll, loadConfig, loadDvgJsonData } from "./lib/DataLoader";

const argv =  yargs
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
    const dvgConfig = await loadConfig(argv.config);
    const config: Config = {
        baseDirectory: await fs.realpath(argv.dir),
        baseURL: dvgConfig.cloudRoot,
        progress: new mp(process.stderr),
        maxSimultaneousDownloads: 6,
    };
    const json = await loadDvgJsonData(dvgConfig.cloudURL);
    downloadAll(json.assets.assets, config);
})();
