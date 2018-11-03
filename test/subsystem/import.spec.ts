import {to} from 'tsfun';
import {createApp, setupSettingsService, setupSyncTestDb} from './subsystem-helper';
import {ImportFacade} from '../../app/core/import/import-facade';
import {Validator} from '../../app/core/model/validator';
import {TypeUtility} from '../../app/core/model/type-utility';
import {ValidationErrors} from '../../app/core/model/validation-errors';
import {M} from '../../app/components/m';
import {ImportErrors} from '../../app/core/import/import-errors';
import {PouchdbManager} from '../../app/core/datastore/core/pouchdb-manager';

/**
 * @author Daniel de Oliveira
 */
describe('Import/Subsystem', () => {

    let datastore;
    let _projectConfiguration;

    beforeEach(async done => {

        await setupSyncTestDb();
        const {projectConfiguration} = await setupSettingsService(new PouchdbManager());
        _projectConfiguration = projectConfiguration;
        const {idaiFieldDocumentDatastore} = await createApp();
        datastore = idaiFieldDocumentDatastore;
        done();
    });


    it('create one operation', async done => {

        await ImportFacade.doImport(
            'native',
            new Validator(_projectConfiguration, datastore, new TypeUtility(_projectConfiguration)),
            datastore,
            { getUsername: () => 'testuser'},
            _projectConfiguration,
            undefined,
            undefined,
            { go: () => Promise.resolve(
                '{ "type": "Trench", "identifier" : "t1", "shortDescription" : "Our Trench 1"}')});

        const result = await datastore.find({});
        expect(result.documents.length).toBe(1);
        expect(result.documents[0].resource.identifier).toBe('t1');
        done();
    });


    it('produce validation error', async done => {

        const trench = await datastore.create({ resource: { identifier: 't1', type: 'Trench', shortDescription: 'Our Trench 1', relations: {}}});

        const report = await ImportFacade.doImport(
            'native',
            new Validator(_projectConfiguration, datastore, new TypeUtility(_projectConfiguration)),
            datastore,
            { getUsername: () => 'testuser'},
            _projectConfiguration,
            trench.resource.id,
            undefined,
            { go: () => Promise.resolve(
                    '{ "type": "Find", "identifier" : "obob1", "shortDescription" : "O.B. One", "geometry": { "type": "UnsupportedGeometryType", "coordinates": [1, 2] } }')});

        expect(report.errors[0]).toEqual([ValidationErrors.UNSUPPORTED_GEOMETRY_TYPE, "UnsupportedGeometryType"]);
        done();
    });


    // TODO this test has to be removed since 'produce validation error' already shows that validation error works
    it('produce validation error 2', async done => {

        const trench = await datastore.create({ resource: { identifier: 't1', type: 'Trench', shortDescription: 'Our Trench 1', relations: {}}});

        const report = await ImportFacade.doImport(
            'native',
            new Validator(_projectConfiguration, datastore, new TypeUtility(_projectConfiguration)),
            datastore,
            { getUsername: () => 'testuser'},
            _projectConfiguration,
            trench.resource.id,
            undefined,
            { go: () => Promise.resolve(
                    '{ "type": "Find", "identifier" : "obob1", "shortDescription" : "O.B. One", "geometry": { "type": "Polygon", "coordinates": [[1, 2, 3]] } }')});

        expect(report.errors[0]).toEqual([ValidationErrors.INVALID_COORDINATES, "Polygon"]);
        done();
    });


    it('create one find, connect to existing operation ', async done => {

        const stored = await datastore.create({ resource: { identifier: 't1', type: 'Trench', shortDescription: 'Our Trench 1', relations: {}}});

        await ImportFacade.doImport(
            'native',
            new Validator(_projectConfiguration, datastore, new TypeUtility(_projectConfiguration)),
            datastore,
            { getUsername: () => 'testuser'},
            _projectConfiguration,
            stored.resource.id,
            false,
            { go: () => Promise.resolve(
                    '{ "type": "Find", "identifier" : "f1", "shortDescription" : "Our Find 1"}')});

        const result = await datastore.find({});
        expect(result.documents.length).toBe(2);
        expect(result.documents.map(to('resource.identifier'))).toContain('t1');
        expect(result.documents.map(to('resource.identifier'))).toContain('f1');
        done();
    });


    function createRollbackTestImportFunction(allowMergingExistingResources: boolean, resourceId: string) {

        return ImportFacade.doImport(
            'native',
            new Validator(_projectConfiguration, datastore, new TypeUtility(_projectConfiguration)),
            datastore,
            { getUsername: () => 'testuser'},
            _projectConfiguration,
            resourceId,
            allowMergingExistingResources,
            { go: () => Promise.resolve(
                    '{ "type": "Feature", "identifier" : "f1", "shortDescription" : "feature1"}'+ "\n"
                    + '{ "type": "InvalidType", "identifier" : "f2", "shortDescription" : "feature2"}')});
    }


    it('rollback', async done => {

        const id = (await datastore.create({ resource: { identifier: 't1', type: 'Trench', shortDescription: 'Our Trench 1', relations: {}}})).resource.id;

        const importReport = await createRollbackTestImportFunction(false, id);
        expect(importReport.errors[0]).toEqual([M.IMPORT_VALIDATION_ERROR_INVALID_TYPE, 'InvalidType']); // TODO should be validation error
        const result = await datastore.find({});
        expect(result.documents.length).toBe(1);
        done();
    });


    it('no rollback, because after merge we will not perform it', async done => {

        const id = (await datastore.create({ resource: { identifier: 't1', type: 'Trench', shortDescription: 'Our Trench 1', relations: {}}})).resource.id;
        await datastore.create({ resource: { identifier: 'f1', type: 'Feature', shortDescription: 'f1', relations: { isRecordedIn: ['t1']}}});

        const importReport = await createRollbackTestImportFunction(true, id);
        expect(importReport.errors[0]).toEqual([ValidationErrors.INVALID_TYPE, 'InvalidType']);

        const result = await datastore.find({});
        expect(result.documents.length).toBe(2);
        expect(result.documents.map(to('resource.identifier'))).toContain('f1');
        expect(result.documents.map(to('resource.identifier'))).toContain('t1');
        expect(result.documents.map(to('resource.shortDescription'))).toContain('feature1'); // updated
        expect(result.documents.map(to('resource.shortDescription'))).toContain('Our Trench 1');
        done();
    });


    it('update shortDescription', async done => {

        await datastore.create({ resource: { identifier: 'f1', type: 'Feature', shortDescription: 'feature1', relations: {}}});

        await ImportFacade.doImport(
            'native',
            new Validator(_projectConfiguration, datastore, new TypeUtility(_projectConfiguration)),
            datastore,
            { getUsername: () => 'testuser'},
            _projectConfiguration,
            undefined,
            true,
            { go: () => Promise.resolve(
                    '{ "type": "Feature", "identifier" : "f1", "shortDescription" : "feature_1"}')});

        const result = await datastore.find({});
        expect(result.documents[0].resource.shortDescription).toBe('feature_1');
        done();
    });


    it('unmatched items get ignored on merge', async done => {

        await datastore.create({ resource: { identifier: 'f1', type: 'Feature', shortDescription: 'feature1', relations: {}}});

        await ImportFacade.doImport(
            'native',
            new Validator(_projectConfiguration, datastore, new TypeUtility(_projectConfiguration)),
            datastore,
            { getUsername: () => 'testuser'},
            _projectConfiguration,
            undefined,
            true,
            { go: () => Promise.resolve(
                    '{ "type": "Feature", "identifier" : "f1", "shortDescription" : "feature_1"}' + "\n"
                + '{ "type": "Feature", "identifier" : "f2", "shortDescription" : "feature_2"}')});

        const result = await datastore.find({});
        expect(result.documents.length).toBe(1);
        expect(result.documents[0].resource.shortDescription).toBe('feature_1');
        done();
    });


    it('import trench not allowed, when import into operation is activated', async done => {

        await datastore.create({ resource: { identifier: 't1', type: 'Trench', shortDescription: 'Our trench 1', relations: {}}});

        const importReport = await ImportFacade.doImport(
            'native',
            new Validator(_projectConfiguration, datastore, new TypeUtility(_projectConfiguration)),
            datastore,
            { getUsername: () => 'testuser'},
            _projectConfiguration,
            'f1',
            false,
            { go: () => Promise.resolve(
                    '{ "type": "Trench", "identifier" : "t2", "shortDescription" : "Our Trench 2"}')});

        expect(importReport.errors[0]).toEqual([ImportErrors.OPERATIONS_NOT_ALLOWED_ON_IMPORT_TO_OPERATION]);

        const result = await datastore.find({});
        expect(result.documents[0].resource.identifier).toBe('t1');
        done();
    });





    // TODO test: merge mode, but isRecordedIn is set. decide how we deal with it.
});
