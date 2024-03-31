import { jest } from "@jest/globals"
import { Readable, Writable, Transform } from "stream"

export default class TestUtil {

    static getTimeFromDate(dateString) {
        return new Date(dateString).getTime()
    }

    static mockDateNow(mockImplementationPeriods) {
        const now = jest.spyOn(global.Date, global.Date.now.name)

        mockImplementationPeriods.forEach(time => {
            now.mockReturnValueOnce(time);
        })
    }

    static generateReadableStream(arrayBuffer) {
        return new Readable({
            objectMode: true,
            read() {

                for (const buffer of arrayBuffer) {
                    // Put all buffer item to be listened for onData function
                    this.push(buffer)
                }

                // This indicates the readable stream finish
                this.push(null)
            }
        })
    }

    static generateWritableStream(onData) {
        return new Writable({
            objectMode: true,
            write(chunk, encoding, cb) {
                onData(chunk)

                cb(null, chunk)
            }
        })
    }

    static generateTransformStream(onData) {
        return new Transform({
            objectMode: true,
            transform(chunk, encoding, cb) {
                onData(chunk)

                cb(null, chunk)
            }
        });
    }

}