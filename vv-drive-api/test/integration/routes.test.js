import {
    describe,
    test,
    expect,
    jest,
    beforeAll,
    afterAll
} from '@jest/globals';
import fs from 'fs'
import FormData from "form-data";
import TestUtil from "../_util/testUtil";
import { logger } from '../../src/logger';
import Routes from '../../src/routes';
import { tmpdir } from "os"
import { join } from "path"

describe("#Routes Integration Test", () => {
    let defaultDownloadsFolder = ""; 
    beforeEach(() => {
        jest.spyOn(logger, 'info').mockImplementation()
    })

    beforeAll(async () => {
        defaultDownloadsFolder = await fs.promises.mkdtemp(join(tmpdir(), "downloads-"))
    })

    afterAll(async () => {
        await fs.promises.rm(defaultDownloadsFolder, { recursive: true })
    })

    describe("#GetFileStatus", () => {
        const ioMock = {
            to: (id) => ioMock,
            emit: (event, message) => {}
        }

        test("Should upload file o the folder", async () => {
            const filename = "equality-table.jpeg";
            const fileStream = fs.createReadStream(`./test/integration/mocks/${filename}`)

            const response = TestUtil.generateWritableStream(() => {})

            const formData = new FormData();
            formData.append("file", fileStream)

            const defaultParams = {
                req: Object.assign(formData, {
                    headers: formData.getHeaders(),
                    method: "POST",
                    url: "?socketId=01"
                }),
                res: Object.assign(response, {
                    setHeader: jest.fn(),
                    writeHead: jest.fn(),
                    end: jest.fn()
                }),
                values: () => Object.values(defaultParams)
            };

            const routes = new Routes(defaultDownloadsFolder);
            routes.setIoInstance(ioMock)

            const dirBefore = await fs.promises.readdir(defaultDownloadsFolder)
            expect(dirBefore).toEqual([])

            await routes.handler(...defaultParams.values());

            const dirAfter = await fs.promises.readdir(defaultDownloadsFolder)
            expect(dirAfter).toEqual([ filename ])

            expect(defaultParams.res.writeHead).toHaveBeenCalledWith(200)

            const result = JSON.stringify({ result: "Files uploaded with success!" })
            expect(defaultParams.res.end).toHaveBeenCalledWith(result)
        })
    })
})