import {Component} from '@angular/core';
import {NgbActiveModal, NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {includedIn, isNot} from 'tsfun';
import {Document, FieldDocument, ImageDocument} from 'idai-components-2';
import {ConflictDeletedModalComponent} from './dialog/conflict-deleted-modal.component';
import {clone} from '../../core/util/object-util';
import {EditSaveDialogComponent} from './dialog/edit-save-dialog.component';
import {DocumentDatastore} from '../../core/datastore/document-datastore';
import {ProjectCategoriesUtility} from '../../core/configuration/project-categories-utility';
import {M} from '../messages/m';
import {MessagesConversion} from './messages-conversion';
import {Loading} from '../widgets/loading';
import {DuplicateModalComponent} from './dialog/duplicate-modal.component';
import {FieldDefinition} from '../../core/configuration/model/field-definition';
import {ProjectConfiguration} from '../../core/configuration/project-configuration';
import {DocumentHolder} from '../../core/docedit/document-holder';
import {DoceditErrors} from '../../core/docedit/docedit-errors';
import {Group, Groups} from '../../core/configuration/model/group';
import {Messages} from '../messages/messages';
import {DatastoreErrors} from '../../core/datastore/model/datastore-errors';


@Component({
    selector: 'detail-modal',
    templateUrl: './docedit.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
        '(window:keyup)': 'onKeyUp($event)',
    }
})
/**
 * Uses the document edit forms of idai-components-2 and adds styling
 * and navigation items like save and back buttons and modals
 * including the relevant functionality like validation,
 * persistence handling, conflict resolution etc.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class DoceditComponent {

    public activeGroup: string = Groups.STEM;
    public subModalOpened: boolean = false;
    public fieldDefinitions: Array<FieldDefinition>|undefined;
    public groups: Array<Group>|undefined;

    public parentLabel: string|undefined = undefined;
    private showDoceditImagesTab: boolean = false;
    public operationInProgress: 'save'|'duplicate'|'none' = 'none';
    private escapeKeyPressed: boolean = false;


    constructor(
        public activeModal: NgbActiveModal,
        public documentHolder: DocumentHolder,
        private messages: Messages,
        private modalService: NgbModal,
        private datastore: DocumentDatastore,
        private projectCategories: ProjectCategoriesUtility,
        public projectConfiguration: ProjectConfiguration,
        private loading: Loading,
        private i18n: I18n) {
    }

    public isChanged = () => this.documentHolder.isChanged();

    public isLoading = () => this.loading.isLoading('docedit');

    public getFieldDefinitionLabel: (_: string) => string;


    public async onKeyDown(event: KeyboardEvent) {

        switch(event.key) {
            case 'Escape':
                await this.onEscapeKeyDown(event);
                break;
            case 's':
                if (event.ctrlKey || event.metaKey) await this.performQuickSave();
                break;
            case 'd':
                if (event.ctrlKey || event.metaKey) await this.openDuplicateModal();
                break;
        }
    }


    public onKeyUp(event: KeyboardEvent) {

        if (event.key === 'Escape') this.escapeKeyPressed = false;
    }


    public showDuplicateButton(): boolean {

        return this.documentHolder.clonedDocument !== undefined
            && this.documentHolder.clonedDocument.resource.category !== 'Project'
            && !this.projectConfiguration.isSubcategory(
                this.documentHolder.clonedDocument.resource.category, 'Image'
            );
    }


    public async setDocument(document: FieldDocument|ImageDocument) {

        this.documentHolder.setDocument(document);

        this.showDoceditImagesTab
            = !this.projectConfiguration.isSubcategory(document.resource.category, 'Image');

        this.getFieldDefinitionLabel = (fieldName: string) =>
            this.projectConfiguration.getFieldDefinitionLabel(document.resource.category, fieldName);

        this.parentLabel = await this.fetchParentLabel(document);
        this.updateFieldDefinitions();
    }


    public changeCategory(newCategory: string) {

        const {invalidFields, invalidRelations} = this.documentHolder.changeCategories(newCategory);
        this.showCategoryChangeFieldsWarning(invalidFields);
        this.showCategoryChangeRelationsWarning(invalidRelations);
        this.updateFieldDefinitions();
    }


    public async cancel() {

        if (this.documentHolder.isChanged()) {
            await this.openEditSaveDialogModal();
        } else {
            this.activeModal.dismiss('cancel');
        }
    }


    public async openDuplicateModal() {

        this.subModalOpened = true;
        let numberOfDuplicates: number|undefined;

        try {
            const modalRef: NgbModalRef = this.modalService.open(
                DuplicateModalComponent, { keyboard: false }
            );
            modalRef.componentInstance.initialize(!this.documentHolder.clonedDocument.resource.id);
            numberOfDuplicates = await modalRef.result;
        } catch(err) {
            // DuplicateModal has been canceled
        } finally {
            this.subModalOpened = false;
        }

        if (numberOfDuplicates !== undefined) await this.save(numberOfDuplicates);
    }


    public async save(numberOfDuplicates?: number) {

        this.operationInProgress = numberOfDuplicates ? 'duplicate' : 'save';
        this.loading.start('docedit');

        const documentBeforeSave: Document = clone(this.documentHolder.clonedDocument);

        try {
            const documentAfterSave: Document = numberOfDuplicates
                ? await this.documentHolder.duplicate(numberOfDuplicates)
                : await this.documentHolder.save();
            await this.handleSaveSuccess(documentBeforeSave, documentAfterSave, this.operationInProgress);
        } catch (errorWithParams) {
            await this.handleSaveError(
                errorWithParams.length > 0 && errorWithParams[0] === DoceditErrors.NOT_FOUND
                    ? M.DATASTORE_ERROR_NOT_FOUND
                    : errorWithParams);
        } finally {
            this.loading.stop();
            this.operationInProgress = 'none';
        }
    }


    private updateFieldDefinitions() {

        this.fieldDefinitions = this.projectConfiguration.getFieldDefinitions(
            this.documentHolder.clonedDocument.resource.category
        );
        this.groups = (this.projectConfiguration.getCategory(this.documentHolder.clonedDocument.resource.category)).groups;
    }


    private async handleSaveSuccess(documentBeforeSave: Document, documentAfterSave: Document,
                                    operation: 'save'|'duplicate') {

        try {
            if (documentAfterSave.resource.category !== 'Project' // because it could have been solved automatically. if not we just accept that it gots shown in the taskbar as conflict then
                    && DoceditComponent.detectSaveConflicts(documentBeforeSave, documentAfterSave)) {
                this.handleSaveConflict(documentAfterSave);
            } else {
                await this.closeModalAfterSave(documentAfterSave.resource.id, operation);
            }
        } catch (msgWithParams) {
            this.messages.add(msgWithParams);
        }
    }


    private async handleSaveError(errorWithParams: any) {

        if (errorWithParams[0] == DatastoreErrors.DOCUMENT_NOT_FOUND) {
            await this.handleDeletedConflict();
            return undefined;
        }

        this.messages.add(errorWithParams.length > 0
            ? MessagesConversion.convertMessage(errorWithParams, this.projectConfiguration)
            : [M.DOCEDIT_ERROR_SAVE]);
    }


    private async onEscapeKeyDown(event: KeyboardEvent) {

        if (!this.subModalOpened && !this.escapeKeyPressed) {
            this.escapeKeyPressed = true;
            if (event.srcElement) (event.srcElement as HTMLElement).blur();
            await this.cancel();
        } else {
            this.escapeKeyPressed = true;
        }
    }


    private async performQuickSave() {

        if (this.isChanged() && !this.isLoading() && !this.subModalOpened) {
            await this.save();
        }
    }


    private async fetchParentLabel(document: FieldDocument|ImageDocument) {

        return !document.resource.relations.isRecordedIn
                || document.resource.relations.isRecordedIn.length === 0
            ? this.i18n({ id: 'docedit.parentLabel.project', value: 'Projekt' })
            : document.resource.id
                ? undefined
                : (await this.datastore.get(
                        document.resource.relations['liesWithin']
                            ? document.resource.relations['liesWithin'][0]
                            : document.resource.relations['isRecordedIn'][0]
                        )
                ).resource.identifier;
    }


    private async openEditSaveDialogModal() {

        this.subModalOpened = true;

        try {
            const modalRef: NgbModalRef = this.modalService.open(
                EditSaveDialogComponent, { keyboard: false }
            );
            modalRef.componentInstance.escapeKeyPressed = this.escapeKeyPressed;

            const result: string = await modalRef.result;

            if (result === 'save') {
                await this.save();
            } else if (result === 'discard') {
                this.activeModal.dismiss('discard');
            }
        } catch(err) {
            // EditSaveDialogModal has been canceled
        } finally {
            this.subModalOpened = false;
        }
    }


    private showCategoryChangeFieldsWarning(invalidFields: string[]) {

        if (invalidFields.length > 0) {
            this.messages.add([
                M.DOCEDIT_WARNING_CATEGORY_CHANGE_FIELDS,
                invalidFields
                    .map(this.getFieldDefinitionLabel)
                    .reduce((acc, fieldLabel) => acc + ', ' + fieldLabel)
            ]);
        }
    }


    private showCategoryChangeRelationsWarning(invalidRelations: string[]) {

        if (invalidRelations.length > 0) {
            this.messages.add([
                M.DOCEDIT_WARNING_CATEGORY_CHANGE_RELATIONS,
                invalidRelations
                    .map((relationName: string) => this.projectConfiguration.getRelationDefinitionLabel(relationName))
                    .reduce((acc, relationLabel) => acc + ', ' + relationLabel)
            ]);
        }
    }


    private async closeModalAfterSave(resourceId: string, operation: 'save'|'duplicate'): Promise<any> {

        this.activeModal.close({
            document: (await this.datastore.get(resourceId))
        });
    }


    private handleSaveConflict(documentAfterSave: Document) {

        this.documentHolder.setDocument(documentAfterSave);
        this.activeGroup = 'conflicts';
        this.messages.add([M.DOCEDIT_WARNING_SAVE_CONFLICT]);
    }


    private async handleDeletedConflict() {

        this.subModalOpened = true;

        try {
            await this.modalService.open(
                ConflictDeletedModalComponent,
                { windowClass: 'conflict-deleted-modal', keyboard: false }
            ).result;
        } catch(err) {
            // ConflictDeletedModal has been canceled
        } finally {
            this.documentHolder.makeClonedDocAppearNew();
            this.subModalOpened = false;
        }
    }


    private static detectSaveConflicts(documentBeforeSave: Document, documentAfterSave: Document): boolean {

        const conflictsBeforeSave: string[] = documentBeforeSave._conflicts as string[];
        const conflictsAfterSave: string[] = documentAfterSave._conflicts as string[];

        if (!conflictsBeforeSave && conflictsAfterSave && conflictsAfterSave.length >= 1) return true;
        if (!conflictsAfterSave) return false;

        return conflictsAfterSave.find(isNot(includedIn(conflictsBeforeSave))) !== undefined;
    }
}
