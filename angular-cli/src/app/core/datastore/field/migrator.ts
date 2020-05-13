import {isObject, flow} from 'tsfun';
import {Document, ValOptionalEndVal} from 'idai-components-2';
import {migrationMap, subFieldsMigrationMap, singleToMultipleValuesFieldNames} from './migration-map';


/**
 * @author Thomas Kleinke
 */
export module Migrator {

    export function migrate(document: Document): Document {

        return flow(
            document,
            migrateFieldNames,
            migratePeriodFields,
            migrateSingleToMultipleValues);
    }


    /**
     * @param document modified in place
     * @return the original, now modified document
     */
    function migratePeriodFields(document: Document): Document {

        const PERIOD = 'period';
        const PERIODEND = 'periodEnd';

        if (document.resource[PERIOD] && !isObject(document.resource[PERIOD])) {

            document.resource[PERIOD] = {
                value: document.resource[PERIOD]
            };
            if (document.resource[PERIODEND]) {
                document.resource[PERIOD][ValOptionalEndVal.ENDVALUE] = document.resource[PERIODEND];
                delete document.resource[PERIODEND];
            }
        }
        return document;
    }


    function migrateFieldNames(document: Document): Document {

        const resource: any = {};

        if (document.resource.relations) delete document.resource.relations['includes'];

        Object.keys(document.resource).forEach((fieldName: string) => {
           const newFieldName: string = migrationMap[fieldName] ? migrationMap[fieldName] : fieldName;

           let field: any = document.resource[fieldName];
           if (Array.isArray(field) && (field.some(isObject))) field = migrateArrayField(field);

           resource[newFieldName] = field;
        });

        document.resource = resource;

        return document;
    }


    function migrateArrayField(arrayField: any[]): any[] {

        const result: any[] = [];

        arrayField.forEach(entry => {
            result.push(isObject(entry) ? migrateSubFieldNames(entry) : entry);
        });

        return result;
    }


    function migrateSubFieldNames(object: any): any {

        const result: any = {};

        Object.keys(object).forEach((fieldName: string) => {
            const newFieldName: string = subFieldsMigrationMap[fieldName]
                ? subFieldsMigrationMap[fieldName]
                : fieldName;
            result[newFieldName] = object[fieldName];
        });

        return result;
    }


    function migrateSingleToMultipleValues(document: Document): Document {

        singleToMultipleValuesFieldNames.forEach((fieldName: string) => {
           if (document.resource[fieldName] && !Array.isArray(document.resource[fieldName])) {
               document.resource[fieldName] = [document.resource[fieldName]];
           }
        });

        return document;
    }
}