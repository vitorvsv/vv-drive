import {
    describe,
    test,
    expect,
    jest,
    beforeEach
} from '@jest/globals';
import Routes from '../../src/routes';
import fs from 'fs'
import TestUtil from '../_util/testUtil';
import UploadHandler from '../../src/uploadHandler';
import { logger } from '../../src/logger';

describe("Route test suit", () => {
    beforeEach(() => {
        jest.spyOn(logger, 'info').mockImplementation()
    })

    const request = TestUtil.generateReadableStream([ 'some bytes here' ])
    const response = TestUtil.generateWritableStream(() => {})

    const defaultParams = {
        req: Object.assign(request, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            method: "",
            body: {}
        }),
        res: Object.assign(response, {
            setHeader: jest.fn(),
            writeHead: jest.fn(),
            end: jest.fn()
        }),
        values: () => Object.values(defaultParams)
    };

    describe("#SetSocketIo", () => {
        test("Should set the socket instance", () => {
            const routes = new Routes();
    
            const obj = {
                to: (id) => obj,
                emit: (event, message) => {}
            }
    
            routes.setIoInstance(obj);
    
            expect(routes.io).toStrictEqual(obj);
        })
    })
    
    describe("#Handler", () => {    
        test("Given an inexistent route should call the default method", async () => {
            const routes = new Routes();
    
            const params = {
                ...defaultParams
            }
    
            params.req.method = "inexist";
    
            await routes.handler(...params.values());
    
            expect(params.res.end).toHaveBeenCalledWith("Route not available")
        })
    
        test("For any route need set the cors config", async () => {
            const routes = new Routes();
    
            const params = {
                ...defaultParams
            }
    
            params.req.method = "GET";
    
            await routes.handler(...params.values());
    
            expect(params.res.setHeader).toHaveBeenCalledWith("Access-Control-Allow-Origin", "*")
        })
    
        test("Given the OPTION route should call the option method", async () => {
            const routes = new Routes();
    
            const params = {
                ...defaultParams
            }
    
            params.req.method = "OPTIONS";
    
            await routes.handler(...params.values());
    
            expect(params.res.writeHead).toHaveBeenCalledWith(204)
            expect(params.res.end).toHaveBeenCalled()
        })
    
        test("Given the GET route should call the get method", async () => {
            const routes = new Routes();
    
            const params = {
                ...defaultParams
            }
    
            params.req.method = "GET";
    
            jest.spyOn(routes, routes.get.name).mockResolvedValue()
    
            await routes.handler(...params.values());
    
            expect(routes.get).toHaveBeenCalled()
        })
    
        test("Given the POST route should call the post method", async () => {
            const routes = new Routes();
    
            const params = {
                ...defaultParams
            }
    
            params.req.method = "POST";
    
            jest.spyOn(routes, routes.post.name).mockResolvedValue()
    
            await routes.handler(...params.values());
    
            expect(routes.post).toHaveBeenCalled()
        })
    })
    
    describe("#Get", () => {
        test("Given the get method should return all files downloaded", async () => {
    
            const routes = new Routes();
            const params = { ...defaultParams };
        
            params.req.method = "GET";
    
            const fileStatusesMock = [
                {            
                    size: "185 kB",
                    file: "file.pdf",
                    lastModified: "2024-03-05T01:19:10.585Z",
                    owner: "vitorvian"
                }
            ];

            jest.spyOn(routes.fileHelper, routes.fileHelper.getFileStatuses.name).mockReturnValue(fileStatusesMock)
    
            await routes.handler(...params.values());
    
            expect(params.res.writeHead).toHaveBeenCalledWith(200);
            expect(params.res.end).toHaveBeenCalledWith(JSON.stringify(fileStatusesMock));
        })
    })

    describe("#Post", () => {
        test("It should validate the post route workflow", async () => {
            const routes = new Routes("/tmp");

            const options = {
                ...defaultParams
            }

            options.req.method = "POST"
            options.req.url = "?socketId=01"

            jest.spyOn(
                UploadHandler.prototype,
                UploadHandler.prototype.registerEvents.name
            ).mockImplementation((headers, onFinish) => {
                const writableStream = TestUtil.generateWritableStream(() => {})
                writableStream.on("finish", onFinish)
                return writableStream;
            })

            await routes.handler(...options.values())

            expect(UploadHandler.prototype.registerEvents).toHaveBeenCalled()
            expect(options.res.writeHead).toHaveBeenCalledWith(200)

            const result = JSON.stringify({ result: "Files uploaded with success!" })
            expect(defaultParams.res.end).toHaveBeenCalledWith(result)
        })
    })
})