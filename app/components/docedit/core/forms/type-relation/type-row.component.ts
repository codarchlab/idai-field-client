import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {FieldDocument} from 'idai-components-2';
import {ModelUtil} from '../../../../../core/model/model-util';
import {ReadImagestore} from '../../../../../core/images/imagestore/read-imagestore';


@Component({
    moduleId: module.id,
    selector: 'dai-type-row',
    templateUrl: './type-row.html'
})
/**
 * @author Daniel de Oliveira
 */
export class TypeRowComponent implements OnChanges {

    public mainThumbnailUrl: string|undefined;

    @Input() document: FieldDocument;
    @Input() imageIds: string[];
    @Output() onSelect: EventEmitter<void> = new EventEmitter<void>();

    constructor(private imagestore: ReadImagestore) {}

    async ngOnChanges() {

        if (this.document) this.mainThumbnailUrl = await this.getMainThumbnailUrl(this.document);
    }

    private async getMainThumbnailUrl(document: FieldDocument): Promise<string|undefined> {

        const mainImageId: string | undefined = ModelUtil.getMainImageId(document.resource);
        if (!mainImageId) return undefined;

        return await this.imagestore.read(mainImageId, false, true);
    }
}