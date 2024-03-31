import { logger } from "../src/logger.js"
import FileHelper from "./fileHelper.js";
import { dirname, resolve } from "path";
import { fileURLToPath, parse } from "url";
import UploadHandler from "./uploadHandler.js";
import { pipeline } from "stream/promises";

const __dirname = dirname(fileURLToPath(import.meta.url))
const defaultDownloadsFolder = resolve(__dirname, "../", "downloads")

export default class Routes {
    constructor(downloadsFolder = defaultDownloadsFolder) {
        this.downloadsFolder = downloadsFolder;
        this.fileHelper = FileHelper;
        this.io = {};
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
        const { headers } = req;

        const { query: { socketId } } = parse(req.url, true);
        const uploadHandler = new UploadHandler({
            socketId,
            io: this.io,
            downloadsFolder: this.downloadsFolder
        });

        const onFinish = (res) => () => {
            res.writeHead(200)
            const data = JSON.stringify({ result: "Files uploaded with success!" });
            res.end(data);
        }

        const busboyInstance = uploadHandler.registerEvents(
            headers,
            onFinish(res)
        )

        await pipeline(
            req,
            busboyInstance
        )
        
        logger.info("Request finished with success!")
    }

    async get(req, res) {
        const files = await this.fileHelper.getFileStatuses(this.downloadsFolder)

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