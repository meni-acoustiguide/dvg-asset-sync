"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const c = require("ansi-styles");
const axios_1 = require("axios");
const cwait_1 = require("cwait");
const fs = require("fs-extra");
const fs_extra_1 = require("fs-extra");
const md5File = require("md5-file/promise");
const path = require("path");
const timers_1 = require("timers");
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
    const results = await Promise.all(assets.map(queue.wrap(async (asset) => {
        try {
            return await doDownload(asset, config);
        }
        catch (_a) {
            return false;
        }
    })));
    console.error(`Finished. ${results.filter((o) => o).length} good of ${assets.length}`);
    return results;
}
exports.downloadAll = downloadAll;
function makePath(asset, config) {
    return path.join(config.baseDirectory, asset.path);
}
exports.makePath = makePath;
async function assetIsValid(asset, config) {
    const assetPath = makePath(asset, config);
    if (!await fs.pathExists(assetPath)) {
        return false;
    }
    const md5 = await md5File(assetPath);
    return !!(md5 && asset.checksum === md5);
}
exports.assetIsValid = assetIsValid;
async function assetIsInvalid(asset, config) {
    let validity;
    try {
        validity = await assetIsValid(asset, config);
    }
    catch (err) {
        console.error("ERROR" + err);
    }
    return !validity;
}
exports.assetIsInvalid = assetIsInvalid;
async function doDownload(asset, config) {
    const response = await axios_1.default.get(asset.path, {
        responseType: "stream",
        baseURL: config.baseURL,
        timeout: 10000,
    });
    const size = parseInt(response.headers["content-length"], 10);
    const bar = config.progress.newBar(`${c.green.open}${asset.path.padEnd(40).substr(0, 40)}${c.green.close} [:bar] ${c.red.open}:percent${c.red.close} ${c.yellow.open}:etas${c.yellow.close}`, {
        complete: c.green.open + "█" + c.green.close,
        incomplete: "█",
        width: 30,
        total: size,
    });
    const outFile = makePath(asset, config);
    await fs_extra_1.ensureFile(outFile);
    return new Promise((resolve, reject) => {
        const makeTimer = () => {
            return timers_1.setTimeout(() => {
                bar.terminate();
                resolve(false);
            }, 10000);
        };
        let timeout = makeTimer();
        response.data
            .on("data", (chunk) => {
            if (bar.tick) {
                bar.tick(chunk.length);
            }
            timers_1.clearTimeout(timeout);
            timeout = makeTimer();
        })
            .on("error", () => {
            bar.terminate();
            timers_1.clearTimeout(timeout);
            resolve(false);
        })
            .on("end", async () => {
            timers_1.clearTimeout(timeout);
            resolve(await assetIsValid(asset, config));
        })
            .pipe(fs.createWriteStream(outFile));
    });
}
exports.doDownload = doDownload;
//# sourceMappingURL=DataLoader.js.map