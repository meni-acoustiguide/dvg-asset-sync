import * as c from "ansi-styles";
import axios from "axios";
import { TaskQueue } from "cwait";
import * as fs from "fs-extra";
import { ensureFile, outputFile } from "fs-extra";
import * as http from "http";
import * as md5File from "md5-file/promise";
import * as mp from "multi-progress";
import * as path from "path";
import * as ProgressBar from "progress";
import { Asset, AssetList, DVGData, DVGDataConfig } from "./DVGData";

export interface Config {
    baseURL: string;
    baseDirectory: string;

    maxSimultaneousDownloads: number;
    progress: typeof mp;
}

export async function loadConfig(file: string): Promise<DVGDataConfig> {
    return fs.readJson(file);
}

export async function loadDvgJsonData(url: string): Promise<DVGData> {
    const req = await axios.get<DVGData>(url);
    if (req.status !== 200) {
        throw new Error("Error downloading JSON " + req.statusText);
    }
    return req.data;
}

const MAX_SIMULTANEOUS_DOWNLOADS = 6;

export async function downloadAll(assets: Asset[], config: Config) {
    const queue = new TaskQueue(Promise, config.maxSimultaneousDownloads || MAX_SIMULTANEOUS_DOWNLOADS);
    try {
        const results = await Promise.all(assets.map(queue.wrap((asset) => doDownload(asset, config))));
    } catch (err) {
        console.error(err);
    }
}

export function makePath(asset: Asset, config: Config) {
    return path.join(config.baseDirectory, asset.path);
}

export async function assetIsValid(asset: Asset, config: Config) {
    const assetPath = makePath(asset, config);

    if (!await fs.pathExists(assetPath)) {
        return false;
    }
    const md5: string = await md5File(assetPath);

    return (md5 && asset.checksum === md5);
}

export async function assetIsInvalid(asset: Asset, config: Config) {
    let validity;
    try {
        validity = await assetIsValid(asset, config);
    } catch (err) {
        console.error("ERROR" + err);
    }
    return !validity;
}

export async function doDownload(asset: Asset, config: Config) {

    const response = await axios.get<http.IncomingMessage>(asset.path, {
        responseType: "stream",
        baseURL: config.baseURL,
    });

    const size = parseInt(response.headers["content-length"], 10);

    const bar: ProgressBar = config.progress.newBar(`${c.green.open}${asset.path.padEnd(40).substr(0, 40)}${c.green.close} [:bar] ${c.red.open}:percent${c.red.close} ${c.yellow.open}:etas${c.yellow.close}`, {
        complete: c.green.open + "█" + c.green.close,
        incomplete: "█",
        width: 30,
        total: size,
    });

    const outFile = makePath(asset, config);
    await ensureFile(outFile);
    return new Promise((resolve, reject) => {
        response.data
            .on("data", (chunk) => {
                if (bar.tick) {
                    bar.tick(chunk.length);
                }
            })
            .on("error", reject)
            .on("end", resolve)
            .pipe(fs.createWriteStream(outFile));
    });

}
