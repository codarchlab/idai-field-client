import {Map, Either} from 'tsfun';
import {Document} from 'idai-components-2';
import {ImportValidator} from './process/import-validator';
import {DocumentDatastore} from '../../datastore/document-datastore';
import {Find, Get} from './types';
import {complementInverseRelationsBetweenImportDocs, makeSureRelationStructuresExists, preprocessRelations} from './preprocess-relations';
import {preprocessFields} from './preprocess-fields';
import {ImportErrors as E} from './import-errors';
import {HierarchicalRelations, PARENT} from '../../model/relation-constants';
import LIES_WITHIN = HierarchicalRelations.LIESWITHIN;
import RECORDED_IN = HierarchicalRelations.RECORDEDIN;
import {InverseRelationsMap} from '../../configuration/inverse-relations-map';
import {processDocuments} from './process/process-documents';
import {processRelations} from './process/process-relations';
import {Settings} from '../../settings/settings';


export interface ImportOptions {

    mergeMode?: boolean;
    permitDeletions?: boolean;
    operationId?: string;
    useIdentifiersInRelations?: boolean;
    differentialImport?: true;
}


export interface ImportHelpers {

    generateId: () => string;
    preprocessDocument: (_: Document) => Document;
    postprocessDocument: (_: Document) => Document;
}


export interface ImportServices {

    validator: ImportValidator,
    datastore: DocumentDatastore
}


export interface ImportContext {

    operationCategoryNames: string[];
    inverseRelationsMap: InverseRelationsMap;
    settings: Settings;
}


export type ErrWithParams = Array<string>;
export type CreateDocuments = Array<Document>;
export type UpdateDocuments = Array<Document>;
export type TargetDocuments = Array<Document>;

export type Result = Either<ErrWithParams, [CreateDocuments, UpdateDocuments, TargetDocuments]>;
export type Documents2Result = (_: Array<Document>) => Promise<Result>;


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * 
 * @returns Documents2Result, which expects
 *   documents with the field resource.identifier set to a non empty string.
 *   If resource.id is set, it will be taken as document.id, otherwise a new id gets generated.
 *   The relations map is assumed to be at least existent, but can be empty. // TODO REVIEW, than we can omit creation of it and only assert that it is there
 *   The resource.category field may be empty.
 */
export function buildImportDocuments(services: ImportServices,
                                     context: ImportContext,
                                     helpers: ImportHelpers,
                                     options: ImportOptions = {}): Documents2Result {

    if (options.mergeMode) {
        if (!options.useIdentifiersInRelations) {
            throw 'FATAL - illegal arguments - '
            + 'useIdentifiersInRelations must also be set when merge mode selected';
        }
        if (options.operationId) {
            throw 'FATAL - illegal argument combination '
            + '- mergeMode and operationId must not be both truthy';
        }
        if (options.differentialImport) {
            throw 'FATAL - illegal argument combination '
            + '- mergeMode and differentialImport must not be both true';
        }
    }

    const get  = (resourceId: string) => services.datastore.get(resourceId);
    const find = findByIdentifier(services.datastore);

    return (documents: Array<Document>) => importDocuments(
            services, context, helpers, options,find, get, documents);
}


async function importDocuments(services: ImportServices,
                               context: ImportContext,
                               helpers: ImportHelpers,
                               options: ImportOptions,
                               find: Find,
                               get: Get,
                               documents: Array<Document>): Promise<Result> {

    makeSureRelationStructuresExists(documents);
    complementInverseRelationsBetweenImportDocs(context, options, documents); // TODO now that we have that here, we could simplify later steps probably
    
    try {
        const existingDocuments = await makeExistingDocumentsMap(find, options, documents);
        const docs = filterOnDifferentialImport(existingDocuments, options, documents);
        preprocessFields(docs, options);
        await preprocessRelations(existingDocuments, docs, helpers, get, options);
        const mergeDocs = preprocessDocuments(existingDocuments, helpers, options, docs);
        const processedDocuments = processDocuments(docs, mergeDocs, services.validator);
        const targetDocuments = await processRelations(
            processedDocuments,
            services.validator,
            context.operationCategoryNames,
            get,
            context.inverseRelationsMap,
            options
        );
        const documentsForImport = processedDocuments.map(helpers.postprocessDocument);
        return options.mergeMode === true 
            ? [undefined, [[], documentsForImport, targetDocuments]]
            : [undefined, [documentsForImport, [], targetDocuments]];

    } catch (errWithParams) {
        if (errWithParams[0] === E.TARGET_CATEGORY_RANGE_MISMATCH
                && ([LIES_WITHIN, RECORDED_IN].includes(errWithParams[2]))) errWithParams[2] = PARENT;
        return [errWithParams, undefined];
    }
}



async function makeExistingDocumentsMap(find: Find,
                                        options: ImportOptions,
                                        documents: Array<Document>): Promise<Map<Document>> {

    if (!options.useIdentifiersInRelations) return {};
    const lookup = {};
    for (const document of documents) {
        const identifier = document.resource.identifier;
        const found = await find(identifier);
        if (found) lookup[identifier] = found;
    }
    return lookup;
}


function filterOnDifferentialImport(existingDocuments: Map<Document>,
                                    options: ImportOptions,
                                    documents: Array<Document>) {

    return options.differentialImport !== true
            ? documents
            : documents.filter(document => 
                existingDocuments[document.resource.identifier] === undefined);
}


function preprocessDocuments(existingDocuments: Map<Document>,
                             helpers: ImportHelpers,
                             options: ImportOptions,
                             documents: Array<Document>): Map<Document> {

    const mergeDocs = {};

    for (let document of documents) {
        const existingDocument = existingDocuments[document.resource.identifier];
        if (options.mergeMode === true) {
            if (!existingDocument) throw [E.UPDATE_TARGET_NOT_FOUND, document.resource.identifier];

            document._id = existingDocument._id;
            document.resource.id = existingDocument.resource.id;

            mergeDocs[existingDocument.resource.id] = helpers.preprocessDocument(existingDocument);
        } else if (existingDocument) {
            throw [E.RESOURCE_EXISTS, existingDocument.resource.identifier];
        }
    }

    return mergeDocs;
}


function findByIdentifier(datastore: DocumentDatastore): Find {

    return async (identifier: string): Promise<Document|undefined> => {

        const result = await datastore.find({ constraints: { 'identifier:match': identifier }});

        return result.totalCount === 1
            ? result.documents[0]
            : undefined;
    }
}
