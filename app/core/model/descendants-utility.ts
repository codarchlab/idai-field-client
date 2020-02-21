import {Document, FindResult} from 'idai-components-2';
import {TypeUtility} from './type-utility';
import {DocumentReadDatastore} from '../datastore/document-read-datastore';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class DescendantsUtility {

    constructor(private typeUtility: TypeUtility,
                private datastore: DocumentReadDatastore) {}


    public async fetchChildren(document: Document): Promise<Array<Document>> {

        return (await this.findDescendants(document)).documents;
    }

    /**
     * Works faster than calling fetchChildren().count, because
     * datastore is queried with skipDocuments.
     *
     * @param document
     */
    public async fetchChildrenCount(document: Document): Promise<number> {

        return !document.resource.id
            ? 0
            : (await this.findDescendants(document, true)).totalCount;
    }


    private async findDescendants(document: Document, skipDocuments = false): Promise<FindResult> {

        return this.typeUtility.isSubtype(document.resource.type, 'Operation')
            ? await this.findRecordedInDocs(document.resource.id, skipDocuments)
            : await this.findLiesWithinDocs(document.resource.id, skipDocuments);
    }


    public async findRecordedInDocs(resourceId: string, skipDocuments: boolean): Promise<FindResult> {

        return this.datastore.find({
            constraints: { 'isRecordedIn:contain': resourceId },
            skipDocuments: skipDocuments
        });
    }


    private async findLiesWithinDocs(resourceId: string, skipDocuments: boolean): Promise<FindResult> {

        return this.datastore.find({
            constraints: {
                'liesWithin:contain': {
                    value: resourceId,
                    type: 'add',
                    searchRecursively: true
                }
            },
            skipDocuments: skipDocuments
        });
    }
}
