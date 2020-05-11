import {Component, Input, ElementRef, ViewChild, OnChanges, EventEmitter, Output} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Relations, FieldDocument} from 'idai-components-2';
import {ResourcesComponent} from './resources.component';
import {ProjectCategories} from '../../core/configuration/project-categories';
import {M} from '../messages/m';
import {Category} from '../../core/configuration/model/category';
import {ProjectConfiguration} from '../../core/configuration/project-configuration';
import {ViewFacade} from '../../core/resources/view/view-facade';
import {FieldReadDatastore} from '../../core/datastore/field/field-read-datastore';
import {Messages} from '../messages/messages';


export type PlusButtonStatus = 'enabled'|'disabled-hierarchy';


@Component({
    selector: 'plus-button',
    moduleId: module.id,
    templateUrl: './plus-button.html'
})

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class PlusButtonComponent implements OnChanges {

    @Input() placement: string = 'bottom'; // top | bottom | left | right

    // undefined when in overview or type management
    @Input() isRecordedIn: FieldDocument|undefined;

    // undefined when current level is operation
    @Input() liesWithin: FieldDocument|undefined;

    @Input() preselectedCategory: string;
    @Input() preselectedGeometryType: string;
    @Input() skipFormAndReturnNewDocument: boolean = false;
    @Input() status: PlusButtonStatus = 'enabled';

    @Output() documentRequested: EventEmitter<FieldDocument> = new EventEmitter<FieldDocument>();

    @ViewChild('popover', { static: false }) private popover: any;

    public selectedCategory: string|undefined;
    public categoriesTreeList: Array<Category>;


    constructor(
        private elementRef: ElementRef,
        private resourcesComponent: ResourcesComponent,
        private projectConfiguration: ProjectConfiguration,
        private messages: Messages,
        private projectCategories: ProjectCategories,
        private viewFacade: ViewFacade,
        private datastore: FieldReadDatastore,
        private i18n: I18n) {

        this.resourcesComponent.listenToClickEvents().subscribe(event => {
            this.handleClick(event);
        });
    }


    public isGeometryCategory = (categoryName: string) =>
        this.projectCategories.isGeometryCategory(categoryName);


    ngOnChanges() {

        this.initializeCategoriesTreeList(this.projectConfiguration);
    }


    public async startDocumentCreation(geometryType: string = this.preselectedGeometryType) {

        if (this.popover) this.popover.close();

        try {
            await this.assertParentResourceStillExists();
        } catch (msgWithParams) {
            return this.messages.add(msgWithParams);
        }

        const newDocument: FieldDocument = <FieldDocument> {
            resource: {
                relations: this.createRelations(),
                category: this.selectedCategory
            }
        };
        if (this.skipFormAndReturnNewDocument) this.documentRequested.emit(newDocument);
        else this.resourcesComponent.startEditNewDocument(newDocument, geometryType);
    }


    public reset() {

        this.selectedCategory = this.getButtonType() === 'singleCategory'
            ? this.categoriesTreeList[0].name
            : this.selectedCategory = undefined;
    }


    public getButtonType(): 'singleCategory'|'multipleCategories'|'none' {

        if (this.categoriesTreeList.length === 0) return 'none';

        if (this.categoriesTreeList.length === 1
                && (!this.categoriesTreeList[0].children || this.categoriesTreeList[0].children.length === 0)) {
            return 'singleCategory';
        }

        return 'multipleCategories';
    }


    public chooseCategory(category: Category) {

        this.selectedCategory = category.name;

        if (this.preselectedGeometryType) {
            this.startDocumentCreation();
        } else if (!this.isGeometryCategory(this.selectedCategory)) {
            this.startDocumentCreation('none');
        }
    }


    public getTooltip(): string {

        switch(this.status) {
            case 'enabled':
                return '';
            case 'disabled-hierarchy':
                return this.i18n({
                    id: 'resources.plusButton.tooltip.deactivated',
                    value: 'Bitte deaktivieren Sie den erweiterten Suchmodus, um neue Ressourcen anlegen zu können.'
                });
        }
    }


    private handleClick(event: any) {

        if (!this.popover) return;

        let target = event.target;
        let inside = false;

        do {
            if (target === this.elementRef.nativeElement
                || target.id === 'new-object-menu'
                || target.id === 'geometry-type-selection') {
                inside = true;
                break;
            }
            target = target.parentNode;
        } while (target);

        if (!inside) this.popover.close();
    }


    private initializeCategoriesTreeList(projectConfiguration: ProjectConfiguration) {

        this.categoriesTreeList = [];

        if (this.preselectedCategory) {
            const category: Category = projectConfiguration.getCategoriesMap()[this.preselectedCategory];
            if (category) {
                this.categoriesTreeList.push(category);
            } else {
                this.messages.add([M.RESOURCES_ERROR_CATEGORY_NOT_FOUND, this.preselectedCategory]);
            }
        } else {
            for (let category of projectConfiguration.getCategoriesArray()) {
                if (this.isAllowedCategory(category, projectConfiguration)
                        && (!category.parentCategory
                            || !this.isAllowedCategory(category.parentCategory, projectConfiguration))) {
                    this.categoriesTreeList.push(category);
                }
            }
        }
    }


    private createRelations(): Relations {

        const relations: Relations = {};
        relations['isRecordedIn'] = this.isRecordedIn
            ? [this.isRecordedIn.resource.id]
            : [];

        if (this.liesWithin) relations['liesWithin'] = [this.liesWithin.resource.id];
        return relations;
    }


    private isAllowedCategory(category: Category, projectConfiguration: ProjectConfiguration): boolean {

        if (category.name === 'Image') return false;

        if (this.isRecordedIn) {
            if (!projectConfiguration.isAllowedRelationDomainCategory(category.name,
                this.isRecordedIn.resource.category, 'isRecordedIn')) {
                return false;
            }
        } else {
            if (!(this.viewFacade.isInOverview()
                    ? this.projectCategories.getOverviewCategories().includes(category.name)
                    : this.projectCategories.getTypeCategories().includes(category.name))) {
                return false;
            }
        }

        if (!this.liesWithin) return !category.mustLieWithin;

        return projectConfiguration.isAllowedRelationDomainCategory(
            category.name, this.liesWithin.resource.category, 'liesWithin'
        );
    }


    private async assertParentResourceStillExists() {

        try {
            if (this.isRecordedIn) await this.datastore.get(this.isRecordedIn.resource.id);
            if (this.liesWithin) await this.datastore.get(this.liesWithin.resource.id);
        } catch {
            throw [M.RESOURCES_ERROR_PARENT_RESOURCE_DELETED];
        }
    }
}
