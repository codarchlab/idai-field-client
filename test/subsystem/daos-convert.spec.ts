import * as PouchDB from 'pouchdb';
import {createApp, setupSyncTestDb} from './subsystem-helper';
import {Static} from '../unit/static';
import {TypeUtility} from '../../app/core/model/type-utility';


/**
 * This test suite focuses on the differences between the Data Access Objects.
 *
 * Depending of the Type Class T and based on document.resource.type,
 * well-formed documents are about to be created.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('DAOs/Convert/Subsystem', () => {

    let image0;
    let trench0;
    let _documentDatastore;
    let _fieldDocumentDatastore;
    let _idaiFieldImageDocumentDatastore;


    function expectErr(err) {

        if (!err) fail('Wrong Err - undefined');
        if (err.indexOf(TypeUtility.UNKNOWN_TYPE_ERROR) === -1) fail('Wrong Err' + err);
    }


    beforeEach(async done => {

        await setupSyncTestDb();

        const {
            documentDatastore,
            fieldDocumentDatastore,
            imageDatastore
        } = await createApp();

        _documentDatastore = documentDatastore;
        _fieldDocumentDatastore = fieldDocumentDatastore;
        _idaiFieldImageDocumentDatastore = imageDatastore;

        image0 = Static.doc('Image','Image','Image','image0');
        trench0 = Static.doc('Trench','Trench','Trench','trench0');

        image0 = await _idaiFieldImageDocumentDatastore.create(image0);
        trench0 = await _fieldDocumentDatastore.create(trench0);
        done();
    });


    afterEach(async done => {

        await new PouchDB('testdb').destroy();
        done();
    }, 5000);


    // create

    it('FieldDatastore - add relations with create', async done => {

        try {
            expect((await _idaiFieldImageDocumentDatastore.
            create(Static.doc('Image','Image','Image','image1'))).
                resource.relations.depicts).toEqual([]);
        } catch (err) {
            fail(err);
        }
        done();
    });


    it('FieldDatastore - add relations with create', async done => {

        try {
            expect((await _fieldDocumentDatastore.
            create(Static.doc('Trench','Trench','Trench','trench1'))).
                resource.relations.isRecordedIn).toEqual([]);
        } catch (err) {
            fail(err);
        }
        done();
    });


    it('create - unknown type', async done => {

        try {
            expect((await _fieldDocumentDatastore.
            create(Static.doc('Trench','Trench','Unknown','trench1'))).
                resource.relations.isRecordedIn).toEqual([]);
            fail();
        } catch (err) {
            expectErr(err);
        }
        done();
    });


    // update

    it('ImageDatastore - add relations with update', async done => {

        delete image0.resource.relations.depicts;
        expect((await _idaiFieldImageDocumentDatastore.update(image0)).resource.relations.depicts).toEqual([]);
        done();
    });


    it('FieldDatastore - add relations with update', async done => {

        delete trench0.resource.relations.isRecordedIn;
        expect((await _fieldDocumentDatastore.
        update(trench0)).resource.relations.isRecordedIn).toEqual([]);
        done();
    });


    // get

    it('get - add relations for FieldDocument', async done => {

        expect((await _fieldDocumentDatastore.get('trench0', { skipCache: true })).
            resource.relations.isRecordedIn).toEqual([]);
        expect((await _fieldDocumentDatastore.get('trench0', { skipCache: false })).
            resource.relations.isRecordedIn).toEqual([]);
        expect((await _documentDatastore.get('trench0', { skipCache: true })).
            resource.relations.isRecordedIn).toEqual([]);
        expect((await _documentDatastore.get('trench0', { skipCache: false })).
            resource.relations.isRecordedIn).toEqual([]);
        done();
    });


    it('get - add relations for ImageDocument', async done => {

        expect((await _idaiFieldImageDocumentDatastore.get('image0', { skipCache: true })).
            resource.relations.depicts).toEqual([]);
        expect((await _idaiFieldImageDocumentDatastore.get('image0', { skipCache: false })).
            resource.relations.depicts).toEqual([]);
        expect((await _documentDatastore.get('image0', { skipCache: true })).
            resource.relations.depicts).toEqual([]);
        expect((await _documentDatastore.get('image0', { skipCache: false })).
            resource.relations.depicts).toEqual([]);
        done();
    });


    // find

    it('find - add relations for FieldDocument', async done => {

        expect((await _fieldDocumentDatastore.find({})). // result coming from cache
            documents[0].resource.relations.isRecordedIn).toEqual([]);
        expect((await _idaiFieldImageDocumentDatastore.find({})). // result coming from cache
            documents[0].resource.relations.depicts).toEqual([]);
        done();
    });
});

