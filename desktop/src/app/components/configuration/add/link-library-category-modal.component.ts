import { Component } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { set } from 'tsfun';
import { BuiltInConfiguration, Document, ConfigReader, ConfigLoader, Category, ConfigurationDocument } from 'idai-field-core';
import { ConfigurationIndex } from '../../../core/configuration/configuration-index';
import { MenuContext, MenuService } from '../../menu-service';
import { AddCategoryModalComponent } from './add-category-modal.component';
import { AngularUtility } from '../../../angular/angular-utility';
import { CategoryEditorModalComponent } from '../editor/category-editor-modal.component';
import { ErrWithParams } from '../../../core/import/import/import-documents';


@Component({
    templateUrl: './link-library-category-modal.html'
})
/**
 * @author Daniel de Oliveira
 */
export class LinkLibraryCategoryModalComponent {

    public categoryName: string;

    customConfigurationDocument: ConfigurationDocument;

    public parentCategory: Category;

    public category: Category|undefined;

    public categories: Array<Category> = [];

    private configurationIndex = {};

    public configureAppSaveChangesAndReload: (configurationDocument: ConfigurationDocument) =>
        Promise<ErrWithParams|undefined>;

    constructor(public activeModal: NgbActiveModal,
                private configReader: ConfigReader,
                private configLoader: ConfigLoader,
                private menuService: MenuService,
                private modalService: NgbModal) {

        this.readConfig();
    }


    public async addSubcategory(parentCategory: Category) {

        this.menuService.setContext(MenuContext.MODAL);

        const modalReference: NgbModalRef = this.modalService.open(AddCategoryModalComponent);
        modalReference.componentInstance.categoryName = this.categoryName;

        try {
            await this.createNewSubcategory(parentCategory, await modalReference.result);

            this.menuService.setContext(MenuContext.DEFAULT);
            AngularUtility.blurActiveElement();
            this.activeModal.close(this.categoryName);
        } catch {
            // Modal has been canceled
        }
    }


    public selectCategory(category: Category) {

        this.category = category;
    }


    public createCategory() {

        if (!this.category) return;

        const configurationDocument = Document.clone(this.customConfigurationDocument);
        configurationDocument.resource.categories[this.category.name] = {
            fields: {},
            hidden: []
        }
        try {
            this.configureAppSaveChangesAndReload(configurationDocument);
            this.activeModal.close();
        } catch { /* stay in modal */ }
    }


    public cancel() {

        this.activeModal.dismiss('cancel');
    }


    public changeCategoryNameInput() {

        // TODO Take language into account, too

        this.categories = set(
            ConfigurationIndex.find(this.configurationIndex, this.categoryName)
                .filter(category => category['parentCategory'].name === this.parentCategory.name)) as any;
        if (this.categories.length > 0) this.category = this.categories[0];
    }


    private async createNewSubcategory(parentCategory: Category, categoryName: string) {

        this.menuService.setContext(MenuContext.CONFIGURATION_EDIT);

        const modalReference: NgbModalRef = this.modalService.open(
            CategoryEditorModalComponent,
            { size: 'lg', backdrop: 'static', keyboard: false }
        );
        modalReference.componentInstance.configureAppSaveChangesAndReload = this.configureAppSaveChangesAndReload;
        modalReference.componentInstance.customConfigurationDocument = this.customConfigurationDocument;
        modalReference.componentInstance.category = {
            name: categoryName,
            label: {},
            defaultLabel: {},
            description: {},
            defaultDescription: {},
            parentCategory: parentCategory
        };
        modalReference.componentInstance.new = true;
        modalReference.componentInstance.initialize();

        try {
            await modalReference.result;
        } catch (err) {
            throw err; // Modal has been canceled
        } finally {
            this.menuService.setContext(MenuContext.DEFAULT);
            AngularUtility.blurActiveElement();
        }
    }


    private async readConfig() {

        try {
            const builtInConfiguration = new BuiltInConfiguration('');
            const config = await this.configReader.read('/Library/Categories.json');
            const languages = await this.configLoader.readDefaultLanguageConfigurations();
            const [categories, configurationIndex] = ConfigurationIndex.create(
                builtInConfiguration.builtInCategories,
                builtInConfiguration.builtInRelations,
                config,
                languages);

            this.configurationIndex = configurationIndex;
            this.categories = categories
                .filter(category => category['parentCategory'].name === this.parentCategory.name) as any;
            if (this.categories.length > 0) this.category = this.categories[0];

        } catch (e) {
            console.error('error while reading config in AddCategoryModalComponent', e);
        }
    }
}
