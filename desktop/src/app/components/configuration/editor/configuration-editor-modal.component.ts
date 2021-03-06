import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { clone } from 'tsfun';
import { ConfigurationDocument, I18nString, Document, Category, CustomCategoryDefinition } from 'idai-field-core';
import { MenuContext, MenuService } from '../../menu-service';
import { Messages } from '../../messages/messages';
import { EditSaveDialogComponent } from '../../widgets/edit-save-dialog.component';
import { ErrWithParams } from '../../../core/import/import/import-documents';


/**
 * @author Thomas Kleinke
 */
export abstract class ConfigurationEditorModalComponent {

    public customConfigurationDocument: ConfigurationDocument;
    public category: Category;
    public new: boolean = false;

    public label: I18nString;
    public description?: I18nString;
    public clonedLabel: I18nString;
    public clonedDescription?: I18nString;
    public clonedConfigurationDocument: ConfigurationDocument;

    public saveAndReload: (configurationDocument: ConfigurationDocument) =>
        Promise<ErrWithParams|undefined>;

    public saving: boolean;
    public escapeKeyPressed: boolean = false;

    protected abstract changeMessage: string;


    constructor(public activeModal: NgbActiveModal,
                private modalService: NgbModal,
                private menuService: MenuService,
                private messages: Messages) {}


    public getClonedLanguageConfigurations = () => this.clonedConfigurationDocument.resource.languages;


    public getClonedCategoryDefinition(): CustomCategoryDefinition {

        return this.clonedConfigurationDocument.resource
            .categories[this.category.libraryId ?? this.category.name];
    }


    public getCustomCategoryDefinition(): CustomCategoryDefinition {

        return this.customConfigurationDocument.resource
            .categories[this.category.libraryId ?? this.category.name];
    }


    public async onKeyDown(event: KeyboardEvent) {

        switch(event.key) {
            case 'Escape':
                await this.onEscapeKeyDown();
                break;
            case 's':
                if (event.ctrlKey || event.metaKey) await this.performQuickSave();
                break;
        }
    }


    public onKeyUp(event: KeyboardEvent) {

        if (event.key === 'Escape') this.escapeKeyPressed = false;
    }


    public initialize() {

        this.clonedConfigurationDocument = Document.clone(this.customConfigurationDocument);

        this.label = this.getLabel();
        this.description = this.getDescription();

        this.clonedLabel = clone(this.label);
        if (this.description) this.clonedDescription = clone(this.description);

        this.saving = false;
    }


    public async save() {

        this.saving = true;
        this.updateCustomLanguageConfigurations();

        const optionalErrWithParams =
            await this.saveAndReload(
                this.clonedConfigurationDocument);

        if (optionalErrWithParams) {
            // TODO Show user-readable error messages
            this.messages.add(optionalErrWithParams);
            this.saving = false;
        } else {
            this.activeModal.close();
        }
    }


    public cancel() {

        if (this.isChanged()) {
            this.openEditSaveDialogModal();
        } else {
            this.activeModal.dismiss('cancel');
        }
    }


    public abstract isChanged(): boolean;


    private async onEscapeKeyDown() {

        if (this.menuService.getContext() === MenuContext.CONFIGURATION_EDIT && !this.escapeKeyPressed) {
            if (event.srcElement) (event.srcElement as HTMLElement).blur();
            await this.cancel();
        } else {
            this.escapeKeyPressed = true;
        }
    }


    private async performQuickSave() {

        if (this.isChanged() && !this.saving && this.menuService.getContext() === MenuContext.CONFIGURATION_EDIT) {
            await this.save();
        }
    }


    private async openEditSaveDialogModal() {

        this.menuService.setContext(MenuContext.MODAL);

        try {
            const modalRef: NgbModalRef = this.modalService.open(
                EditSaveDialogComponent, { keyboard: false }
            );
            modalRef.componentInstance.changeMessage = this.changeMessage;
            modalRef.componentInstance.escapeKeyPressed = this.escapeKeyPressed;

            const result: string = await modalRef.result;

            if (result === 'save') {
                await this.save();
            } else if (result === 'discard') {
                this.activeModal.dismiss('cancel');
            }
        } catch(err) {
            // EditSaveDialogModal has been canceled
        } finally {
            this.menuService.setContext(MenuContext.CONFIGURATION_EDIT);
        }
    }


    protected abstract getLabel(): I18nString;

    protected abstract getDescription(): I18nString|undefined;

    protected abstract updateCustomLanguageConfigurations();
}
