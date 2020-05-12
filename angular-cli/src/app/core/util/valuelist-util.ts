import {includedIn, isNot, isArray, filter} from 'tsfun';
import {Document, Resource} from 'idai-components-2';
import {FieldDefinition} from '../configuration/model/field-definition';
import {ValueDefinition, ValuelistDefinition} from '../configuration/model/valuelist-definition';
import {clone} from './object-util';

const locale: string = window.require('electron').remote.getGlobal('config').locale;


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module ValuelistUtil {

    export function getValuesNotIncludedInValuelist(resource: Resource|undefined, fieldName: string|undefined,
                                                    valuelist: ValuelistDefinition): string[]|undefined {

        if (!resource || !fieldName || !resource[fieldName] || !valuelist) return undefined;

        const itemsNotIncludedInValueList = isArray(resource[fieldName])
            ? resource[fieldName].filter(isNot(includedIn(Object.keys(valuelist.values))))
            : isNot(includedIn(Object.keys(valuelist.values)))(resource[fieldName])
                ? [resource[fieldName]]
                : [];

        return itemsNotIncludedInValueList.length > 0 ? itemsNotIncludedInValueList : undefined;
    }


    export function getValueLabel(valuelist: ValuelistDefinition, valueId: string): string {

        const value: ValueDefinition|undefined = valuelist.values[valueId];
        if (!value) return valueId;

        const label: { [locale: string]: string }|undefined = valuelist.values[valueId].labels;

        return label
            ? label[locale] ?? valueId
            : valueId;
    }


    export function getValuelist(field: FieldDefinition, projectDocument: Document,
                                 parentResource?: Resource): ValuelistDefinition {

        const valuelist: ValuelistDefinition|string[] = field.valuelist
            ? field.valuelist
            : getValuelistFromProjectField(field.valuelistFromProjectField as string, projectDocument);

        return field.allowOnlyValuesOfParent && parentResource
                && parentResource.category !== 'Place'
            ? getValuesOfParentField(valuelist, field.name, parentResource)
            : valuelist;
    }


    export function getValuelistFromProjectField(fieldName: string,
                                                 projectDocument: Document): ValuelistDefinition {

        const field: string[]|undefined = projectDocument.resource[fieldName];
        return field && isArray(field)
            ? {
                values: field.reduce((values: { [fieldId: string]: ValueDefinition }, fieldName: string) => {
                    values[fieldName] = {};
                    return values;
                }, {})
            }
        : { values: {} };
    }


    function getValuesOfParentField(valuelist: ValuelistDefinition, fieldName: string,
                                    parentResource: Resource): ValuelistDefinition {

        const parentValues: string[] = parentResource[fieldName] ?? [];

        const result: ValuelistDefinition = clone(valuelist);
        result.values = filter((_, key: string) => {
            return parentValues.includes(key);
        })(valuelist.values) as { [key: string]: ValueDefinition };

        return result;
    }
}

