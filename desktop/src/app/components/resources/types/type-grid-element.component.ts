import {Input, Component, OnChanges, SimpleChanges} from '@angular/core';
import {FieldDocument} from 'idai-components-2';
import {SafeResourceUrl} from '@angular/platform-browser';
import {ReadImagestore} from '../../../core/images/imagestore/read-imagestore';
import {FieldReadDatastore} from '../../../core/datastore/field/field-read-datastore';
import {ImageReadDatastore} from '../../../core/datastore/field/image-read-datastore';
import {BlobMaker} from '../../../core/images/imagestore/blob-maker';

@Component({
    selector: 'type-grid-element',
    templateUrl: './type-grid-element.html'
})
/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class TypeGridElementComponent implements OnChanges {

    @Input() document: FieldDocument;
    @Input() subtype?: FieldDocument;
    @Input() images?: Array<Blob>;

    public imageUrls: Array<SafeResourceUrl> = [];


    constructor(private imagestore: ReadImagestore,
                private fieldDatastore: FieldReadDatastore,
                private imageDatastore: ImageReadDatastore,
                private blobMaker: BlobMaker) {}


    async ngOnChanges(changes: SimpleChanges) {

        if (changes['document'] || changes['images']) await this.loadImages();
    }


    private async loadImages() {

        this.imageUrls = [];

        if (!this.images) return;

        for (let blob of this.images) {
            const url = this.blobMaker.makeBlob(blob);
            this.imageUrls.push(url.safeResourceUrl);
        }
    }
}
