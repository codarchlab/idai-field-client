import {Map} from 'tsfun';
import {BuiltinCategoryDefinition} from '../model/builtin-category-definition';
import {LibraryCategoryDefinition} from '../model/library-category-definition';
import {CustomCategoryDefinition} from '../model/custom-category-definition';
import {FieldDefinition} from '../../model/field-definition';


export function addSourceField(builtInCategories: Map<BuiltinCategoryDefinition>,
                               libraryCategories: Map<LibraryCategoryDefinition>,
                               customCategories: Map<CustomCategoryDefinition>|undefined,
                               commonFields: Map<any>|undefined) {

    setFieldSourceOnCategories(builtInCategories, FieldDefinition.Source.BUILTIN);
    setFieldSourceOnCategories(libraryCategories, FieldDefinition.Source.LIBRARY);
    if (customCategories) setFieldSourceOnCategories(customCategories, FieldDefinition.Source.CUSTOM);
    if (commonFields) setFieldSourceOnFields(commonFields, FieldDefinition.Source.COMMON);
}


function setFieldSourceOnCategories(categories: any, value: any) {

    for (const category of Object.values(categories) as any) {

        category.source = value;
        setFieldSourceOnFields(category.fields, value)
    }
}


function setFieldSourceOnFields(fields: any, value: any) {

    for (const field of Object.values(fields) as any) {
        
        field.source = value;
    }
}
