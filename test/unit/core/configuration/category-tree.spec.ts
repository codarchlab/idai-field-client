import {treeToCategoryArray, treeToCategoryMap} from '../../../../src/app/core/configuration/category-tree';


describe('CategoryTree', () => {

    it('treeToCategoryArray', () => {

        const t = [
            [
                { name: 'P1' },
                [
                    [
                        {
                            name: 'C1'
                        },
                        []
                    ]
                ]
            ]
        ]

        const result = treeToCategoryArray(t as any);

        expect(result.length).toBe(2);

        expect(result[0].name).toBe('P1');
        expect(result[0].children.length).toBe(1);
        expect(result[0].children[0].name).toBe('C1');
        expect(result[0].children[0].children.length).toBe(0);
        expect(result[0].children[0].children).toEqual([]);

        expect(result[1].name).toBe('C1');
        expect(result[1].children.length).toBe(0);
        expect(result[1].children).toEqual([]);
    });


    it('treeToCategoryMap', () => {

        const t = [
            [
                { name: 'P1' },
                [
                    [
                        {
                            name: 'C1'
                        },
                        []
                    ]
                ]
            ]
        ]

        const result = treeToCategoryMap(t as any);

        expect(result['P1'].name).toBe('P1');
        expect(result['P1'].children.length).toBe(1);
        expect(result['P1'].children[0].name).toBe('C1');
        expect(result['P1'].children[0].children.length).toBe(0);
        expect(result['P1'].children[0].children).toEqual([]);

        expect(result['C1'].name).toBe('C1');
        expect(result['C1'].children.length).toBe(0);
        expect(result['C1'].children).toEqual([]);
    });
});
