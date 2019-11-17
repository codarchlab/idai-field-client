import {Component, DoCheck, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {NgbActiveModal, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Messages, FieldDocument} from 'idai-components-2';
import {Imagestore} from '../../core/imagestore/imagestore';
import {DoceditComponent} from '../docedit/docedit.component';
import {BlobMaker} from '../../core/imagestore/blob-maker';
import {ImageContainer} from '../../core/imagestore/image-container';
import {RoutingService} from '../routing-service';
import {ImageReadDatastore} from '../../core/datastore/field/image-read-datastore';
import {M} from '../m';
import {MenuService} from '../../menu-service';
import {MediaState} from '../mediaoverview/view/media-state';
import {IdaiFieldMediaDocument} from '../../core/model/idai-field-media-document';


@Component({
    moduleId: module.id,
    templateUrl: './image-view.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ImageViewComponent implements OnInit, DoCheck {

    @ViewChild('thumbnailSliderContainer', {static: false}) thumbnailSliderContainer: ElementRef;
    @ViewChild('imageInfo', {static: false}) imageInfo: ElementRef;

    public images: Array<ImageContainer> = [];
    public selectedImage: ImageContainer;
    public linkedResourceIdentifier: string|undefined;
    public openSection: string|undefined = 'stem';

    public thumbnailSliderScrollbarVisible: boolean = false;
    public imageInfoScrollbarVisible: boolean = false;

    private subModalOpened: boolean = false;


    constructor(
        private activeModal: NgbActiveModal,
        private datastore: ImageReadDatastore,
        private imagestore: Imagestore,
        private messages: Messages,
        private router: Router,
        private modalService: NgbModal,
        private routingService: RoutingService,
        private mediaState: MediaState
    ) {}


    public toggleExpandAllGroups = () => this.mediaState.setExpandAllGroups(
        !this.mediaState.getExpandAllGroups()
    );


    public getExpandAllGroups = () => this.mediaState.getExpandAllGroups();


    ngOnInit() {

        (window.getSelection() as any).removeAllRanges();
    }


    ngDoCheck() {

        this.thumbnailSliderScrollbarVisible = this.isThumbnailSliderScrollbarVisible();
        this.imageInfoScrollbarVisible = this.isImageInfoScrollbarVisible();
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && !this.subModalOpened) await this.activeModal.close();
        if (event.key === 'ArrowLeft') await this.selectPrevious();
        if (event.key === 'ArrowRight') await this.selectNext();
    }


    public async initialize(documents: Array<IdaiFieldMediaDocument>, selectedDocument: IdaiFieldMediaDocument,
                            linkedResourceIdentifier?: string) {

        if (!this.imagestore.getPath()) this.messages.add([M.IMAGESTORE_ERROR_INVALID_PATH_READ]);

        this.linkedResourceIdentifier = linkedResourceIdentifier;

        this.images = [];
        await this.select(await this.fetchThumbnail(selectedDocument), false);

        for (let document of documents) {
            if (document === selectedDocument) {
                this.images.push(this.selectedImage);
            } else {
                this.images.push(await this.fetchThumbnail(document));
            }
        }

        this.showErrorMessagesForMissingImages();
        ImageViewComponent.scrollToThumbnail(this.selectedImage);
    }


    public async select(image: ImageContainer, scroll: boolean = true) {

        if (!image.imgSrc) await this.addOriginal(image);

        this.selectedImage = image;
        if (scroll) ImageViewComponent.scrollToThumbnail(image);
    }


    public setOpenSection(section: string) {

        this.openSection = section;
        if (this.getExpandAllGroups()) this.toggleExpandAllGroups();
    }


    public close() {

        this.activeModal.close();
    }


    public async startEdit() {

        this.subModalOpened = true;
        MenuService.setContext('docedit');

        const doceditModalRef = this.modalService.open(
            DoceditComponent,
            { size: 'lg', backdrop: 'static' }
            );
        const doceditModalComponent = doceditModalRef.componentInstance;
        doceditModalComponent.setDocument(this.selectedImage.document as IdaiFieldMediaDocument);

        try {
            const result = await doceditModalRef.result;
            if (result.document) this.selectedImage.document = result.document;
        } catch (closeReason) {
            if (closeReason === 'deleted') await this.activeModal.close();
        }

        this.subModalOpened = false;
        MenuService.setContext('image-view');
    }


    public async jumpToResource(documentToJumpTo: FieldDocument) {

        await this.routingService.jumpToResource(
            documentToJumpTo, true
        );

        this.activeModal.close();
    }


    public containsOriginal(image: ImageContainer): boolean {

        return image.imgSrc !== undefined && image.imgSrc !== '';
    }


    public isMissingImage(image: ImageContainer): boolean {

        return image.thumbSrc === BlobMaker.blackImg;
    }


    private isThumbnailSliderScrollbarVisible(): boolean {

        return this.thumbnailSliderContainer
            && this.thumbnailSliderContainer.nativeElement.scrollWidth
            > this.thumbnailSliderContainer.nativeElement.clientWidth;
    }


    private isImageInfoScrollbarVisible(): boolean {

        return this.imageInfo
            && this.imageInfo.nativeElement.scrollHeight
            > this.imageInfo.nativeElement.clientHeight;
    }


    private async fetchThumbnail(document: IdaiFieldMediaDocument): Promise<ImageContainer> {

        const image: ImageContainer = { document: document };

        try {
            image.thumbSrc = await this.imagestore.read(document.resource.id, false, true);
        } catch (e) {
            image.thumbSrc = BlobMaker.blackImg;
        }

        return image;
    }


    private async addOriginal(image: ImageContainer) {

        if (!image.document) return;

        try {
            image.imgSrc = await this.imagestore.read(
                image.document.resource.id, false, false
            );
        } catch (e) {
            image.imgSrc = BlobMaker.blackImg;
        }
    }


    private async selectPrevious() {

        if (this.images.length < 2) return;

        let index: number = this.images.indexOf(this.selectedImage);
        index = index === 0
            ? this.images.length - 1
            : index - 1;

        await this.select(this.images[index]);
    }


    private async selectNext() {

        if (this.images.length < 2) return;

        let index: number = this.images.indexOf(this.selectedImage);
        index = index === this.images.length - 1
            ? 0
            : index + 1;

        await this.select(this.images[index]);
    }


    private showErrorMessagesForMissingImages() {

        const missingImagesCount: number
            = this.images.filter(image => image.thumbSrc === BlobMaker.blackImg).length;

        if (missingImagesCount === 1) {
            this.messages.add([M.IMAGES_ERROR_NOT_FOUND_SINGLE]);
        } else if (missingImagesCount > 1) {
            this.messages.add([M.IMAGES_ERROR_NOT_FOUND_MULTIPLE]);
        }
    }


    private static scrollToThumbnail(image: ImageContainer) {

        const element: HTMLElement|null = document.getElementById(
            'thumbnail-' + (image.document as IdaiFieldMediaDocument).resource.id
        );

        if (element) element.scrollIntoView({ inline: 'center' });
    }
}
