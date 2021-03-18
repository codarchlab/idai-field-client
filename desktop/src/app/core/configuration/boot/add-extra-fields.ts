import {Map} from 'tsfun';
import {update} from 'tsfun/associative';
import {clone} from 'tsfun/struct';
import {FieldDefinition} from '../model/field-definition';
import {TransientCategoryDefinition} from '../model/transient-category-definition';


export function addExtraFields(extraFields: Map<FieldDefinition>) {

    return (configuration: Map<TransientCategoryDefinition>) => {

        return Object.keys(configuration)
            .reduce((configuration: Map<TransientCategoryDefinition>, categoryName: string) => {

            return update(categoryName, addExtraFieldsToCategory(extraFields))(configuration);

        }, configuration);
    };
}


function addExtraFieldsToCategory(extraFields: Map<FieldDefinition>) {

    return (categoryDefinition: TransientCategoryDefinition) => {

        const newCategoryDefinition = clone(categoryDefinition);
        if (!newCategoryDefinition.fields) newCategoryDefinition.fields = {};
        if (newCategoryDefinition.parent === undefined) _addExtraFields(newCategoryDefinition, extraFields);
        return newCategoryDefinition
    }
}


function _addExtraFields(categoryDefinition: TransientCategoryDefinition,
                         extraFields: { [fieldName: string]: FieldDefinition }) {

    for (let extraFieldName of Object.keys(extraFields)) {
        let fieldAlreadyPresent = false;

        for (let fieldName of Object.keys(categoryDefinition.fields)) {
            if (fieldName === extraFieldName) fieldAlreadyPresent = true;
        }

        if (!fieldAlreadyPresent) {
            categoryDefinition.fields[extraFieldName] = Object.assign({}, extraFields[extraFieldName]);
        }
    }
}
