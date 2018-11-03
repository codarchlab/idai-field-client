import {APP_INITIALIZER, LOCALE_ID, NgModule, TRANSLATIONS, TRANSLATIONS_FORMAT} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {HttpClientModule} from '@angular/common/http';
import {HashLocationStrategy, LocationStrategy, registerLocaleData} from '@angular/common';
import localeDe from '@angular/common/locales/de';
import {FormsModule} from '@angular/forms';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {ConfigLoader, ConfigReader, IdaiDocumentsModule, IdaiMessagesModule, MD, Messages,
    ProjectConfiguration, IdaiWidgetsModule, IdaiFieldAppConfigurator} from 'idai-components-2';
import {routing} from './app.routing';
import {AppComponent} from './app.component';
import {ResourcesModule} from './components/resources/resources.module';
import {Imagestore} from './core/imagestore/imagestore';
import {ReadImagestore} from './core/imagestore/read-imagestore';
import {MediaOverviewModule} from './components/mediaoverview/media-overview.module';
import {NavbarComponent} from './components/navbar/navbar.component';
import {BlobMaker} from './core/imagestore/blob-maker';
import {Converter} from './core/imagestore/converter';
import {SettingsModule} from './components/settings/settings.module';
import {SettingsService} from './core/settings/settings-service';
import {TaskbarComponent} from './components/navbar/taskbar.component';
import {WidgetsModule} from './widgets/widgets.module';
import {PouchDbFsImagestore} from './core/imagestore/pouch-db-fs-imagestore';
import {ProjectsComponent} from './components/navbar/projects.component';
import {ImportModule} from './components/import/import-module';
import {BackupModule} from './components/backup/backup.module';
import {DoceditActiveTabService} from './components/docedit/docedit-active-tab-service';
import {ImageViewModule} from './components/imageview/image-view.module';
import {View3DModule} from './components/view-3d/view-3d.module';
import {AppController} from './app-controller';
import {DatastoreModule} from './core/datastore/datastore.module';
import {PersistenceManager} from './core/model/persistence-manager';
import {Validator} from './core/model/validator';
import {MatrixModule} from './components/matrix/matrix.module';
import {PouchdbManager} from './core/datastore/core/pouchdb-manager';
import {TaskbarConflictsComponent} from './components/navbar/taskbar-conflicts.component';
import {TypeUtility} from './core/model/type-utility';
import {UsernameProvider} from './core/settings/username-provider';
import {IndexFacade} from './core/datastore/index/index-facade';
import {FulltextIndexer} from './core/datastore/index/fulltext-indexer';
import {ConstraintIndexer} from './core/datastore/index/constraint-indexer';
import {HelpComponent} from './components/help/help.component';
import {TaskbarUpdateComponent} from './components/navbar/taskbar-update.component';
import {M} from './components/m';
import {SettingsSerializer} from './core/settings/settings-serializer';
import {IndexerConfiguration} from './indexer-configuration';
import {SynchronizationStatus} from './core/settings/synchronization-status';
import {Translations} from './translations';


const remote = require('electron').remote;

let projectConfiguration: ProjectConfiguration|undefined = undefined;
let fulltextIndexer: FulltextIndexer|undefined = undefined;
let constraintIndexer: ConstraintIndexer|undefined = undefined;
let indexFacade: IndexFacade|undefined = undefined;


registerLocaleData(localeDe, 'de');


@NgModule({
    imports: [
        MediaOverviewModule,
        ImageViewModule,
        View3DModule,
        ResourcesModule,
        SettingsModule,
        BrowserModule,
        FormsModule,
        HttpClientModule,
        NgbModule.forRoot(),
        IdaiDocumentsModule,
        IdaiMessagesModule,
        routing,
        IdaiWidgetsModule,
        WidgetsModule,
        ImportModule,
        BackupModule,
        DatastoreModule,
        MatrixModule
    ],
    declarations: [
        AppComponent,
        NavbarComponent,
        TaskbarComponent,
        TaskbarConflictsComponent,
        TaskbarUpdateComponent,
        ProjectsComponent,
        HelpComponent
    ],
    providers: [
        { provide: LOCALE_ID, useValue: remote.getGlobal('config').locale },
        { provide: TRANSLATIONS, useValue: Translations.getTranslations() },
        { provide: TRANSLATIONS_FORMAT, useValue: 'xlf' },
        I18n,
        ConfigReader,
        ConfigLoader,
        IdaiFieldAppConfigurator,
        {
            provide: APP_INITIALIZER,
            multi: true,
            deps: [SettingsService, PouchdbManager],
            useFactory: (settingsService: SettingsService, pouchdbManager: PouchdbManager) => () =>
                pouchdbManager.setupServer()
                    .then(() => (new SettingsSerializer).load())
                    .then(settings =>
                        settingsService.bootProjectDb(settings).then(() =>
                            settingsService.loadConfiguration(remote.getGlobal('configurationDirPath'))))
                    .then(configuration => {
                        projectConfiguration = configuration;

                        const {createdConstraintIndexer, createdFulltextIndexer, createdIndexFacade} =
                            IndexerConfiguration.configureIndexers(projectConfiguration);
                        constraintIndexer = createdConstraintIndexer;
                        fulltextIndexer = createdFulltextIndexer;
                        return createdIndexFacade;
                     }).then(facade => {
                         indexFacade = facade;
                         return pouchdbManager.reindex(indexFacade);
                    })
        },
        SettingsService,
        { provide: UsernameProvider, useExisting: SettingsService },
        {
            provide: Messages,
            useFactory: function(md: MD) {
                return new Messages(md, remote.getGlobal('switches').messages_timeout);
            },
            deps: [MD]
        },
        {
            provide: Imagestore,
            useFactory: function(pouchdbManager: PouchdbManager, converter: Converter, blobMaker: BlobMaker) {
                return new PouchDbFsImagestore(converter, blobMaker, pouchdbManager.getDbProxy());
            },
            deps: [PouchdbManager, Converter, BlobMaker]
        },
        TypeUtility,
        { provide: ReadImagestore, useExisting: Imagestore },
        { provide: LocationStrategy, useClass: HashLocationStrategy },
        BlobMaker,
        Converter,
        AppController,
        {
            provide: ProjectConfiguration,
            useFactory: () => {
                if (!projectConfiguration) {
                    console.error('project configuration has not yet been provided');
                    throw 'project configuration has not yet been provided';
                }
                return projectConfiguration;
            },
            deps: []
        },
        {
            provide: FulltextIndexer,
            useFactory: () => {
                if (!fulltextIndexer) {
                    console.error('fulltext indexer has not yet been provided');
                    throw 'fulltext indexer has not yet been provided';
                }
                return fulltextIndexer;
            },
            deps: []
        },
        {
            provide: ConstraintIndexer,
            useFactory: () => {
                if (!constraintIndexer) {
                    console.error('constraint indexer has not yet been provided');
                    throw 'constraint indexer has not yet been provided';
                }
                return constraintIndexer;
            },
            deps: []
        },
        {
            provide: IndexFacade,
            useFactory: () => {
                if (!indexFacade) {
                    console.error('index facade has not yet been provided');
                    throw 'index facade has not yet been provided';
                }
                return indexFacade;
            },
            deps: []
        },
        PersistenceManager,
        Validator,
        { provide: MD, useClass: M},
        DoceditActiveTabService,
        SynchronizationStatus
    ],
    bootstrap: [ AppComponent ]
})
export class AppModule { }