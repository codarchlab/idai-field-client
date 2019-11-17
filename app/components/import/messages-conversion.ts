import {isArray} from 'tsfun';
import {ValidationErrors} from '../../core/model/validation-errors';
import {M} from '../m';
import {ImportErrors} from '../../core/import/exec/import-errors';
import {ParserErrors} from '../../core/import/parser/parser-errors';
import {ReaderErrors} from '../../core/import/reader/reader-errors';


/**
 * Converts messages of Validator / Importer to messages of M for ImportComponent.
 *
 * @author Daniel de Oliveira
 */
export module MessagesConversion {

    export function convertMessage(msgWithParams: string[]): string[] {

        if (!isArray(msgWithParams)) {
            console.warn('convertMessage. arg not of type array', msgWithParams);
            return [];
        }
        if (msgWithParams.length === 0) return [];
        let replacement = undefined;
        const msg = msgWithParams[0];

        if (msg === ReaderErrors.FILE_UNREADABLE) replacement = M.IMPORT_READER_FILE_UNREADABLE;
        if (msg === ReaderErrors.SHAPEFILE_READ) replacement = M.IMPORT_READER_SHAPEFILE_READ_ERROR;
        if (msg === ReaderErrors.SHAPEFILE_UNSUPPORTED_GEOMETRY_TYPE) replacement = M.IMPORT_READER_SHAPEFILE_UNSUPPORTED_GEOMETRY_TYPE;
        if (msg === ReaderErrors.SHAPEFILE_JSONL_WRITE) replacement = M.IMPORT_READER_SHAPEFILE_JSONL_WRITE;
        if (msg === ReaderErrors.SHAPEFILE_GENERIC) replacement = M.IMPORT_PARSER_SHAPEFILE_GENERIC;

        if (msg === ParserErrors.SHAPEFILE_GENERIC) replacement = M.IMPORT_PARSER_SHAPEFILE_GENERIC;
        if (msg === ParserErrors.FILE_INVALID_JSON) replacement = M.IMPORT_PARSER_INVALID_JSON;
        if (msg === ParserErrors.FILE_INVALID_JSONL) replacement = M.IMPORT_PARSER_INVALID_JSONL;
        if (msg === ParserErrors.MANDATORY_CSV_FIELD_MISSING) replacement = M.IMPORT_PARSER_MANDATORY_CSV_FIELD_MISSING;
        if (msg === ParserErrors.INVALID_GEOJSON_IMPORT_STRUCT) replacement = M.IMPORT_PARSER_INVALID_GEOJSON_IMPORT_STRUCT;
        if (msg === ParserErrors.INVALID_GEOMETRY) replacement = M.IMPORT_PARSER_INVALID_GEOMETRY;
        if (msg === ParserErrors.MISSING_IDENTIFIER) replacement = M.IMPORT_PARSER_MISSING_IDENTIFIER;
        if (msg === ParserErrors.ID_MUST_NOT_BE_SET) replacement = M.IMPORT_PARSER_ID_MUST_NOT_BE_SET;
        if (msg === ParserErrors.WRONG_IDENTIFIER_FORMAT) replacement = M.IMPORT_PARSER_IDENTIFIER_FORMAT;
        if (msg === ParserErrors.CSV_GENERIC) replacement = M.IMPORT_PARSER_GENERIC_CSV_ERROR;
        if (msg === ParserErrors.CSV_INVALID) replacement = M.IMPORT_PARSER_INVALID_CSV;
        if (msg === ParserErrors.CSV_NOT_A_NUMBER) replacement = M.IMPORT_PARSER_NOT_A_NUMBER;
        if (msg === ParserErrors.CSV_NOT_A_BOOLEAN) replacement = M.IMPORT_PARSER_NOT_A_BOOLEAN;

        if (msg === ValidationErrors.NO_ISRECORDEDIN) replacement = M.IMPORT_VALIDATION_ERROR_NO_RECORDEDIN;
        if (msg === ValidationErrors.NO_ISRECORDEDIN_TARGET) replacement = M.IMPORT_VALIDATION_ERROR_NO_RECORDEDIN_TARGET;
        if (msg === ValidationErrors.IDENTIFIER_ALREADY_EXISTS) replacement = M.MODEL_VALIDATION_IDENTIFIER_ALREADY_EXISTS;
        if (msg === ValidationErrors.MISSING_PROPERTY) replacement = M.IMPORT_VALIDATION_MISSING_PROPERTY;
        if (msg === ValidationErrors.MISSING_GEOMETRY_TYPE) replacement = M.MODEL_VALIDATION_MISSING_GEOMETRYTYPE;
        if (msg === ValidationErrors.MISSING_COORDINATES) replacement = M.MODEL_VALIDATION_MISSING_COORDINATES;
        if (msg === ValidationErrors.INVALID_COORDINATES) replacement = M.MODEL_VALIDATION_INVALID_COORDINATES;
        if (msg === ValidationErrors.UNSUPPORTED_GEOMETRY_TYPE) replacement = M.MODEL_VALIDATION_UNSUPPORTED_GEOMETRY_TYPE;
        if (msg === ValidationErrors.GENERIC_DATASTORE) replacement = M.IMPORT_READER_GENERIC_DATASTORE;

        if (msg === ImportErrors.INVALID_DROPDOWN_RANGE_VALUES) replacement = M.IMPORT_VALIDATION_ERROR_INVALID_DROPDOWN_RANGE_VALUES;
        if (msg === ImportErrors.INVALID_TYPE) replacement = M.IMPORT_VALIDATION_INVALID_TYPE;
        if (msg === ImportErrors.EMPTY_RELATION) replacement = M.IMPORT_EXEC_EMPTY_RELATION;
        if (msg === ImportErrors.BAD_INTERRELATION) replacement = M.IMPORT_EXEC_NOT_INTERRELATED;
        if (msg === ImportErrors.UPDATE_TARGET_NOT_FOUND) replacement = M.IMPORT_ERROR_NOT_UPDATED;
        if (msg === ImportErrors.TYPE_NOT_ALLOWED) replacement = M.IMPORT_ERROR_TYPE_NOT_ALLOWED;
        if (msg === ImportErrors.TYPE_ONLY_ALLOWED_ON_UPDATE) replacement = M.IMPORT_ERROR_TYPE_ONLY_ALLOWED_ON_UPDATE;
        if (msg === ImportErrors.OPERATIONS_NOT_ALLOWED) replacement = M.IMPORT_PREVALIDATION_OPERATIONS_NOT_ALLOWED;
        if (msg === ImportErrors.NO_PARENT_ASSIGNED) replacement = M.IMPORT_EXEC_NO_LIES_WITHIN_SET;
        if (msg === ImportErrors.DUPLICATE_IDENTIFIER) replacement = M.IMPORT_PREVALIDATION_DUPLICATE_IDENTIFIER;
        if (msg === ImportErrors.MISSING_RELATION_TARGET) replacement = M.IMPORT_PREVALIDATION_MISSING_RELATION_TARGET;
        if (msg === ImportErrors.MENINX_NO_OPERATION_ASSIGNABLE) replacement = M.IMPORT_NO_OPERATION_ASSIGNABLE;
        if (msg === ImportErrors.MENINX_FIND_NO_FEATURE_ASSIGNABLE) replacement = M.IMPORT_NO_FEATURE_ASSIGNABLE;
        if (msg === ImportErrors.RESOURCE_EXISTS) replacement = M.MODEL_VALIDATION_IDENTIFIER_ALREADY_EXISTS;
        if (msg === ImportErrors.EXEC_MISSING_RELATION_TARGET) replacement = M.IMPORT_EXEC_MISSING_RELATION_TARGET;
        if (msg === ImportErrors.INVALID_MAIN_TYPE_DOCUMENT) replacement = M.IMPORT_READER_INVALID_OPERATION_RESOURCE;
        if (msg === ImportErrors.LIES_WITHIN_TARGET_NOT_MATCHES_ON_IS_RECORDED_IN) replacement = M.IMPORT_LIES_WITHIN_TARGET_NOT_MATCHES_ON_IS_RECORDED_IN;
        if (msg === ImportErrors.PARENT_ASSIGNMENT_TO_OPERATIONS_NOT_ALLOWED) replacement = M.IMPORT_PARENT_ASSIGNMENT_TO_OPERATIONS_NOT_ALLOWED;
        if (msg === ImportErrors.PARENT_MUST_NOT_BE_ARRAY) replacement = M.IMPORT_PARENT_MUST_NOT_BE_ARRAY;
        if (msg === ImportErrors.MUST_BE_ARRAY) replacement = M.IMPORT_MUST_BE_ARRAY;
        if (msg === ImportErrors.MUST_BE_IN_SAME_OPERATION) replacement = M.IMPORT_MUST_BE_IN_SAME_OPERATION;
        if (msg === ImportErrors.MUST_LIE_WITHIN_OTHER_NON_OPERATON_RESOURCE) replacement = M.IMPORT_ERROR_MUST_LIE_WITHIN_OTHER_NON_OPERATON_RESOURCE;
        if (msg === ImportErrors.TARGET_TYPE_RANGE_MISMATCH) replacement = M.IMPORT_ERROR_TARGET_TYPE_RANGE_MISMATCH;
        if (msg === ImportErrors.MUST_NOT_BE_EMPTY_STRING) replacement = M.IMPORT_ERROR_MUST_NOT_BE_EMPTY_STRING;
        if (msg === ImportErrors.TYPE_CANNOT_BE_CHANGED) replacement = M.IMPORT_ERROR_TYPE_CANNOT_BE_CHANGED;

        if (msg === ImportErrors.ROLLBACK) replacement = M.IMPORT_READER_ROLLBACK;
        if (msg === ImportErrors.INVALID_FIELDS) {
            replacement = msgWithParams.length > 2 && msgWithParams[2].indexOf(',') !== -1
                ? M.IMPORT_VALIDATION_ERROR_INVALID_FIELDS
                : M.IMPORT_VALIDATION_ERROR_INVALID_FIELD
        }
        if (msg === ImportErrors.INVALID_RELATIONS) {
            replacement = msgWithParams.length > 2 && msgWithParams[2].indexOf(',') !== -1
                ? M.IMPORT_VALIDATION_ERROR_INVALID_RELATION_FIELDS
                : M.IMPORT_VALIDATION_ERROR_INVALID_RELATION_FIELD
        }
        if (msg === ValidationErrors.INVALID_NUMERICAL_VALUES) {
            replacement = msgWithParams.length > 2 && msgWithParams[2].indexOf(',') !== -1
                ? M.IMPORT_VALIDATION_ERROR_INVALID_NUMERIC_VALUES
                : M.IMPORT_VALIDATION_ERROR_INVALID_NUMERIC_VALUE
        }
        if (msg === ValidationErrors.INVALID_DATING_VALUES) {
            replacement = msgWithParams.length > 2 && msgWithParams[2].indexOf(',') !== -1
                ? M.IMPORT_VALIDATION_ERROR_INVALID_DATING_VALUES
                : M.IMPORT_VALIDATION_ERROR_INVALID_DATING_VALUE
        }
        if (msg === ValidationErrors.INVALID_DIMENSION_VALUES) {
            replacement = msgWithParams.length > 2 && msgWithParams[2].indexOf(',') !== -1
                ? M.IMPORT_VALIDATION_ERROR_INVALID_DIMENSION_VALUES
                : M.IMPORT_VALIDATION_ERROR_INVALID_DIMENSION_VALUE
        }

        if (replacement) msgWithParams[0] = replacement;
        return msgWithParams;
    }
}