import {Component, OnInit} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {to} from 'tsfun';
import {FieldDocument, Query} from 'idai-components-2';
import {SettingsService} from '../../core/settings/settings-service';
import {M} from '../messages/m';
import {ExportModalComponent} from './export-modal.component';
import {ModelUtil} from '../../core/model/model-util';
import {JavaToolExecutor} from '../../core/java/java-tool-executor';
import {FieldReadDatastore} from '../../core/datastore/field/field-read-datastore';
import {GeoJsonExporter} from '../../core/export/geojson-exporter';
import {ShapefileExporter} from '../../core/export/shapefile-exporter';
import {ProjectCategories} from '../../core/configuration/project-categories';
import {CsvExporter} from '../../core/export/csv/csv-exporter';
import {CategoryCount} from '../../core/export/export-helper';
import {ExportRunner} from '../../core/export/export-runner';
import {DocumentReadDatastore} from '../../core/datastore/document-read-datastore';
import {Category} from '../../core/configuration/model/category';
import {ProjectConfiguration} from '../../core/configuration/project-configuration';
import {TabManager} from '../../core/tabs/tab-manager';
import {ViewFacade} from '../../core/resources/view/view-facade';
import {Messages} from '../messages/messages';

const remote = require('electron').remote;



@Component({
    moduleId: module.id,
    templateUrl: './export.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Thomas Kleinke
 */
export class ExportComponent implements OnInit {

    public format: 'geojson' | 'shapefile' | 'csv' = 'csv';
    public initializing: boolean = false;
    public running: boolean = false;
    public javaInstalled: boolean = true;
    public operations: Array<FieldDocument> = [];

    public categoryCounts: Array<CategoryCount> = [];
    public selectedCategory: Category|undefined = undefined;
    public selectedOperationId: string = 'project';
    public csvExportMode: 'schema' | 'complete' = 'complete';

    private modalRef: NgbModalRef|undefined;

    private static TIMEOUT: number = 200;


    constructor(private settingsService: SettingsService,
                private modalService: NgbModal,
                private messages: Messages,
                private i18n: I18n,
                private viewFacade: ViewFacade,
                private fieldDatastore: FieldReadDatastore,
                private documentDatastore: DocumentReadDatastore,
                private projectCategories: ProjectCategories,
                private tabManager: TabManager,
                private projectConfiguration: ProjectConfiguration) {}


    public getOperationLabel = (operation: FieldDocument) => ModelUtil.getDocumentLabel(operation);

    public isJavaInstallationMissing = () => this.format === 'shapefile' && !this.javaInstalled;

    public noResourcesFound = () => this.categoryCounts.length === 0 && !this.initializing;

    public find = (query: Query) => this.documentDatastore.find(query);

    public showOperations = () => this.format !== 'csv' || this.csvExportMode === 'complete';


    async ngOnInit() {

        this.initializing = true;

        this.operations = await this.fetchOperations();
        await this.setCategoryCounts();
        this.javaInstalled = await JavaToolExecutor.isJavaInstalled();

        this.initializing = false;
    }


    public async setCategoryCounts() {

        this.categoryCounts = await ExportRunner.determineCategoryCounts(
            this.find,
            this.getOperationIdForMode(),
            this.projectConfiguration.getCategoriesArray()
        );

        if (this.categoryCounts.length > 0) this.selectedCategory = this.categoryCounts[0][0];
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') await this.tabManager.openActiveTab();
    }


    public isExportButtonEnabled() {

        return !this.isJavaInstallationMissing()
            && !this.initializing
            && !this.running
            && this.categoryCounts.length > 0;
    }


    private getOperationIdForMode() {

        return this.csvExportMode === 'complete' ? this.selectedOperationId : undefined;
    }


    public async startExport() {

        this.messages.removeAllMessages();

        const filePath: string = await this.chooseFilepath();
        if (!filePath) return;

        this.running = true;
        this.openModal();

        try {
            if (this.format === 'geojson') await this.startGeojsonExport(filePath);
            else if (this.format === 'shapefile') await this.startShapeFileExport(filePath);
            else if (this.format === 'csv') await this.startCsvExport(filePath);

            this.messages.add([M.EXPORT_SUCCESS]);
        } catch (msgWithParams) {
            this.messages.add(msgWithParams);
        }

        this.running = false;
        this.closeModal();
    }


    private async startGeojsonExport(filePath: string) {

        await GeoJsonExporter.performExport(
            this.fieldDatastore,
            filePath,
            this.selectedOperationId
        );
    }


    private async startShapeFileExport(filePath: string) {

        await ShapefileExporter.performExport(
            this.settingsService.getSelectedProject(),
            await this.documentDatastore.get('project'),
            filePath,
            this.selectedOperationId
        );
    }


    private async startCsvExport(filePath: string) {

        if (!this.selectedCategory) return console.error('No category selected');

        try {
            await ExportRunner.performExport(
                this.find,
                this.getOperationIdForMode(),
                this.selectedCategory,
                this.projectConfiguration.getRelationDefinitions(this.selectedCategory.name).map(to('name')),
                (async resourceId => (await this.documentDatastore.get(resourceId)).resource.identifier),
                CsvExporter.performExport(filePath)
            );
        } catch(err) {
            console.error(err);
            throw [M.EXPORT_ERROR_GENERIC];
        }
    }


    private chooseFilepath(): Promise<string> {

        return new Promise<string>(async resolve => {

            const options: any = { filters: [this.getFileFilter()] };
            if (this.selectedCategory) {
                options.defaultPath = this.i18n({ id: 'export.dialog.untitled', value: 'Ohne Titel' });
                if (this.format === 'csv') options.defaultPath += '.' + this.selectedCategory.name.toLowerCase();
            }

            const saveDialogReturnValue = await remote.dialog.showSaveDialog(options);
            resolve(saveDialogReturnValue.filePath);
        });
    }


    private getFileFilter(): any {

        switch (this.format) {
            case 'geojson':
                return {
                    name: this.i18n({ id: 'export.dialog.filter.geojson', value: 'GeoJSON-Datei' }),
                    extensions: ['geojson', 'json']
                };
            case 'shapefile':
                return {
                    name: this.i18n({ id: 'export.dialog.filter.zip', value: 'ZIP-Archiv' }),
                    extensions: ['zip']
                };
            case 'csv':
                return {
                    name: 'CSV',
                    extensions: ['csv']
                };
        }
    }


    private openModal() {

        setTimeout(() => {
            if (this.running) {
                this.modalRef = this.modalService.open(
                    ExportModalComponent,
                    { backdrop: 'static', keyboard: false }
                );
            }
        }, ExportComponent.TIMEOUT);
    }


    private closeModal() {

        if (this.modalRef) this.modalRef.close();
        this.modalRef = undefined;
    }


    private async fetchOperations(): Promise<Array<FieldDocument>> {

        try {
            return (await this.fieldDatastore.find({
                categories: this.projectCategories.getOperationCategoryNames()
            })).documents;
        } catch (msgWithParams) {
            this.messages.add(msgWithParams);
            return [];
        }
    }
}