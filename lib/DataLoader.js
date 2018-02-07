"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const cwait_1 = require("cwait");
const fs = require("fs-extra");
const fs_extra_1 = require("fs-extra");
const path = require("path");
async function loadConfig(file) {
    return fs.readJson(file);
}
exports.loadConfig = loadConfig;
async function loadDvgJsonData(url) {
    const req = await axios_1.default.get(url);
    if (req.status !== 200) {
        throw new Error("Error downloading JSON " + req.statusText);
    }
    return req.data;
}
exports.loadDvgJsonData = loadDvgJsonData;
const MAX_SIMULTANEOUS_DOWNLOADS = 6;
async function downloadAll(assets, config) {
    const queue = new cwait_1.TaskQueue(Promise, config.maxSimultaneousDownloads || MAX_SIMULTANEOUS_DOWNLOADS);
    try {
        const results = await Promise.all(assets.map(queue.wrap((asset) => doDownload(asset, config))));
    }
    catch (err) {
        console.error(err);
    }
}
exports.downloadAll = downloadAll;
async function doDownload(asset, config) {
    const response = await axios_1.default.get(asset.path, {
        responseType: "stream",
        baseURL: config.baseURL,
    });
    const size = parseInt(response.headers["content-length"], 10);
    const bar = config.progress.newBar(`${asset.path.padEnd(20).substr(0, 20)} [:bar] :percent :etas`, {
        complete: "█",
        incomplete: "░",
        width: 30,
        total: size,
    });
    const outFile = path.join(config.baseDirectory, asset.path);
    await fs_extra_1.ensureFile(outFile);
    response.data.on("data", (chunk) => {
        if (bar.tick) {
            bar.tick(chunk.length);
        }
    }).pipe(fs.createWriteStream(outFile));
}
exports.doDownload = doDownload;
