/// <reference path='desktop/express-import' />

import {Injectable} from '@angular/core';
import * as express from 'express';
import {Document} from 'idai-components-2';
import {PouchdbManager} from './core/datastore/core/pouchdb-manager';
import {DocumentCache} from './core/datastore/core/document-cache';
import {ResourcesStateManager} from './components/resources/view/resources-state-manager';
import {IndexFacade} from './core/datastore/index/index-facade';
import {MediaState} from './components/mediaoverview/view/media-state';
import {TabManager} from './components/tab-manager';

const remote = require('electron').remote;


@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class AppController {

    constructor(
        private pouchdbManager: PouchdbManager,
        private resourcesState: ResourcesStateManager,
        private documentCache: DocumentCache<Document>,
        private mediaState: MediaState,
        private indexFacade: IndexFacade,
        private tabManager: TabManager) {
    }
    

    public setupServer(): Promise<any> {
        
        return new Promise(resolve => {

            if (!remote.getGlobal('switches').provide_reset) return resolve();

            const control = express();
            control.use(express.json());

            control.post('/reset', async (request: any, result: any) => {
                await this.reset();
                result.send('done');
            });

            control.listen(3003, function() {
                console.log('App Control listening on port 3003');
                resolve();
            });
        });
    }


    private async reset() {

        this.resourcesState.resetForE2E();

        this.tabManager.resetForE2E();
        this.documentCache.resetForE2E();
        await this.pouchdbManager.resetForE2E();
        await this.pouchdbManager.reindex(this.indexFacade);
    }
}