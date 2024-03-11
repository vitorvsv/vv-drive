import https from 'https'
import fs from 'fs'
import { Server } from 'socket.io';

import { logger } from './logger.js'
import Routes from './routes.js';

const PORT = process.env.PORT || 3000;

const localSSLConfig = {
    key: fs.readFileSync("./certificates/key.pem"),
    cert: fs.readFileSync("./certificates/cert.pem")
}

const routes = new Routes();

const server = https.createServer(
    localSSLConfig,
    // It's important set the bind with routes param
    // without it the this inside the routes.js file is the Server object
    routes.handler.bind(routes) 
)

const io = new Server(server, {
    cors: {
        origin: process.env.NODE_ENV === "production" ? "" : `https://localhost:${PORT}`,
        credentials: false
    }
});

routes.setIoInstance(io);

io.on("connection", (socket) => {
    logger.info(`Anyone is connecting is this server by socket, ${socket.id}`);
});

const startServer = () => {
    const { address, port } = server.address();
    logger.info(`Server started at ${address} using port ${port}`)
}

server.listen(PORT, startServer)