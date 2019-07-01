import {ImportValidator} from './import-validator';
import {asyncForEach, asyncMap, duplicates, equal, hasNot, includedIn, isArray,
    isDefined, isNot, isUndefinedOrEmpty, not, to, undefinedOrEmpty, isnt} from 'tsfun';
import {ImportErrors as E} from './import-errors';
import {Relations, NewDocument, Document} from 'idai-components-2';
import {RelationsCompleter} from './relations-completer';
import {DocumentMerge} from './document-merge';
import {clone} from '../../util/object-util';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module DefaultImportCalc {

    type Either<T1, T2> = [T1, undefined]|[undefined, T2];

    type Get = (resourceId: string) => Promise<Document>;
    type Find = (identifier: string) => Promise<Document|undefined>;
    type GenerateId = () => string;
    type GetInverseRelation = (propertyName: string) => string|undefined;

    type Id = string;
    type IdMap = { [id: string]: Document };
    type Identifier = string;
    type IdentifierMap = { [identifier: string]: string };

    const RECORDED_IN = 'isRecordedIn';
    const LIES_WITHIN = 'liesWithin';
    const INCLUDES = 'includes';
    const PARENT = 'isChildOf';
    const RESOURCE_IDENTIFIER = 'resource.identifier';
    const RESOURCE_ID = 'resource.id';

    const forbiddenRelations = [LIES_WITHIN, INCLUDES, RECORDED_IN];


    export function build(validator: ImportValidator,
                          operationTypeNames: string[],
                          generateId: GenerateId,
                          find: Find,
                          get: Get,
                          getInverseRelation: GetInverseRelation,
                          mergeMode: boolean,
                          allowOverwriteRelationsInMergeMode: boolean,
                          mainTypeDocumentId: Id,
                          useIdentifiersInRelations: boolean) {

        if (mainTypeDocumentId && mergeMode) {
            throw 'FATAL ERROR - illegal argument combination - mainTypeDocumentId and mergeIfExists must not be both truthy';
        }

        return async function process(documents: Array<Document>)
            : Promise<[Array<Document>, Array<Document>, Array<string>|undefined]> {

            try {
                const documentsForUpdate = await processDocuments(
                    documents,
                    validator,
                    mergeMode, allowOverwriteRelationsInMergeMode, useIdentifiersInRelations,
                    find, get, generateId);

                const relatedDocuments = await processRelations(
                    documentsForUpdate,
                    validator, operationTypeNames,
                    mergeMode, allowOverwriteRelationsInMergeMode,
                    getInverseRelation, get,
                    mainTypeDocumentId);

                return [documentsForUpdate, relatedDocuments, undefined];
            } catch (errWithParams) {
                return [[],[], errWithParams];
            }
        }
    }


    /**
     * @returns clones of the documents with their properties adjusted
     */
    async function processDocuments(documents: Array<Document>,
                                    validator: ImportValidator,
                                    mergeMode: boolean,
                                    allowOverwriteRelationsInMergeMode: boolean,
                                    useIdentifiersInRelations: boolean,
                                    find: Find,
                                    get: Get,
                                    generateId: GenerateId): Promise<Array<Document>> {


        async function preprocessAndValidateRelations(document: Document): Promise<Document> {

            const relations = document.resource.relations;
            if (!relations) return document;

            if (!mergeMode || allowOverwriteRelationsInMergeMode) {
                const foundForbiddenRelations = Object.keys(document.resource.relations)
                    .filter(includedIn(forbiddenRelations))
                    .join(', ');
                if (foundForbiddenRelations) throw [E.INVALID_RELATIONS, document.resource.type, foundForbiddenRelations];

                for (let name of Object.keys(document.resource.relations)) {
                    if (name === PARENT) continue;
                    if (not(isArray)(relations[name])) throw [E.MUST_BE_ARRAY, document.resource.identifier];
                }
                if (isArray(relations[PARENT])) throw [E.PARENT_MUST_NOT_BE_ARRAY, document.resource.identifier];
                if (relations[PARENT]) (relations[LIES_WITHIN] = [relations[PARENT] as any]) && delete relations[PARENT];
            }

            if ((!mergeMode || allowOverwriteRelationsInMergeMode)  && useIdentifiersInRelations) {

                if (useIdentifiersInRelations) {
                    removeSelfReferencingIdentifiers(relations, document.resource.identifier);
                    await rewriteIdentifiersInRelations(relations, find, identifierMap);
                }
            } else if (!mergeMode) {
                await assertNoMissingRelationTargets(relations, get);
            }
            return document;
        }


        const dups = duplicates(documents.map(to(RESOURCE_IDENTIFIER)));
        if (dups.length > 0) throw [E.DUPLICATE_IDENTIFIER, dups[0]];
        const identifierMap: IdentifierMap = mergeMode ? {} : assignIds(documents, generateId);

        return await asyncMap(async (document: Document) => {
            let _ = clone(document); 
            _ = await preprocessAndValidateRelations(_);
            _ = await mergeOrUseAsIs(_, find, mergeMode, allowOverwriteRelationsInMergeMode);
            return validate(_, validator, mergeMode);
        })(documents);
    }


    async function processRelations(documents: Array<Document>,
                                    validator: ImportValidator,
                                    operationTypeNames: string[],
                                    mergeMode: boolean,
                                    allowOverwriteRelationsInMergeMode: boolean,
                                    getInverseRelation: GetInverseRelation,
                                    get: Get,
                                    mainTypeDocumentId: Id) {

        if (!mergeMode) await prepareIsRecordedInRelation(documents, validator, mainTypeDocumentId);
        await replaceTopLevelLiesWithins(documents, operationTypeNames, get, mainTypeDocumentId);
        await inferRecordedIns(documents, operationTypeNames, get, mainTypeDocumentId);

        return !mergeMode || allowOverwriteRelationsInMergeMode
            ? await RelationsCompleter.completeInverseRelations(
                documents,
                get, getInverseRelation,
                mergeMode)
            : [];
    }


    async function replaceTopLevelLiesWithins(documents: Array<Document>,
                                              operationTypeNames: string[],
                                              get: Get,
                                              mainTypeDocumentId: Id) {

        for (let document of documents) {
            const relations = document.resource.relations;
            if (!relations || !relations[LIES_WITHIN]) continue;

            let liesWithinTarget = undefined;
            try { liesWithinTarget = await get(relations[LIES_WITHIN][0]) } catch {}
            if (!liesWithinTarget || !operationTypeNames.includes(liesWithinTarget.resource.type)) continue;

            if (mainTypeDocumentId) throw [E.PARENT_ASSIGNMENT_TO_OPERATIONS_NOT_ALLOWED];
            relations[RECORDED_IN] = relations[LIES_WITHIN];
            delete relations[LIES_WITHIN];
        }
    }


    async function inferRecordedIns(documents: Array<Document>,
                                    operationTypeNames: string[],
                                    get: Get,
                                    mainTypeDocumentId: Id) {

        const idMap = documents.reduce((tmpMap, document: Document) => {
                tmpMap[document.resource.id] = document;
                return tmpMap;
            },
            {} as IdMap);


        async function getRecordedInFromImportDocument(liesWithinTargetInImport: any) {
            if (liesWithinTargetInImport[0]) return liesWithinTargetInImport[0];

            const target = liesWithinTargetInImport[1] as Document;
            if (isNot(undefinedOrEmpty)((target.resource.relations[LIES_WITHIN]))) return determineRecordedInValueFor(target);
        }


        async function getRecordedInFromExistingDocument(targetId: Id) {

            try {
                const got = await get(targetId);
                return  operationTypeNames.includes(got.resource.type)
                    ? got.resource.id
                    : got.resource.relations[RECORDED_IN][0];
            } catch { console.log("FATAL - not found") } // should have been caught earlier, in processDocuments
        }


        async function determineRecordedInValueFor(document: Document): Promise<string|undefined> {

            const relations = document.resource.relations;
            if (!relations || isUndefinedOrEmpty(relations[LIES_WITHIN])) return;

            const liesWithinTargetInImport = searchInImport(relations[LIES_WITHIN][0], idMap, operationTypeNames);
            return liesWithinTargetInImport
                ? getRecordedInFromImportDocument(liesWithinTargetInImport)
                : getRecordedInFromExistingDocument(relations[LIES_WITHIN][0]);
        }


        for (let document of documents) {
            const relations = document.resource.relations;

            const _ = await determineRecordedInValueFor(document);
            assertNoRecordedInMismatch(document, _, mainTypeDocumentId);

            if (_) relations[RECORDED_IN] = [_];
            if (relations && equal(relations[RECORDED_IN])(relations[LIES_WITHIN])) {
                delete relations[LIES_WITHIN];
            }
        }
    }


    function assertNoRecordedInMismatch(document: Document, compare: string|undefined, mainTypeDocumentId: Id) {

        const relations = document.resource.relations;
        if (mainTypeDocumentId
            && isNot(undefinedOrEmpty)(relations[RECORDED_IN])
            && relations[RECORDED_IN][0] !== compare
            && isDefined(compare)) {
            throw [E.LIES_WITHIN_TARGET_NOT_MATCHES_ON_IS_RECORDED_IN, document.resource.identifier];
        }
    }


    async function rewriteIdentifiersInRelations(relations: Relations,
                                                 find: Find,
                                                 identifierMap: IdentifierMap): Promise<void> {

        return iterateRelationsInImport(relations, async (relation: string, i: number, identifier: Identifier) => {
            if (identifierMap[identifier]) {
                relations[relation][i] = identifierMap[identifier];
            } else {
                const _ = await find(identifier);
                if (!_) throw [E.MISSING_RELATION_TARGET, identifier];
                relations[relation][i] = _.resource.id;
            }
        });
    }


    async function assertNoMissingRelationTargets(relations: Relations,
                                                  get: Get): Promise<void> {

        return iterateRelationsInImport(relations, async (relation: string, i: number, id: Id) => {
            try { await get(id) }
            catch { throw [E.MISSING_RELATION_TARGET, id] }
        });
    }


    async function iterateRelationsInImport(
        relations: Relations,
        asyncIterationFunction: (relation: string, i: number, idOrIdentifier: Id|Identifier) => Promise<void>): Promise<void> {

        for (let relation of Object.keys(relations)) {
            await asyncForEach((idOrIdentifier: string, i) =>
                asyncIterationFunction(relation, i, idOrIdentifier))(relations[relation]);
        }
    }
    

    function validate(document: Document, validator: ImportValidator, mergeMode: boolean): Document {

        if (!mergeMode) {
            validator.assertIsKnownType(document);
            validator.assertIsAllowedType(document, mergeMode);
        }
        validator.assertIsWellformed(document);
        return document;
    }


    function removeSelfReferencingIdentifiers(relations: Relations, resourceIdentifier: Identifier) {

        for (let relName of Object.keys(relations)) {
            relations[relName] = relations[relName].filter(isnt(resourceIdentifier));
            if (isUndefinedOrEmpty(relations[relName])) delete relations[relName];
        }
    }


    function assignIds(documents: Array<Document>, generateId: Function): IdentifierMap {

        return documents
            .filter(hasNot(RESOURCE_ID))
            .reduce((identifierMap, document)  => {
                identifierMap[document.resource.identifier] = document.resource.id = generateId();
                return identifierMap;
            }, {} as IdentifierMap);
    }


    async function mergeOrUseAsIs(document: NewDocument|Document,
                                  find: Find,
                                  mergeIfExists: boolean,
                                  allowOverwriteRelationsOnMerge: boolean): Promise<Document> {

        let documentForUpdate: Document = document as Document;
        const existingDocument = await find(document.resource.identifier);

        if (mergeIfExists) {
            if (existingDocument) documentForUpdate = DocumentMerge.merge(existingDocument, documentForUpdate, allowOverwriteRelationsOnMerge);
            else throw [E.UPDATE_TARGET_NOT_FOUND, document.resource.identifier];
        } else {
            if (existingDocument) throw [E.RESOURCE_EXISTS, existingDocument.resource.identifier];
        }
        return documentForUpdate;
    }


    async function prepareIsRecordedInRelation(documentsForUpdate: Array<NewDocument>,
                                               validator: ImportValidator,
                                               mainTypeDocumentId: Id) {

        for (let document of documentsForUpdate) {
            if (!mainTypeDocumentId) {
                validator.assertHasLiesWithin(document);
            } else {
                await validator.assertIsNotOverviewType(document);
                await validator.isRecordedInTargetAllowedRelationDomainType(document, mainTypeDocumentId);
                initRecordedIn(document, mainTypeDocumentId);
            }
        }
    }


    function searchInImport(targetDocumentResourceId: Id,
                            idMap: IdMap,
                            operationTypeNames: string[]
    ): Either<string, Document> // recordedInResourceId|targetDocument
       |undefined {             // targetDocument not found

        const targetInImport = idMap[targetDocumentResourceId];
        if (!targetInImport) return undefined;

        if (operationTypeNames.includes(targetInImport.resource.type)) {
            return [targetInImport.resource.id, undefined];
        }
        if (targetInImport.resource.relations.isRecordedIn
            && targetInImport.resource.relations.isRecordedIn.length > 0) {
            return [targetInImport.resource.relations.isRecordedIn[0], undefined];
        }
        return [undefined, targetInImport];
    }


    function initRecordedIn(document: NewDocument, mainTypeDocumentId: Id) {

        const relations = document.resource.relations;
        if (!relations[RECORDED_IN]) relations[RECORDED_IN] = [];
        if (!relations[RECORDED_IN].includes(mainTypeDocumentId)) {
            relations[RECORDED_IN].push(mainTypeDocumentId);
        }
    }
}