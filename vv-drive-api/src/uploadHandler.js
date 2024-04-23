import { pipeline } from "stream/promises"
import fs from "fs"
import Busboy from "busboy"

import { logger } from "./logger.js"

export default class UploadHandler {
    constructor({ io, socketId, downloadsFolder, messageTimeDelay = 200 }) {
        this.io = io
        this.socketId = socketId
        this.downloadsFolder = downloadsFolder
        this.ON_UPLOAD_EVENT = "file-upload"
        this.messageTimeDelay = messageTimeDelay
    }

    canExecute(lastExecution) {
        return (Date.now() - lastExecution) >= this.messageTimeDelay
    }

    handleFileBytes(filename) {
        this.lastMessageSent = Date.now();
        
        async function *handleData(source) {
            let alreadyProcessed = 0;

            for await (const chunk of source) {
                // It here I can pass the chunk because I'm not doing nothing with this chunk
                yield chunk;

                alreadyProcessed += chunk.length;

                if (!this.canExecute(this.lastMessageSent)) {
                    continue;
                }

                this.lastMessageSent = Date.now();

                this.io.to(this.socketId).emit(this.ON_UPLOAD_EVENT, { alreadyProcessed, filename })
                logger.info(`File [${filename}] already processed ${alreadyProcessed} bytes to ${this.socketId}`);
            }
        }

        return handleData.bind(this)
    }

    async onFile(fieldname, file, filename) {

        const saveTo = `${this.downloadsFolder}/${filename}`

        await pipeline(
            // Get a readable stream
            file,
            // Filter, transform, convert data
            this.handleFileBytes.apply(this, [ filename ]),
            // Output data, writable stream
            fs.createWriteStream(saveTo)
        )

        logger.info(`File [${saveTo}] finished`)
    }

    registerEvents(headers, onFinish) {
        const busboy = new Busboy({ headers })

        // Passed the bind for when we call this inside onFile, calls the File class context
        busboy.on("file", this.onFile.bind(this))

        busboy.on("finish", onFinish)

        return busboy
    }
}