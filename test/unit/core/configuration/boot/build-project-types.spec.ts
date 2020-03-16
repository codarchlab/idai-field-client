import {Map} from 'tsfun';
import {buildProjectTypes} from '../../../../../app/core/configuration/boot/build-project-types';
import {ConfigurationErrors} from '../../../../../app/core/configuration/boot/configuration-errors';
import {FieldDefinition} from '../../../../../app/core/configuration/model/field-definition';
import {Group} from '../../../../../app/core/model/group-util';
import {CustomTypeDefinition} from '../../../../../app/core/configuration/model/custom-type-definition';
import {BuiltinTypeDefinition} from '../../../../../app/core/configuration/model/builtin-type-definition';
import {LibraryTypeDefinition} from '../../../../../app/core/configuration/model/library-type-definition';
import {ValuelistDefinition} from '../../../../../app/core/configuration/model/valuelist-definition';


describe('buildProjectTypes', () => {

    it('auto-select parent if child defined',  () => {

        const builtInTypes: Map<BuiltinTypeDefinition> = {
            A: {
                superType: true,
                userDefinedSubtypesAllowed: true,
                fields: {}
            }
        };
        const customTypes: Map<CustomTypeDefinition> = {
            B: {
                parent: 'A',
                fields: {},
                hidden: []
            }
        };
        const result = buildProjectTypes(
            builtInTypes,
            {},
            customTypes);

        expect(result['A']).toBeDefined();
        expect(result['B']).toBeDefined();
    });


    it('throw away type which is neither selected explicitly or as a parent',  () => {

        const builtInTypes: Map<BuiltinTypeDefinition> = {
            A: {
                superType: true,
                userDefinedSubtypesAllowed: true,
                fields: {}
            },
            C: {
                fields: {}
            }
        };
        const customTypes: Map<CustomTypeDefinition> = {
            B: {
                parent: 'A',
                fields: {},
                hidden: []
            }
        };
        const result = buildProjectTypes(
            builtInTypes,
            {},
            customTypes);

        expect(result['A']).toBeDefined();
        expect(result['B']).toBeDefined();
        expect(result['C']).toBeUndefined();
    });


    it('hide fields', () => {

        const builtInTypes: Map<BuiltinTypeDefinition> = {
            A: {
                fields: {
                    field1: { inputType: 'input' },
                    field2: { inputType: 'input' }
                }
            }
        };
        const libraryTypes: Map<LibraryTypeDefinition> = {
            A: {
                typeFamily: 'A',
                commons: ['aCommonField', 'bCommonField'],
                valuelists: {},
                fields: {
                    field3: { inputType: 'input' },
                    field4: { inputType: 'input' }
                },
                creationDate: '', createdBy: '', description: {}
            }
        };
        const customTypes = {
            A: {
                fields: {},
                hidden: ['field1', 'aCommonField', 'field3']
            }
        };
        const commonFields = {
            aCommonField: { inputType: 'input' },
            bCommonField: { inputType: 'input' }
        };

        const result = buildProjectTypes(
            builtInTypes,
            libraryTypes,
            customTypes,
            commonFields);

        expect(result['A']['fields']['field1'].visible).toBe(false);
        expect(result['A']['fields']['field2'].visible).toBe(true);
        expect(result['A']['fields']['field3'].visible).toBe(false);
        expect(result['A']['fields']['field4'].visible).toBe(true);
        expect(result['A']['fields']['aCommonField'].visible).toBe(false);
        expect(result['A']['fields']['bCommonField'].visible).toBe(true);
    });


    it('valuelistId - provided via valuelists property in custom type', () => {

        const builtInTypes: Map<BuiltinTypeDefinition> = { A: { fields: { aField: { inputType: 'dropdown' }} }};
        const libraryTypes: Map<LibraryTypeDefinition> = {};
        const customTypes: Map<CustomTypeDefinition> = {
            'A': {
                fields: {},
                valuelists: { aField: 'aField-valuelist-id-1' }
            }
        };

        const result = buildProjectTypes(
            builtInTypes,
            libraryTypes,
            customTypes,
            {},
            { 'aField-valuelist-id-1': { values: { a: {} }, description: {}, createdBy: '', creationDate: '' }});

        expect(result['A'].fields['aField']['valuelist']['values']).toEqual({ a: {} });
    });


    it('valuelistId - overwrite valuelists property in custom type, extending a library type - for a common field', () => {

        const builtInTypes: Map<BuiltinTypeDefinition> = {
            A: { fields: {} }};
        const libraryTypes: Map<LibraryTypeDefinition> = {
            'A:default': {
                commons: ['aCommon'],
                valuelists: { aCommon: 'aCommon-valuelists-id-1' },
                creationDate: '', createdBy: '', description: {}, fields: {}, typeFamily: 'A'}
        };
        const commonFields = { aCommon: { group: 'stem', inputType: 'dropdown' }};
        const customTypes: Map<CustomTypeDefinition> = {
            'A:default': {
                commons: ['aCommon'],
                valuelists: { aCommon: 'aCommon-valuelist-id-2' },
                fields: { }
            }};

        const result = buildProjectTypes(
            builtInTypes,
            libraryTypes,
            customTypes,
            commonFields,
            { 'aCommon-valuelist-id-1': { values: { a: {} }, description: {}, createdBy: '', creationDate: '' },
              'aCommon-valuelist-id-2': { values: { b: {} }, description: {}, createdBy: '', creationDate: '' }});

        expect(result['A'].fields['aCommon']['valuelist']['values']).toEqual({ b: {} });
    });


    it('valuelistId - provided via valuelists property in library', () => {

        const builtInTypes: Map<BuiltinTypeDefinition> = { A: { fields: { aField: { inputType: 'dropdown' }} }};
        const libraryTypes: Map<LibraryTypeDefinition> = {
            'A:default': {
                valuelists: { aField: 'aField-valuelist-id-1' },
                typeFamily: 'A',
                commons: [],
                fields: {},
                description: {},
                createdBy: '',
                creationDate: ''
            }
        };
        const customTypes: Map<CustomTypeDefinition> = {
            'A:default': { fields: {}}
        };

        const result = buildProjectTypes(
                builtInTypes,
                libraryTypes,
                customTypes,
                {},
                { 'aField-valuelist-id-1': { values: { a: {}}, description: {}, creationDate: '', createdBy: '' }});

        expect(result['A'].fields['aField']['valuelist']['values']).toEqual({ a: {} });
    });


    it('valuelistId - nowhere provided - built in type selected', () => {

        const builtInTypes: Map<BuiltinTypeDefinition> = { A: { fields: { aField: { inputType: 'dropdown' }} }};
        const customTypes: Map<CustomTypeDefinition> = {
            'A': { fields: { aField: {}}}
        };

        try {
            buildProjectTypes(
                builtInTypes,
                {},
                customTypes,
                {},
                {},
                {});
            fail();
        } catch (expected) {
            expect(expected).toEqual([ConfigurationErrors.MISSING_FIELD_PROPERTY, 'valuelistId', 'A', 'aField']);
        }
    });


    it('valuelistId - nowhere provided - library type selected', () => {

        const builtInTypes: Map<BuiltinTypeDefinition> = { A: { fields: { aField: { inputType: 'dropdown' }} }};
        const libraryTypes: Map<LibraryTypeDefinition> = {
            'A:0': {
                typeFamily: 'A',
                commons: [],
                valuelists: {},
                fields: { aField: {} },
                createdBy: '',
                creationDate: '',
                description: {}
            },
        };
        const customTypes: Map<CustomTypeDefinition> = {
            'A:0': { fields: { aField: {}}}
        };

        try {
            buildProjectTypes(
                builtInTypes,
                libraryTypes,
                customTypes,
                {},
                {},
                {});
            fail();
        } catch (expected) {
            expect(expected).toEqual([ConfigurationErrors.MISSING_FIELD_PROPERTY, 'valuelistId', 'A:0', 'aField']);
        }
    });


    it('duplication in selection', () => {

        const builtinTypes: Map<BuiltinTypeDefinition> = { A: { fields: {} }};
        const libraryTypes: Map<LibraryTypeDefinition> = {
            'A:0': {
                typeFamily: 'A',
                commons: [],
                valuelists: {},
                fields: {},
                createdBy: '',
                creationDate: '',
                description: {}
            },
            'A:1': {
                typeFamily: 'A',
                commons: [],
                valuelists: {},
                fields: {},
                createdBy: '',
                creationDate: '',
                description: {}
            }
        };
        const customTypes: Map<CustomTypeDefinition> = {
            'A:0': {
                fields: {}
            },
            'A:1': {
                fields: {}
            }
        };

        try {
            buildProjectTypes(
                builtinTypes,
                libraryTypes,
                customTypes);
            fail();
        } catch (expected) {
            expect(expected).toEqual([ConfigurationErrors.DUPLICATION_IN_SELECTION, 'A']);
        }
    });


    it('duplication in selection - built in types create type family implicitely', () => {

        const builtinTypes: Map<BuiltinTypeDefinition> = { A: { fields: {} }};
        const libraryTypes: Map<LibraryTypeDefinition> = {
            'A:0': {
                typeFamily: 'A',
                commons: [],
                fields: {},
                valuelists: {},
                createdBy: '',
                creationDate: '',
                description: {}
            }
        };
        const customTypes: Map<CustomTypeDefinition> = {
            'A': { fields: {} },
            'A:0': { fields: {} }
        };

        try {
            buildProjectTypes(
                builtinTypes,
                libraryTypes,
                customTypes);
            fail();
        } catch (expected) {
            expect(expected).toEqual([ConfigurationErrors.DUPLICATION_IN_SELECTION, 'A']);
        }
    });


    it('type families - divergent input type', () => {

        const builtinTypes: Map<BuiltinTypeDefinition> = { A: { fields: {}}};
        const libraryTypes: Map<LibraryTypeDefinition> = {
            'A:0': {
                typeFamily: 'A',
                commons: [],
                valuelists: {},
                fields: { aField: { inputType: 'text' }},
                createdBy: '',
                creationDate: '',
                description: {}
            },
            'A:1': {
                typeFamily: 'A',
                commons: [],
                valuelists: {},
                fields: { aField: { inputType: 'input' }},
                createdBy: '',
                creationDate: '',
                description: {}
            }
        };

        try {
            buildProjectTypes(
                builtinTypes,
                libraryTypes);
            fail();
        } catch (expected) {
            expect(expected).toEqual([ConfigurationErrors.INCONSISTENT_TYPE_FAMILY,
                'A', 'divergentInputType', 'aField']);
        }
    });


    it('subtypes - user defined subtype not allowed', () => {

        const builtInTypes: Map<BuiltinTypeDefinition> = { A: { fields: {} }};
        const libraryTypes: Map<LibraryTypeDefinition> = {
            'B:0': {
                typeFamily: 'B',
                parent: 'A',
                fields: {},
                commons: [],
                createdBy: '',
                valuelists: {},
                creationDate: '',
                description: {}
            }};

        try {
            buildProjectTypes(
                builtInTypes,
                libraryTypes,
                {'B:0': {fields: {}}},
                {},
                {},
                {});
            fail();
        } catch (expected) {
            expect(expected).toEqual([ConfigurationErrors.TRYING_TO_SUBTYPE_A_NON_EXTENDABLE_TYPE, 'A']);
        }
    });


    it('commons - cannot set type of common in libary types', () => {

        const builtInTypes: Map<BuiltinTypeDefinition> = { A: { fields: {} }};
        const commonFields = { aCommon: { group: 'stem', inputType: 'input' }};
        const libraryTypes: Map<LibraryTypeDefinition> = {
            'A:0': {
                typeFamily: 'A',
                commons: [],
                fields: { aCommon: { inputType: 'input' } },
                createdBy: '',
                valuelists: {},
                creationDate: '',
                description: {}
            }};

        try {
            buildProjectTypes(
                builtInTypes,
                libraryTypes,
                { 'A:0': { fields: {} } },
                commonFields,
                {},
                {});
            fail();
        } catch (expected) {
            expect(expected).toEqual([ConfigurationErrors.MUST_NOT_SET_INPUT_TYPE, 'A:0', 'aCommon']);
        }
    });


    it('commons - cannot set type of common in custom types', () => {

        const builtInTypes: Map<BuiltinTypeDefinition> = { A: { fields: {} }};
        const commonFields = { aCommon: { group: 'stem', inputType: 'input' }};
        const customTypes: Map<CustomTypeDefinition> = {
            'A': { fields: { aCommon: { inputType: 'text' }}}
        };

        try {
            buildProjectTypes(
                builtInTypes,
                {},
                customTypes,
                commonFields,
                {},
                {});
            fail();
        } catch (expected) {
            expect(expected).toEqual([ConfigurationErrors.MUST_NOT_SET_INPUT_TYPE, 'A', 'aCommon']);
        }
    });


    it('commons - common field not provided', () => {

        const builtInTypes: Map<BuiltinTypeDefinition> = { A: { fields: {} }};
        const commonFields = {};
        const customTypes: Map<CustomTypeDefinition> = {
            A: { fields: {}, commons: ['missing']}
        };

        try {
            buildProjectTypes(
                builtInTypes,
                {},
                customTypes,
                commonFields,
                {},
                {});
            fail();
        } catch (expected) {
            expect(expected).toEqual([ConfigurationErrors.COMMON_FIELD_NOT_PROVIDED, 'missing']);
        }
    });


    it('commons - mix in commons in library type', () => {

        const builtInTypes: Map<BuiltinTypeDefinition> = { A: { fields: {} }};
        const commonFields = { aCommon: { group: 'stem', inputType: 'input' }};
        const libraryTypes: Map<LibraryTypeDefinition> = {
            'A:0': {
                typeFamily: 'A',
                commons: ['aCommon'],
                fields: { },
                valuelists: {},
                createdBy: '',
                creationDate: '',
                description: {}
            }};

        const result = buildProjectTypes(
            builtInTypes,
            libraryTypes,
            { 'A:0': { fields: {} } },
            commonFields,
            {},
            {});

        expect(result['A'].fields['aCommon']['group']).toBe('stem');
        expect(result['A'].fields['aCommon']['inputType']).toBe('input');
    });


    it('commons - mix in commons in custom type', () => {

        const builtInTypes: Map<BuiltinTypeDefinition> = { A: { fields: {} }};
        const commonFields = { aCommon: { group: 'stem', inputType: 'input' }};
        const customTypes: Map<CustomTypeDefinition> = {
            A: {
                commons: ['aCommon'],
                fields: { }
            }};

        const result = buildProjectTypes(
            builtInTypes,
            {},
            customTypes,
            commonFields,
            {},
            {});

        expect(result['A'].fields['aCommon']['group']).toBe('stem');
        expect(result['A'].fields['aCommon']['inputType']).toBe('input');
    });


    it('commons - add together commons from library and custom type', () => {

        const builtInTypes: Map<BuiltinTypeDefinition> = { A: { fields: {} }};
        const commonFields = {
            aCommon: { group: 'stem', inputType: 'input'},
            bCommon: { group: 'stem', inputType: 'input'}
        };
        const libraryTypes: Map<LibraryTypeDefinition> = {
            'A:0': {
                typeFamily: 'A',
                commons: ['aCommon'],
                fields: { },
                valuelists: {},
                createdBy: '',
                creationDate: '',
                description: {}
            }};
        const customTypes: Map<CustomTypeDefinition> = {
            'A:0': {
                commons: ['bCommon'],
                fields: { }
            }};

        const result = buildProjectTypes(
            builtInTypes,
            libraryTypes,
            customTypes,
            commonFields,
            {},
            {});

        expect(result['A'].fields['aCommon']['group']).toBe('stem');
        expect(result['A'].fields['aCommon']['inputType']).toBe('input');
        expect(result['A'].fields['bCommon']['group']).toBe('stem');
        expect(result['A'].fields['bCommon']['inputType']).toBe('input');
    });


    it('commons - use valuelistFromProjectField if defined in commons', () => {

        const builtInTypes: Map<BuiltinTypeDefinition> = { A: { fields: {} }};
        const commonFields = { aCommon:
                { group: 'stem', inputType: 'dropdown', valuelistFromProjectField: 'x' }
        };
        const libraryTypes: Map<LibraryTypeDefinition> = {
            'A:0': {
                typeFamily: 'A',
                commons: ['aCommon'],
                fields: { },
                valuelists: {},
                createdBy: '',
                creationDate: '',
                description: {}
            }};

        const result = buildProjectTypes(
            builtInTypes,
            libraryTypes,
            { 'A:0': { fields: {} } },
            commonFields,
            {},
            {});

        expect(result['A'].fields['aCommon']['group']).toBe('stem');
        expect(result['A'].fields['aCommon']['inputType']).toBe('dropdown');
        expect(result['A'].fields['aCommon']['valuelistFromProjectField']).toBe('x');
    });


    // err cases

    it('field property validation - invalid input Type', () => {

        const builtInTypes: Map<BuiltinTypeDefinition> = { A: { fields: {} }};
        const libraryTypes: Map<LibraryTypeDefinition> = {
            'A:0': {
                typeFamily: 'A',
                commons: [],
                valuelists: {},
                fields: { aField: { inputType: 'invalid' }},
                createdBy: '',
                creationDate: '',
                description: {}
            }};

        try {
            buildProjectTypes(
                builtInTypes,
                libraryTypes,
                {},
                [],
                {},
                {});
            fail();
        } catch (expected) {
            expect(expected).toEqual([ConfigurationErrors.ILLEGAL_FIELD_INPUT_TYPE, 'invalid', 'aField'])
        }
    });


    it('field property validation - missing input type in field of entirely new custom type', () => {

        const builtInTypes: Map<BuiltinTypeDefinition> = { A: { fields: {}, superType: true, userDefinedSubtypesAllowed: true }};
        const libraryTypes: Map<LibraryTypeDefinition> = {};
        const customTypes: Map<CustomTypeDefinition> = { 'C': { parent: 'A', fields: { cField: {} }}};

        try {
            buildProjectTypes(
                builtInTypes,
                libraryTypes,
                customTypes,
                {},
                {},
                {});
            fail();
        } catch (expected) {
            expect(expected).toEqual([ConfigurationErrors.MISSING_FIELD_PROPERTY, 'inputType', 'C', 'cField'])
        }
    });


    it('field property validation - missing input type in field of builtInType type - extension of supertype', () => {

        const builtInTypes: Map<BuiltinTypeDefinition> = {
            A: { fields: {} }
        };

        const libraryTypes: Map<LibraryTypeDefinition> = {
            'A:0': {
                typeFamily: 'A',
                commons: [],
                valuelists: {},
                fields: { aField: {} } as any,
                creationDate: '', createdBy: '', description: {}
            },
        };

        try {
            buildProjectTypes(builtInTypes,
                libraryTypes,
                {},  {}, {}, {});
            fail();
        } catch (expected) {
            expect(expected).toEqual([ConfigurationErrors.MISSING_FIELD_PROPERTY, 'inputType', 'A:0', 'aField'])
        }
    });


    it('field property validation  - extension of supertype - inputType inherited from builtIn', () => {

        const builtInTypes: Map<BuiltinTypeDefinition> = {
            A: { fields: { aField: { inputType: 'input' } } }
        };

        const libraryTypes: Map<LibraryTypeDefinition> = {
            'A:0': {
                typeFamily: 'A',
                commons: [],
                valuelists: {},
                fields: { aField: {} } as any,
                creationDate: '', createdBy: '', description: {}
            },
        };

        const result = buildProjectTypes(
            builtInTypes,
            libraryTypes,
                {'A:0': { hidden: [], fields: {} }}, {}, {}, {});

        expect(result['A'].fields['aField'].inputType).toBe('input');
    });


    it('field property validation - missing input type in field of library type - new subtype', () => {

        const builtInTypes: Map<BuiltinTypeDefinition> = {
            A: { fields: {}, superType: true, userDefinedSubtypesAllowed: true }
        };

        const libraryTypes: Map<LibraryTypeDefinition> = {
            'B:0': {
                typeFamily: 'B',
                parent: 'A',
                commons: [],
                valuelists: {},
                fields: { bField: {}} as any,
                creationDate: '', createdBy: '', description: {}
            },
        };

        try {
            buildProjectTypes(builtInTypes,
                libraryTypes,
                {}, {}, {}, {});
            fail();
        } catch (expected) {
            expect(expected).toEqual([ConfigurationErrors.MISSING_FIELD_PROPERTY, 'inputType', 'B:0', 'bField'])
        }
    });


    it('field property validation - must not set field type on inherited field', () => {

        const builtInTypes: Map<BuiltinTypeDefinition> = {
            A: { fields: { aField: { inputType: 'input' }} }
        };

        const libraryTypes: Map<LibraryTypeDefinition> = {
            'A:0': {
                typeFamily: 'A',
                commons: [],
                valuelists: {},
                fields: { aField: { inputType: 'input' }} as any,
                creationDate: '', createdBy: '', description: {}
            },
        };

        try {
            buildProjectTypes(builtInTypes,
                libraryTypes,
                {}, {}, {}, {});
            fail();
        } catch (expected) {
            expect(expected).toEqual([ConfigurationErrors.MUST_NOT_SET_INPUT_TYPE, 'A:0', 'aField'])
        }
    });


    it('field property validation - undefined property in library type field', () => {

        const builtInTypes: Map<BuiltinTypeDefinition> = {
            A: { fields: {} }
        };

        const libraryTypes: Map<LibraryTypeDefinition> = {
            'A:0': {
                typeFamily: 'A',
                commons: [],
                valuelists: {},
                fields: { aField: { group: 'a' }} as any,
                creationDate: '', createdBy: '', description: {}
            },
        };

        try {
            buildProjectTypes(builtInTypes,
                libraryTypes,
                {}, {}, {}, {});
            fail();
        } catch (expected) {
            expect(expected).toEqual([ConfigurationErrors.ILLEGAL_FIELD_PROPERTY, 'library', 'group'])
        }
    });


    it('field property validation - undefined property in custom type field', () => {

        const builtInTypes: Map<BuiltinTypeDefinition> = {
            A: { fields: {} }
        };

        const customTypes: Map<CustomTypeDefinition> = {
            'A': {
                fields: { aField: { group: 'a'} as any }
            }
        };

        try {
            buildProjectTypes(
                builtInTypes,
                {},
                customTypes, {}, {}, {});
            fail();
        } catch (expected) {
            expect(expected).toEqual([ConfigurationErrors.ILLEGAL_FIELD_PROPERTY, 'custom', 'group'])
        }
    });


    it('apply valuelistConfiguration', () => {

        const builtInTypes: Map<BuiltinTypeDefinition> = {
            A: {
                fields: {
                    field1: { inputType: 'input' }
                }
            }
        };

        const libraryTypes: Map<LibraryTypeDefinition>  = {
            'A:0': {
                typeFamily: 'A',
                commons: [],
                valuelists: { 'a1': '123'},
                fields: {
                    a1: { inputType: 'dropdown' },
                    a2: { inputType: 'input' },
                    a3: { inputType: 'input' }},
                creationDate: '',
                createdBy: '',
                description: {}
            }
        };

        const valuelistsConfiguration: Map<ValuelistDefinition> = {
            '123': { values: { 'one': {}, 'two': {}, 'three': {} }, description: {}, createdBy: '', creationDate: '' }
        };

        const result = buildProjectTypes(builtInTypes,
            libraryTypes,
            {'A:0':{ fields: {}}}, {}, valuelistsConfiguration, {});
        expect(result['A'].fields['a1'].valuelist.values).toEqual({
            one: {},
            two: {},
            three: {}
        });
    });


    it('missing description', () => {

        const builtinTypes = {};

        const libraryTypes: Map<LibraryTypeDefinition> = {
            'B:0': {
                fields: {}
            }
        } as any;

        try {
            buildProjectTypes(builtinTypes,
                libraryTypes,
                {}, {}, {}, {});
        } catch (expected) {
            expect(expected).toEqual([ConfigurationErrors.MISSING_TYPE_PROPERTY, 'description', 'B:0'])
        }
    });


    it('missing parent in library type', () => {

        const builtInTypes = {} as any;

        const libraryTypes: Map<LibraryTypeDefinition> = {
            'B:0': {
                typeFamily: 'B',
                commons: [],
                fields: {},
                createdBy: "",
                valuelists: {},
                creationDate: "",
                description: {}
            }
        };

        try {
            buildProjectTypes(builtInTypes,
                libraryTypes,
                {}, {}, {}, {});
        } catch (expected) {
            expect(expected).toEqual([ConfigurationErrors.MISSING_TYPE_PROPERTY, 'parent', 'B:0'])
        }
    });


    it('missing parent in custom type', () => {

        const customTypes: Map<CustomTypeDefinition> = {
            'B:0': { fields: {} }
        };

        try {
            buildProjectTypes(
                {},
                {},
                customTypes,
                {},
                {},
                {});
        } catch (expected) {
            expect(expected).toEqual([ConfigurationErrors.MISSING_TYPE_PROPERTY, 'parent', 'B:0', 'must be set for new types'])
        }
    });


    it('merge libraryType with builtIn', () => {

        const builtInTypes: Map<BuiltinTypeDefinition> = {
            A: {
                fields: {
                    field1: { inputType: 'text', group: 'stem' }
                }
            }
        };

        const libraryTypes: Map<LibraryTypeDefinition> = {
            'A:1': {
                typeFamily: 'A',
                commons: [],
                valuelists: {},
                fields: {
                    field1: {},
                    field2: { inputType: 'text' }
                },
                creationDate: "",
                createdBy: "",
                description: {} }
        };

        const result = buildProjectTypes(builtInTypes, libraryTypes, {'A:1': { hidden: [], fields: {} }},
            {}, {}, {});

        expect(result['A'].fields['field1'].inputType).toBe('text');
        expect(result['A'].fields['field1'].group).toBe('stem');
        expect(result['A'].fields['field2'].inputType).toBe('text');
    });


    it('merge custom types with built-in types', () => {

        const builtInTypes: Map<BuiltinTypeDefinition> = {
            A: {
                fields: {
                    field1: { inputType: 'text', group: 'stem' }
                }
            }
        };

        const customTypes: Map<CustomTypeDefinition> = {
            A: {
                fields: {
                    field1: { },
                    field2: { inputType: 'text' }
                }
            }
        };

        const result = buildProjectTypes(builtInTypes, {}, customTypes,
            {}, {}, {});

        expect(result['A'].fields['field1'].inputType).toBe('text');
        expect(result['A'].fields['field1'].group).toBe('stem');
        expect(result['A'].fields['field2'].inputType).toBe('text');
    });


    it('merge custom types with library types', () => {

        const builtInTypes: Map<BuiltinTypeDefinition> = {
            A: {
                fields: {
                    field1: { inputType: 'text', group: 'stem' }
                }
            }
        };

        const libraryTypes: Map<LibraryTypeDefinition> = {
            'A:0': {
                typeFamily: 'A',
                commons: [],
                valuelists: {},
                fields: {
                    field2: { inputType: 'text' }
                },
                creationDate: '',
                createdBy: '',
                description: {} }
        };

        const customTypes: Map<CustomTypeDefinition> = {
            'A:0': {
                fields: {
                    field2: { },
                    field3: { inputType: 'text' }
                }
            }
        };

        const result = buildProjectTypes(builtInTypes, libraryTypes, customTypes,
            {}, {}, {});

        expect(result['A'].fields['field1'].inputType).toBe('text');
        expect(result['A'].fields['field2'].inputType).toBe('text');
        expect(result['A'].fields['field3'].inputType).toBe('text');
    });


    it('source field', () => {

        const commonFields = {
            aCommon: { inputType: FieldDefinition.InputType.INPUT },
        };

        const builtInTypes: Map<BuiltinTypeDefinition> = {
            A: {
                fields: {
                    field1: { inputType: FieldDefinition.InputType.TEXT, group: Group.STEM }
                }
            }
        };

        const libraryTypes: Map<LibraryTypeDefinition> = {
            'A:0': {
                typeFamily: 'A',
                commons: ['aCommon'],
                valuelists: {},
                fields: {
                    field2: { inputType: FieldDefinition.InputType.TEXT }
                },
                creationDate: '',
                createdBy: '',
                description: {} }
        };

        const customTypes: Map<CustomTypeDefinition> = {
            'A:0': {
                fields: {
                    field2: { },
                    field3: { inputType: FieldDefinition.InputType.TEXT }
                }
            }
        };

        const result = buildProjectTypes(builtInTypes, libraryTypes, customTypes, commonFields, {}, {});

        expect(result['A'].fields['field1'].source).toBe(FieldDefinition.Source.BUILTIN);
        expect(result['A'].fields['field2'].source).toBe(FieldDefinition.Source.LIBRARY);
        expect(result['A'].fields['field3'].source).toBe(FieldDefinition.Source.CUSTOM);
        expect(result['A'].fields['aCommon'].source).toBe(FieldDefinition.Source.COMMON);
    });

    // err cases

    xit('critical change of input type', () => {

        const builtInTypes: Map<BuiltinTypeDefinition> = {
            A: {
                superType: true,
                userDefinedSubtypesAllowed: true,
                fields : {}
            }
        };

        const libraryTypes: Map<LibraryTypeDefinition> = {
            'B:0': {
                typeFamily: 'B',
                parent: 'A',
                commons: [],
                valuelists: {},
                fields: {
                    field1: { inputType: 'text' }
                },
                creationDate: '',
                createdBy: '',
                description: {} }
        };

        const customTypes: Map<CustomTypeDefinition> = {
            'B:0': {
                fields: {
                    field1: { inputType: 'radio' },
                },
                valuelists: {
                    field1: 'valuelist_field1'
                }
            }
        };

        const result = buildProjectTypes(builtInTypes, libraryTypes, customTypes,
            {}, {}, {});

        // expectation?
    });
});