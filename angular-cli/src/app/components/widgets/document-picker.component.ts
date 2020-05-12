import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {union} from 'tsfun';
import {Query, FieldDocument, Constraint} from 'idai-components-2';
import {FieldDatastore} from '../../core/datastore/field/field-datastore';
import {Loading} from './loading';
import {clone} from '../../core/util/object-util';
import {AngularUtility} from '../../angular/angular-utility';
import {FieldDocumentFindResult} from '../../core/datastore/field/field-read-datastore';
import {Category} from '../../core/configuration/model/category';
import {ProjectConfiguration} from '../../core/configuration/project-configuration';
import {Messages} from '../messages/messages';


@Component({
    selector: 'document-picker',
    moduleId: module.id,
    templateUrl: './document-picker.html'
})
/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class DocumentPickerComponent implements OnChanges {

    @Input() filterOptions: Array<Category>;
    @Input() getConstraints: () => Promise<{ [name: string]: string|Constraint }>;
    @Input() showProjectOption: boolean = false;

    @Output() documentSelected: EventEmitter<FieldDocument> = new EventEmitter<FieldDocument>();

    public documents: Array<FieldDocument>;

    private query: Query = { limit: 50 };
    private currentQueryId: string;


    constructor(private datastore: FieldDatastore,
                private projectConfiguration: ProjectConfiguration,
                private loading: Loading,
                private messages: Messages,
                private i18n: I18n) {}


    public isLoading = () => this.loading.isLoading();


    async ngOnChanges() {

        this.query.categories = this.getAllAvailableCategoryNames();
        await this.updateResultList();
    }


    public getQueryCategories(): string[]|undefined {

        if (!this.query.categories) return undefined;

        return this.query.categories.length === this.getAllAvailableCategoryNames().length
                && this.filterOptions.length > 1
            ? undefined
            : this.query.categories;
    }


    public async setQueryString(q: string) {

        this.query.q = q;
        await this.updateResultList();
    }


    public async setQueryCategories(categories: string[]) {

        if (categories && categories.length > 0) {
            this.query.categories = categories;
        } else {
            this.query.categories = this.getAllAvailableCategoryNames();
        }

        await this.updateResultList();
    }


    public isQuerySpecified(): boolean {

        return ((this.query.q !== undefined && this.query.q.length > 0)
            || (this.query.categories !== undefined
                && (this.query.categories.length < this.getAllAvailableCategoryNames().length
                    || this.query.categories.length === 1)));
    }


    private async updateResultList() {

        this.documents = [];
        if (this.isQuerySpecified()) await this.fetchDocuments();
    }


    private async fetchDocuments() {

        this.loading.start('documentPicker');
        await AngularUtility.refresh();

        this.currentQueryId = new Date().toISOString();

        try {
            if (this.getConstraints) this.query.constraints = await this.getConstraints();
            this.query.id = this.currentQueryId;
            const result = await this.datastore.find(clone(this.query));
            if (result.queryId === this.currentQueryId) this.documents = this.getDocuments(result);
        } catch (msgWithParams) {
            this.messages.add(msgWithParams);
        } finally {
            this.loading.stop();
        }
    }


    private getDocuments(result: FieldDocumentFindResult): Array<FieldDocument> {

        return this.isProjectOptionVisible()
            ? [this.getProjectOption()].concat(
                result.documents.filter(document => document.resource.category !== 'Project')
            )
            : result.documents;
    }


    private getAllAvailableCategoryNames(): string[] {

        return union(this.filterOptions.map(category => {
            return category.children
                ? [category.name].concat(category.children.map(child => child.name))
                : [category.name];
        }));
    }


    private getProjectOption(): FieldDocument {

        return {
            resource: {
                id: 'project',
                identifier: this.i18n({ id: 'widgets.documentPicker.project', value: 'Projekt' }),
                category: 'Project'
            }
        } as any;
    }


    private isProjectOptionVisible(): boolean {

        return this.showProjectOption
            && ((this.query.q !== undefined && this.query.q.length > 0
                && this.i18n({ id: 'widgets.documentPicker.project', value: 'Projekt' })
                    .toLowerCase().startsWith(this.query.q.toLowerCase()))
                || (this.query.categories !== undefined && this.query.categories.includes('Project')));
    }
}