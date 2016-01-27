import {IdaiFieldObject} from "../model/idai-field-object";
import {Observable} from "rxjs/Observable";

export abstract class Datastore {

    abstract create(object: IdaiFieldObject): Promise<string>;

    abstract update(object: IdaiFieldObject): Promise<any>;

    abstract get(id: string): Promise<IdaiFieldObject>;

    abstract delete(id: string): Promise<any>;

    abstract getObjectsToSync(): Observable<IdaiFieldObject>;

    abstract find(query: string, options: any): Promise<IdaiFieldObject[]>;

    abstract all(options: any): Promise<IdaiFieldObject[]>;

    abstract getUnsyncedObjects(): Promise<IdaiFieldObject[]>;
}