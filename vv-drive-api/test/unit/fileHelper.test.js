import {
    describe,
    test,
    expect,
    jest
} from '@jest/globals';
import Routes from '../../src/routes';
import fs from 'fs';
import FileHelper from '../../src/fileHelper';

describe("#FileHelper", () => {
    test("Should return the status from the files", async () => {
        // Input
        const donwloadFolder = "/tmp";

        // Mocks
        const fileStatMock = {
            dev: 16777234,
            mode: 33152,
            nlink: 1,
            uid: 501,
            gid: 20,
            rdev: 0,
            blksize: 4096,
            ino: 15706569,
            size: 185310,
            blocks: 368,
            atimeMs: 1709602648346.964,
            mtimeMs: 1709601550585.3083,
            ctimeMs: 1709602647082.9302,
            birthtimeMs: 1709601550585.0498,
            atime: "2024-03-05T01:37:28.347Z",
            mtime: "2024-03-05T01:19:10.585Z",
            ctime: "2024-03-05T01:37:27.083Z",
            birthtime: "2024-03-05T01:19:10.585Z"
        }

        const owner = "vitorvian"
        process.env.USER = owner
        const filename = 'test.pdf'

        jest.spyOn(fs.promises, fs.promises.stat.name)
            .mockResolvedValue(fileStatMock)

        jest.spyOn(fs.promises, fs.promises.readdir.name)
            .mockResolvedValue([ filename ])

        // Output
        const expectedResult = [{
            size: "185 kB",
            file: filename,
            lastModified: fileStatMock.birthtime,
            owner: owner
        }];

        const result = await FileHelper.getFileStatuses(donwloadFolder);
    
        // Asserts
        expect(fs.promises.stat).toHaveBeenCalledWith(`${donwloadFolder}/${filename}`);
        expect(result).toMatchObject(expectedResult);
    })
})