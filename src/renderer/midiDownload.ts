// Implementing file download for remote files with pre-download and caching

/* Can't drag'n'drop a file that's not already downloaded, so need to
    pre-download all different voices and store them somewhere on disk to be
    able to drag'n'drop into e.g. Ableton

    Should use Electron's `webContents.startDrag` method:
    https://electronjs.org/docs/api/web-contents#contentsstartdragitem
    */


/* provides the interface and internals to download (and
    drag'n'drop) a single Data Object */
class DataDownloaderModel {
    private downloadData: () => Promise<string>;
    private preDownload: boolean;

    public dataType: string;
    public dataName: string;

    private _filePath: string = undefined;

    constructor(downloadData: () => Promise<string>,
        dataType: string,
        dataName: string,
        preDownload: boolean=false) {
        /* Input:
        - dataDownload: a function that downloads the remote file to a local
        file path and returns a Promise holding that path,
        - preDownload: if true, will pre-download the file without waiting for
        the user to initiate download. Necessary to use drag'n'drop feature.
        */
        this.downloadData = downloadData;
        this.preDownload = preDownload;
        this.dataType = dataType;
        this.dataName = dataName;

        this.update();
    }

    public update(): void {
        if (this.preDownload) {
            let self = this;
            this.downloadData().then(filePath => {
                    self._filePath = filePath;
                })
        }
    }

    public get filePath(): Promise<string> {
        if (this._filePath) {
            return Promise(this._filePath);
        }
        else {
            return this.downloadData();
        }
    };
}

class DataDownloaderView {
    protected dataDownloader: DataDownloaderModel;
    protected containerElement: HTMLElement;
    protected downloadElement: HTMLAnchorElement;

    protected CSSClass: string = 'data-downloader';

    constructor(dataDownloader: DataDownloaderModel,
        containerElement: HTMLElement) {
        this.dataDownloader = dataDownloader;
        this.containerElement = containerElement;

        this.renderDownloadElement();
        this.update();
    }

    // should open a 'Save As' dialog for the target file on clicking the element
    private renderDownloadElement() {
        this.downloadElement = document.createElement('a');
        // downloadElem.classList.add('download-element');
        this.containerElement.appendChild(this.downloadElement);

        this.downloadElement.type = this.dataDownloader.dataType;
        this.downloadElement.download = this.dataDownloader.dataName;
    }

    public update() {
        this.dataDownloader.update();
        this.dataDownloader.filePath.then()
    }
}

class dataDownloaderViewIcon extends DataDownloaderView {

}

class DataDownloaderDragController {
    constructor(dataDownloader: DataDownloaderModel, D)
}
