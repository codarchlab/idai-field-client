import { filter, flow, includedIn, is, map, remove } from 'tsfun';
import { Category} from '../model';
import { Forest, Named, Name, isTopLevelItemOrChildThereof, removeTrees, Tree, filterTrees } from '../tools';


const TYPE_CATALOG = 'TypeCatalog';
const TYPE = 'Type';
const TYPE_CATALOG_AND_TYPE = [TYPE_CATALOG, TYPE];


/**
 * For naming of document types (for example "ConcreteField"-XYZ, "Image"-XYZ)
 * see document.ts
 * 
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module ProjectCategories {

    export function isGeometryCategory(t: Forest<Named>, category: Name): boolean {

        return !isTopLevelItemOrChildThereof(t, category,
            'Image', 'Inscription', 'Type', 'TypeCatalog', 'Project');
    }


    export function getRegularCategoryNames(t: Forest<Category>): Array<Name> {

        return flow(t,
            removeTrees('Place', 'Project', TYPE_CATALOG, TYPE, 'Image', 'Operation'),
            Tree.flatten,
            map(Named.toName)
        );
    }


    export function getConcreteFieldCategories(t: Forest<Category>): Array<Category> {

        return flow(t,
            removeTrees('Image', 'Project', TYPE_CATALOG, TYPE),
            Tree.flatten
        );
    }


    export function getConcreteFieldCategoryNames(t: Forest<Category>): Array<Name> {

        return getConcreteFieldCategories(t).map(Named.toName);
    }


    export function getFieldCategories(t: Forest<Category>): Array<Category> {

        return flow(t,
            removeTrees('Image', 'Project'),
            Tree.flatten
        );
    }


    export function getFieldCategoryNames(t: Forest<Category>): Array<Name> {

        return getFieldCategories(t).map(Named.toName);
    }


    export function getOverviewCategoryNames(t: Forest<Category>): Array<Name> {

        return flow(t,
            filterTrees('Operation', 'Place'),
            Tree.flatten,
            map(Named.toName)
        );
    }


    export function getOverviewCategories(t: Forest<Category>): Array<Name> {

        return flow(t,
            filterTrees('Operation', 'Place'),
            Tree.flatten,
            remove(Named.onName(is('Operation'))), // TODO review why we do remove this here but not in getOverviewCategoryNames, compare also getOverviewToplevelCategories
            map(Named.toName) as any
        );
    }


    export function getOverviewToplevelCategories(t: Forest<Category>): Array<Category> {

        return flow(t,
            filterTrees('Operation', 'Place'),
            Tree.flatten,
            filter(Named.onName(includedIn(['Operation', 'Place']))) as any
        );
    }


    export function getTypeCategories(t: Forest<Category>): Array<Category> {

        return flow(t,
            filterTrees('Type', 'TypeCatalog'),
            Tree.flatten
        );
    }


    export function getTypeCategoryNames(): Array<Name> {

        return TYPE_CATALOG_AND_TYPE;
    }


    export function getImageCategoryNames(t: Forest<Category>): Array<Name> {

        return flow(t,
            filterTrees('Image'),
            Tree.flatten,
            map(Named.toName)
        );
    }


    export function getFeatureCategoryNames(categories: Forest<Category>): string[] {

        return getSuperCategoryNames(categories, 'Feature');
    }


    export function getOperationCategoryNames(categories: Forest<Category>): string[] {

        return getSuperCategoryNames(categories, 'Operation');
    }


    function getSuperCategoryNames(categories: Forest<Category>, superCategoryName: string) {

        return flow(
            categories,
            filterTrees(superCategoryName),
            Tree.flatten,
            map(Named.toName));
    }
}
