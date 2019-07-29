/**
 * @author Daniel de Oliveira
 */
import {MeninxFindCsvParser} from '../../app/core/import/parser/meninx-find-csv-parser';


xdescribe('MeninxCsvParser', () => {

    it('abc', async done => {

        const fileContent = 'se,id,description\n'
            + '1001,1,hallohallo1\n'
            + '1001,2,hallohallo2\n';

        const documents = [];
        MeninxFindCsvParser.parse(fileContent).then((documents) => {

            expect(documents[0].resource.identifier).toEqual('1001-1');
            expect(documents[1].resource.identifier).toEqual('1001-2');
            expect(documents[0].resource.relations.liesWithin[0]).toEqual('1001');
            expect(documents[1].resource.relations.liesWithin[0]).toEqual('1001');
            done();
        });
    });
});
