import {FieldDocument} from 'idai-components-2';
import {CachedReadDatastore, IdaiFieldFindResult} from '../cached/cached-read-datastore';
import {Query} from '../model/query';


export interface FieldDocumentFindResult extends IdaiFieldFindResult<FieldDocument> {}


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export abstract class FieldReadDatastore extends CachedReadDatastore<FieldDocument> {

    public async find(query: Query, ignoreTypes: boolean = false): Promise<FieldDocumentFindResult> {

        return super.find(query, ignoreTypes);
    }
}
