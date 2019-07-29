import {FieldDocument} from 'idai-components-2';
import {IdigCsvParser} from '../../app/core/import/parser/idig-csv-parser';
import {ParserErrors} from '../../app/core/import/parser/parser-errors';

/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
// export function main() {


describe('IdigCsvParser', () => {

    beforeEach(
        function() {
            spyOn(console, 'error'); // to suppress console.error output
        }
    );

/*
    it('should create documents from file content', (done) => {

        let fileContent = 'IdentifierUUID,Identifier,Title,Type\n'
            + '1,one,One,Context\n'
            + '2,two,Two,Context\n';

        let parse = IdigCsvParser.parse;
        let documents: Array<FieldDocument> = [];
        parse(fileContent).subscribe(resultDocument => {
            expect(resultDocument).not.toBe(undefined);
            documents.push(resultDocument as FieldDocument);
        }, (err) => {
            console.error(err);
            fail();
        }, () => {
            expect(documents.length).toBe(2);
            // expect(parser.getWarnings().length).toBe(0);
            expect(documents[0].resource.id).toEqual('1');
            expect(documents[0].resource.type).toEqual('Context');
            expect(documents[1].resource.shortDescription).toEqual('Two');
            done();
        });

    });

    it('should abort on syntax errs in file content', (done) => {

        let fileContent = 'IdentifierUUID,Identifier,Title,Type\n'
            + '1,one,One,Context\n'
            + ',two,Two,Context\n';

        let parse = IdigCsvParser.parse;
        let documents: Array<FieldDocument> = [];
        parse(fileContent).subscribe(resultDocument => {
            expect(resultDocument).not.toBe(undefined);
            documents.push(resultDocument as FieldDocument);
        }, (msgWithParams) => {
            expect(documents.length).toBe(1);
            expect(documents[0].resource.id).toEqual('1');
            expect(msgWithParams).toEqual([ParserErrors.MANDATORY_CSV_FIELD_MISSING, 2, 'IdentifierUUID']);
            done();
        });

    });

    it('should parse point, polygon and multipolygon geometries', (done) => {

        let fileContent = 'IdentifierUUID	Identifier	Title	Type	CoverageUnion\n'
            + '1	one	One	Context	POINT ((416,361 354,404))\n'
            + '2	two	Two	Context	POLYGON ((415,732 354,88, 416,982 353,988, 416,227 352,992, 415,732 354,88))\n'
            + '3	three	Three	Context	MULTIPOLYGON ((407,259 356,711, 407,25 356,417, 407,29 356,430, '
            + '407,259 356,711), (406,432 356,684, 406,46 356,698, 406,50 356,690, 406,432 356,684))\n';

        let parse = IdigCsvParser.parse;
        let documents: Array<FieldDocument> = [];
        parse(fileContent).subscribe(resultDocument => {
            expect(resultDocument).not.toBe(undefined);
            documents.push(resultDocument as FieldDocument);
        }, (err) => {
            console.error(err);
            fail();
        }, () => {
            expect(documents.length).toBe(3);
            // expect(parser.getWarnings().length).toBe(0);
            expect(documents[0].resource.geometry.type).toEqual('Point');
            expect(documents[0].resource.geometry.coordinates).toEqual([416.361, 354.404]);
            expect(documents[1].resource.geometry.type).toEqual('Polygon');
            expect(documents[1].resource.geometry.coordinates).toEqual(
                [[[415.732, 354.88], [416.982, 353.988], [416.227, 352.992], [415.732, 354.88]]]);
            done();
            expect(documents[2].resource.geometry.type).toEqual('MultiPolygon');
            expect(documents[2].resource.geometry.coordinates).toEqual(
                [[[[407.259, 356.711], [407.25, 356.417], [407.29, 356.430], [407.259, 356.711]]],
                    [[[406.432, 356.684], [406.46, 356.698], [406.50, 356.690], [406.432, 356.684]]]]);
            done();
        });

    });

    it('should abort on invalid geometries', (done) => {

        let fileContent = 'IdentifierUUID	Identifier	Title	Type	CoverageUnion\n'
            + '1	one	One	Context	POINT ((416,361 354,404))\n'
            + '2	two	Two	Context	POINT ((416,361 354,404 354,404))\n';

        let parse = IdigCsvParser.parse;
        let documents: Array<FieldDocument> = [];
        parse(fileContent).subscribe(resultDocument => {
            expect(resultDocument).not.toBe(undefined);
            documents.push(resultDocument as FieldDocument);
        }, (err) => {
            expect(documents.length).toBe(1);
            expect(documents[0].resource.id).toEqual('1');
            expect(err).toEqual([ParserErrors.INVALID_GEOMETRY, 2]);
            done();
        });

    });*/
});
