import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Datastore, ImageDocument } from 'idai-field-core';
import { flatten } from 'tsfun';
import { constructGrid } from '../../../core/images/grid/construct-grid';
import { Imagestore } from '../../../core/images/imagestore/imagestore';


const DROPAREA = 'droparea';


@Component({
    selector: 'image-grid',
    templateUrl: './image-grid.html'
})
/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class ImageGridComponent implements OnChanges {

    @Input() nrOfColumns: number = 1;
    @Input() documents: Array<ImageDocument>;
    @Input() selected: Array<ImageDocument> = [];
    @Input() main: ImageDocument|undefined;
    @Input() totalDocumentCount = 0;
    @Input() showLinkBadges = true;
    @Input() showIdentifier = true;
    @Input() showShortDescription = true;
    @Input() showGeoIcon = false;
    @Input() showTooltips = false;
    @Input() showDropArea = false;
    @Input() compressDropArea = false;
    @Input() paddingRight: number;

    @Output() onClick = new EventEmitter<any>();
    @Output() onDoubleClick = new EventEmitter<any>();

    public rows = [];
    public resourceIdentifiers: { [id: string]: string } = {};

    private calcGridTimeout: any;
    private calcGridPromise: Promise<void>|undefined;


    constructor(private element: ElementRef,
                private imagestore: Imagestore,
                private datastore: Datastore,
                private sanitizer: DomSanitizer) {}


    async ngOnChanges(changes: SimpleChanges) {

        if (!changes['documents']) return;

        if (this.showDropArea) this.insertStubForDropArea();
        this.calcGrid();
    }


    public async onCellMouseEnter(doc: ImageDocument) {

        if (!this.showLinkBadges) return;

        for (let depictsRelId of doc.resource.relations.depicts) {

            if (!this.resourceIdentifiers[depictsRelId]) {
                const target = await this.datastore.get(depictsRelId);
                this.resourceIdentifiers[depictsRelId] = target.resource.identifier;
            }
        }
    }


    public async calcGrid() {

        if (this.calcGridTimeout) clearTimeout(this.calcGridTimeout);

        this.calcGridTimeout = setTimeout(async () => {
            this.calcGridPromise = this.calcGridPromise
                ? this.calcGridPromise.then(() => this._calcGrid())
                : this._calcGrid();

            await this.calcGridPromise;

            this.calcGridPromise = undefined;
            this.calcGridTimeout = undefined;
        }, 100);
    }


    private async _calcGrid() {

        if (!this.documents) return;

        const rows = constructGrid(
            this.documents,
            this.nrOfColumns,
            this.element.nativeElement.children[0].clientWidth,
            this.paddingRight
        );

        await this.loadImages(rows);
        this.rows = rows;
    }


    private async loadImages(rows: any) {

        const imageData: { [imageId: string]: string } = await this.getImageData(rows);

        for (let row of rows) {
            for (let cell of row) {
                if (!cell.document
                    || !cell.document.resource
                    || !cell.document.resource.id
                    || cell.document.resource.id === DROPAREA) continue;

                if (imageData[cell.document.resource.id] ) {
                    cell.imgSrc = this.sanitizer.bypassSecurityTrustUrl(imageData[cell.document.resource.id]);
                }
            }
        }
    }


    private getImageData(rows: any): Promise<{ [imageId: string]: string }> {

        const imageIds: string[] =
            (flatten(rows.map(row => row.map(cell => cell.document.resource.id))) as any)
                .filter(id => id !== DROPAREA);

        return this.imagestore.readThumbnails(imageIds);
    }


    /**
     * Insert stub document for first cell that will act as drop area for uploading images
     */
    private insertStubForDropArea() {

        if (this.documents?.[0]?.id === DROPAREA) return;

        if (!this.documents) this.documents = [];

        this.documents.unshift({
            id: DROPAREA,
            resource: {
                id: DROPAREA,
                identifier: '',
                shortDescription:'',
                category: '',
                originalFilename: '',
                width: 1,
                height: this.compressDropArea ? 0.2 : 1,
                relations: { depicts: [] }
            }
        } as any);
    }
}
