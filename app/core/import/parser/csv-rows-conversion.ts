import {reduce, map, ObjectStruct, arrayList} from 'tsfun';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module CsvRowsConversion {

    const PATH_SEPARATOR = '.';

    type Field = string;


    export function parse(separator: string) {

        return (content: string): Array<ObjectStruct> => {

            const rows: string[][] = getRows(content, separator);
            if (rows.length < 0) return [];
            const headings: string[] = rows.shift() as string[];
            return map((row: string[]) => convertRowToStruct(headings, row))(rows);
        }
    }


    function convertRowToStruct(headings: string[], row: string[]): any {

        return reduce((struct, fieldOfRow, i: number) => {
            insertFieldIntoDocument(struct, headings[i], fieldOfRow);
            return struct as ObjectStruct;
        }, {})(row);
    }


    const convertIfEmpty = (val: string) => val === '' ? null : val;


    function insertFieldIntoDocument(struct: any, fieldOfHeading: string, fieldOfRow: any) {

        if (fieldOfHeading.includes(PATH_SEPARATOR)) {
            implodePaths(struct, fieldOfHeading.split(PATH_SEPARATOR), fieldOfRow);
        } else {
            (struct as any)[fieldOfHeading] = convertIfEmpty(fieldOfRow);
        }
    }


    function implodePaths(currentSegmentObject: any, pathSegments: any[], val: any) {

        let index = parseInt(pathSegments[0]);
        if (isNaN(index)) index = pathSegments[0];

        if (pathSegments.length < 2) {
            currentSegmentObject[index] = convertIfEmpty(val);
            return;
        }

        const nextIndex = parseInt(pathSegments[1]);
        const newItem = isNaN(nextIndex) ? {} : arrayList(nextIndex + 1);

        if (!currentSegmentObject[index]) currentSegmentObject[index] = newItem;

        pathSegments.shift();
        implodePaths(currentSegmentObject[index], pathSegments, val);
    }


    function getRows(content: string, separator: string): Field[][] {

        let rows: string[][] = [];
        let currentRow: string[] = [];
        let currentField: string = '';

        let inQuotes: boolean = false;
        let lastCharacter: 'quote'|'linebreak'|'other' = 'other';

        for (let character of content) {
            switch(character) {
                case '"':
                    if (lastCharacter === 'quote') {
                        currentField += '"';
                        lastCharacter = 'other';
                    } else {
                        lastCharacter = 'quote';
                    }
                    break;
                case separator:
                    if (lastCharacter === 'quote') inQuotes = !inQuotes;
                    if (inQuotes) {
                        currentField += separator;
                    } else {
                        addFieldToRow(currentField, currentRow);
                        currentField = '';
                    }
                    lastCharacter = 'other';
                    break;
                case '\n':
                case '\r':
                    if (lastCharacter === 'quote') inQuotes = !inQuotes;
                    if (lastCharacter !== 'linebreak') {
                        if (inQuotes) {
                            currentField += '\n';
                        } else {
                            addFieldToRow(currentField, currentRow);
                            rows.push(currentRow);
                            currentField = '';
                            currentRow = [];
                        }
                        lastCharacter = 'linebreak';
                    }
                    break;
                default:
                    if (lastCharacter === 'quote') inQuotes = !inQuotes;
                    lastCharacter = 'other';
                    currentField += character;
                    break;
            }
        }

        if (lastCharacter !== 'linebreak') addFieldToRow(currentField, currentRow);
        if (currentRow.length > 0) rows.push(currentRow);

        return rows;
    }


    function addFieldToRow(field: string, row: string[]) {

        if (field === '"') field = '';
        row.push(field);
    }
}