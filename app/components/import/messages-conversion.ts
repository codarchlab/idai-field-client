import {ValidationErrors} from '../../core/model/validation-errors';
import {M} from '../m';
import {ImportErrors} from '../../core/import/import-errors';

/**
 * Converts messages of Validator / Importer to messages of M for Import component.
 *
 * @author Daniel de Oliveira
 */
export module MessagesConversion {

    export function convertMessage(msg: string[]): string[] {

        if (msg.length === 0) return [];

        let replacement = undefined;

        if (msg[0] === ValidationErrors.INVALID_TYPE) replacement = M.IMPORT_VALIDATION_ERROR_INVALIDTYPE;
        if (msg[0] === ValidationErrors.NO_ISRECORDEDIN) replacement = M.IMPORT_VALIDATION_ERROR_NORECORDEDIN;
        if (msg[0] === ValidationErrors.NO_ISRECORDEDIN_TARGET) replacement = M.IMPORT_VALIDATION_ERROR_NORECORDEDINTARGET;
        if (msg[0] === ValidationErrors.IDENTIFIER_EXISTS) replacement = M.MODEL_VALIDATION_ERROR_IDEXISTS;
        if (msg[0] === ValidationErrors.MISSING_PROPERTY) replacement = M.IMPORT_VALIDATION_ERROR_MISSINGPROPERTY;
        if (msg[0] === ValidationErrors.MISSING_GEOMETRY_TYPE) replacement = M.MODEL_VALIDATION_ERROR_MISSING_GEOMETRYTYPE;
        if (msg[0] === ValidationErrors.MISSING_COORDINATES) replacement = M.MODEL_VALIDATION_ERROR_MISSING_COORDINATES;
        if (msg[0] === ValidationErrors.INVALID_COORDINATES) replacement = M.MODEL_VALIDATION_ERROR_INVALID_COORDINATES;
        if (msg[0] === ValidationErrors.UNSUPPORTED_GEOMETRY_TYPE) replacement = M.MODEL_VALIDATION_ERROR_UNSUPPORTED_GEOMETRYTYPE;
        if (msg[0] === ValidationErrors.UNSUPPORTED_GEOMETRY_TYPE) replacement = M.MODEL_VALIDATION_ERROR_UNSUPPORTED_GEOMETRYTYPE;

        if (msg[0] === ImportErrors.FILE_UNREADABLE) replacement = M.IMPORT_FAILURE_FILEUNREADABLE;
        if (msg[0] === ImportErrors.FILE_INVALID_JSON) replacement = M.IMPORT_FAILURE_INVALIDJSON;
        if (msg[0] === ImportErrors.FILE_INVALID_JSONL) replacement = M.IMPORT_FAILURE_INVALIDJSONL;
        if (msg[0] === ImportErrors.INVALID_GEOJSON_IMPORT_STRUCT) replacement = M.IMPORT_FAILURE_INVALID_GEOJSON_IMPORT_STRUCT;
        if (msg[0] === ImportErrors.MISSING_IDENTIFIER) replacement = M.IMPORT_FAILURE_MISSING_IDENTIFIER;
        if (msg[0] === ImportErrors.WRONG_IDENTIFIER_FORMAT) replacement = M.IMPORT_FAILURE_IDENTIFIER_FORMAT;
        if (msg[0] === ImportErrors.INVALID_CSV) replacement = M.IMPORT_FAILURE_INVALIDCSV;
        if (msg[0] === ImportErrors.GENERIC_CSV_ERROR) replacement = M.IMPORT_FAILURE_GENERICCSVERROR;
        if (msg[0] === ImportErrors.MANDATORY_CSV_FIELD_MISSING) replacement = M.IMPORT_FAILURE_MANDATORYCSVFIELDMISSING;

        if (msg[0] === ImportErrors.GENERIC_DATASTORE_ERROR) replacement = M.IMPORT_FAILURE_GENERICDATASTOREERROR;
        if (msg[0] === ImportErrors.INVALID_GEOMETRY) replacement = M.IMPORT_FAILURE_INVALIDGEOMETRY;
        if (msg[0] === ImportErrors.ROLLBACK_ERROR) replacement = M.IMPORT_FAILURE_ROLLBACKERROR;
        if (msg[0] === ImportErrors.MISSING_RESOURCE) replacement = M.IMPORT_FAILURE_MISSING_RESOURCE;
        if (msg[0] === ImportErrors.MISSING_RELATION_TARGET) replacement = M.IMPORT_FAILURE_MISSING_RELATION_TARGET;
        if (msg[0] === ImportErrors.INVALID_MAIN_TYPE_DOCUMENT) replacement = M.IMPORT_FAILURE_INVALID_MAIN_TYPE_DOCUMENT;
        if (msg[0] === ImportErrors.OPERATIONS_NOT_ALLOWED_ON_IMPORT_TO_OPERATION) replacement = M.IMPORT_FAILURE_OPERATIONS_NOT_ALLOWED_ON_IMPORT_TO_OPERATION;
        if (msg[0] === ImportErrors.NO_OPERATION_ASSIGNABLE) replacement = M.IMPORT_FAILURE_NO_OPERATION_ASSIGNABLE;
        if (msg[0] === ImportErrors.NO_FEATURE_ASSIGNABLE) replacement = M.IMPORT_FAILURE_NO_FEATURE_ASSIGNABLE;



        if (msg[0] === ValidationErrors.INVALID_FIELDS) {
            replacement = msg.length > 2 && msg[2].indexOf(',') !== -1
                ? M.IMPORT_VALIDATION_ERROR_INVALIDFIELDS
                : M.IMPORT_VALIDATION_ERROR_INVALIDFIELD
        }
        if (msg[0] === ValidationErrors.INVALID_RELATIONS) {
            replacement = msg.length > 2 && msg[2].indexOf(',') !== -1
                ? M.IMPORT_VALIDATION_ERROR_INVALIDRELATIONFIELDS
                : M.IMPORT_VALIDATION_ERROR_INVALIDRELATIONFIELD
        }
        if (msg[0] === ValidationErrors.INVALID_NUMERICAL_VALUES) {
            replacement = msg.length > 2 && msg[2].indexOf(',') !== -1
                ? M.IMPORT_VALIDATION_ERROR_INVALID_NUMERIC_VALUES
                : M.IMPORT_VALIDATION_ERROR_INVALID_NUMERIC_VALUE
        }

        if (replacement) (msg as any)[0] = replacement;
        return msg;
    }
}