import { Map } from 'tsfun';
import { addRelations } from '../../../src/configuration/boot';
import { LibraryCategoryDefinition } from '../../../src/configuration/model';
import { RelationDefinition } from '../../../src/model';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('addRelations', () => {

    let configuration;
    let t1: LibraryCategoryDefinition;

    beforeEach(() => {

        t1 = {
            categoryName: 'x1',
            commons: [],
            parent: 'x',
            description: { 'de': '' },
            createdBy: '',
            creationDate: '',
            color: 'white',
            valuelists: {},
            groups: [],
            fields: {
                'aField': {}
            }
        } as LibraryCategoryDefinition;

        configuration = [
            { 'T1': t1 } as Map<LibraryCategoryDefinition>,
            []
        ];
    });


    it('add an extra relation', () => {

        const extraRelation: RelationDefinition = {
            name: 'R',
            domain: ['domainA'],
            range : ['rangeA'],
            editable: false,
            inputType: 'relation'
        };
        configuration.relations = [];

        const [, relations] = addRelations([extraRelation])(configuration);

        expect(relations[0].name).toBe('R');
        expect(relations[1]).toBe(undefined); // to prevent reintroducing bug
    });


    it('overwrite relation for a part of a domain', () => {

        const r1: RelationDefinition = {
            name: 'R',
            domain: ['domainA', 'domainB', 'domainC'],
            range : ['rangeA'],
            editable: false,
            inputType: 'relation'
        };

        const r2: RelationDefinition = {
            name: 'R',
            domain: ['domainB', 'domainC'],
            range : ['rangeB'],
            editable: false,
            inputType: 'relation'
        };

        configuration = [{ T1: t1 }, []];

        const [, relations] = addRelations([r1, r2])(configuration);
        expect(relations[0].domain).toContain('domainB');
        expect(relations[0].domain).toContain('domainC');
        expect(relations[0].range).toContain('rangeB');

        expect(relations[1].domain).toContain('domainA');
        expect(relations[1].range).toContain('rangeA');
    });


    it('overwrite relation with inheritance for a part of a domain', () => {

        const r1: RelationDefinition = {
            name: 'R',
            domain: ['T1:inherit'],
            range : ['rangeA'],
            editable: false,
            inputType: 'relation'
        };

        const r2: RelationDefinition = {
            name: 'R',
            domain: ['T1:inherit'],
            range: ['rangeA', 'rangeB', 'rangeC'],
            editable: false,
            inputType: 'relation'
        };

        configuration = [{ T1: t1 }, []];

        const [, relations] = addRelations([r1, r2])(configuration);

        expect(relations.length).toEqual(1); // to make sure the relation is collapsed into one
        expect(relations[0].range).toContain('rangeA');
        expect(relations[0].range).toContain('rangeB');
        expect(relations[0].range).toContain('rangeC');
    });


    it('replace range ALL with all categories except the domain categories', () => {

        const r: RelationDefinition = {
            name: 'R',
            domain: ['T2', 'T3'],
            range: [],
            editable: false,
            inputType: 'relation'
        };

        configuration.relations = [];

        const [, relations] = addRelations([r])(configuration);

        expect(relations[0].range[0]).toBe('T1');
        expect(relations[0].range[1]).toBe(undefined);
    });


    it('should replace domain ALL with all categories except the range categories', () => {

        const r: RelationDefinition = {
            name: 'R',
            domain: [],
            range: ['T2', 'T3'],
            editable: false,
            inputType: 'relation'
        };

        configuration.relations = [];

        const [, relations] = addRelations([r])(configuration);

        expect(relations[0].domain[0]).toBe('T1');
        expect(relations[0].domain[1]).toBe(undefined);
    });


    it('should replace range :inherit with all subcategories', () => {

        const r: RelationDefinition = { name: 'R',
            domain: [ 'T3' ],
            range: [ 'T1:inherit' ],
            editable: false,
            inputType: 'relation'
        };

        configuration[1] = [];
        configuration[0]['T2'] = { fields: {}, parent: 'T1' };
        configuration[0]['T3'] = { fields: {} };

        const [, relations] = addRelations([r])(configuration);

        expect(relations[0].range.indexOf('T1')).not.toBe(-1);
        expect(relations[0].range.indexOf('T2')).not.toBe(-1);
        expect(relations[0].range.indexOf('T1:inherit')).toBe(-1);
        expect(relations[0].domain[0]).toBe('T3');
    });


    it('should replace domain :inherit with all subcategories', () => {

        const r: RelationDefinition = {
            name: 'R',
            domain: ['T1:inherit'],
            range: ['T3'],
            editable: false,
            inputType: 'relation'
        };

        configuration[1] = [];
        configuration[0]['T2'] = { fields: {}, parent: 'T1' };
        configuration[0]['T3'] = { fields: {} };

        const [, relations] = addRelations([r])(configuration);

        expect(relations[0].domain.indexOf('T1')).not.toBe(-1);
        expect(relations[0].domain.indexOf('T2')).not.toBe(-1);
        expect(relations[0].domain.indexOf('T1:inherit')).toBe(-1);
        expect(relations[0].range[0]).toBe('T3');
    });


    // This test can detect problems coming from a wrong order of expandInherits and expandAllMarker calls
    it('should exclude the category and subcategories when using :inherit and total range', () => {

        const r: RelationDefinition = {
            name: 'R',
            domain: ['T1:inherit'],
            range: [],
            editable: false,
            inputType: 'relation'
        };

        configuration[1] = [];
        configuration[0]['T2'] = { fields: {}, parent: 'T1' };
        configuration[0]['T3'] = { fields: {} };
        const [, relations] = addRelations([r])(configuration);

        expect(relations[0].range[0]).toBe('T3');
        expect(relations[0].range.indexOf('T1')).toBe(-1);
        expect(relations[0].range.indexOf('T2')).toBe(-1);
    });
});
