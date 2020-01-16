import {dropRightWhile, includedIn, is, isArray, isNot, isObject, assoc, isAssociative, ObjectCollection,
    Associative, keys, isEmpty, values, isnt, flow, dissoc, reduce, cond, forEach, val} from 'tsfun';
import {NewResource, Resource} from 'idai-components-2';
import {clone} from '../../../util/object-util';
import {HIERARCHICAL_RELATIONS} from '../../../model/relation-constants';
import {ImportErrors} from '../import-errors';
import {hasEmptyAssociatives, typeOf} from '../../util';


export const GEOMETRY = 'geometry';
export const RELATIONS = 'relations';


/**
 * @author Daniel de Oliveira
 *
 * @param into
 * @param additional Must not contain empty objects or arrays as any leaf of the tree.
 *
 * @throws
 *   [ImportErrors.TYPE_CANNOT_BE_CHANGED, identifier]
 *   [ImportErrors.EMPTY_SLOTS_IN_ARRAYS_FORBIDDEN, identifier]
 *     - if a new array object is to be created at an index which would leave unfilled indices between
 *       the new index and the last index of the array which is filled in the original field.
 *     - if the deletion of an array object will leave it empty
 *   [ImportErrors.ARRAY_OF_HETEROGENEOUS_TYPES, identifier]
 */
export function mergeResource(into: Resource, additional: NewResource): Resource {

    assertRelationsSet(into);
    assertNoEmptyAssociatives(into);       // our general assumption regarding documents stored in the database
    assertNoEmptyAssociatives(additional); // our assumption regarding the import process;

    try {
        assertArraysHomogeneouslyTyped(additional);
        assertNoAttemptToChangeType(into, additional);

        const target =
            overwriteOrDeleteProperties(
                clone(into),
                additional,
                Resource.CONSTANT_FIELDS.concat([GEOMETRY]));

        if (additional[GEOMETRY]) target[GEOMETRY] = additional[GEOMETRY];

        return !additional.relations
            ? target
            : assoc(
                RELATIONS,
                overwriteOrDeleteProperties(
                    target.relations,
                    additional.relations,
                    [HIERARCHICAL_RELATIONS.RECORDED_IN]))
            (target) as Resource;

    } catch (err) {
        throw appendIdentifier(err, into.identifier);
    }
}


function appendIdentifier(err: any, identifier: string) {

    return isArray(err) ? err.concat(identifier) : err;
}


const assertArrayHomogeneouslyTyped =
    reduce((arrayItemsType: string|undefined, arrayItem) => {
        // typeof null -> 'object', typeof undefined -> 'undefined'
        const t = typeof arrayItem === 'undefined' ? 'object' : typeof arrayItem;

        if (arrayItemsType !== undefined && t !== arrayItemsType) throw [ImportErrors.ARRAY_OF_HETEROGENEOUS_TYPES];
        return t;
    }, undefined);


/**
 * heterogeneous arrays like
 * [1, {b: 2}]
 * are not allowed
 *
 * exceptions are undefined values
 * [undefined, 2, null, 3]
 * undefined and null values get ignored
 */
function assertArraysHomogeneouslyTyped(o: Associative<any>) {

    flow(o,
        forEach(cond(isArray, assertArrayHomogeneouslyTyped)),
        forEach(cond(isAssociative, assertArraysHomogeneouslyTyped)));
}


function assertRelationsSet(into: Resource) {

    if (!into.relations) throw Error('illegal argument in mergeResource: relations not defined for \'into\'');
}


function assertNoAttemptToChangeType(into: Resource, additional: NewResource) {

    if (additional.type && into.type !== additional.type) {
        throw [ImportErrors.TYPE_CANNOT_BE_CHANGED];
    }
}


function assertNoEmptyAssociatives(resource: Resource|NewResource) {

    flow(resource,
        dissoc(GEOMETRY),
        dissoc(RELATIONS),
        cond(hasEmptyAssociatives, () => {
            throw Error('Precondition violated in mergeResource. Identifier: ' + resource.identifier);
        }));
}


function isObjectArray(as: Array<any>|any) {

    if (!isArray(as)) return false;

    const arrayType = as
        .map(typeOf)
        // typeof null -> 'object', typeof undefined -> 'undefined'
        .map(cond(is('undefined'), val('object')))
        // By assertion we know our arrays are not empty and all entries are of one type
        [0];

    return arrayType === 'object';
}


/**
 * Iterates over all fields of source, except those specified by exlusions
 * and either copies them from source to target
 * or deletes them if the field is set to null.
 *
 * If expandObjectArrays is set, objects contained within array fields
 * get copied by the same rules, recursively.
 *
 * @param target
 * @param source
 * @param exclusions
 */
function overwriteOrDeleteProperties(target: ObjectCollection<any>|undefined,
                                     source: ObjectCollection<any>,
                                     exclusions: string[]) {

    return keys(source)
        .filter(isNot(includedIn(exclusions)))
        .reduce((target: any, property: string|number) => {

            if (source[property] === null) delete target[property];
            else if (isObjectArray(source[property])) {

                if (!target[property]) target[property] = [];
                target[property] = expandObjectArray(target[property], source[property]);

                if (target[property].length === 0) delete target[property];

            } else if (isObject(source[property]) && isObject(target[property])) {

                overwriteOrDeleteProperties(target[property], source[property], []);
                if (isEmpty(target[property])) delete target[property];

            } else if (isObject(source[property]) && target[property] === undefined) {

                if (values(source[property]).filter(isnt(null)).length > 0) {
                    target[property] = source[property];
                }

            } else target[property] = source[property];

            return target;
        }, target ? target : {});
}


function expandObjectArray(target: Array<any>, source: Array<any>) {

    keys(source).forEach(index => {

        // This can happen if deletions are not permitted and
        // null values got collapsed via preprocessFields
        if (source[index] === undefined) {
            // make the slot so array will not be sparse
            if (target[index] === undefined) target[index] = null;
            return;
        } else if (source[index] === null) {
            target[index] = null;
            return;
        }

        if (target[index] === undefined && isObject(source[index])) target[index] = {};

        if (isObject(source[index]) && isObject(target[index])) {
            overwriteOrDeleteProperties(target[index], source[index], []);
        } else {
            target[index] = source[index];
        }

        if (isObject(target[index]) && keys(target[index]).length === 0) target[index] = null;
    });

    const result = dropRightWhile(is(null))(target);
    if (result.includes(null)) throw [ImportErrors.EMPTY_SLOTS_IN_ARRAYS_FORBIDDEN];
    return result;
}