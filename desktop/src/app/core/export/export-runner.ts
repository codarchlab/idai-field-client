import {includedIn, isNot, on, to, map, pairWith, val, greaterThan} from 'tsfun';
import {map as asyncMap, flow as asyncFlow} from 'tsfun/async';
import {FieldDocument} from 'idai-components-2';
import {ISRECORDEDIN_CONTAIN} from '../constants';
import {clone} from '../util/object-util';
import {Find, GetIdentifierForId, PerformExport, CategoryCount} from './export-helper';
import {Category} from '../configuration/model/category';
import {Query} from '../datastore/model/query';


const NAME = 'name';
const RESOURCE = 'resource';


/**
 * Fetches documents, rewrites identifiers in relations, triggering the export of the transformed docs.
 *
 * Currently this gets used only by CSV export, though in principle it serves every export
 * with the abovementioned requirements, especially the second.
 *
 * @author Daniel de Oliveira
 */
export module ExportRunner {

    export const BASE_EXCLUSION = ['Operation', 'Project'];
    const ADD_EXCLUSION = ['Place', 'Survey', 'Trench', 'Building'];


    export async function performExport(find: Find, selectedOperationId: string|undefined,
                                        selectedCategory: Category, relations: string[],
                                        getIdentifierForId: GetIdentifierForId,
                                        performExport: PerformExport) {

        return await asyncFlow(
                selectedOperationId
                    ? await fetchDocuments(find, selectedOperationId, selectedCategory)
                    : [],
                asyncMap(rewriteIdentifiers(getIdentifierForId)),
                map(to(RESOURCE)),
                performExport(selectedCategory, relations));
    }


    export function getCategoriesWithoutExcludedCategories(categories: Array<Category>, exclusion: string[]) {

        return categories.filter(on(NAME, isNot(includedIn(exclusion))))
    }


    /**
     * @param find
     * @param selectedOperationId
     * @param categoriesList
     */
    export async function determineCategoryCounts(find: Find,
                                                  selectedOperationId: string|undefined,
                                                  categoriesList: Array<Category>): Promise<Array<CategoryCount>> {

        if (!selectedOperationId) return determineCategoryCountsForSchema(categoriesList);

        const categories = getCategoriesWithoutExcludedCategories(
            categoriesList,
            BASE_EXCLUSION.concat(selectedOperationId === 'project' ? [] : ADD_EXCLUSION)
        );

        const resourceCategoryCounts: Array<CategoryCount> = [];
        for (let category of categories) {
            const query = getQuery(category.name, selectedOperationId, 0);
            resourceCategoryCounts.push([
                category,
                (await find(query)).totalCount
            ]);
        }
        return resourceCategoryCounts.filter(on('[1]', greaterThan(0)));
    }


    function determineCategoryCountsForSchema(categoriesList: Array<Category>) {

        const categories = getCategoriesWithoutExcludedCategories(categoriesList, BASE_EXCLUSION);
        return categories.map(pairWith(val(-1))) as Array<CategoryCount>;
    }


    /**
     * Fetches documents, clones them and replaces ids with identifiers
     *
     * @param find
     * @param selectedOperationId
     * @param selectedCategory
     */
    async function fetchDocuments(find: Find,
                                  selectedOperationId: string,
                                  selectedCategory: Category): Promise<Array<FieldDocument>> {

        try {
            const query = getQuery(selectedCategory.name, selectedOperationId);
            return (await find(query)).documents as Array<FieldDocument>;
        } catch (msgWithParams) {
            console.error(msgWithParams);
            return [];
        }
    }


    function rewriteIdentifiers(getIdentifierForId: GetIdentifierForId) {

        return async (document: FieldDocument): Promise<FieldDocument> => {

            const clonedDocument: FieldDocument = clone(document); // because we will modify it
            if (!clonedDocument.resource.relations) return clonedDocument;

            for (let relation of Object.keys(clonedDocument.resource.relations)) {

                const newTargets = [];
                for (let target of clonedDocument.resource.relations[relation]) {
                    try {
                        newTargets.push(await getIdentifierForId(target));
                    } catch(err) {
                        console.warn('Relation target "' + target + '" of resource "'
                            + document.resource.id + '" not found', err);
                    }
                }
                clonedDocument.resource.relations[relation] = newTargets;
            }
            return clonedDocument;
        }
    }


    function getQuery(categoryName: string, selectedOperationId: string, limit?: number) {

        const query: Query = {
            categories: [categoryName],
            constraints: {},
            limit: limit
        };
        if (selectedOperationId !== 'project') {
            (query.constraints as any)[ISRECORDEDIN_CONTAIN] = selectedOperationId;
        }
        return query;
    }
}
