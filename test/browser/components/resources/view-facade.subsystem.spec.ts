import {Document} from 'idai-components-2/core';
import {ProjectConfiguration} from 'idai-components-2/configuration'
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Static} from '../../helper/static';
import {CachedDatastore} from '../../../../app/core/datastore/core/cached-datastore';
import {ViewFacade} from '../../../../app/components/resources/view/view-facade';
import {ResourcesState} from '../../../../app/components/resources/view/resources-state';
import {IdaiFieldDocumentDatastore} from '../../../../app/core/datastore/idai-field-document-datastore';
import {IdaiFieldTypeConverter} from '../../../../app/core/datastore/idai-field-type-converter';
import {TypeUtility} from '../../../../app/common/type-utility';

/**
 * This is a subsystem test.
 * The use of mocks is intentionally reduced.
 * The subsystem gets assembled in the ViewFacade's constructor.
 *
 * @author Daniel de Oliveira
 */
export function main() {

    describe('ViewFacade/Subsystem', () => {

        const viewsList = [
            {
                'mainTypeLabel': 'Schnitt',
                'label': 'Ausgrabung',
                'operationSubtype': 'Trench',
                'name': 'excavation'
            }
        ];

        const pc = {
            types: [
                { 'type': 'Trench', 'fields': [] },
                { 'type': 'Image', 'fields': [] },
                { 'type': 'Find', 'fields': [] },
                { 'type': 'Project', 'fields': [] }
            ]
        };

        let viewFacade: ViewFacade;
        let operationTypeDocument1: Document;
        let operationTypeDocument2: Document;
        let document1: Document;
        let document2: Document;
        let document3: Document;
        let idaiFieldDocumentDatastore: CachedDatastore<IdaiFieldDocument>;


        beforeEach(async done => {

            spyOn(console, 'debug'); // suppress console.debug

            const {datastore, documentCache} = Static.createPouchdbDatastore('testdb');
            idaiFieldDocumentDatastore = new IdaiFieldDocumentDatastore(
                datastore, documentCache,
                new IdaiFieldTypeConverter(new TypeUtility(new ProjectConfiguration(pc))));

            const projectDocument = Static.doc('testdb','testdb','Project','testdb');
            operationTypeDocument1 = Static.doc('trench1','trench1','Trench','t1');
            operationTypeDocument2 = Static.doc('trench2','trench2','Trench','t2');
            operationTypeDocument1.resource.relations['isRecordedIn'] = ['testdb'];
            operationTypeDocument2.resource.relations['isRecordedIn'] = ['testdb'];

            document1 = Static.doc('find1','find1','Find');
            document1.resource.relations['isRecordedIn'] = [operationTypeDocument1.resource.id];
            document2 = Static.doc('find2','find2','Find');
            document2.resource.relations['isRecordedIn'] = [operationTypeDocument1.resource.id];
            document3 = Static.doc('find3','find3','Find');
            document3.resource.relations['isRecordedIn'] = [operationTypeDocument2.resource.id];

            await idaiFieldDocumentDatastore.create(projectDocument);
            await idaiFieldDocumentDatastore.create(operationTypeDocument1);
            await idaiFieldDocumentDatastore.create(operationTypeDocument2);
            await idaiFieldDocumentDatastore.create(document1);
            await idaiFieldDocumentDatastore.create(document2);
            await idaiFieldDocumentDatastore.create(document3);
            done();
        });


        beforeEach(() => {

            const settingsService =
                jasmine.createSpyObj('settingsService', ['getUsername', 'getSelectedProject']);
            settingsService.getUsername.and.returnValue('user');
            settingsService.getSelectedProject.and.returnValue('testdb');

            const stateSerializer = jasmine.createSpyObj('stateSerializer', ['load', 'store']);
            stateSerializer.load.and.returnValue(Promise.resolve({}));
            stateSerializer.store.and.returnValue(Promise.resolve());

            const changesStream = jasmine.createSpyObj('changesStream', ['remoteChangesNotifications']);
            changesStream.remoteChangesNotifications.and.returnValue({
                subscribe: () => {}
            });

            viewFacade = new ViewFacade(
                idaiFieldDocumentDatastore,
                changesStream,
                settingsService,
                new ResourcesState(stateSerializer),
                viewsList
            );
        });


        afterEach((done) => new PouchDB('testdb').destroy().then(() => {done()}), 5000);



        it('populate document list in operations view', async done => {

            await viewFacade.setupView('excavation', undefined);
            expect(viewFacade.getDocuments().length).toBe(2);
            const identifiers = viewFacade.getDocuments().map(document => document.resource.identifier);
            expect(identifiers).toContain('find1');
            expect(identifiers).toContain('find2');
            done();
        });


        it('operations overview: populate document list', async done => {

            await viewFacade.setupView('project', undefined);
            expect(viewFacade.getDocuments().length).toBe(2);
            const identifiers = viewFacade.getDocuments().map(document => document.resource.identifier);
            expect(identifiers).toContain('trench1');
            expect(identifiers).toContain('trench2');
            done();
        });


        it('operations view: select operations type document', async done => {

            await viewFacade.setupView('excavation', undefined);
            await viewFacade.selectMainTypeDocument(operationTypeDocument2);
            expect(viewFacade.getDocuments().length).toBe(1);
            expect(viewFacade.getDocuments()[0].resource.identifier).toEqual('find3');
            done();
        });


        it('operations view: search', async done => {

            await viewFacade.setupView('excavation', undefined);
            await viewFacade.setQueryString('find2');
            expect(viewFacade.getDocuments().length).toBe(1);
            expect(viewFacade.getDocuments()[0].resource.identifier).toEqual('find2');
            done();
        });


        it('operations overview: search', async done => {

            await viewFacade.setupView('project', undefined);
            await viewFacade.setQueryString('trench2');
            expect(viewFacade.getDocuments().length).toBe(1);
            expect(viewFacade.getDocuments()[0].resource.identifier).toEqual('trench2');
            done();
        });


        it('operations view: set selected, query invalidated', async done => {

            await viewFacade.setupView('excavation', undefined);
            await viewFacade.setQueryString('find1');
            await viewFacade.setSelectedDocument(document2);
            expect(viewFacade.getQueryString()).toEqual('');
            expect(viewFacade.getDocuments().length).toBe(2);
            done();
        });


        it('operations view: set selected in operations view, query not invalidated', async done => {

            await viewFacade.setupView('excavation', undefined);
            await viewFacade.setQueryString('find1');
            await viewFacade.setSelectedDocument(document1);
            expect(viewFacade.getQueryString()).toEqual('find1');
            expect(viewFacade.getDocuments().length).toBe(1);
            done();
        });


        it('operations view: query matches selection', async done => {

            await viewFacade.setupView('excavation', undefined);
            await viewFacade.setSelectedDocument(document1);
            expect(await viewFacade.setQueryString('find1')).toEqual(true);
            expect(viewFacade.getSelectedDocument()).toBe(document1);
            done();
        });


        it('operations view: query does not match selection, deselect', async done => {

            await viewFacade.setupView('excavation', undefined);
            await viewFacade.setSelectedDocument(document1);
            expect(await viewFacade.setQueryString('find2')).toEqual(false);
            expect(viewFacade.getSelectedDocument()).toBe(undefined);
            done();
        });
    })
}
