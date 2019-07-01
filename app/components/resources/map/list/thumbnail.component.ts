import {Component, Input, OnChanges} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {ImageDocument} from 'idai-components-2';
import {BlobMaker} from '../../../../core/imagestore/blob-maker';
import {Imagestore} from '../../../../core/imagestore/imagestore';
import {MenuService} from '../../../../menu-service';
import {ImageViewComponent} from '../../../imageview/image-view.component';
import {ImageDatastore} from '../../../../core/datastore/field/image-datastore';
import {ResourcesComponent} from '../../resources.component';


@Component({
    selector: 'thumbnail',
    moduleId: module.id,
    templateUrl: './thumbnail.html'
})
/**
 * @author Thomas Kleinke
 */
export class ThumbnailComponent implements OnChanges {

    @Input() identifier: string;
    @Input() isDepictedInRelations: string[]|undefined;

    public thumbnailUrl: string|undefined;

    private images: Array<ImageDocument> = [];


    constructor(private imagestore: Imagestore,
                private datastore: ImageDatastore,
                private modalService: NgbModal,
                private resourcesComponent: ResourcesComponent) {}


    async ngOnChanges() {

        this.thumbnailUrl = await this.getThumbnailUrl(this.isDepictedInRelations);
        this.images = await this.getImageDocuments(this.isDepictedInRelations);
    }


    public async openImageModal() {

        MenuService.setContext('image-view');
        this.resourcesComponent.isModalOpened = true;

        const modalRef: NgbModalRef = this.modalService.open(
            ImageViewComponent,
            { size: 'lg', backdrop: 'static', keyboard: false }
        );
        await modalRef.componentInstance.initialize(
            this.images,
            this.images[0],
            this.identifier
        );
        await modalRef.result;

        MenuService.setContext('default');
        this.resourcesComponent.isModalOpened = false;
    }


    private async getThumbnailUrl(relations: string[]|undefined): Promise<string|undefined> {

        if (!relations || relations.length === 0) return undefined;

        try {
            return this.imagestore.read(
                relations[0], false, true
            );
        } catch (e) {
            return BlobMaker.blackImg;
        }
    }


    private async getImageDocuments(relations: string[]|undefined): Promise<Array<ImageDocument>> {

        return relations
            ? this.datastore.getMultiple(relations)
            : [];
    }
}