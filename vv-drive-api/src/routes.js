import { logger } from "../src/logger.js"
import FileHelper from "./fileHelper.js";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url))
const defaultDownloadsFolder = resolve(__dirname, "../", "downloads")

export default class Routes {

    io;

    constructor(downloadsFolder = defaultDownloadsFolder) {
        this.downloadsFolder = downloadsFolder;
        this.fileHelper = FileHelper;
    }

    setIoInstance(io) {
        this.io = io;
    }

    async default(req, res) {
        res.end("Route not available");
    }

    async options(req, res) {
        res.writeHead(204);
        res.end();
    }

    async post(req, res) {
        logger.info("post")
        res.end();
    }

    async get(req, res) {
        const files = await this.fileHelper.getFileStatuses(this.downloadsFolder)

        console.log(files)

        res.writeHead(200)
        res.end(JSON.stringify(files));
    }

    handler(req, res) {
        res.setHeader("Access-Control-Allow-Origin", "*");

        const { method } = req;
        const choosen = this[method.toLowerCase()] || this.default;

        return choosen.apply(this, [req, res]);
    }
}