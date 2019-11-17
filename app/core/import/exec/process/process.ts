import {duplicates, to, dissocOn} from 'tsfun';
import {Document, NewDocument} from 'idai-components-2';
import {ImportValidator} from './import-validator';
import {ImportErrors as E} from '../import-errors';
import {RESOURCE_IDENTIFIER} from '../../../../c';
import {processRelations} from './process-relations';
import {Get, GetInverseRelation} from '../types';
import {assertLegalCombination} from '../utils';
import {ImportOptions} from '../default-import';
import {mergeDocument} from './merge-document';


/**
 * null values get interpreted as commands to delete the corresponding fields or relations in merge mode.
 *
 * This function takes relations in the form, that only liesWithin is defined and never isRecordedIn.
 * isRecordedIn gets inferred. This especially is true in cases where a top level item references
 * its operation with liesWithin, which gets resolved to an empty liesWithin and a isRecordedIn in its place.
 *
 * -------------------------------------------------------
 * ImportErrors (accessible via ProcessResult)
 *
 * [MUST_LIE_WITHIN_OTHER_NON_OPERATON_RESOURCE, resourceType, resourceIdentifier]
 *   - if a resource of
 *     a defined builtin type should be placed inside another resource of a legal LIES_WITHIN range type, but is placed
 *     directly below an operation.
 *
 * [BAD_INTERRELATION, sourceId]
 *   - if opposing relations are pointing to the same resource.
 *     For example IS_BEFORE and IS_AFTER pointing both from document '1' to '2'.
 *   - if mutually exluding relations are pointing to the same resource.
 *     For example IS_CONTEMPORARY_WITH and IS_AFTER both from document '1' to '2'.
 *
 * [TARGET_TYPE_RANGE_MISMATCH, resourceIdentifier, relationName, relationTargetResourceType]
 *   - if a resource points to another resource, however, the specified relation is not allowed between the
 *     types of the resources.
 *
 * [PARENT_ASSIGNMENT_TO_OPERATIONS_NOT_ALLOWED]
 *   - if mainTypeDocumentId is not '' and
 *     a resource references an operation as parent.
 *
 * [LIES_WITHIN_TARGET_NOT_MATCHES_ON_IS_RECORDED_IN, resourceIdentifier]
 *   - if the inferredRecordedIn
 *     differs from a possibly specified recordedIn.
 *
 * [EXEC_MISSING_RELATION_TARGET, targetId]
 *
 * @throws [EMPTY_RELATION, resourceId]
 *   - if relations empty for some relation is empty.
 *     For example relations: {isAbove: []}
 *
 *  @author Daniel de Oliveira
 *  @author Thomas Kleinke
 */
export async function process(documents: Array<Document>,
                              validator: ImportValidator,
                              operationTypeNames: string[],
                              get: Get,
                              getInverseRelation: GetInverseRelation,
                              importOptions : ImportOptions = {})
        : Promise<[Array<Document>, Array<Document>, string[]|undefined]> {

    assertLegalCombination(importOptions.mergeMode, importOptions.mainTypeDocumentId);

    try {
        assertNoDuplicates(documents);

        const processedDocuments = processDocuments(documents, validator, importOptions.mergeMode === true);

        const relatedDocuments = await processRelations(
            processedDocuments,
            validator,
            operationTypeNames,
            getInverseRelation,
            get,
            importOptions
        );

        return [processedDocuments, relatedDocuments, undefined];

    } catch (errWithParams) {

        return [[],[], errWithParams];
    }
}


function assertNoDuplicates(documents: Array<Document>) {

    const dups = duplicates(documents.map(to(RESOURCE_IDENTIFIER)));
    if (dups.length > 0) throw [E.DUPLICATE_IDENTIFIER, dups[0]];
}


/**
 * @returns clones of the documents with their properties adjusted
 */
function processDocuments(documents: Array<Document>, validator: ImportValidator, mergeMode: boolean)
        : Array<Document> {

    return documents.map((document: Document) => {
        validator.assertDropdownRangeComplete(document.resource); // we want dropdown fields to be complete before merge
        return validate(
            mergeOrUseAsIs(document),
            validator,
            mergeMode);
    });
}


function mergeOrUseAsIs(document: NewDocument|Document): Document {

    return (document as any)[MERGE_TARGET]
        ? mergeDocument((document as any)[MERGE_TARGET], dissocOn(MERGE_TARGET)(document))
        : document as Document;

}


function validate(document: Document, validator: ImportValidator, mergeMode: boolean): Document {

    if (!mergeMode) {
        validator.assertIsKnownType(document);
        validator.assertIsAllowedType(document, mergeMode);
    }
    validator.assertIsWellformed(document);
    return document;
}


export const MERGE_TARGET = 'mergeTarget';


