import pino from 'pino'

const logger = new pino({
    prettyPrint: {
        ignore: 'pid,hostname'
    }
});

export {
    logger
}