export default class ViewManager {
    constructor() {
        this.tbody = document.getElementById("tbody");
        this.newFileBtn = document.getElementById("newFileBtn");
        this.uploadFileElem = document.getElementById("uploadFileElem");
        this.progressModal = document.getElementById("progressModal");
        this.progressBar = document.getElementById("progressBar");
        this.output = document.getElementById("output");
        
        this.formatter = new Intl.DateTimeFormat("pt", {
            locale: "pt-br",
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        })

        this.modalInstance = {};
    }

    configureModal() {
        this.modalInstance = M.Modal.init(this.progressModal, {
            opacity: 0,
            dismissable: false,
            // Allows click on screen with modal opened
            onOpenEnd() {
                this.$overlay[0].remove()
            }
        });
    }

    openModal() {
        this.modalInstance.open();
    }

   closeModal() {
        this.modalInstance.close();
    }

    updateStatus(size) {
        this.output.innerHTML = `Uploading in <b>${Math.floor(size)}%</b>`;
        this.progressBar.value = size;
    }

    configureFileBtnClick() {
        this.newFileBtn.onclick = () => this.uploadFileElem.click();
    }

    configureOnFileChange(fn) {
        this.uploadFileElem.onchange = (e) => fn(e.target.files)
    }

    getIcon(file) {
        const { file: filename } = file;

        const [ name, extention ] = filename.split(".")

        const icons = {
            mp4: "movie",
            pdf: "content_copy",
            png: "image",
            jpg: "image",
            jpeg: "image"
        }

        return icons[extention] || "content_copy";
    }

    makeIcon(file) {
        const icon = this.getIcon(file);

        const colors = {
            movie: "red600",
            image: "yellow600",
            content_copy: ""
        }

        return `<i class="material-icons ${colors[icon]} left">${icon}</i>`
    }

    updateCurrentFiles(files) {

        this.tbody.innerHTML = "";

        const template = (file) => {
            const { file: filename, lastModified, owner, size } = file

            const trHtml = `
                <tr>
                    <td>${this.makeIcon(file)} ${filename}</td>
                    <td>${owner}</td>
                    <td>${this.formatter.format(new Date(lastModified))}</td>
                    <td>${size}</td>
                </tr>
            `;

            this.tbody.innerHTML += trHtml;
        }

        if (files && files.length) files.map(template)
    }
}