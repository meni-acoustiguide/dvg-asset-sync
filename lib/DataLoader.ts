import axios from "axios";
import { TaskQueue } from "cwait";
import * as fs from "fs-extra";
import { ensureFile, outputFile } from "fs-extra";
import * as http from "http";
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

export async function doDownload(asset: Asset, config: Config) {

    const response = await axios.get<http.IncomingMessage>(asset.path, {
        responseType: "stream",
        baseURL: config.baseURL,
    });

    const size = parseInt(response.headers["content-length"], 10);

    const bar: ProgressBar = config.progress.newBar(`${asset.path.padEnd(20).substr(0, 20)} [:bar] :percent :etas`, {
        complete: "█",
        incomplete: "░",
        width: 30,
        total: size,
    });

    const outFile = path.join(config.baseDirectory, asset.path);
    await ensureFile(outFile);
    response.data.on("data", (chunk) => {
        if (bar.tick) {
            bar.tick(chunk.length);
        }
    }).pipe(fs.createWriteStream(outFile));
}
