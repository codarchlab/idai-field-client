import {Injectable} from '@angular/core';
import {Query} from 'idai-components-2/datastore';
import {StateSerializer} from '../../../common/state-serializer';

@Injectable()
/**
 * @author Thomas Kleinke
 */
export class MediaState {

    private query: Query;
    private mainTypeDocumentFilterOption: string = '';
    private gridSize: number = 4;

    private initialized: boolean = false;


    constructor(private serializer: StateSerializer) {}


    public resetForE2E() {

        this.initialized = true;
    }


    public initialize(): Promise<any> {

        if (this.initialized) return Promise.resolve();

        return this.serializer.load(StateSerializer.MEDIA_STATE)
            .then(result => {
                if (result.query) this.query = result.query;
                if (result.mainTypeDocumentFilterOption) this.mainTypeDocumentFilterOption
                    = result.mainTypeDocumentFilterOption;
                if (result.gridSize) this.gridSize = result.gridSize;
                this.initialized = true;
            });
    }


    public getQuery(): Query {

        return this.query;
    }


    public setQuery(query: Query) {

        this.query = query;
        this.serializer.store(StateSerializer.MEDIA_STATE, this.getSerializableObject());
    }


    public getMainTypeDocumentFilterOption(): string {

        if (!this.mainTypeDocumentFilterOption) return 'ALL';

        const result = this.mainTypeDocumentFilterOption;
        if (['LINKED','UNLINKED'].indexOf(this.mainTypeDocumentFilterOption) !== -1) {
            return result;
        }
        return 'ALL';
    }


    public setMainTypeDocumentFilterOption(mainTypeDocumentFilterOption: string) {

        this.mainTypeDocumentFilterOption = mainTypeDocumentFilterOption;
        this.serializer.store(StateSerializer.MEDIA_STATE, this.getSerializableObject());
    }


    public getGridSize(): number {

        return this.gridSize;
    }


    public setGridSize(value: number) {

        this.gridSize = value;
        this.serializer.store(StateSerializer.MEDIA_STATE, this.getSerializableObject());
    }


    private getSerializableObject(): any {

        return {
            query: this.query,
            mainTypeDocumentFilterOption: this.mainTypeDocumentFilterOption,
            gridSize: this.gridSize
        };
    }
}