import {arrayList, compose, drop, flatMap, flow, identity, includedIn, indices, is, isDefined, isNot,
    isnt, on, range, reduce, reverse, take, to, cond, val} from 'tsfun';
import {Dating, Dimension, FieldResource} from 'idai-components-2';
import {clone} from '../util/object-util';
import {fillUpToSize} from './export-helper';
import {HIERARCHICAL_RELATIONS} from '../model/relation-constants';
import {FieldDefinition} from '../configuration/model/field-definition';


/**
 * @author Daniel de Oliveira
 */
export module CSVExport {

    const EMPTY = '';
    const SEPARATOR = ',';
    const OBJECT_SEPARATOR = '.';
    export const ARRAY_SEPARATOR = ';';

    const RELATIONS_IS_RECORDED_IN = 'relations.isRecordedIn';
    const RELATIONS_IS_CHILD_OF = 'relations.isChildOf';
    const RELATIONS_LIES_WITHIN = 'relations.liesWithin';

    const H = 0;
    const M = 1;
    type Cell = string;
    type Heading = string;
    type HeadingsAndMatrix = [Heading[], Cell[][]];


    /**
     * Creates a header line and lines for each record.
     * If resources is empty, still a header line gets created.
     *
     * @param resources
     * @param fieldDefinitions
     * @param relations
     */
    export function createExportable(resources: Array<FieldResource>,
                                     fieldDefinitions: Array<FieldDefinition>,
                                     relations: Array<string>) {

        const headings: string[] = makeHeadings(fieldDefinitions, relations);
        const matrix = resources
            .map(toDocumentWithFlattenedRelations)
            .map(toRowsArrangedBy(headings));

        return flow([headings, matrix],
            expandDating,
            expandDimension(fieldDefinitions),
            combine);
    }


    function combine(headingsAndMatrix: HeadingsAndMatrix) {

        return [headingsAndMatrix[H]].concat(headingsAndMatrix[M]).map(toCsvLine);
    }


    const expandDatingItems = expandHomogeneousItems(rowsWithDatingElementsExpanded, 9);

    const expandDimensionItems = expandHomogeneousItems(rowsWithDimensionElementsExpanded, 7);

    const expandLevelOne =
        (columnIndex: number, widthOfNewItem: number) => expandHomogeneousItems(identity, widthOfNewItem)(columnIndex, 1);


    function expandDating(headingsAndMatrix: HeadingsAndMatrix) {

        const indexOfDatingElement = headingsAndMatrix[H].indexOf('dating');
        if (indexOfDatingElement === -1) return headingsAndMatrix;

        return expand(
            expandDatingHeadings,
            expandDatingItems,
            headingsAndMatrix)([indexOfDatingElement]);
    }


    function expandDimension(fieldDefinitions: Array<FieldDefinition>) {

        const getDimensionIndices = getIndices(fieldDefinitions, 'dimension');

        return (headings_and_matrix: HeadingsAndMatrix) => {

            const dimensionIndices = reverse(getDimensionIndices(headings_and_matrix[H]));

            return expand(
                    expandDimensionHeadings,
                    expandDimensionItems,
                    headings_and_matrix
                )(dimensionIndices);
        }
    }


    function getIndices(fieldDefinitions: Array<FieldDefinition>, inputType: string) {

        return indices((heading: string) => {

                if (heading.includes(OBJECT_SEPARATOR)) return false;
                const field = fieldDefinitions.find(on('name', is(heading)));
                if (!field) return false;

                return field.inputType === inputType;
            });
    }


    /**
     * Returns a function that when provided an array of columnIndices,
     * expands headingsAndMatrix at the columns, assuming that
     * these columns contain array values.
     *
     * For example:
     *
     * [['h1', 'h2'],
     *  [[7,   [{b: 2}, {b: 3}],
     *   [8,   [{b: 5}]]]
     *
     * Expanding at index 1, with appropriate expansion functions we can transform into
     *
     * [['h1', 'h2.0.b', 'h2.1.b'],
     *  [[7,   2       , 3],
     *   [8,   5,      , undefined]]]
     *
     * @param expandHeadings
     * @param expandLevelTwo
     * @param headingsAndMatrix
     */
    function expand(expandHeadings: (numItems: number) => (fieldName: string) => string[],
                    expandLevelTwo: (where: number, nrOfNewItems: number) => (itms: any[]) => any[],
                    headingsAndMatrix: HeadingsAndMatrix) {

        return reduce((headingsAndMatrix: HeadingsAndMatrix, columnIndex: number) => {

                const max = Math.max(1, getMax(columnIndex)(headingsAndMatrix[M]));

                const expandedHeader = replaceItem(columnIndex, expandHeadings(max))(headingsAndMatrix[H]);
                const expandedRows   = headingsAndMatrix[M]
                    .map(expandLevelOne(columnIndex, max))
                    .map(expandLevelTwo(columnIndex, max));

                return [expandedHeader, expandedRows];

            }, headingsAndMatrix);
    }


    function getMax(columnIndex: any) {

        return reduce((max: number, row: any) =>

                Math.max(
                    max,
                    row[columnIndex]
                        ? row[columnIndex].length
                        : 0)

            , 0);
    }


    function makeHeadings(fieldDefinitions: Array<FieldDefinition>, relations: string[]) {

        const fieldNames = insertDropdownRangeEnds(makeFieldNamesList(fieldDefinitions), fieldDefinitions);

        return fieldNames
            .concat(
                relations
                    .filter(isNot(includedIn(HIERARCHICAL_RELATIONS.ALL)))
                    .map(relation => 'relations.' + relation))
            .concat(relations.find(includedIn(HIERARCHICAL_RELATIONS.ALL)) ? [RELATIONS_IS_CHILD_OF] : []);
    }


    function insertDropdownRangeEnds(fieldNames: string[], fieldDefinitions: Array<FieldDefinition>) {

        const dropdownRangeIndices = getIndices(fieldDefinitions, 'dropdownRange')(fieldNames);

        return reverse(dropdownRangeIndices)
            .reduce(
                (fieldNamesList, index) => replaceItem(index, name => [name, name + 'End'])(fieldNamesList) as string[],
                fieldNames);
    }


    function expandDatingHeadings(n: number) { return (fieldName: string) => {

        return flatMap<any>((i: number) => [
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'type',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'begin.inputType',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'begin.inputYear',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'end.inputType',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'end.inputYear',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'margin',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'source',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'isImprecise',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'isUncertain']
            )(range(n));
    }}


    function expandDimensionHeadings(n:number) { return (fieldName: string) => {

        return flatMap<any>((i: number) => [
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'inputValue',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'inputRangeEndValue',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'measurementPosition',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'measurementComment',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'inputUnit',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'isImprecise',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'isRange']
            )(range(n));
    }}


    function rowsWithDatingElementsExpanded(dating: Dating): string[] {

        const {type, begin, end, margin, source, isImprecise, isUncertain} = dating;

        const expandedDating = [
            type ? type : '',
            begin && begin.inputType ? begin.inputType : '',
            begin && begin.inputYear ? begin.inputYear.toString() : '',
            end && end.inputType ? end.inputType : '',
            end && end.inputYear ? end.inputYear.toString() : '',
            margin ? margin.toString() : '',
            source ? source : ''];

        if (isImprecise !== undefined) expandedDating.push(isImprecise ? 'true' : 'false');
        if (isUncertain !== undefined) expandedDating.push(isUncertain ? 'true' : 'false');

        return expandedDating;
    }


    function rowsWithDimensionElementsExpanded(dimension: Dimension): string[] {

        const {inputValue, inputRangeEndValue, measurementPosition, measurementComment,
            inputUnit, isImprecise, isRange} = dimension;

        const expandedDimension = [
            inputValue ? inputValue.toString() : '',
            inputRangeEndValue ? inputRangeEndValue.toString() : '',
            measurementPosition ? measurementPosition : '',
            measurementComment ? measurementComment : '',
            inputUnit ? inputUnit : ''];

        if (isImprecise !== undefined) expandedDimension.push(isImprecise ? 'true' : 'false');
        if (isRange !== undefined) expandedDimension.push(isRange ? 'true' : 'false');

        return expandedDimension;
    }


    /**
     * Takes itms, for example [A,B,C,D,E]
     * and replaces one or more entries by a number of same-structured entries.
     *
     * Lets assume where is 2, nrOfNewItems is 2 and widthOfEachNewitem is 2, then
     * we get
     * [A,B,R1a,R1b,R2a,R2b,E]
     * where the R1 entries replace the C entry
     *   and the R2 entries replace the D enty
     *
     * @param widthOfEachNewItem
     * @param computeReplacement should return an array of size widthOfEachNewItem
     */
    function expandHomogeneousItems(computeReplacement: (removed: any) => any[],
                                    widthOfEachNewItem: number) {
        /**
         * @param where
         * @param nrOfNewItems
         */
        return (where: number, nrOfNewItems: number) => {

            return replaceItems(
                where,
                nrOfNewItems,
                flatMap(compose(
                    cond(isDefined, computeReplacement, val([])),
                    fillUpToSize(widthOfEachNewItem, EMPTY))));
        }
    }


    function replaceItem<A>(where: number,
                            replace: (_: A) => A[]) {

        return replaceItems(where, 1,
            (items: any[]) =>
                items.length === 0
                    ? []
                    : replace(items[0]));
    }


    function replaceItems<A>(where: number,
                             nrOfNewItems: number,
                             replace: (_: A[]) => A[]) {

        /**
         * @param itms
         */
        return (itms: A[]) => {

            const replacements =
                flow(itms,
                    drop(where),
                    take(nrOfNewItems),
                    replace);

            return take(where)(itms)
                .concat(replacements)
                .concat(drop(where + nrOfNewItems)(itms));
        }
    }


    /**
     * resource.relations = { someRel: ['val1', 'val2] }
     * ->
     * resource['relations.someRel'] = 'val1; val2'
     *
     * @param resource
     * @returns a new resource instance, where relations are turned into fields.
     */
    function toDocumentWithFlattenedRelations(resource: FieldResource): FieldResource {

        const cloned = clone(resource); // so we can modify in place

        if (!cloned.relations) return cloned;
        for (let relation of Object.keys(cloned.relations)) {
            cloned['relations.' + relation] = cloned.relations[relation].join(ARRAY_SEPARATOR);
        }
        delete cloned.relations;

        if (cloned[RELATIONS_LIES_WITHIN]) {
            delete cloned[RELATIONS_IS_RECORDED_IN];
            cloned[RELATIONS_IS_CHILD_OF] = cloned[RELATIONS_LIES_WITHIN];
        }
        else if (cloned[RELATIONS_IS_RECORDED_IN]) {
            cloned[RELATIONS_IS_CHILD_OF] = cloned[RELATIONS_IS_RECORDED_IN];
            delete cloned[RELATIONS_IS_RECORDED_IN];
        }

        return cloned;
    }


    function toRowsArrangedBy(headings: Heading[]) { return (resource: FieldResource) => {

        const row = arrayList(headings.length);

        return getUsableFieldNames(Object.keys(resource))
            .reduce((row, fieldName) => {

                const indexOfFoundElement = headings.indexOf(fieldName);
                if (indexOfFoundElement !== -1) row[indexOfFoundElement] = (resource as any)[fieldName];

                return row;
            }, row);
    }}


    function makeFieldNamesList(fieldDefinitions: Array<FieldDefinition>): string[] {

        let fieldNames: string[] = getUsableFieldNames(fieldDefinitions.map(to('name')));
        const indexOfShortDescription = fieldNames.indexOf('shortDescription');
        if (indexOfShortDescription !== -1) {
            fieldNames.splice(indexOfShortDescription, 1);
            fieldNames.unshift('shortDescription');
        }
        fieldNames = fieldNames.filter(isnt('identifier'));
        fieldNames.unshift('identifier');

        return fieldNames;
    }


    function getUsableFieldNames(fieldNames: string[]): string[] {

        return fieldNames.filter(isNot(includedIn(
            ['id', 'type', 'geometry', 'georeference', 'originalFilename', 'filename']
        )));
    }


    function toCsvLine(fields: string[]): string {

        const wrapContents  = (field: string) => '"' + getFieldValue(field) + '"';
        const createEmptyField = val('""');

        return fields
            .map(cond(isDefined, wrapContents, createEmptyField))
            .join(SEPARATOR);
    }


    function getFieldValue(field: any): string {

        const value: string = Array.isArray(field)
            ? field.join(ARRAY_SEPARATOR)
            : field + '';   // Convert numbers to strings

        return value.replace(new RegExp('"', 'g'), '""');
    }
}