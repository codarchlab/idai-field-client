import {Injectable} from '@angular/core';
import {flow, includedIn, isEmpty, isNot, equal} from 'tsfun';
import {Document, NewDocument, ProjectConfiguration, IdaiType, FieldDefinition} from 'idai-components-2';
import {Validator} from '../../core/model/validator';
import {PersistenceManager} from '../../core/model/persistence-manager';
import {Imagestore} from '../../core/imagestore/imagestore';
import {DocumentDatastore} from '../../core/datastore/document-datastore';
import {Validations} from '../../core/model/validations';
import {TypeUtility} from '../../core/model/type-utility';
import {UsernameProvider} from '../../core/settings/username-provider';
import {clone} from '../../core/util/object-util';
import {M} from '../m';
import {DuplicationUtil} from './duplication-util';


@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class DocumentHolder {

    /**
     * These are the revisions (of the cloned document as long as not saved)
     * that are conflict resolved. They will be be removed from document
     * as soon as it gets saved.
     */
    public inspectedRevisions: Array<Document>;

    /**
     * Holds a cloned version of the <code>document</code> set via {@link DocumentHolder#setDocument}.
     * On clonedDocument changes can be made which can be either saved or discarded later.
     */
    public clonedDocument: Document;

    private oldVersion: Document;


    constructor(
        private projectConfiguration: ProjectConfiguration,
        private persistenceManager: PersistenceManager,
        private validator: Validator,
        private imagestore: Imagestore,
        private typeUtility: TypeUtility,
        private usernameProvider: UsernameProvider,
        private datastore: DocumentDatastore) {
    }


    public isChanged(): boolean {

        if (!this.clonedDocument) return false;

        return (this.inspectedRevisions.length > 0 || !equal(this.clonedDocument.resource)(this.oldVersion.resource));
    }


    public changeType(newType: string) {

        this.clonedDocument.resource.type = newType;

        return {
            invalidFields: this.validateFields(),
            invalidRelations: this.validateRelationFields()
        }
    }


    public setDocument(document: Document) {

        this.oldVersion = clone(document);
        this.clonedDocument = clone(document);
        this.inspectedRevisions = [];
    };


    public async save(): Promise<Document> {

        await this.performAssertions();
        this.convertStringsToNumbers();

        const savedDocument: Document = await this.persistenceManager.persist(
            this.cleanup(this.clonedDocument),
            this.usernameProvider.getUsername(),
            this.oldVersion,
            this.inspectedRevisions
        );

        return this.fetchLatestRevision(savedDocument.resource.id);
    }


    public async duplicate(numberOfDuplicates: number): Promise<Document> {

        const documentAfterSave: Document = await this.save();
        const template: NewDocument = DuplicationUtil.createTemplate(documentAfterSave);

        let { baseIdentifier, identifierNumber, minDigits } =
            DuplicationUtil.splitIdentifier(template.resource.identifier);

        for (let i = 0; i < numberOfDuplicates; i++) {
            identifierNumber = await DuplicationUtil.setUniqueIdentifierForDuplicate(
                template, baseIdentifier, identifierNumber, minDigits, this.validator
            );

            await this.persistenceManager.persist(
                template,
                this.usernameProvider.getUsername(),
                this.oldVersion,
                []
            );
        }

        return documentAfterSave;
    }


    public makeClonedDocAppearNew() {

        // make the doc appear 'new' ...
        delete this.clonedDocument.resource.id; // ... for persistenceManager
        delete (this.clonedDocument as any)['_id'];      // ... for pouchdbdatastore
        delete (this.clonedDocument as any)['_rev'];
    }


    private async performAssertions() {

        await this.validator.assertIdentifierIsUnique(this.clonedDocument);
        this.validator.assertHasIsRecordedIn(this.clonedDocument);
        Validations.assertNoFieldsMissing(this.clonedDocument, this.projectConfiguration);
        Validations.assertCorrectnessOfNumericalValues(this.clonedDocument, this.projectConfiguration);
        Validations.assertUsageOfDotAsDecimalSeparator(this.clonedDocument, this.projectConfiguration);
        Validations.assertCorrectnessOfDatingValues(this.clonedDocument, this.projectConfiguration);
        Validations.assertCorrectnessOfDimensionValues(this.clonedDocument, this.projectConfiguration);
        await this.validator.assertIsRecordedInTargetsExist(this.clonedDocument);
        await this.validator.assertGeometryIsValid(this.clonedDocument);
    }


    private convertStringsToNumbers() {

        const type: IdaiType = this.projectConfiguration.getTypesMap()[this.clonedDocument.resource.type];

        for (let fieldName in this.clonedDocument.resource) {
            const field: FieldDefinition|undefined
                = type.fields.find(field => field.name === fieldName);
            if (!field) continue;

            if (field.inputType === 'unsignedInt') {
                this.clonedDocument.resource[fieldName] = parseInt(this.clonedDocument.resource[fieldName]);
            } else if (field.inputType === 'float' || field.inputType === 'unsignedFloat') {
                this.clonedDocument.resource[fieldName] = parseFloat(this.clonedDocument.resource[fieldName]);
            }
        }
    }


    private cleanup(document: Document): Document {

        return flow(
            document,
            Document.removeRelations(this.validateRelationFields()),
            Document.removeRelations(this.getEmptyRelationFields()),
            Document.removeFields(this.validateFields()),
            Document.removeFields(this.getEmptyFields())
        )
    }


    private async fetchLatestRevision(id: string): Promise<Document> {

        try {
            return await this.datastore.get(id, { skipCache: true });
        } catch (e) {
            throw [M.DATASTORE_ERROR_NOT_FOUND];
        }
    }


    private validateFields(): Array<string> {

        return this.validateButKeepInvalidOldVersionFields(Validations.validateDefinedFields);
    }


    private validateRelationFields(): Array<string> {

        return this.validateButKeepInvalidOldVersionFields(Validations.validateDefinedRelations);
    }


    private validateButKeepInvalidOldVersionFields(validate: (_: any, __: any) => Array<string>): Array<string> {

        const validationResultClonedVersion = validate(this.clonedDocument.resource, this.projectConfiguration);
        const validationResultOldVersion = validate(this.oldVersion.resource, this.projectConfiguration);

        return validationResultClonedVersion.filter(isNot(includedIn(validationResultOldVersion)));
    }


    private getEmptyRelationFields(): Array<string> {

        return Object
            .keys(this.clonedDocument.resource.relations)
            .filter(relationName => isEmpty(this.clonedDocument.resource.relations[relationName]));
    }


    private getEmptyFields(): Array<string> {

        return Object.keys(this.clonedDocument.resource)
            .filter(_ =>
                (typeof(this.clonedDocument.resource[_]) === 'string')
                && this.clonedDocument.resource[_].length === 0
            );
    }
}