import {Injectable} from '@angular/core';
import {unique} from 'tsfun';
import {Messages, ProjectConfiguration, Document, AppConfigurator} from 'idai-components-2';
import {Settings} from './settings';
import {SettingsSerializer} from './settings-serializer';
import {Imagestore} from '../imagestore/imagestore';
import {PouchdbManager} from '../datastore/core/pouchdb-manager';
import {ImagestoreErrors} from '../imagestore/imagestore-errors';
import {FieldSampleDataLoader} from '../datastore/field/field-sample-data-loader';
import {Converter} from '../imagestore/converter';
import {M} from '../../components/m';
import {SynchronizationStatus} from './synchronization-status';

const {remote, ipcRenderer} = require('electron');


@Injectable()
/**
 * The settings service provides access to the
 * properties of the config.json file. It can be
 * serialized to and from config.json files.
 *
 * It is connected to the imagestore and datastore
 * subsystems which are controlled based on the settings.
 *
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class SettingsService {

    private settings: Settings;
    private settingsSerializer: SettingsSerializer = new SettingsSerializer();
    private currentSyncUrl = '';
    private currentSyncTimeout: any;
    private projectDocument: Document;


    constructor(private imagestore: Imagestore,
                private pouchdbManager: PouchdbManager,
                private messages: Messages,
                private appConfigurator: AppConfigurator,
                private converter: Converter,
                private synchronizationStatus: SynchronizationStatus) {
    }


    /**
     * Retrieve the current settings.
     * Returns a clone of the settings object in order to prevent the settings
     * object from being changed without explicitly saving the settings.
     * @returns {Settings} the current settings
     */
    public getSettings = (): Settings => JSON.parse(JSON.stringify(this.settings)); // deep copy

    public getUsername = () => this.settings.username;

    public getDbs = () => this.settings.dbs;

    public getProjectDocument = () => this.projectDocument;

    public getSelectedProject(): string {

        return this.settings.dbs && this.settings.dbs.length > 0
            ? this.settings.dbs[0]
            : 'test';
    }

    public isAutoUpdateActive = () => this.settings.isAutoUpdateActive;


    public async loadProjectDocument(isBoot = false): Promise<void> {

        delete this.projectDocument; // making sure we start fresh

        try { // new
            this.projectDocument = await this.pouchdbManager.getDbProxy().get('project');
        } catch (_) {
            console.warn('Didn\'t find new style project document, try old method');
        }

        if (!this.projectDocument) {
            try { // old
                this.projectDocument = await this.pouchdbManager.getDbProxy().get(this.getSelectedProject());
            } catch (_) {
                if (isBoot) {
                    console.warn('Didn\'t find old style project document either, creating new one');
                    await this.pouchdbManager.getDbProxy().put(
                        SettingsService.createProjectDocument(this.getSelectedProject(), this.getUsername())
                    );
                    this.projectDocument = await this.pouchdbManager.getDbProxy().get('project');
                }
            }
        }
    }


    public async bootProjectDb(settings: Settings): Promise<void> {

        await this.updateSettings(settings);
        await this.pouchdbManager.loadProjectDb(
            this.getSelectedProject(),
            new FieldSampleDataLoader(this.converter, this.settings.imagestorePath, this.settings.locale));

        if (this.settings.isSyncActive) await this.startSync();
        await this.loadProjectDocument(true);
    }


    public async loadConfiguration(configurationDirPath: string): Promise<ProjectConfiguration> {

        let customProjectName = undefined;
        if (this.getSelectedProject().startsWith('meninx-project')) customProjectName = 'Meninx';
        if (this.getSelectedProject().startsWith('pergamongrabung')) customProjectName = 'Pergamon';
        if (this.getSelectedProject() === 'wes' || this.getSelectedProject().startsWith('wes-')) {
            customProjectName = 'WES';
        }
        if (this.getSelectedProject().startsWith('bogazkoy-hattusa')) customProjectName = 'Boha';

        try {
            return await this.appConfigurator.go(
                configurationDirPath,
                customProjectName,
                this.getSettings().locale
            );
        } catch (msgsWithParams) {
            if (msgsWithParams.length > 0) {
                msgsWithParams.forEach((msg: any) => console.error('err in project configuration', msg));
            } else { // should not happen normally
                console.error(msgsWithParams);
            }
            if (msgsWithParams.length > 1) {
                console.error('num errors in project configuration', msgsWithParams.length);
            }
            throw 'Could not boot project';
        }
    }


    public async addProject(name: string) {

        this.settings.dbs = unique(this.settings.dbs.concat([name]));
        await this.settingsSerializer.store(this.settings);
    }


    public async selectProject(name: string) {

        this.settings.dbs = unique([name].concat(this.settings.dbs));
        await this.settingsSerializer.store(this.settings);
    }


    public async deleteProject(name: string) {

        await this.pouchdbManager.destroyDb(name);
        this.settings.dbs.splice(this.settings.dbs.indexOf(name), 1);
        await this.settingsSerializer.store(this.settings);
    }


    public async createProject(name: string, destroyBeforeCreate: boolean) {

        await this.selectProject(name);

        await this.pouchdbManager.createDb(
            name,
            SettingsService.createProjectDocument(name, this.getUsername()),
            destroyBeforeCreate
        );
    }


    /**
     * Sets, validates and persists the settings state.
     * Project settings have to be set separately.
     */
    public async updateSettings(settings: Settings) {

        settings = JSON.parse(JSON.stringify(settings)); // deep copy
        this.settings = SettingsService.initSettings(settings);

        if (this.settings.syncTarget.address) {
            this.settings.syncTarget.address = this.settings.syncTarget.address.trim();
            if (!SettingsService.validateAddress(this.settings.syncTarget.address))
                throw 'malformed_address';
        }

        if (ipcRenderer) ipcRenderer.send('settingsChanged', this.settings);

        return this.imagestore.setPath(settings.imagestorePath, this.getSelectedProject() as any)
            .catch((errWithParams: any) => {
                if (errWithParams.length > 0 && errWithParams[0] === ImagestoreErrors.INVALID_PATH) {
                    this.messages.add([M.IMAGESTORE_ERROR_INVALID_PATH, settings.imagestorePath]);
                } else {
                    console.error('Something went wrong with imagestore.setPath', errWithParams);
                }
            })
            .then(() => this.settingsSerializer.store(this.settings));
    }


    public startSync(): Promise<any> {

        if (this.currentSyncTimeout) clearTimeout(this.currentSyncTimeout);

        this.currentSyncUrl = SettingsService.makeUrlFromSyncTarget(this.settings.syncTarget);
        if (!this.currentSyncUrl) return Promise.resolve();
        if (!SettingsService.isSynchronizationAllowed(this.getSelectedProject())) return Promise.resolve();

        return this.pouchdbManager.setupSync(this.currentSyncUrl, this.getSelectedProject())
            .then(syncState => {

            // avoid issuing 'connected' too early
            const msg = setTimeout(() => this.synchronizationStatus.setConnected(true), 500);

            syncState.onError.subscribe(() => {
                clearTimeout(msg); // stop 'connected' msg if error
                syncState.cancel();
                this.synchronizationStatus.setConnected(false);
                this.currentSyncTimeout = setTimeout(() => this.startSync(), 5000); // retry
            });
        });
    }


    public restartSync() {

        this.stopSync();

        if (!this.settings.isSyncActive
                || !this.settings.dbs
                || !(this.settings.dbs.length > 0))
            return Promise.resolve();

        return new Promise<any>(resolve => {
                setTimeout(() => {
                    this.startSync().then(() => resolve());
                }, 1000);
            });
    }


    public stopSync() {

        if (this.currentSyncTimeout) clearTimeout(this.currentSyncTimeout);
        this.pouchdbManager.stopSync();
        this.synchronizationStatus.setConnected(false);
    }


    private static isSynchronizationAllowed(project: string): boolean {

        return project !== undefined && (project !== 'test' || remote.getGlobal('mode') === 'test');
    }


    private static validateAddress(address: any) {

        return (address == '')
            ? true
            : new RegExp('^(https?:\/\/)?([0-9a-z\.-]+)(:[0-9]+)?(\/.*)?$').test(address);
    }


    private static makeUrlFromSyncTarget(serverSetting: any) {

        let address = serverSetting['address'];
        if (!address) return false;

        if (address.indexOf('http') == -1) address = 'http://' + address;

        return !serverSetting['username'] || !serverSetting['password']
            ? address
            : address.replace(/(https?):\/\//, '$1://' +
                serverSetting['username'] + ':' + serverSetting['password'] + '@');
    }


    /**
     * initializes settings to default values
     * @param settings provided settings
     * @returns {Settings} settings with added default settings
     */
    private static initSettings(settings: Settings): Settings {

        if (!settings.username) settings.username = 'anonymous';
        if (!settings.dbs || settings.dbs.length === 0) settings.dbs = ['test'];
        if (!settings.isSyncActive) settings.isSyncActive = false;

        if (settings.imagestorePath) {
            let path: string = settings.imagestorePath;
            if (path.substr(-1) != '/') path += '/';
            settings.imagestorePath = path;
        } else {
            if (remote.app){ // jasmine unit tests
                settings.imagestorePath = remote.app.getPath('appData') + '/'
                    + remote.app.getName() + '/imagestore/';
            }
        }
        return settings;
    }


    private static createProjectDocument(name: string, username: string): any {

        return {
            _id: 'project',
            resource: {
                type: 'Project',
                identifier: name,
                id: 'project',
                coordinateReferenceSystem: 'Eigenes Koordinatenbezugssystem',
                relations: {}
            },
            created: { user: username, date: new Date() },
            modified: [{ user: username, date: new Date() }]
        };
    }
}