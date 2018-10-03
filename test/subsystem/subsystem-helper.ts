import {IdaiFieldAppConfigurator, ConfigLoader, ConfigReader, Document} from 'idai-components-2';
import {IdaiFieldImageDocumentDatastore} from '../../app/core/datastore/field/idai-field-image-document-datastore';
import {IdaiFieldDocumentDatastore} from '../../app/core/datastore/field/idai-field-document-datastore';
import {DocumentDatastore} from '../../app/core/datastore/document-datastore';
import {TypeUtility} from '../../app/core/model/type-utility';
import {IdaiFieldTypeConverter} from '../../app/core/datastore/field/idai-field-type-converter';
import {IndexerConfiguration} from '../../app/indexer-configuration';
import {PouchdbDatastore} from '../../app/core/datastore/core/pouchdb-datastore';
import {DocumentCache} from '../../app/core/datastore/core/document-cache';
import {PouchdbManager} from '../../app/core/datastore/core/pouchdb-manager';
import {PouchDbFsImagestore} from '../../app/core/imagestore/pouch-db-fs-imagestore';
import {Imagestore} from '../../app/core/imagestore/imagestore';
import {RemoteChangesStream} from '../../app/core/datastore/core/remote-changes-stream';
import {ResourcesStateManagerConfiguration} from '../../app/components/resources/view/resources-state-manager-configuration';
import {StandardStateSerializer} from '../../app/common/standard-state-serializer';
import {ViewFacade} from '../../app/components/resources/view/view-facade';
import {PersistenceManager} from '../../app/core/model/persistence-manager';
import {DocumentHolder} from '../../app/components/docedit/document-holder';
import {Validator} from '../../app/core/model/validator';
import {SyncTarget} from '../../app/core/settings/settings';
import {FsConfigReader} from '../../app/core/util/fs-config-reader';
import {SettingsService} from '../../app/core/settings/settings-service';
import * as PouchDB from 'pouchdb';

class IdGenerator {
    public generateId() {
        return Math.floor(Math.random() * 10000000).toString();
    }
}


/**
 * Boot project via settings service such that it immediately starts syncinc with http://localhost:3003/synctestremotedb
 */
export async function setupSettingsService(pouchdbmanager, projectName = 'testdb', startSync = false) {

    const settingsService = new SettingsService(
        new PouchDbFsImagestore(
            undefined, undefined, pouchdbmanager.getDbProxy()) as Imagestore,
        pouchdbmanager,
        undefined,
        new IdaiFieldAppConfigurator(new ConfigLoader(new FsConfigReader() as ConfigReader)),
        undefined
    );

    await settingsService.bootProjectDb({
        isAutoUpdateActive: false,
        isSyncActive: startSync,
        remoteSites: [],
        syncTarget: new class implements SyncTarget {
            address: string = 'http://localhost:3003/';
            password: string;
            username: string;
        },
        dbs: [projectName],
        imagestorePath: '/tmp/abc',
        model3DStorePath: '/tmp/def',
        username: 'synctestuser'
    });

    const projectConfiguration = await settingsService.loadConfiguration('./config/');
    return {settingsService, projectConfiguration};
}


export async function createApp(projectName = 'testdb', startSync = false) {

    const pouchdbmanager = new PouchdbManager();

    const {settingsService, projectConfiguration} = await setupSettingsService(
        pouchdbmanager, projectName, startSync);

    const {createdConstraintIndexer, createdFulltextIndexer, createdIndexFacade} =
        IndexerConfiguration.configureIndexers(projectConfiguration);

    const datastore = new PouchdbDatastore(
        pouchdbmanager.getDbProxy(),
        new IdGenerator(),
        true);

    const documentCache = new DocumentCache<Document>();

    const typeUtility = new TypeUtility(projectConfiguration);

    const typeConverter = new IdaiFieldTypeConverter(typeUtility);

    const idaiFieldDocumentDatastore = new IdaiFieldDocumentDatastore(
        datastore, createdIndexFacade, documentCache as any, typeConverter);
    const idaiFieldImageDocumentDatastore = new IdaiFieldImageDocumentDatastore(
        datastore, createdIndexFacade, documentCache as any, typeConverter);
    const documentDatastore = new DocumentDatastore(
        datastore, createdIndexFacade, documentCache, typeConverter);

    const remoteChangesStream = new RemoteChangesStream(
        datastore,
        createdIndexFacade,
        documentCache,
        typeConverter,
        { getUsername: () => 'fakeuser' });

    const resourcesStateManager = ResourcesStateManagerConfiguration.build(
        projectConfiguration,
        idaiFieldDocumentDatastore,
        new StandardStateSerializer(settingsService),
        'synctest',
        true
    );

    const viewFacade = new ViewFacade(
        projectConfiguration,
        idaiFieldDocumentDatastore,
        remoteChangesStream,
        resourcesStateManager,
        undefined
    );

    const persistenceManager = new PersistenceManager(
        idaiFieldDocumentDatastore,
        projectConfiguration,
        typeUtility,
    );

    const documentHolder = new DocumentHolder(
        projectConfiguration,
        persistenceManager,
        new Validator(projectConfiguration, idaiFieldDocumentDatastore, typeUtility),
        undefined,
        undefined,
        typeUtility,
        { getUsername: () => 'fakeuser' },
        documentDatastore
    );

    return {
        remoteChangesStream,
        viewFacade,
        documentHolder,
        documentDatastore,
        idaiFieldDocumentDatastore,
        idaiFieldImageDocumentDatastore,
        settingsService
    }
}


/**
 * Creates the db that is in the simulated client app
 */
export async function setupSyncTestDb(projectName = 'testdb') {

    let synctest = new PouchDB(projectName);
    await synctest.destroy();
    synctest = new PouchDB(projectName);
    await synctest.put({
        '_id': 'project',
        'resource': {
            'type': 'Project',
            'id': 'project',
            'identifier': projectName
        }
    });
    await synctest.close();
}