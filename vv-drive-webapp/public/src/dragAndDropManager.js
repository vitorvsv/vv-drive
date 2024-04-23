export default class DragAndDropManager {
    constructor() {
        this.dropArea = document.getElementById("dropArea");
        this.onDropHandler = () => {};
    }

    initialize(onDropHandler) {
        this.disableDragAndDrop();
        this.enableHighlightOnDrag();
        this.enableDrop();

        this.onDropHandler = onDropHandler;
    }

    disableDragAndDrop() {
        const events = [
            'dragenter',
            'dragover',
            'dragleave',
            'drop',
        ]

        const preventDefaults = (e) => {
            e.preventDefault();
            e.stopPropagation();
        }

        events.forEach(eventname => {
            this.dropArea.addEventListener(eventname, preventDefaults, false);
            document.body.addEventListener(eventname, preventDefaults, false);
        })
    }

    enableHighlightOnDrag() {
        const events = ['dragenter', 'dragover'];

        const highlight = (e) => {
            this.dropArea.classList.add('highlight');
            this.dropArea.classList.add('drop-area');
        }

        events.forEach(eventname => {
            this.dropArea.addEventListener(eventname, highlight, false)
        })
    }

    enableDrop(e) {
        const drop = (e) => {
            this.dropArea.classList.remove('drop-area');

            const files = e.dataTransfer.files;
            return this.onDropHandler(files);
        }

        this.dropArea.addEventListener('drop', drop, false);
    }
}