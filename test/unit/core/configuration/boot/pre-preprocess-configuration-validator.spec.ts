
/**
 * @author Daniel de Oliveira
 */
describe('PrePreprocessConfigurationValidator',() => {

    /*
    it('reject if isRecordedIn defined for image type', () => {

        const configuration = {
            identifier: 'Conf',
            types: {
                'Image': {}
            },
            relations: [{
                name: 'isRecordedIn',
                domain: ['Image']
            }]
        };


        const result = new IdaiFieldPrePreprocessConfigurationValidator().validateFieldDefinitions_(configuration);
        expect(result[0][0]).toContain('image type/ isRecordedIn must not be defined manually');
    });


    it('reject if isRecordedIn defined for image subtype', () => {

        const configuration = {
            identifier: 'Conf',
            types: {
                'Drawing': { parent: 'Image' }
            },
            relations: [{
                name: 'isRecordedIn',
                domain: ['Drawing']
            }]
        };


        const result = new IdaiFieldPrePreprocessConfigurationValidator().validateFieldDefinitions_(configuration);
        expect(result[0][0]).toContain('image type/ isRecordedIn must not be defined manually');
    });


    it('reject if isRecordedIn defined for operation subtype', () => {

        const configuration = {
            identifier: 'Conf',
            types: {
                'A': { parent: 'Operation' }
            },
            relations: [{
                name: 'isRecordedIn',
                domain: ['A']
            }]
        };


        const result = new IdaiFieldPrePreprocessConfigurationValidator().validateFieldDefinitions_(configuration);
        expect(result[0][0]).toContain('operation subtype as domain type/ isRecordedIn must not be defined manually');
    });


    it('reject if isRecordedIn range not operation subtype', () => {

        const configuration = {
            identifier: 'Conf',
            types: {
                'A': {},
                'B': {}
            },
            relations: [{
                name: 'isRecordedIn',
                domain: ['A'],
                range: ['B']
            }]
        };

        const result = new IdaiFieldPrePreprocessConfigurationValidator().validateFieldDefinitions_(configuration);
        expect(result[0][0]).toContain('isRecordedIn - only operation subtypes allowed in range');
    });


    xit('reject if field not allowed in relation', () => {

        const configuration = {
            identifier: 'Conf',
            types: {
                'A': {}
            },
            relations: [{
                name: 'abc',
                visible: 'true'
            }]
        };

        const result = new IdaiFieldPrePreprocessConfigurationValidator().validateFieldDefinitions_(configuration);
        expect(result[0][0]).toContain('relation field not allowed');
    });*/



});