import {Injectable} from '@angular/core';
import {Query} from 'idai-components-2/datastore';
import {IdaiFieldImageDocument} from '../../../core/model/idai-field-image-document';
import {ViewFacade} from '../../resources/view/view-facade';
import {ImagesState} from './images-state';
import {IdaiFieldMediaDocumentReadDatastore} from '../../../core/datastore/idai-field-media-document-read-datastore';
import {IdaiField3DDocument} from '../../../core/model/idai-field-3d-document';


@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class ImageDocumentsManager {

    private documents: Array<IdaiFieldImageDocument|IdaiField3DDocument>;
    private totalDocumentCount: number;

    public selected: Array<IdaiFieldImageDocument|IdaiField3DDocument>  = [];

    private depictsRelationsSelected: boolean = false;


    constructor(
        public viewFacade: ViewFacade,
        private imagesState: ImagesState,
        private imageDatastore: IdaiFieldMediaDocumentReadDatastore
    ) {
    }


    public getSelected(): Array<IdaiFieldImageDocument|IdaiField3DDocument> {

        return this.selected;
    }


    public getDocuments(): Array<IdaiFieldImageDocument|IdaiField3DDocument> {

        return this.documents;
    }


    public getTotalDocumentCount(): number {

        return this.totalDocumentCount;
    }


    public getDepictsRelationsSelected(): boolean {

        return this.depictsRelationsSelected;
    }


    public remove(document: IdaiFieldImageDocument|IdaiField3DDocument) {

        this.documents.splice(this.documents.indexOf(document), 1);
    }


    /**
     * @param document the object that should be selected
     */
    public select(document: IdaiFieldImageDocument|IdaiField3DDocument) {

        if (this.selected.indexOf(document) == -1) {
            this.selected.push(document);
        } else {
            this.selected.splice(this.selected.indexOf(document), 1);
        }

        this.depictsRelationsSelected = this.doSelectedDocumentsContainDepictsRelations();
    }


    private doSelectedDocumentsContainDepictsRelations(): boolean {

        for (let document of this.selected) {

            // TODO make sure the DAO always returns docs with depicts, then simplify here
            if (document.resource.relations.depicts &&
                    document.resource.relations.depicts.length > 0) {
                return true;
            }
        }

        return false;
    }


    public clearSelection() {

        this.selected = [];
    }


    /**
     * Populates the document list with all documents from
     * the datastore which match a <code>query</code>
     */
    public async fetchDocuments(limit: number) {

        const query: Query = JSON.parse(JSON.stringify(this.imagesState.getQuery()));
        query.limit = limit;

        console.debug('fetch docs', query);
        try {
            const {documents, totalCount} = await this.imageDatastore.find(query);
            this.documents = documents;
            this.totalDocumentCount = totalCount;
            console.debug('fetch docs end');
        } catch (errWithParams) {
            console.error('ERROR with find using query', query);
            if (errWithParams.length == 2) console.error('Cause: ', errWithParams[1]);
        }
    }
}