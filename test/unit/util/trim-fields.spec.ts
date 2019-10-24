import {Resource} from 'idai-components-2';
import {trimFields} from '../../../app/core/util/trim-fields';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('trim fields', () => {

    it('strip whitespace from start & end of field values', () => {

        const resource: Resource = {
            id: '1',
            identifier: 'resource1',
            type: 'Trench',
            relations: {},
            field1: '    ABC',
            field2: 'ABC    ',
            field3: '    ABC    ',
            field4: ' ABC DEF  GHI '
        };

        trimFields(resource);

        expect(resource.field1).toEqual('ABC');
        expect(resource.field2).toEqual('ABC');
        expect(resource.field3).toEqual('ABC');
        expect(resource.field4).toEqual('ABC DEF  GHI');
    });


    it('strip whitespace from start & end of strings in nested objects', () => {

        const resource: Resource = {
            id: '1',
            identifier: 'resource1',
            type: 'Trench',
            relations: {},
            field: {
                subfield1: '    ABC DEF    ',
                subfield2: '    ABC    ',
            }
        };

        trimFields(resource);

        expect(resource.field.subfield1).toEqual('ABC DEF');
        expect(resource.field.subfield2).toEqual('ABC');
    });


    it('strip whitespace from start & end of strings in nested objects', () => {

        const resource: Resource = {
            id: '1',
            identifier: 'resource1',
            type: 'Trench',
            relations: {},
            fields: [{
                subfield1: '    ABC',
                subfield2: 'ABC    '
            }, {
                subfield1: '    ABC    ',
                subfield2: ' ABC DEF  GHI '
            }]
        };

        trimFields(resource);

        expect(resource.fields[0].subfield1).toEqual('ABC');
        expect(resource.fields[0].subfield2).toEqual('ABC');
        expect(resource.fields[1].subfield1).toEqual('ABC');
        expect(resource.fields[1].subfield2).toEqual('ABC DEF  GHI');
    });
});