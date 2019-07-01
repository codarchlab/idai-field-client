import {Injectable} from '@angular/core';
import {Query} from 'idai-components-2';


export type MediaFilterOption = 'ALL'|'LINKED'|'UNLINKED';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class MediaState {

    private query: Query;
    private customConstraints: { [name: string]: string } = {};
    private linkFilter: MediaFilterOption = 'ALL';
    private gridSize: number = 4;

    private initialized: boolean = false;


    constructor() {}


    public resetForE2E() {

        this.initialized = true;
    }


    public async initialize(): Promise<any> {

        if (this.initialized) return;
        this.initialized = true;
    }


    public getQuery(): Query {

        return this.query;
    }


    public setQuery(query: Query) {

        this.query = query;
    }


    public getCustomConstraints(): { [name: string]: string } {

        return this.customConstraints;
    }


    public setCustomConstraints(customConstraints: { [name: string]: string }) {

        this.customConstraints = customConstraints;
    }


    public getLinkFilter(): MediaFilterOption {

        if (!this.linkFilter) return 'ALL';

        const result = this.linkFilter;
        if (['LINKED','UNLINKED'].indexOf(this.linkFilter) !== -1) {
            return result;
        }
        return 'ALL';
    }


    public setLinkFilter(linkFilter: MediaFilterOption) {

        this.linkFilter = linkFilter;
    }


    public getNrMediaResourcesPerRow(): number {

        return this.gridSize;
    }


    public setNrMediaResourcesPerRow(value: number) {

        this.gridSize = value;
    }
}