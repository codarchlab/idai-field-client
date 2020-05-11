import {flow, forEach, is, keysAndValues, Map} from 'tsfun';
import {BuiltinCategoryDefinition} from '../model/builtin-category-definition';
import {LibraryCategoryDefinition} from '../model/library-category-definition';
import {CustomCategoryDefinition} from '../model/custom-category-definition';
import {ValuelistDefinition} from '../model/valuelist-definition';
import {TransientCategoryDefinition} from '../model/transient-category-definition';
import {ConfigurationErrors} from './configuration-errors';
import {getDefinedParents, iterateOverFieldsOfCategories} from './helpers';
import {mapToNamedArray, Named} from '../../util/named';


export module Assertions {

    export function performAssertions(builtInCategories: Map<BuiltinCategoryDefinition>,
                                      libraryCategories: Map<LibraryCategoryDefinition>,
                                      customCategories: Map<CustomCategoryDefinition>,
                                      commonFields: Map<any>,
                                      valuelistsConfiguration: Map<ValuelistDefinition>) {

        assertCategoriesAndValuelistsStructurallyValid(Object.keys(builtInCategories), libraryCategories, customCategories, valuelistsConfiguration);
        assertSubtypingIsLegal(builtInCategories, libraryCategories);
        assertSubtypingIsLegal(builtInCategories, customCategories);
        assertNoCommonFieldInputTypeChanges(commonFields, libraryCategories);
        assertNoCommonFieldInputTypeChanges(commonFields, customCategories);
        assertNoCommonFieldWithValuelistFromProjectFieldGetsNewValuelist(commonFields, libraryCategories, customCategories);
        assertCategoryNamesConsistent(libraryCategories);
    }


    function assertNoCommonFieldWithValuelistFromProjectFieldGetsNewValuelist(commonFields: Map<any>,
                                                                              libraryCategories: Map<LibraryCategoryDefinition>,
                                                                              customCategories: Map<CustomCategoryDefinition>) {

        const categories = mapToNamedArray(libraryCategories).concat(mapToNamedArray(customCategories)) as Array<Named>;
        for (let category of categories) {
            if (!(category as any)['valuelists']) return;
            for (let valuelist of Object.keys((category as any)['valuelists'])) {
                if (commonFields[valuelist] && commonFields[valuelist].valuelistFromProjectField) {
                    throw [
                        ConfigurationErrors.COMMON_FIELD_VALUELIST_FROM_PROJECTDOC_NOT_TO_BE_OVERWRITTEN,
                        category.name,
                        valuelist
                    ];
                }
            }
        }
    }


    export function assertInputTypesAreSet(assertInputTypePresentIfNotCommonType: Function) {

        return (categories: Map<TransientCategoryDefinition>) => {

            iterateOverFieldsOfCategories(categories,
                    (categoryName, category, fieldName, field) => {
                assertInputTypePresentIfNotCommonType(categoryName, fieldName, field);
            });

            return categories;
        }
    }


    export function assertNoDuplicationInSelection(customCategories: Map<CustomCategoryDefinition>) {

        return (mergedCategories: Map<TransientCategoryDefinition>) => {

            Object.keys(customCategories).reduce((selectedCategoryNames, customCategoryName) => {

                const selectedCategory = mergedCategories[customCategoryName];
                if (!selectedCategory) return selectedCategoryNames;
                if (!selectedCategoryNames.includes(selectedCategory.categoryName)) {
                    return selectedCategoryNames.concat([selectedCategory.categoryName]);
                }
                throw [ConfigurationErrors.DUPLICATION_IN_SELECTION, selectedCategory.categoryName];

            }, [] as string[]);

            return mergedCategories;
        }
    }


    export function assertValuelistIdsProvided(mergedCategories: Map<TransientCategoryDefinition>) {

        iterateOverFieldsOfCategories(mergedCategories, (categoryName, category, fieldName, field) => {
            if (['dropdown', 'checkboxes', 'radio'].includes(field.inputType ? field.inputType : '')) {

                if (!field.valuelistId && !field.valuelistFromProjectField) {
                    throw [ConfigurationErrors.MISSING_FIELD_PROPERTY, 'valuelistId', categoryName, fieldName];
                }
            }
        });

        return mergedCategories;
    }


    export function assertInputTypePresentIfNotCommonField(commonFields: any) {

        return (categoryName: string, fieldName: string, field: any) => {

            if (!field.inputType && !Object.keys(commonFields).includes(fieldName)) {
                throw [ConfigurationErrors.MISSING_FIELD_PROPERTY, 'inputType', categoryName, fieldName];
            }
        }
    }


    function assertSubtypingIsLegal(builtinCategories: Map<BuiltinCategoryDefinition>, categories: any) {

        flow(categories,
            getDefinedParents,
            forEach((parent: any) => {
                const found = Object.keys(builtinCategories).find(is(parent));
                if (!found) throw [ConfigurationErrors.INVALID_CONFIG_PARENT_NOT_DEFINED, parent];
                const foundBuiltIn = builtinCategories[found];
                if (!foundBuiltIn.supercategory || !foundBuiltIn.userDefinedSubcategoriesAllowed) {
                    throw [ConfigurationErrors.TRYING_TO_SUBTYPE_A_NON_EXTENDABLE_CATEGORY, parent];
                }
            }));
    }


    function assertCategoriesAndValuelistsStructurallyValid(builtInCategories: string[],
                                                            libraryCategories: Map<LibraryCategoryDefinition>,
                                                            customCategories: Map<CustomCategoryDefinition>,
                                                            valuelistDefinitions: Map<ValuelistDefinition>) {

        const assertLibraryCategoryValid = LibraryCategoryDefinition.makeAssertIsValid(builtInCategories);
        const assertCustomCategoryValid = CustomCategoryDefinition.makeAssertIsValid(
            builtInCategories, Object.keys(libraryCategories)
        );

        keysAndValues(libraryCategories).forEach(assertLibraryCategoryValid);
        keysAndValues(customCategories).forEach(assertCustomCategoryValid);
        keysAndValues(valuelistDefinitions).forEach(ValuelistDefinition.assertIsValid);
    }


    function assertCategoryNamesConsistent(libraryCategories: Map<LibraryCategoryDefinition>) {

        type InputType = string;
        const collected: { [categoryName: string]: { [fieldName: string]: InputType }} = {};

        Object.values(libraryCategories).forEach((libraryCategory: any) => {

            const categoryName: string = libraryCategory.categoryName;

            if (!collected[categoryName]) collected[categoryName] = {};

            keysAndValues(libraryCategory.fields).forEach(([fieldName, field]: any) => {

                const inputType = field['inputType'];

                if (collected[categoryName][fieldName]) {
                    if (collected[categoryName][fieldName] !== inputType) {
                        throw [
                            ConfigurationErrors.INCONSISTENT_CATEGORY_NAME,
                            categoryName,
                            'divergentInputType',
                            fieldName];
                    }
                } else {
                    collected[categoryName][fieldName] = inputType;
                }
            });
        });
    }


    /**
     * Currently we check for every field of the library categories, if
     * for a field having the name of a common field, the input type differs from
     * that one defined in the common field, regardless of whether the category actually
     * uses that common field or not
     */
    function assertNoCommonFieldInputTypeChanges(commonFields: Map<any>,
                                                 categories: Map<LibraryCategoryDefinition>|Map<CustomCategoryDefinition>) {

        const commonFieldNames = Object.keys(commonFields);

        iterateOverFieldsOfCategories(categories as any, (categoryName, category, fieldName, field) => {

            if (commonFieldNames.includes(fieldName)) {
                if (field.inputType) {
                    throw [ConfigurationErrors.MUST_NOT_SET_INPUT_TYPE, categoryName, fieldName];
                }
            }
        });
    }
}