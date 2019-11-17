import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Messages, Query, FieldDocument} from 'idai-components-2';
import {ImageGridComponent} from '../../imagegrid/image-grid.component';
import {TypeUtility} from '../../../core/model/type-utility';
import {M} from '../../m';
import {IdaiFieldMediaDocumentReadDatastore} from '../../../core/datastore/idai-field-media-document-read-datastore';
import {IdaiFieldMediaDocument} from '../../../core/model/idai-field-media-document';
import {clone} from '../../../core/util/object-util';


@Component({
    selector: 'media-resource-picker',
    moduleId: module.id,
    templateUrl: './media-resource-picker.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Fabian Z.
 * @author Thomas Kleinke
 */
export class MediaResourcePickerComponent implements OnInit {

    @ViewChild('imageGrid', {static: false}) public imageGrid: ImageGridComponent;

    public documents: Array<IdaiFieldMediaDocument>;
    public document: FieldDocument;
    public selectedDocuments: Array<IdaiFieldMediaDocument> = [];

    private query: Query = { q: '' };
    private currentQueryId: string;

    private static documentLimit: number = 24;


    constructor(
        public activeModal: NgbActiveModal,
        private messages: Messages,
        private datastore: IdaiFieldMediaDocumentReadDatastore,
        private el: ElementRef,
        private typeUtility: TypeUtility
    ) {}


    public ngOnInit() {

        // Listen for transformation of modal to capture finished 
        // resizing and invoke recalculation of imageGrid
        let modalEl = this.el.nativeElement.parentElement.parentElement;
        modalEl.addEventListener('transitionend', (event: any) => {
            if (event.propertyName === 'transform') this.onResize();
        });
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') {
            this.activeModal.dismiss('cancel');
        } else if (event.key === 'Enter') {
            this.applySelection();
        }
    }


    public async setDocument(document: FieldDocument) {

        this.document = document;
        await this.fetchDocuments(this.query);
    }


    public async setQueryString(q: string) {

        this.query.q = q;
        await this.fetchDocuments(this.query);
    }


    public async setQueryTypes(types: string[]|undefined) {

        this.query.types = types;
        await this.fetchDocuments(this.query);
    }


    public onResize() {

        this.imageGrid.calcGrid();
    }


    /**
     * @param document the object that should be selected
     */
    public select(document: IdaiFieldMediaDocument) {

        if (!this.selectedDocuments.includes(document)) {
            this.selectedDocuments.push(document);
        } else {
            this.selectedDocuments.splice(this.selectedDocuments.indexOf(document), 1);
        }
    }


    public applySelection() {

        if (this.selectedDocuments.length > 0) this.activeModal.close(this.selectedDocuments);
    }


    /**
     * Populates the document list with all documents from
     * the datastore which match a <code>query</code>
     * @param query
     */
    private fetchDocuments(query: Query) {

        this.query = query;
        if (!this.query) this.query = {};

        this.query.constraints = {
            'depicts:contain': { value: this.document.resource.id as string, type: 'subtract' }
        };
        this.query.limit = MediaResourcePickerComponent.documentLimit;

        this.currentQueryId = new Date().toISOString();
        this.query.id = this.currentQueryId;

        return this.datastore.find(clone(this.query))
            .then(result => {
                if (result.queryId === this.currentQueryId) this.documents = result.documents;
            })
            .catch(errWithParams => {
                console.error('Error in find with query', this.query);
                if (errWithParams.length === 2) {
                    console.error('Error in find', errWithParams[1]);
                }
                this.messages.add([M.ALL_ERROR_FIND]);
            });
    }
}