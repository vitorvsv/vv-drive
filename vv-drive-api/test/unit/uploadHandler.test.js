import {
    describe,
    test,
    expect,
    jest,
    beforeEach
} from "@jest/globals";
import fs from "fs";
import { resolve } from "path"
import UploadHandler from "../../src/uploadHandler";
import TestUtil from "../_util/testUtil";
import { pipeline } from "stream/promises";
import { logger } from "../../src/logger"

describe("#UploadHandler", () => {
    const ioMock = {
        to: (id) => ioMock,
        emit: (event, message) => {}
    }

    beforeEach(() => {
        jest.spyOn(logger, 'info').mockImplementation()
    })

    describe("#registerEvents", () => {
        test("Should call onFile and onFinish functions on Busboy instance", async () => {
            const uploadHandler = new UploadHandler({ io: ioMock, socketId: "01" });
    
            jest.spyOn(uploadHandler ,uploadHandler.onFile.name)
                .mockResolvedValue();
    
            const headers = {
                "content-type": "multipart/form-data; boundary="
            }
    
            const onFinishMock = jest.fn()
            const busboyInstance = uploadHandler.registerEvents(headers, onFinishMock);
    
            const fileStream = TestUtil.generateReadableStream([ "chunk", "of", "file" ])
             
            busboyInstance.emit("file", "fieldname", fileStream, "filename.txt")
    
            busboyInstance.listeners("finish")[0].call()
    
            expect(uploadHandler.onFile).toHaveBeenCalled();
            expect(onFinishMock).toHaveBeenCalled();
        })
    })

    describe("#onFile", () => {
        test("Given a stream file it should save it on disk", async () => {
            const chunks = ["hey", "dude"]
            const downloadsFolder = "/tmp"

            const handler = new UploadHandler({
                io: ioMock,
                socketId: "01",
                downloadsFolder
            })

            const onData = jest.fn();
            jest.spyOn(fs, fs.createWriteStream.name)
                .mockImplementation(() => TestUtil.generateWritableStream(onData));

            const onTransform = jest.fn();
            jest.spyOn(handler, handler.handleFileBytes.name)
                .mockImplementation(() => TestUtil.generateTransformStream(onTransform));

            const params = {
                fieldname: 'video',
                file: TestUtil.generateReadableStream(chunks),
                filename: 'mockVideo.avi'
            }

            await handler.onFile(...Object.values(params));

            expect(onData.mock.calls.join()).toEqual(chunks.join());
            expect(onTransform.mock.calls.join()).toEqual(chunks.join());

            const expectedFolder = resolve(handler.downloadsFolder, params.filename);
            expect(fs.createWriteStream).toHaveBeenCalledWith(expectedFolder)
        })
    })
   
    describe("#handleFileBytes", () => {

        const ioObj = {
            to: (id) => ioObj,
            emit: (event, message) => {}
        }

        test("should call emit function and it is a transform stream", async () => {
            jest.spyOn(ioMock, ioMock.to.name)
            jest.spyOn(ioMock, ioMock.emit.name)

            const messages = ["hello"]

            const uploadHandler = new UploadHandler({
                io: ioMock, 
                socketId: "01", 
                downloadsFolder: "/tmp"
            })

            jest.spyOn(uploadHandler, uploadHandler.canExecute.name)
                .mockResolvedValueOnce(true);

            const onWrite = jest.fn();

            const source = TestUtil.generateReadableStream(messages);
            const writable = TestUtil.generateWritableStream(onWrite);

            await pipeline(
                source,
                uploadHandler.handleFileBytes("temp.txt"),
                writable
            )

            expect(ioMock.to).toHaveBeenCalledTimes(messages.length)
            expect(ioMock.emit).toHaveBeenCalledTimes(messages.length)

            // if the process it ok, our pipeline will run through and
            // the writable stream will be called
            expect(onWrite).toHaveBeenCalledTimes(messages.length)
            expect(onWrite.mock.calls.join()).toEqual(messages.join())
        })

        test("given message timerDelay set as 2 secs it should emit only two messages during 2 secs period", async () => {
            jest.spyOn(ioMock, ioMock.emit.name)

            const day = '2021-07-01 01:01';
            const messageTimeDelay = 2000;

            // Date.now() in this.lastMessageSent on handleBytes
            const onFirsLastMessageSent = TestUtil.getTimeFromDate(`${day}:00`)

            const onFirstCanExecute = TestUtil.getTimeFromDate(`${day}:02`)
            const onSecondUpdateLastMessageSent = onFirstCanExecute

            const onSecondCanExecute = TestUtil.getTimeFromDate(`${day}:03`)

            const onThirdCanExecute = TestUtil.getTimeFromDate(`${day}:04`)

            TestUtil.mockDateNow(
                [
                    onFirsLastMessageSent,
                    onFirstCanExecute,
                    onSecondUpdateLastMessageSent,
                    onSecondCanExecute,
                    onThirdCanExecute
                ]
            )

            const uploadHandler = new UploadHandler({
                io: ioMock, 
                socketId: "01", 
                messageTimeDelay
            })
            const messages = ["hello", "hello", "world"]
            const filename = "test.avi"
            const expectedMessageSent = 2

            const source = TestUtil.generateReadableStream(messages)

            await pipeline(
                source,
                uploadHandler.handleFileBytes(filename)
            )

            expect(ioMock.emit).toHaveBeenCalledTimes(expectedMessageSent)

            const [ firstCall, secondCall ] = ioMock.emit.mock.calls

            expect(firstCall).toEqual([ uploadHandler.ON_UPLOAD_EVENT, { alreadyProcessed: messages[0].length, filename } ])
            expect(secondCall).toEqual([ uploadHandler.ON_UPLOAD_EVENT, { alreadyProcessed: messages.join("").length, filename } ])
        })
        
       
    })

    describe("#canExecute", () => {
        test("should return true when the time is later than the specified delay", () => {
            const tickNow = TestUtil.getTimeFromDate("1997-06-11 00:00:00")
            const tickThreeSecondsLater = TestUtil.getTimeFromDate("1997-06-11 00:00:03")

            TestUtil.mockDateNow([ tickThreeSecondsLater ]);

            const timerDelayInSeconds = 1000;

            const uploadHandler = new UploadHandler({
                io: {},
                socketId: "01",
                messageTimeDelay: timerDelayInSeconds
            })

            const result = uploadHandler.canExecute(tickNow);

            expect(result).toBeTruthy();
        })

        test("should return false when the time isn't later than the specified delay", () => {
            const now = TestUtil.getTimeFromDate("1997-06-11 00:00:00")
            const lastExecution = TestUtil.getTimeFromDate("1997-06-11 00:00:01")

            TestUtil.mockDateNow([ lastExecution ]);

            const timerDelayInSeconds = 3000;

            const uploadHandler = new UploadHandler({
                io: {},
                socketId: "01",
                messageTimeDelay: timerDelayInSeconds
            })

            const result = uploadHandler.canExecute(now);

            expect(result).toBeFalsy();
        })
    })
})