import {Document, NewDocument, ProjectConfiguration} from 'idai-components-2';
import {ImportStrategy} from './import-strategy';
import {DocumentDatastore} from '../datastore/document-datastore';
import {Validator} from '../model/validator';
import {IdaiFieldFindResult} from '../datastore/core/cached-read-datastore';
import {clone} from '../util/object-util';
import {ImportErrors} from './import-errors';


const removeEmptyStrings = (obj: any) => { Object.keys(obj).forEach((prop) => {
   if (obj[prop] === '') { delete obj[prop] }
    }); return obj; };


/**
 * @author Daniel de Oliveira
 * @author Juliane Watson
 */
export class MeninxFindImportStrategy implements ImportStrategy {


    constructor(private validator: Validator,
                private datastore: DocumentDatastore,
                private projectConfiguration: ProjectConfiguration,
                private username: string) { }


    /**
     * @throws errorWithParams
     */
    public async importDoc(importDoc: NewDocument): Promise<Document> {

        const existingDoc: Document|undefined = await this.getExistingDoc(importDoc.resource.identifier);

        const updateDoc: NewDocument|Document = existingDoc
            ? MeninxFindImportStrategy.mergeInto(existingDoc, importDoc)
            : importDoc;

        MeninxFindImportStrategy.checkTypeOfSherd(importDoc.resource.sherdTypeCheck, updateDoc.resource, importDoc.resource.amount);
        delete updateDoc.resource.amount;
        delete updateDoc.resource.sherdTypeCheck;

        updateDoc.resource = removeEmptyStrings(updateDoc.resource);
        updateDoc.resource.relations['isRecordedIn'] =
            [await this.getIsRecordedInId(importDoc.resource.identifier[0] + '000')];
        updateDoc.resource.relations['liesWithin'] =
            [await this.getLiesWithinId(importDoc.resource.relations['liesWithin'][0])];

        console.log(existingDoc ? 'update' : 'create', updateDoc);

        return existingDoc
            ? await this.datastore.update(updateDoc as Document, this.username)
            : await this.datastore.create(updateDoc, this.username);
    }


    private async getExistingDoc(resourceIdentifier: string) {

        let importDocExistenceFindResult: IdaiFieldFindResult<Document>;
        try {
            importDocExistenceFindResult = await this.datastore.find(
                { constraints: { 'identifier:match': resourceIdentifier } });
        } catch (err) { throw 'no find result obtained' }
        if (importDocExistenceFindResult.documents.length > 1) throw ['More than one doc found for identifier ', resourceIdentifier];

        return importDocExistenceFindResult.documents.length === 1
            ? importDocExistenceFindResult.documents[0]
            : undefined;
    }


    private async getIsRecordedInId(trenchIdentifier: string) {

        try {
            const trench = await this.datastore.find({
                constraints: { 'identifier:match': trenchIdentifier},
                types: ['Trench']});
            return trench.documents[0].resource.id;
        } catch (err) {
            throw [ImportErrors.NO_OPERATION_ASSIGNABLE, trenchIdentifier];
        }
    }


    private async getLiesWithinId(liesWithinIdentifier: string) {

        let liesWithinTargetFindResult: IdaiFieldFindResult<Document>;
        try {
            liesWithinTargetFindResult = await this.datastore.find({
                constraints: { 'identifier:match': liesWithinIdentifier},
                types: [
                    'Feature',
                    'DrillCoreLayer',
                    'Floor',
                    'Grave',
                    'Layer',
                    'Other',
                    'Architecture',
                    'SurveyUnit',
                    'Planum',
                    'Room',
                    'Burial']});
        } catch (err) {
            throw [ImportErrors.NO_FEATURE_ASSIGNABLE, liesWithinIdentifier];
        }

        if (liesWithinTargetFindResult.documents.length > 1) {
            console.error('cannot get liesWithinId for identifier', liesWithinIdentifier);
            throw [ImportErrors.NO_FEATURE_ASSIGNABLE, 'More than one SU found for identifier ' +
                liesWithinTargetFindResult.documents.map(_ => _.resource.identifier).join(' -- ')];
        }

        if (liesWithinTargetFindResult.documents.length === 0) {
            throw [ImportErrors.NO_FEATURE_ASSIGNABLE, 'No target SU found for identifier ' + liesWithinIdentifier];
        }

        return liesWithinTargetFindResult.documents[0].resource.id;
    }


    private static mergeInto(mergeTarget: Document|NewDocument, mergeSource: NewDocument) {

        const mergedDoc = clone(mergeTarget);

        if (mergeSource.resource.shortDescription.length > 0) mergedDoc.resource.shortDescription = mergeSource.resource.shortDescription;
        if (mergeSource.resource.vesselForm.length > 0) mergedDoc.resource.vesselForm = mergeSource.resource.vesselForm;
        if (mergeSource.resource.typeNumber.length > 0) mergedDoc.resource.typeNumber = mergeSource.resource.typeNumber;
        if (mergeSource.resource.type.length > 0) mergedDoc.resource.type = mergeSource.resource.type;
        if (mergeSource.resource.decorationTechnique.length > 0) mergedDoc.resource.decorationTechnique = mergeSource.resource.decorationTechnique;
        if (mergeSource.resource.comment.length > 0) mergedDoc.resource.comment = mergeSource.resource.comment;
        if (mergeSource.resource.provenance.length > 0) mergedDoc.resource.provenance = mergeSource.resource.provenance;

        return mergedDoc;
    }


    private static checkTypeOfSherd(typeSherd: any, obj: any, amount: number) {

        if (typeSherd === 'B') {
            obj.amountSherdsRim = amount;
        } else if (typeSherd === 'C') {
            obj.amountSherdsRimBase = amount;
        } else if (typeSherd === 'P') {
            obj.amountSherdsWall = amount;
        } else if (typeSherd === 'F') {
            obj.amountSherdsBase = amount;
        } else if (typeSherd === 'A') {
            obj.amountSherdsHandles = amount;
        }
    }
}
