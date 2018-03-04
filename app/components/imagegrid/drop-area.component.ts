import {Component, Output, EventEmitter} from '@angular/core';
import {Messages} from 'idai-components-2/messages';
import {ImageUploader} from '../../upload/image/image-uploader';
import {UploadResult} from '../../upload/upload-result';


@Component({
    selector: 'drop-area',
    moduleId: module.id,
    templateUrl: './drop-area.html'
})
/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class DropAreaComponent {

    @Output() onImagesUploaded: EventEmitter<any> = new EventEmitter<any>();

    private dragOverActive = false;


    public constructor(
        private imageUploader: ImageUploader,
        private messages: Messages
    ) {}


    public onDragOver(event: any) {

        if (this.dragOverActive) return;

        this.dragOverActive = true;
        event.target.classList.add('dragover');
        event.preventDefault();
    }


    public onDragLeave(event: any) {

        this.dragOverActive = false;
        event.target.classList.remove('dragover');
    }


    public onDrop(event: any) {

        event.preventDefault();
        this.imageUploader.startUpload(event).then(uploadResult => this.handleUploadResult(uploadResult));
        this.onDragLeave(event);
    }


    public onSelectImages(event: any) {

        this.imageUploader.startUpload(event).then(uploadResult => this.handleUploadResult(uploadResult));
    }


    private handleUploadResult(uploadResult: UploadResult) {

        if (uploadResult.uploadedFiles > 0) this.onImagesUploaded.emit();

        for (let msgWithParams of uploadResult.messages) {
            this.messages.add(msgWithParams);
        }
    }
}
