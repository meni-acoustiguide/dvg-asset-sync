#!/usr/bin/env node

import { filter } from "asyncro";
import * as fs from "fs-extra";
import * as mp from "multi-progress";
import * as path from "path";
import * as yargs from "yargs";
import {
  assetIsInvalid,
  assetIsValid,
  Config,
  downloadAll,
  loadConfig,
  loadDvgJsonData
} from "./lib/DataLoader";
import { Asset, DVGData } from "./lib/DVGData";

const argv = yargs
  .options({
    configFile: {
      alias: "c",
      demandOption: true,
      describe: "Config file (update_profile.json)"
    },
    dir: {
      alias: "d",
      describe: "Target directory for files",
      demandOption: true
    },
    saveJSON: {
      alias: "j",
      describe: "Filename to save the new JSON if successful"
    }
  })
  .help().argv;

export const download = async (
  configFile: string,
  dir: string,
  saveJSON: string
) => {
  const dvgConfig = await loadConfig(configFile);
  const config: Config = {
    baseDirectory: await fs.realpath(dir),
    baseURL: dvgConfig.cloudRoot,
    progress: new mp(process.stderr),
    maxSimultaneousDownloads: 6
  };
  let json: DVGData | undefined;
  try {
    json = await loadDvgJsonData(dvgConfig.cloudURL);
  } catch (err) {
    console.error("Could not load JSON:", err.message);
    return false;
  }
  const missing = await filter(json.assets.assets, async (asset: Asset) => {
    return assetIsInvalid(asset, config);
  });
  console.error(
    `Missing ${missing.length} assets of ${json.assets.assets.length}`
  );
  let result: boolean[] = [];
  try {
    result = await downloadAll(missing, config);
  } catch (err) {
    console.error("Done fail");
    return false;
  }
  console.error(
    `Downloaded ${result.filter(o => o).length} of ${missing.length}`
  );
  if (result.includes(false)) {
    return false;
  }
  if (saveJSON) {
    console.error(`Saving new JSON file ${saveJSON}`);
    try {
      await fs.outputJSON(saveJSON, json);
    } catch (err) {
      console.error("error " + err);
      return false;
    }
  }
  return true;
};

download(argv.configFile, argv.dir, argv.saveJSON).then(result =>
  process.exit(result ? 0 : -1)
);
