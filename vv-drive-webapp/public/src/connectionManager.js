export default class ConnectionManager {
    constructor({ apiUrl }) {
        this.apiUrl = apiUrl;
        this.io = io.connect(this.apiUrl, { withCredentials: false });
        this.socketId = "";
    }

    configureEvents(onProgress) {
        this.io.on("connect", this.onConnect.bind(this));
        this.io.on("file-upload", onProgress);
    }

    onConnect() {
        console.log("Connected", this.io.id);
        this.socketId = this.io.id;
    }

    async uploadFile(file) {
        const formData = new FormData();
        formData.append('files', file);

        const response = await fetch(`${this.apiUrl}?socketId=${this.socketId}`, {
            method: "POST",
            body: formData
        });

        return response.json();
    }

    async getCurrentFiles() {
        const files = await (await fetch(this.apiUrl)).json();
        return files;
    }

}