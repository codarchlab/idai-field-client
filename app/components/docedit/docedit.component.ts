import {Component} from '@angular/core';
import {NgbActiveModal, NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {includedIn, isNot} from 'tsfun';
import {DatastoreErrors, Document, FieldDocument, ImageDocument, Messages,
    ProjectConfiguration, FieldDefinition, RelationDefinition} from 'idai-components-2';
import {ConflictDeletedModalComponent} from './dialog/conflict-deleted-modal.component';
import {clone} from '../../core/util/object-util';
import {EditSaveDialogComponent} from './dialog/edit-save-dialog.component';
import {DocumentDatastore} from '../../core/datastore/document-datastore';
import {DocumentHolder} from './document-holder';
import {TypeUtility} from '../../core/model/type-utility';
import {M} from '../m';
import {MessagesConversion} from './messages-conversion';
import {Loading} from '../../widgets/loading';
import {DuplicateModalComponent} from './dialog/duplicate-modal.component';


@Component({
    selector: 'detail-modal',
    moduleId: module.id,
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

    public activeGroup: string = 'stem';
    public subModalOpened: boolean = false;
    public fieldDefinitions: Array<FieldDefinition>|undefined;
    public relationDefinitions: Array<RelationDefinition>|undefined;

    private parentLabel: string|undefined = undefined;
    private showDoceditMediaTab: boolean = false;
    private operationInProgress: 'save'|'duplicate'|'none' = 'none';
    private escapeKeyPressed: boolean = false;


    constructor(
        public activeModal: NgbActiveModal,
        public documentHolder: DocumentHolder,
        private messages: Messages,
        private modalService: NgbModal,
        private datastore: DocumentDatastore,
        private typeUtility: TypeUtility,
        public projectConfiguration: ProjectConfiguration,
        private loading: Loading,
        private i18n: I18n) {
    }

    public isChanged = () => this.documentHolder.isChanged();

    public isLoading = () => this.loading.isLoading();

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
            && this.documentHolder.clonedDocument.resource.type !== 'Project'
            && !this.typeUtility.isSubtype(
                this.documentHolder.clonedDocument.resource.type, 'Image'
            );
    }


    public async setDocument(document: FieldDocument|ImageDocument) {

        this.documentHolder.setDocument(document);
        this.showDoceditMediaTab = !this.typeUtility.getMediaTypeNames().includes(document.resource.type);

        this.getFieldDefinitionLabel = (fieldName: string) =>
            this.projectConfiguration.getFieldDefinitionLabel(document.resource.type, fieldName);

        this.parentLabel = await this.fetchParentLabel(document);
        this.updateFieldDefinitions();
        this.updateRelationDefinitions();
    }


    public changeType(newType: string) {

        const {invalidFields, invalidRelations} = this.documentHolder.changeType(newType);
        this.showTypeChangeFieldsWarning(invalidFields);
        this.showTypeChangeRelationsWarning(invalidRelations);
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
            await this.handleSaveError(errorWithParams);
        } finally {
            this.loading.stop();
            this.operationInProgress = 'none';
        }
    }


    private updateFieldDefinitions() {

        this.fieldDefinitions
            = this.projectConfiguration.getFieldDefinitions(this.documentHolder.clonedDocument.resource.type);
    }


    private updateRelationDefinitions() {

        this.relationDefinitions = this.projectConfiguration.getRelationDefinitions(
            this.documentHolder.clonedDocument.resource.type, false, 'editable');
    }


    private async handleSaveSuccess(documentBeforeSave: Document, documentAfterSave: Document,
                                    operation: 'save'|'duplicate') {

        try {
            if (DoceditComponent.detectSaveConflicts(documentBeforeSave, documentAfterSave)) {
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


    private showTypeChangeFieldsWarning(invalidFields: string[]) {

        if (invalidFields.length > 0) {
            this.messages.add([
                M.DOCEDIT_WARNING_TYPE_CHANGE_FIELDS,
                invalidFields
                    .map(this.getFieldDefinitionLabel)
                    .reduce((acc, fieldLabel) => acc + ', ' + fieldLabel)
            ]);
        }
    }


    private showTypeChangeRelationsWarning(invalidRelations: string[]) {

        if (invalidRelations.length > 0) {
            this.messages.add([
                M.DOCEDIT_WARNING_TYPE_CHANGE_RELATIONS,
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
        this.messages.add(operation === 'save'
            ? [M.DOCEDIT_SUCCESS_SAVE]
            : [M.DOCEDIT_SUCCESS_DUPLICATE]
        );
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

        const conflictsBeforeSave: string[] = (documentBeforeSave as any)['_conflicts'];
        const conflictsAfterSave: string[] =  (documentAfterSave as any)['_conflicts'];

        if (!conflictsBeforeSave && conflictsAfterSave && conflictsAfterSave.length >= 1) return true;
        if (!conflictsAfterSave) return false;

        return conflictsAfterSave.find(isNot(includedIn(conflictsBeforeSave))) !== undefined;
    }
}


const doNothing = () => {};